from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

PermissionState = Literal["granted", "denied", "prompt", "unsupported"]
SignalSeverity = Literal["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO", "GOOD"]
RecommendationPriority = Literal["now", "soon", "info"]


class DeviceScreen(BaseModel):
    width: int = Field(0, ge=0, le=20_000)
    height: int = Field(0, ge=0, le=20_000)
    pixel_ratio: float = Field(1.0, ge=0, le=20)
    color_depth: int = Field(24, ge=0, le=128)
    viewport_width: int = Field(0, ge=0, le=20_000)
    viewport_height: int = Field(0, ge=0, le=20_000)


class DeviceHardware(BaseModel):
    cpu_cores: int | None = Field(None, ge=0, le=1024)
    memory_gb: float | None = Field(None, ge=0, le=4096)
    max_touch_points: int = Field(0, ge=0, le=64)
    plugins: int = Field(0, ge=0, le=1024)
    audio_inputs: int = Field(0, ge=0, le=256)
    audio_outputs: int = Field(0, ge=0, le=256)
    video_inputs: int = Field(0, ge=0, le=256)


class DeviceConnection(BaseModel):
    effective_type: str | None = Field(None, max_length=24)
    downlink_mbps: float | None = Field(None, ge=0, le=100_000)
    rtt_ms: int | None = Field(None, ge=0, le=600_000)
    save_data: bool = False


class DeviceBattery(BaseModel):
    charging: bool | None = None
    level: float | None = Field(None, ge=0, le=1)


class DevicePrivacy(BaseModel):
    do_not_track: bool = False
    global_privacy_control: bool = False
    webdriver: bool = False


class DeviceContext(BaseModel):
    secure: bool = True
    hostname: str | None = Field(None, max_length=255)
    protocol: str | None = Field(None, max_length=32)


class DeviceStorage(BaseModel):
    local_storage: bool = False
    session_storage: bool = False
    indexed_db: bool = False


class DeviceWebRtc(BaseModel):
    supported: bool = False
    local_addresses: list[str] = Field(default_factory=list, max_length=20)
    public_addresses: list[str] = Field(default_factory=list, max_length=20)


class DevicePermissions(BaseModel):
    camera: PermissionState = "unsupported"
    microphone: PermissionState = "unsupported"
    geolocation: PermissionState = "unsupported"
    notifications: PermissionState = "unsupported"
    clipboard_read: PermissionState = "unsupported"


class DeviceSnapshot(BaseModel):
    """Client-collected browser and device facts.

    The browser cannot prove most of these values, so they are treated as
    self-reported observations rather than trusted attestations.
    """

    model_config = ConfigDict(extra="ignore")

    platform: str | None = Field(None, max_length=96)
    browser: str | None = Field(None, max_length=96)
    browser_version: str | None = Field(None, max_length=64)
    user_agent: str | None = Field(None, max_length=512)
    language: str | None = Field(None, max_length=32)
    languages: list[str] = Field(default_factory=list, max_length=20)
    timezone: str | None = Field(None, max_length=96)
    timezone_offset: int | None = Field(
        None,
        ge=-900,
        le=900,
        description="Minutes behind UTC, as returned by Date.prototype.getTimezoneOffset.",
    )

    screen: DeviceScreen = Field(default_factory=DeviceScreen)
    hardware: DeviceHardware = Field(default_factory=DeviceHardware)
    connection: DeviceConnection = Field(default_factory=DeviceConnection)
    battery: DeviceBattery = Field(default_factory=DeviceBattery)
    privacy: DevicePrivacy = Field(default_factory=DevicePrivacy)
    context: DeviceContext = Field(default_factory=DeviceContext)
    storage: DeviceStorage = Field(default_factory=DeviceStorage)
    webrtc: DeviceWebRtc = Field(default_factory=DeviceWebRtc)
    permissions: DevicePermissions = Field(default_factory=DevicePermissions)

    cookies_enabled: bool = False
    collected_at: datetime | None = None


class DeviceScanCreate(BaseModel):
    label: str | None = Field(None, max_length=160)
    snapshot: DeviceSnapshot


class DeviceSignal(BaseModel):
    key: str
    label: str
    severity: SignalSeverity
    points: int
    detail: str
    category: Literal["transport", "privacy", "permissions", "integrity", "environment"]


class DeviceRecommendation(BaseModel):
    title: str
    detail: str
    priority: RecommendationPriority


class DeviceAssessment(BaseModel):
    score: int = Field(ge=0, le=100)
    level: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    summary: str
    signals: list[DeviceSignal] = Field(default_factory=list)
    recommendations: list[DeviceRecommendation] = Field(default_factory=list)


class DeviceScanListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    label: str | None = None
    score: int
    level: str
    summary: str
    platform: str | None = None
    browser: str | None = None
    created_at: datetime


class DeviceScanDetail(DeviceScanListItem):
    user_agent: str | None = None
    signals: list[DeviceSignal] = Field(default_factory=list)
    recommendations: list[DeviceRecommendation] = Field(default_factory=list)
    metrics: DeviceSnapshot


class DeviceScanPage(BaseModel):
    items: list[DeviceScanListItem]
    total: int
    page: int
    page_size: int
    pages: int
