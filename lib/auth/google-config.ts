"use client";

let cachedGoogleClientId: string | null = null;

function readClientIdFromRuntimeEnv() {
  const raw = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  return typeof raw === "string" ? raw.trim() : "";
}

export async function resolveGoogleClientId(): Promise<string> {
  if (cachedGoogleClientId) {
    return cachedGoogleClientId;
  }

  const fromRuntimeEnv = readClientIdFromRuntimeEnv();
  if (fromRuntimeEnv) {
    cachedGoogleClientId = fromRuntimeEnv;
    return fromRuntimeEnv;
  }

  const response = await fetch("/api/auth/google/client-id", {
    method: "GET",
    credentials: "include",
    cache: "no-store"
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        client_id?: unknown;
        detail?: unknown;
      }
    | null;

  const clientId = typeof payload?.client_id === "string" ? payload.client_id.trim() : "";
  if (response.ok && clientId) {
    cachedGoogleClientId = clientId;
    return clientId;
  }

  const detail = typeof payload?.detail === "string" && payload.detail.trim() ? payload.detail.trim() : "";
  throw new Error(detail || "Google sign-in is not configured. Missing Google client ID.");
}
