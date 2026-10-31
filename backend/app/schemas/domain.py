from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Severity = Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
VerificationStatus = Literal["verified", "contradicted", "requires_verification", "unknown"]
StageStatus = Literal["pending", "running", "completed", "skipped", "failed"]


class RiskSignal(BaseModel):
    name: str
    severity: Severity = "MEDIUM"
    explanation: str = ""


class EvidenceReference(BaseModel):
    source: str
    excerpt: str
    relevance: str = ""


class Claim(BaseModel):
    claim: str
    verification_status: VerificationStatus = "unknown"
    supporting_evidence: list[str] = Field(default_factory=list)
    evidence_references: list[EvidenceReference] = Field(default_factory=list)


class Entity(BaseModel):
    entity_type: str
    value: str


class InvestigationAnalysis(BaseModel):
    threat_category: str = "Unknown"
    intent: list[str] = Field(default_factory=list)
    entities: list[Entity] = Field(default_factory=list)
    claims: list[Claim] = Field(default_factory=list)
    risk_signals: list[RiskSignal] = Field(default_factory=list)
    summary: str = ""


class ExtractedEvidence(BaseModel):
    urls: list[str] = Field(default_factory=list)
    phone_numbers: list[str] = Field(default_factory=list)
    emails: list[str] = Field(default_factory=list)
    money_amounts: list[str] = Field(default_factory=list)
    organizations: list[str] = Field(default_factory=list)
    requests: list[str] = Field(default_factory=list)
    risk_indicators: list[str] = Field(default_factory=list)
    categories: list[str] = Field(default_factory=list)


class URLIntelligenceResult(BaseModel):
    url: str
    valid: bool = False
    error: str | None = None
    hostname: str = ""
    registered_domain: str = ""
    scheme: str = ""
    port: int | None = None
    is_https: bool = False
    is_ip_address: bool = False
    is_url_shortener: bool = False
    contains_at_symbol: bool = False
    contains_punycode: bool = False
    subdomain_count: int = 0
    suspicious_keywords: list[str] = Field(default_factory=list)
    query_parameters: list[str] = Field(default_factory=list)
    brand_mentions: list[str] = Field(default_factory=list)
    brand_domain_mismatches: list[str] = Field(default_factory=list)
    risk_indicators: list[str] = Field(default_factory=list)
    assessment: str = ""


class CorrelationPattern(BaseModel):
    name: str
    severity: Severity
    explanation: str
    evidence: list[str] = Field(default_factory=list)


class EvidenceRelationship(BaseModel):
    source: str
    relationship: str
    target: str


class CorrelationResult(BaseModel):
    evidence_signals: list[str] = Field(default_factory=list)
    correlations: list[CorrelationPattern] = Field(default_factory=list)
    correlation_score: int = 0
    correlation_level: str = "NONE"
    relationships: list[EvidenceRelationship] = Field(default_factory=list)
    narrative: str = ""


class RiskAssessment(BaseModel):
    score: int = 0
    level: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"] = "LOW"
    explanation: str = ""


class RetrievedSource(BaseModel):
    source: str
    title: str = ""
    text: str
    score: float = 0.0
    document_id: str | None = None


class PipelineStage(BaseModel):
    key: str
    label: str
    status: StageStatus = "pending"
    duration_ms: int | None = None
    detail: str | None = None


class InvestigationReport(BaseModel):
    model_config = ConfigDict(extra="ignore")

    text_excerpt: str = ""
    extracted: ExtractedEvidence = Field(default_factory=ExtractedEvidence)
    urls: list[URLIntelligenceResult] = Field(default_factory=list)
    analysis: InvestigationAnalysis = Field(default_factory=InvestigationAnalysis)
    correlation: CorrelationResult = Field(default_factory=CorrelationResult)
    risk: RiskAssessment = Field(default_factory=RiskAssessment)
    actions: list[str] = Field(default_factory=list)
    sources: list[RetrievedSource] = Field(default_factory=list)
    stages: list[PipelineStage] = Field(default_factory=list)
    analysis_mode: str = "deterministic"
    notes: list[str] = Field(default_factory=list)
    generated_at: datetime | None = None
