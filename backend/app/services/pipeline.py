from __future__ import annotations

import time
import uuid
from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import SessionLocal
from app.core.errors import AppError
from app.core.logging import get_logger
from app.models.investigation import InputType, Investigation, InvestigationStatus
from app.schemas.domain import (
    ExtractedEvidence,
    InvestigationReport,
    PipelineStage,
    RiskAssessment,
    URLIntelligenceResult,
)
from app.services.actions import generate_response
from app.services.correlation import EvidenceCorrelation
from app.services.documents import document_service
from app.services.evidence_extractor import EvidenceExtractor
from app.services.llm import investigator
from app.services.ocr import ocr_service
from app.services.rag import knowledge_base
from app.services.risk_engine import assess_risk
from app.services.url_intelligence import URLIntelligence

logger = get_logger(__name__)

STAGES: list[dict[str, str]] = [
    {"key": "intake", "label": "Evidence intake"},
    {"key": "extraction", "label": "Evidence extraction"},
    {"key": "url", "label": "URL intelligence"},
    {"key": "retrieval", "label": "Trusted knowledge retrieval"},
    {"key": "analysis", "label": "Generative AI investigation"},
    {"key": "correlation", "label": "Evidence correlation"},
    {"key": "risk", "label": "Risk assessment"},
    {"key": "actions", "label": "Protection & response"},
]

SIGNAL_ALIASES = {
    "credential_theft": "credential_request",
    "otp_request": "credential_request",
    "password_request": "credential_request",
    "identity_theft": "credential_request",
    "payment_request": "advance_payment",
    "money_request": "advance_payment",
    "verification_fee": "advance_payment",
    "financial_request": "advance_payment",
    "urgency": "artificial_urgency",
    "time_pressure": "artificial_urgency",
    "government_impersonation": "government_impersonation",
    "brand_impersonation": "impersonation",
    "suspicious_link": "suspicious_url",
    "malicious_url": "suspicious_url",
}


def _normalize_signal(value: str) -> str:
    normalized = value.strip().lower().replace("-", "_").replace(" ", "_")
    return SIGNAL_ALIASES.get(normalized, normalized)


