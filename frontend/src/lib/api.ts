import type { ApiErrorPayload } from "@/lib/types";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/+$/, "");

const TOKEN_KEY = "trustscan.access_token";

export class ApiError extends Error {
  status: number;
  code: string;
  details: unknown;

  constructor(
    message: string,
    status = 0,
    code = "request_failed",
    details: unknown = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let accessToken: string | null = null;
let refreshInFlight: Promise<string | null> | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function getApiBaseUrl(): string {
  return API_URL;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  if (typeof window === "undefined") return;
  if (token) {
    window.sessionStorage.setItem(TOKEN_KEY, token);
  } else {
    window.sessionStorage.removeItem(TOKEN_KEY);
  }
}

export function hydrateAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  accessToken = window.sessionStorage.getItem(TOKEN_KEY);
  return accessToken;
}

export function onUnauthorized(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

function parseError(status: number, body: unknown): ApiError {
  const payload = body as ApiErrorPayload | null;
  const error = payload?.error;
  if (error?.message) {
    return new ApiError(
      error.message,
      status,
      error.code ?? "request_failed",
      error.details ?? null,
    );
  }
  if (status === 401) {
    return new ApiError("Your session has expired. Please sign in again.", 401, "unauthorized");
  }
  if (status === 403) {
    return new ApiError("You do not have permission to do that.", 403, "forbidden");
  }
  if (status === 404) {
    return new ApiError("The requested resource was not found.", 404, "not_found");
  }
  if (status === 429) {
    return new ApiError("Too many requests. Please slow down.", 429, "rate_limited");
  }
  if (status >= 500) {
    return new ApiError("TrustScan hit an unexpected error. Please try again.", status, "server_error");
  }
  return new ApiError("The request could not be completed.", status, "request_failed");
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  const text = await response.text();
  return text ? { error: { message: text } } : null;
}

export async function refreshSession(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  // Refresh tokens rotate and are shared through the httpOnly cookie. Without
  // cross-tab serialisation, two tabs bootstrapping at once would both send the
  // same token; the second would look like token reuse and revoke the session.
  // The Web Locks API makes the calls sequential, so each tab reads the cookie
  // the previous tab just rotated.
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;

  const run = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        setAccessToken(null);
        return null;
      }
      const data = (await response.json()) as { access_token: string };
      setAccessToken(data.access_token);
      return data.access_token;
    } catch {
      return null;
    }
  };

  refreshInFlight = (
    locks?.request ? locks.request("trustscan.refresh", run) : run()
  ).finally(() => {
    refreshInFlight = null;
  }) as Promise<string | null>;

  return refreshInFlight;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  formData?: FormData;
  signal?: AbortSignal;
  auth?: boolean;
  retryOnUnauthorized?: boolean;
  raw?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = "GET",
    body,
    formData,
    signal,
    auth = true,
    retryOnUnauthorized = true,
  } = options;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
      credentials: "include",
      signal,
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(
      "Cannot reach the TrustScan API. Check that the backend is running.",
      0,
      "network_error",
    );
  }

  if (response.status === 401 && auth && retryOnUnauthorized) {
    const token = await refreshSession();
    if (token) {
      return apiRequest<T>(path, { ...options, retryOnUnauthorized: false });
    }
    unauthorizedHandler?.();
  }

  const payload = await readBody(response);

  if (!response.ok) {
    throw parseError(response.status, payload);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method">) =>
    apiRequest<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method">) =>
    apiRequest<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...options, method: "DELETE" }),
  upload: <T>(path: string, formData: FormData, options?: Omit<RequestOptions, "method">) =>
    apiRequest<T>(path, { ...options, method: "POST", formData }),
};

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
