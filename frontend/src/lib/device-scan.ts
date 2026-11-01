import type {
  DeviceBattery,
  DeviceConnection,
  DeviceHardware,
  DevicePermissions,
  DeviceSnapshot,
  DeviceStorage,
  DeviceWebRtc,
  PermissionState,
} from "@/lib/types";

interface UserAgentData {
  platform?: string;
  brands?: { brand: string; version: string }[];
}

interface NavigatorExtras {
  userAgentData?: UserAgentData;
  deviceMemory?: number;
  connection?: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  };
  globalPrivacyControl?: boolean;
  getBattery?: () => Promise<{ charging: boolean; level: number }>;
  doNotTrack?: string | null;
}

type ExtendedNavigator = Navigator & NavigatorExtras;

const PERMISSION_NAMES = [
  "camera",
  "microphone",
  "geolocation",
  "notifications",
  "clipboard-read",
] as const;

function detectBrowser(userAgent: string): { browser: string | null; version: string | null } {
  const candidates: [string, RegExp][] = [
    ["Edge", /Edg\/([\d.]+)/],
    ["Opera", /OPR\/([\d.]+)/],
    ["Samsung Internet", /SamsungBrowser\/([\d.]+)/],
    ["Firefox", /Firefox\/([\d.]+)/],
    ["Chrome", /Chrome\/([\d.]+)/],
    ["Safari", /Version\/([\d.]+).*Safari/],
  ];
  for (const [browser, pattern] of candidates) {
    const match = userAgent.match(pattern);
    if (match) {
      return { browser, version: match[1]?.split(".")[0] ?? null };
    }
  }
  return { browser: null, version: null };
}

function mapPlatform(raw: string | undefined): string | null {
  if (!raw) return null;
  if (/cros/i.test(raw)) return "ChromeOS";
  if (/win/i.test(raw)) return "Windows";
  if (/mac/i.test(raw)) return "macOS";
  if (/android/i.test(raw)) return "Android";
  if (/iphone|ipad|ipod/i.test(raw)) return "iOS";
  if (/linux/i.test(raw)) return "Linux";
  return raw;
}

function probeStorage(kind: "local" | "session"): boolean {
  try {
    const storage = kind === "local" ? window.localStorage : window.sessionStorage;
    const key = "__trustscan_storage_probe__";
    storage.setItem(key, "1");
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function probeIndexedDb(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!window.indexedDB) {
      resolve(false);
      return;
    }
    const name = `trustscan-probe-${Date.now()}`;
    try {
      const request = window.indexedDB.open(name, 1);
      request.onsuccess = () => {
        request.result.close();
        window.indexedDB.deleteDatabase(name);
        resolve(true);
      };
      request.onerror = () => resolve(false);
      request.onblocked = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

async function readStorage(): Promise<DeviceStorage> {
  return {
    local_storage: probeStorage("local"),
    session_storage: probeStorage("session"),
    indexed_db: await probeIndexedDb(),
  };
}

async function readPermission(name: string): Promise<PermissionState> {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) {
    return "unsupported";
  }
  try {
    const status = await navigator.permissions.query({
      name,
    } as PermissionDescriptor);
    if (status.state === "granted" || status.state === "denied" || status.state === "prompt") {
      return status.state;
    }
    return "unsupported";
  } catch {
    // Browsers reject names they do not expose through the Permissions API.
    return "unsupported";
  }
}

async function readPermissions(): Promise<DevicePermissions> {
  const [camera, microphone, geolocation, notifications, clipboard] = await Promise.all(
    PERMISSION_NAMES.map((name) => readPermission(name)),
  );
  return {
    camera,
    microphone,
    geolocation,
    notifications,
    clipboard_read: clipboard,
  };
}

async function readMediaCounts(): Promise<
  Pick<DeviceHardware, "audio_inputs" | "audio_outputs" | "video_inputs">
> {
  const counts = { audio_inputs: 0, audio_outputs: 0, video_inputs: 0 };
  if (!navigator.mediaDevices?.enumerateDevices) return counts;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    for (const device of devices) {
      if (device.kind === "audioinput") counts.audio_inputs += 1;
      else if (device.kind === "audiooutput") counts.audio_outputs += 1;
      else if (device.kind === "videoinput") counts.video_inputs += 1;
    }
  } catch {
    // Device labels and counts require permission in some browsers.
  }
  return counts;
}

async function readBattery(): Promise<DeviceBattery> {
  const getBattery = (navigator as ExtendedNavigator).getBattery;
  if (typeof getBattery !== "function") {
    return { charging: null, level: null };
  }
  try {
    const battery = await getBattery.call(navigator);
    return {
      charging: Boolean(battery.charging),
      level: Number.isFinite(battery.level) ? battery.level : null,
    };
  } catch {
    return { charging: null, level: null };
  }
}

function readConnection(): DeviceConnection {
  const connection = (navigator as ExtendedNavigator).connection;
  return {
    effective_type: connection?.effectiveType ?? null,
    downlink_mbps:
      typeof connection?.downlink === "number" ? connection.downlink : null,
    rtt_ms: typeof connection?.rtt === "number" ? connection.rtt : null,
    save_data: Boolean(connection?.saveData),
  };
}

function isPrivateAddress(address: string): boolean {
  if (address.includes(":")) {
    const lower = address.toLowerCase();
    if (lower === "::1" || lower === "::") return true;
    if (lower.startsWith("fe80") || lower.startsWith("fc") || lower.startsWith("fd")) {
      return true;
    }
    return false;
  }

  const parts = address.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return true;
  const [first, second] = parts;
  return (
    first === 10 ||
    first === 127 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 169 && second === 254)
  );
}

