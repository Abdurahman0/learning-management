export const AUTH_BACKEND_ENDPOINTS = {
  register: "/api/auth/register/",
  activate: "/api/auth/activate/",
  resendActivation: "/api/auth/resend-activation/",
  login: "/api/auth/login/",
  google: "/api/auth/google/",
  me: "/api/auth/me/",
  edit: "/api/auth/edit/",
  refresh: "/api/auth/token/refresh/",
  forgotPassword: "/api/auth/forgot-password/",
  verifyResetCode: "/api/auth/verify-reset-code/",
  resetPassword: "/api/auth/reset-password/"
} as const;

type JsonRecord = Record<string, unknown>;

export type BackendAuthResponse<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  detail: string | null;
};

function asRecord(value: unknown): JsonRecord | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as JsonRecord;
}

export function extractDetail(payload: unknown): string | null {
  const record = asRecord(payload);

  if (!record) {
    return null;
  }

  const keys = ["detail", "message", "error"];
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function resolveBackendBaseUrl() {
  const rawBaseUrl =
    process.env.AUTH_API_BASE_URL ??
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "";

  return rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
}

function buildBackendUrl(endpointPath: string) {
  const baseUrl = resolveBackendBaseUrl();

  if (!baseUrl) {
    return null;
  }

  const endpoint = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;

  try {
    const parsedBaseUrl = new URL(baseUrl);
    const basePath = parsedBaseUrl.pathname.endsWith("/")
      ? parsedBaseUrl.pathname.slice(0, -1)
      : parsedBaseUrl.pathname;

    const hasSamePrefix =
      basePath.length > 0 && basePath !== "/" && (endpoint === basePath || endpoint.startsWith(`${basePath}/`));
    const finalPath = hasSamePrefix ? endpoint : `${basePath === "/" ? "" : basePath}${endpoint}`;

    return `${parsedBaseUrl.origin}${finalPath}`;
  } catch {
    return `${baseUrl}${endpoint}`;
  }
}

export async function requestAuthBackend<T>(params: {
  endpointPath: string;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  accessToken?: string;
}): Promise<BackendAuthResponse<T>> {
  const method = params.method ?? "GET";
  const hasBody = params.body !== undefined && method !== "GET" && method !== "DELETE";
  const endpointPath = params.endpointPath;

  const url = buildBackendUrl(endpointPath);

  if (!url) {
    return {
      ok: false,
      status: 500,
      data: null,
      detail: "AUTH_API_BASE_URL is not configured."
    };
  }

  try {
    const headers: Record<string, string> = {
      Accept: "application/json"
    };

    if (params.accessToken?.trim()) {
      headers.Authorization = `Bearer ${params.accessToken.trim()}`;
    }

    if (hasBody) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      method,
      headers,
      body: hasBody ? JSON.stringify(params.body) : undefined,
      cache: "no-store"
    });

    const data = (await response.json().catch(() => null)) as T | null;

    return {
      ok: response.ok,
      status: response.status,
      data,
      detail: extractDetail(data)
    };
  } catch {
    return {
      ok: false,
      status: 503,
      data: null,
      detail: "Authentication service is temporarily unavailable."
    };
  }
}

export async function postToAuthBackend<T>(endpointPath: string, body: unknown): Promise<BackendAuthResponse<T>> {
  return requestAuthBackend<T>({endpointPath, method: "POST", body});
}
