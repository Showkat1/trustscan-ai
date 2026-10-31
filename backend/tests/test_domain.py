from __future__ import annotations

import json
from pathlib import Path

from app.services.correlation import EvidenceCorrelation
from app.services.evidence_extractor import EvidenceExtractor
from app.services.risk_engine import assess_risk
from app.services.url_intelligence import URLIntelligence

CASES = Path(__file__).resolve().parents[2] / "data" / "test_cases" / "trustscan_test_cases.json"


def _pipeline(case: dict) -> tuple[dict, list[dict], list[str]]:
    extracted = EvidenceExtractor.extract(case["message"])
    urls = [URLIntelligence.analyze(url) for url in extracted["urls"]]
    signals = [*extracted["risk_indicators"], *extracted["categories"]]
    for result in urls:
        if result["risk_indicators"]:
            signals.append("suspicious_url")
    return extracted, urls, signals


def test_evaluation_suite_reaches_full_accuracy() -> None:
    cases = json.loads(CASES.read_text(encoding="utf-8"))
    passed = 0
    failures = []
    for case in cases:
        extracted, _, signals = _pipeline(case)
        risk = assess_risk(signals, extracted)
        if risk.level == case["expected_risk"]:
            passed += 1
        else:
            failures.append((case["id"], case["expected_risk"], risk.level, risk.score))
    assert passed == len(cases), failures


def test_negation_does_not_cancel_an_earlier_request() -> None:
    extracted = EvidenceExtractor.extract(
        "Send PKR 15,000 immediately. If payment is not received within 20 minutes, "
        "your application will be cancelled."
    )
    assert "Payment / money transfer" in extracted["requests"]
    assert "advance_payment" in extracted["risk_indicators"]


def test_safety_advice_is_not_treated_as_a_credential_request() -> None:
    extracted = EvidenceExtractor.extract(
        "For your security, never share your password, PIN or OTP with anyone. "
        "Our bank will never ask customers to provide these credentials by phone."
    )
    assert extracted["requests"] == []
    assert "credential_request" not in extracted["risk_indicators"]


def test_benign_government_announcement_is_low_risk() -> None:
    extracted = EvidenceExtractor.extract(
        "The government has announced that citizens can review program information "
        "through the official government website. No payment or credential sharing is required."
    )
    risk = assess_risk(extracted["risk_indicators"] + extracted["categories"], extracted)
    assert risk.level == "LOW"


def test_url_intelligence_flags_brand_mismatch() -> None:
    result = URLIntelligence.analyze("https://secure-hbl-login.example.com/verify")
    assert result["valid"] is True
    assert result["registered_domain"] == "example.com"
    assert "hbl" in result["brand_mentions"]
    assert "brand_domain_mismatch" in result["risk_indicators"]
    assert "suspicious_url_keywords" in result["risk_indicators"]


def test_url_intelligence_accepts_official_domain() -> None:
    result = URLIntelligence.analyze("https://www.hbl.com.pk/accounts")
    assert result["registered_domain"] == "hbl.com.pk"
    assert "brand_domain_mismatch" not in result["risk_indicators"]


def test_correlation_builds_patterns_and_relationships() -> None:
    extracted = EvidenceExtractor.extract(
        "Your account will be blocked. Send your OTP and pay PKR 5,000 at "
        "https://secure-hbl-login.example.com/verify immediately."
    )
    urls = [URLIntelligence.analyze(url) for url in extracted["urls"]]
    result = EvidenceCorrelation.correlate(
        extracted_evidence=extracted,
        url_results=urls,
        ai_signals=[*extracted["risk_indicators"], *extracted["categories"]],
        threat_category="Phishing",
    )
    assert result["correlation_score"] > 0
    assert result["correlation_level"] in {"WEAK", "MODERATE", "STRONG"}
    assert result["correlations"]
    assert result["relationships"]
    assert result["narrative"]


def test_risk_engine_requires_independent_evidence_for_critical() -> None:
    credential_only = assess_risk(["credential_request"])
    assert credential_only.level == "MEDIUM"

    payment_and_urgency = assess_risk(
        ["advance_payment", "artificial_urgency"],
        {"money_amounts": ["PKR 15,000"], "requests": ["Payment / money transfer"]},
    )
    assert payment_and_urgency.level == "HIGH"

    critical = assess_risk(
        ["credential_request", "advance_payment", "suspicious_url"],
        {
            "urls": ["https://secure-bank.example.com"],
            "money_amounts": ["PKR 5,000"],
            "requests": ["OTP / verification code", "Payment / money transfer"],
        },
    )
    assert critical.level == "CRITICAL"
