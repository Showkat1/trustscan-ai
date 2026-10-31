from __future__ import annotations

from typing import Any


def generate_response(
    risk_level_value: str,
    signals: list[str] | None = None,
    evidence: dict[str, Any] | None = None,
) -> list[str]:
    """Build risk-tiered, context-aware protection and recovery guidance."""

    signals = [str(signal).lower() for signal in (signals or [])]
    evidence = evidence or {}

    actions: list[str] = []

    def add(action: str) -> None:
        if action not in actions:
            actions.append(action)

    if risk_level_value == "CRITICAL":
        add("Do not send money or share any financial information.")
        add("Do not share OTPs, PINs, passwords, card details, or identity documents.")
        add("Do not click links or open attachments in the message.")
        add("Verify the organization through its official website or a known phone number.")
        add("If you already shared credentials, change your passwords and contact your bank immediately.")
        add("If money was transferred, ask your bank to attempt a recall and preserve all evidence.")
        add("Report the incident to the FIA Cybercrime Wing or your local cybercrime authority.")
    elif risk_level_value == "HIGH":
        add("Do not provide sensitive information or make any payment yet.")
        add("Verify the sender independently using an official channel.")
        add("Inspect links and organization details before taking action.")
        add("Preserve screenshots and message headers in case you need to report the incident.")
    elif risk_level_value == "MEDIUM":
        add("Treat the communication with caution and slow down.")
        add("Verify important claims through a trusted, independently sourced channel.")
        add("Do not share credentials or make payments until the claim is confirmed.")
    else:
        add("No major risk indicators were detected, but this is not a guarantee of safety.")
        add("Continue to verify unexpected requests through official channels.")

    if "credential_request" in signals:
        add("Never share an OTP or password, even with someone claiming to be from your bank.")

    if "advance_payment" in signals or evidence.get("money_amounts"):
        add("Use official payment channels only and never pay an unexpected 'fee' to receive money.")

    if "suspicious_url" in signals or evidence.get("urls"):
        add("Type the official website address manually instead of using the supplied link.")

    if "government_impersonation" in signals:
        add("Contact the government department using a number published on its official website.")

    if "job_scam" in signals:
        add("Legitimate employers do not ask candidates to pay registration or processing fees.")

    if "investment_scam" in signals:
        add("Be sceptical of guaranteed returns; check the entity against your regulator's register.")

    if "prize_scam" in signals:
        add("You cannot win a lottery you did not enter; do not pay taxes or fees to claim a prize.")

    return actions[:10]