class InvestigationPipeline:
    async def run(self, investigation_id: uuid.UUID) -> None:
        async with SessionLocal() as session:
            investigation = await session.get(Investigation, investigation_id)
            if investigation is None:
                logger.warning("investigation_missing", investigation_id=str(investigation_id))
                return
            if investigation.status in {InvestigationStatus.COMPLETED, InvestigationStatus.RUNNING}:
                return

            started = time.perf_counter()
            stages = [PipelineStage(**stage) for stage in STAGES]
            notes: list[str] = []
            durations: dict[str, int] = {}

            try:
                investigation.status = InvestigationStatus.RUNNING
                investigation.error_message = None
                await self._stage(session, investigation, 0, "Reading evidence")

                text, intake_note = await self._resolve_text(investigation)
                if intake_note:
                    notes.append(intake_note)
                if not text.strip():
                    raise AppError("No readable text was found in the supplied evidence.")
                if len(text) > settings.max_text_characters:
                    text = text[: settings.max_text_characters]
                    notes.append("Evidence was truncated to the maximum analysis length.")
                investigation.input_excerpt = self._excerpt(text)
                await session.commit()

                # 2. Evidence extraction
                stage_start = time.perf_counter()
                await self._stage(session, investigation, 1, "Extracting structured observations")
                extracted = ExtractedEvidence(**EvidenceExtractor.extract(text))
                durations["extraction"] = self._elapsed(stage_start)
                stages[1].status = "completed"
                stages[1].duration_ms = durations["extraction"]
                stages[1].detail = (
                    f"{len(extracted.urls)} URL(s), {len(extracted.phone_numbers)} phone(s), "
                    f"{len(extracted.risk_indicators)} indicator(s)"
                )

                # 3. URL intelligence
                stage_start = time.perf_counter()
                await self._stage(session, investigation, 2, "Analysing links")
                urls: list[URLIntelligenceResult] = []
                for url in extracted.urls[:10]:
                    try:
                        urls.append(URLIntelligenceResult(**URLIntelligence.analyze(url)))
                    except Exception as exc:  # pragma: no cover - defensive
                        notes.append(f"One URL could not be analysed: {exc}")
                if len(extracted.urls) > 10:
                    notes.append("Only the first 10 URLs were analysed.")
                durations["url"] = self._elapsed(stage_start)
                stages[2].status = "completed"
                stages[2].duration_ms = durations["url"]
                stages[2].detail = f"{len(urls)} link(s) analysed"

                # 4. Retrieval
                stage_start = time.perf_counter()
                await self._stage(session, investigation, 3, "Searching trusted guidance")
                sources = await knowledge_base.search(session, text)
                if not sources:
                    notes.append("No trusted guidance passage matched above the relevance threshold.")
                durations["retrieval"] = self._elapsed(stage_start)
                stages[3].status = "completed"
                stages[3].duration_ms = durations["retrieval"]
                stages[3].detail = f"{len(sources)} source passage(s) retrieved"

                # 5. Generative analysis (or deterministic fallback)
                stage_start = time.perf_counter()
                await self._stage(session, investigation, 4, "Investigating with TrustScan AI")
                outcome = await investigator.analyze(text, extracted, sources)
                analysis = outcome.analysis
                notes.extend(outcome.notes)
                durations["analysis"] = self._elapsed(stage_start)
                stages[4].status = "completed"
                stages[4].duration_ms = durations["analysis"]
                stages[4].detail = (
                    f"{outcome.mode.replace('_', ' ')} · {analysis.threat_category}"
                )

                # 6. Correlation
                stage_start = time.perf_counter()
                await self._stage(session, investigation, 5, "Correlating evidence")
                signal_names: list[str] = []
                for signal in analysis.risk_signals:
                    signal_names.append(_normalize_signal(signal.name))
                signal_names.extend(extracted.risk_indicators)
                signal_names.extend(extracted.categories)
                for url_result in urls:
                    if url_result.risk_indicators:
                        signal_names.append("suspicious_url")
                    if url_result.brand_domain_mismatches:
                        signal_names.append("brand_domain_mismatch")
                signal_names = list(dict.fromkeys(name for name in signal_names if name))

                correlation = EvidenceCorrelation.correlate(
                    extracted_evidence=extracted.model_dump(),
                    url_results=[url.model_dump() for url in urls],
                    ai_signals=signal_names,
                    threat_category=analysis.threat_category,
                )
                durations["correlation"] = self._elapsed(stage_start)
                stages[5].status = "completed"
                stages[5].duration_ms = durations["correlation"]
                stages[5].detail = (
                    f"{correlation['correlation_level']} · "
                    f"{len(correlation['correlations'])} pattern(s)"
                )

                # 7. Risk
                stage_start = time.perf_counter()
                await self._stage(session, investigation, 6, "Scoring explainable risk")
                risk: RiskAssessment = assess_risk(signal_names, extracted.model_dump())
                durations["risk"] = self._elapsed(stage_start)
                stages[6].status = "completed"
                stages[6].duration_ms = durations["risk"]
                stages[6].detail = f"{risk.level} · {risk.score}/100"

                # 8. Actions
                stage_start = time.perf_counter()
                await self._stage(session, investigation, 7, "Preparing protection guidance")
                actions = generate_response(risk.level, signal_names, extracted.model_dump())
                durations["actions"] = self._elapsed(stage_start)
                stages[7].status = "completed"
                stages[7].duration_ms = durations["actions"]
                stages[7].detail = f"{len(actions)} recommended action(s)"

                stages[0].status = "completed"
                stages[0].duration_ms = None

                report = InvestigationReport(
                    text_excerpt=text[:6000],
                    extracted=extracted,
                    urls=urls,
                    analysis=analysis,
                    correlation=correlation,  # type: ignore[arg-type]
                    risk=risk,
                    actions=actions,
                    sources=sources,
                    stages=stages,
                    analysis_mode=outcome.mode,
                    notes=list(dict.fromkeys(notes)),
                    generated_at=datetime.now(UTC),
                )

                investigation.status = InvestigationStatus.COMPLETED
                investigation.stage = "completed"
                investigation.stage_index = len(STAGES)
                investigation.risk_score = risk.score
                investigation.risk_level = risk.level
                investigation.threat_category = analysis.threat_category
                investigation.correlation_level = correlation["correlation_level"]
                investigation.analysis_mode = outcome.mode
                investigation.result = report.model_dump(mode="json")
                investigation.completed_at = datetime.now(UTC)
                investigation.duration_ms = self._elapsed(started)
                await session.commit()

                logger.info(
                    "investigation_completed",
                    investigation_id=str(investigation.id),
                    risk_level=risk.level,
                    risk_score=risk.score,
                    mode=outcome.mode,
                    duration_ms=investigation.duration_ms,
                )

            except Exception as exc:
                logger.exception("investigation_failed", investigation_id=str(investigation_id))
                investigation.status = InvestigationStatus.FAILED
                investigation.stage = "failed"
                investigation.error_message = (
                    exc.message if isinstance(exc, AppError) else "The investigation could not be completed."
                )
                investigation.completed_at = datetime.now(UTC)
                investigation.duration_ms = self._elapsed(started)
                await session.commit()

    async def _resolve_text(self, investigation: Investigation) -> tuple[str, str | None]:
        if investigation.input_type == InputType.MESSAGE:
            return investigation.input_text or "", None
        if investigation.input_type == InputType.URL:
            return investigation.input_text or investigation.input_url or "", None

        if not investigation.file_path:
            raise AppError("The uploaded evidence file is missing.")

        path = Path(investigation.file_path)
        data = path.read_bytes()

        if investigation.input_type == InputType.SCREENSHOT:
            text = await ocr_service.extract_text(data)
            investigation.input_text = text
            return text, "Text was extracted from the screenshot with OCR."

        text = await document_service.extract_text(investigation.file_name or path.name, data)
        investigation.input_text = text
        return text, "Text was extracted from the uploaded document."

    async def _stage(
        self,
        session: AsyncSession,
        investigation: Investigation,
        index: int,
        detail: str,
    ) -> None:
        investigation.stage = STAGES[index]["key"]
        investigation.stage_index = index
        await session.commit()
        logger.info(
            "investigation_stage",
            investigation_id=str(investigation.id),
            stage=STAGES[index]["key"],
            detail=detail,
        )

    @staticmethod
    def _elapsed(start: float) -> int:
        return max(0, int((time.perf_counter() - start) * 1000))

    @staticmethod
    def _excerpt(text: str) -> str:
        compact = " ".join(text.split())
        return compact[:500]


pipeline = InvestigationPipeline()
