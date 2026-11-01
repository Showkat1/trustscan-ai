from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

from app.schemas.device import (
    DeviceAssessment,
    DeviceRecommendation,
    DeviceSignal,
    DeviceSnapshot,
)

LEVEL_BANDS: tuple[tuple[int, str], ...] = (
    (75, "CRITICAL"),
    (50, "HIGH"),
    (25, "MEDIUM"),
    (0, "LOW"),
)

SEVERITY_WEIGHT = {
    "CRITICAL": 5,
    "HIGH": 4,
    "MEDIUM": 3,
    "LOW": 2,
    "INFO": 1,
    "GOOD": 0,
}


def _band(score: int) -> str:
    for threshold, level in LEVEL_BANDS:
        if score >= threshold:
            return level
    return "LOW"


def _label(snapshot: DeviceSnapshot) -> str | None:
    browser = (snapshot.browser or "").strip()
    platform = (snapshot.platform or "").strip()
    if browser and platform:
        return f"{browser} on {platform}"
    return browser or platform or None


def _timezone_drift(snapshot: DeviceSnapshot) -> int | None:
    """Return a suspicious timezone drift in minutes, when one is measurable."""
    if not snapshot.timezone or snapshot.timezone_offset is None:
        return None
    try:
        zone = ZoneInfo(snapshot.timezone)
    except Exception:  # unknown zone names are not, on their own, a risk signal
        return None
    offset = datetime.now(zone).utcoffset()
    if offset is None:
        return None
    local_offset = int(offset.total_seconds() // 60)
    reported_local = -snapshot.timezone_offset
    drift = abs(local_offset - reported_local)
    return drift if drift > 90 else None


def _signal(
    key: str,
    label: str,
    severity: str,
    points: int,
    detail: str,
    category: str,
) -> DeviceSignal:
    return DeviceSignal(
        key=key,
        label=label,
        severity=severity,  # type: ignore[arg-type]
        points=points,
        detail=detail,
        category=category,  # type: ignore[arg-type]
    )


def _recommendation(
    title: str, detail: str, priority: str = "soon"
) -> DeviceRecommendation:
    return DeviceRecommendation(
        title=title,
        detail=detail,
        priority=priority,  # type: ignore[arg-type]
    )


def _is_loopback(hostname: str | None) -> bool:
    if not hostname:
        return False
    value = hostname.lower().strip("[]")
    return value in {"localhost", "127.0.0.1", "::1"} or value.endswith(".localhost")


def assess_device(snapshot: DeviceSnapshot) -> DeviceAssessment:
    """Score a browser snapshot with transparent, additive rules.

    The score is an exposure score, not a malware verdict: it describes how
    much this browser environment leaks or exposes, based only on facts the
    page can observe.
    """
    signals: list[DeviceSignal] = []
    recommendations: list[DeviceRecommendation] = []

    # --- Transport ---------------------------------------------------------
    protocol = (snapshot.context.protocol or "").lower()
    loopback = _is_loopback(snapshot.context.hostname)
    if not snapshot.context.secure or (protocol == "http:" and not loopback):
        signals.append(
            _signal(
                "insecure_context",
                "Insecure connection",
                "CRITICAL",
                50,
                "This page is not served over HTTPS. Anything typed here can be read or altered on the network.",
                "transport",
            )
        )
        recommendations.append(
            _recommendation(
                "Use the HTTPS address",
                "Only enter sensitive information on pages that show a secure HTTPS connection. "
                "Never sign in through an HTTP link.",
                "now",
            )
        )
    else:
        signals.append(
            _signal(
                "secure_context",
                "Secure connection",
                "GOOD",
                0,
                "This page is served over HTTPS."
                if protocol == "https:"
                else "This page is served from a local loopback address, so traffic does not leave this device.",
                "transport",
            )
        )

    if not snapshot.cookies_enabled:
        signals.append(
            _signal(
                "cookies_disabled",
                "Cookies disabled",
                "HIGH",
                18,
                "Cookies are blocked, so the browser cannot maintain a protected session or honour security cookie settings.",
                "transport",
            )
        )
        recommendations.append(
            _recommendation(
                "Allow cookies for this site",
                "Enable cookies for the TrustScan origin so sign-in and session protection work as designed.",
            )
        )

    storage_off = [
        name
        for name, available in (
            ("local storage", snapshot.storage.local_storage),
            ("session storage", snapshot.storage.session_storage),
            ("IndexedDB", snapshot.storage.indexed_db),
        )
        if not available
    ]
    if storage_off:
        signals.append(
            _signal(
                "storage_blocked",
                "Browser storage blocked",
                "MEDIUM",
                8,
                "Blocked: " + ", ".join(storage_off) + ". Some site features cannot persist safely.",
                "transport",
            )
        )
        recommendations.append(
            _recommendation(
                "Allow site storage",
                "If a privacy extension blocks storage for every site, add an exception for trusted origins "
                "so they can keep you signed in securely.",
                "info",
            )
        )

    # --- Privacy -----------------------------------------------------------
    if snapshot.webrtc.public_addresses:
        signals.append(
            _signal(
                "webrtc_public_ip",
                "Public IP exposed over WebRTC",
                "MEDIUM",
                10,
                "A public IP address was gathered through WebRTC, which can reveal your approximate location "
                "and network provider.",
                "privacy",
            )
        )
        recommendations.append(
            _recommendation(
                "Limit WebRTC address gathering",
                "WebRTC can reveal your public IP even behind some proxies. Disable WebRTC in the browser, "
                "or use a VPN that blocks STUN traffic, when you do not need calls.",
            )
        )

    if snapshot.webrtc.local_addresses:
        signals.append(
            _signal(
                "webrtc_local_ip",
                "Local network address exposed",
                "MEDIUM",
                8,
                "WebRTC exposed a private network address, which can help a site fingerprint "
                "or probe your local network.",
                "privacy",
            )
        )

    if snapshot.privacy.do_not_track:
        signals.append(
            _signal(
                "do_not_track",
                "Do Not Track enabled",
                "GOOD",
                -4,
                "The browser asks sites not to track you.",
                "privacy",
            )
        )

    if snapshot.privacy.global_privacy_control:
        signals.append(
            _signal(
                "global_privacy_control",
                "Global Privacy Control enabled",
                "GOOD",
                -6,
                "The browser sends a legally recognised opt-out signal for data selling and sharing.",
                "privacy",
            )
        )

    granted = [
        (key, label)
        for key, label, state in (
            ("camera", "camera", snapshot.permissions.camera),
            ("microphone", "microphone", snapshot.permissions.microphone),
            ("geolocation", "location", snapshot.permissions.geolocation),
            ("notifications", "notifications", snapshot.permissions.notifications),
            ("clipboard_read", "clipboard", snapshot.permissions.clipboard_read),
        )
        if state == "granted"
    ]
    permission_points = {
        "camera": 7,
        "microphone": 7,
        "geolocation": 10,
        "notifications": 4,
        "clipboard_read": 10,
    }
    for key, label in granted:
        signals.append(
            _signal(
                f"permission_{key}",
                f"{label.title()} permission granted",
                "MEDIUM" if permission_points[key] >= 7 else "LOW",
                permission_points[key],
                f"This site has already been granted {label} access, so it can use that capability "
                "without asking again.",
                "permissions",
            )
        )

    if granted:
        recommendations.append(
            _recommendation(
                "Review site permissions",
                "Revoke access you do not actively use: "
                + ", ".join(label for _, label in granted)
                + ". Grant permissions per site instead of globally.",
            )
        )

    # --- Integrity ---------------------------------------------------------
    if snapshot.privacy.webdriver:
        signals.append(
            _signal(
                "automation_driver",
                "Automation driver detected",
                "HIGH",
                50,
                "navigator.webdriver is true, which means this browser is being driven by automation "
                "software rather than a person.",
                "integrity",
            )
        )
        recommendations.append(
            _recommendation(
                "Use a normal browser profile",
                "Scan from the browser you actually use. Automated sessions are more likely to be "
                "scripted, shared, or leaking credentials.",
                "now",
            )
        )

    drift = _timezone_drift(snapshot)
    if drift is not None:
        signals.append(
            _signal(
                "timezone_mismatch",
                "Time zone inconsistency",
                "MEDIUM",
                8,
                f"The reported time zone is {drift} minutes away from the browser's UTC offset, "
                "which can indicate a spoofed location or a misconfigured device.",
                "integrity",
            )
        )
        recommendations.append(
            _recommendation(
                "Check the system time zone",
                "Set the device clock and time zone to automatic. Inconsistent time zones break "
                "certificate checks and can indicate location spoofing.",
                "info",
            )
        )

    # --- Environment (informational) --------------------------------------
    if snapshot.screen.width == 0 or snapshot.screen.height == 0:
        signals.append(
            _signal(
                "unknown_screen",
                "Screen details unavailable",
                "INFO",
                0,
                "The browser did not report a usable screen size, which limits fingerprint consistency checks.",
                "environment",
            )
        )

    raw_score = sum(signal.points for signal in signals)
    score = max(0, min(100, raw_score))
    level = _band(score)

    risk_signals = [signal for signal in signals if signal.points > 0]
    risk_signals.sort(key=lambda signal: SEVERITY_WEIGHT.get(signal.severity, 0), reverse=True)

    if risk_signals:
        summary = (
            f"{level.title()} browser exposure ({score}/100). "
            f"{len(risk_signals)} signal{'s' if len(risk_signals) != 1 else ''} need attention: "
            + ", ".join(signal.label.lower() for signal in risk_signals[:4])
            + "."
        )
    else:
        summary = (
            "No material exposure signals detected. This browser blocks common leaks and does not "
            "grant sensitive permissions to this site."
        )

    if not recommendations:
        recommendations.append(
            _recommendation(
                "Keep the browser current",
                "No action is required from this scan. Continue installing browser and OS updates, "
                "and review site permissions periodically.",
                "info",
            )
        )

    return DeviceAssessment(
        score=score,
        level=level,
        summary=summary,
        signals=signals,
        recommendations=recommendations,
    )


def device_label(snapshot: DeviceSnapshot) -> str | None:
    return _label(snapshot)
