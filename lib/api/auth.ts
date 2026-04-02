import type {AuthCurrentUser} from "@/lib/auth/current-user";

type AuthApiRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
};

export type AuthApiResponse<T = Record<string, unknown>> = {
  ok: boolean;
  status: number;
  data: T | null;
  detail: string | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function extractDetail(payload: unknown): string | null {
  const record = asRecord(payload);
  if (!record) return null;

  const directKeys = ["detail", "message", "error"] as const;
  for (const key of directKeys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

async function requestAuthApi<T>(path: string, options?: AuthApiRequestOptions): Promise<AuthApiResponse<T>> {
  const method = options?.method ?? "POST";
  const hasBody = options?.body !== undefined && method !== "GET" && method !== "DELETE";

  try {
    const response = await fetch(path, {
      method,
      headers: {
        Accept: "application/json",
        ...(hasBody ? {"Content-Type": "application/json"} : {})
      },
      body: hasBody ? JSON.stringify(options?.body) : undefined,
      credentials: "include",
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
      detail: "Authentication service is unavailable right now."
    };
  }
}

export const authApi = {
  me() {
    return requestAuthApi<AuthCurrentUser>("/api/auth/me", {method: "GET"});
  },

  editCurrentUser(payload: {full_name: string}) {
    return requestAuthApi<AuthCurrentUser>("/api/auth/edit", {method: "PATCH", body: payload});
  },

  activate(payload: {token: string}) {
    return requestAuthApi<{detail?: string}>("/api/auth/activate", {body: payload});
  },

  resendActivation(payload: {email: string}) {
    return requestAuthApi<{detail?: string}>("/api/auth/resend-activation", {body: payload});
  },

  forgotPassword(payload: {email: string}) {
    return requestAuthApi<{detail?: string}>("/api/auth/forgot-password", {body: payload});
  },

  verifyResetCode(payload: {email: string; code: string}) {
    return requestAuthApi<{detail?: string}>("/api/auth/verify-reset-code", {body: payload});
  },

  resetPassword(payload: {email: string; new_password: string}) {
    return requestAuthApi<{detail?: string}>("/api/auth/reset-password", {body: payload});
  }
};