function extractCandidateAddress(candidate: string): string | null {
  for (const token of candidate.split(" ")) {
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(token)) {
      return token === "0.0.0.0" ? null : token;
    }
    const colons = token.split(":").length - 1;
    if (colons >= 2 && /^[0-9a-f:]+$/i.test(token)) {
      return token;
    }
  }
  return null;
}

export function collectWebRtc(timeoutMs = 3000): Promise<DeviceWebRtc> {
  if (typeof window === "undefined" || typeof window.RTCPeerConnection !== "function") {
    return Promise.resolve({ supported: false, local_addresses: [], public_addresses: [] });
  }

  const addresses = new Set<string>();

  return new Promise<DeviceWebRtc>((resolve) => {
    let settled = false;
    let peer: RTCPeerConnection | null = null;

    function finish() {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      try {
        peer?.close();
      } catch {
        // Closing an already closed peer connection is harmless.
      }

      const local = new Set<string>();
      const exposed = new Set<string>();
      for (const address of addresses) {
        if (isPrivateAddress(address)) local.add(address);
        else exposed.add(address);
      }

      resolve({
        supported: true,
        local_addresses: [...local].slice(0, 20),
        public_addresses: [...exposed].slice(0, 20),
      });
    }

    const timer = window.setTimeout(finish, timeoutMs);

    try {
      peer = new window.RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.cloudflare.com:3478" }],
      });
      peer.onicecandidate = (event) => {
        if (!event.candidate) {
          finish();
          return;
        }
        const address = extractCandidateAddress(event.candidate.candidate);
        if (address) addresses.add(address);
      };
      peer.createDataChannel("trustscan-probe");
      void peer
        .createOffer()
        .then((offer) => peer?.setLocalDescription(offer))
        .catch(() => finish());
    } catch {
      finish();
    }
  });
}

export async function collectDeviceSnapshot(): Promise<DeviceSnapshot> {
  if (typeof window === "undefined") {
    throw new Error("Device scans can only run in a browser");
  }

  const nav = navigator as ExtendedNavigator;
  const userAgent = nav.userAgent ?? "";
  const detected = detectBrowser(userAgent);

  const [permissions, mediaCounts, storage, webrtc, battery] = await Promise.all([
    readPermissions(),
    readMediaCounts(),
    readStorage(),
    collectWebRtc(),
    readBattery(),
  ]);

  let timezone: string | null = null;
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    timezone = null;
  }

  const dnt = nav.doNotTrack ?? (window as Window & { doNotTrack?: string | null }).doNotTrack;
  const platform =
    mapPlatform(nav.userAgentData?.platform) ?? mapPlatform(nav.platform) ?? null;

  return {
    platform,
    browser: detected.browser,
    browser_version: detected.version,
    user_agent: userAgent || null,
    language: nav.language ?? null,
    languages: Array.from(nav.languages ?? []).slice(0, 20),
    timezone,
    timezone_offset: new Date().getTimezoneOffset(),
    screen: {
      width: Number(window.screen?.width ?? 0),
      height: Number(window.screen?.height ?? 0),
      pixel_ratio: Number(window.devicePixelRatio ?? 1),
      color_depth: Number(window.screen?.colorDepth ?? 24),
      viewport_width: Number(window.innerWidth ?? 0),
      viewport_height: Number(window.innerHeight ?? 0),
    },
    hardware: {
      cpu_cores: typeof nav.hardwareConcurrency === "number" ? nav.hardwareConcurrency : null,
      memory_gb: typeof nav.deviceMemory === "number" ? nav.deviceMemory : null,
      max_touch_points: Number(nav.maxTouchPoints ?? 0),
      plugins: Number(nav.plugins?.length ?? 0),
      ...mediaCounts,
    },
    connection: readConnection(),
    battery,
    privacy: {
      do_not_track: dnt === "1" || dnt === "yes",
      global_privacy_control: nav.globalPrivacyControl === true,
      webdriver: nav.webdriver === true,
    },
    context: {
      secure: window.isSecureContext,
      hostname: window.location.hostname || null,
      protocol: window.location.protocol || null,
    },
    storage,
    webrtc,
    permissions,
    cookies_enabled: nav.cookieEnabled,
    collected_at: new Date().toISOString(),
  };
}
