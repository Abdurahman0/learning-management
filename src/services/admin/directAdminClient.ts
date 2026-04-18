import axios, {type AxiosProgressEvent} from "axios";

import {toAdminApiError} from "./httpClient";
import {AdminApiError} from "./types";

export const PROXY_UPLOAD_SOFT_LIMIT_BYTES = 4 * 1024 * 1024; // Vercel/route-handler limits are typically ~4-5MB.

type DirectAuthPayload = {
  accessToken?: unknown;
  baseUrl?: unknown;
  detail?: unknown;
  role?: unknown;
};

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

async function fetchDirectAdminAuth() {
  const response = await fetch("/api/auth/access-token", {
    method: "GET",
    cache: "no-store",
    credentials: "include"
  });

  const payload = (await response.json().catch(() => null)) as DirectAuthPayload | null;
  if (!response.ok) {
    const message = asString(payload?.detail).trim() || "Authentication required.";
    throw new AdminApiError(message, response.status, {}, payload ?? null);
  }

  const accessToken = asString(payload?.accessToken).trim();
  const baseUrl = asString(payload?.baseUrl).trim().replace(/\/$/, "");
  if (!accessToken || !baseUrl) {
    throw new AdminApiError("Upload authentication is not configured.", 500, {}, payload ?? null);
  }

  return {accessToken, baseUrl};
}

async function refreshDirectTokenCookie() {
  await fetch("/api/auth/token/refresh", {
    method: "POST",
    headers: {"Content-Type": "application/json", Accept: "application/json"},
    body: JSON.stringify({}),
    credentials: "include",
    cache: "no-store"
  });
}

export async function directAdminMultipartRequest<T>(params: {
  path: string;
  method: "POST" | "PUT" | "PATCH";
  body: FormData;
  onUploadProgress?: (progress: AxiosProgressEvent) => void;
}) {
  const {accessToken, baseUrl} = await fetchDirectAdminAuth();

  const url = `${baseUrl}/api/v1/admin/${params.path.replace(/^\//, "")}`;
  try {
    const response = await axios.request<T>({
      url,
      method: params.method,
      data: params.body,
      withCredentials: false,
      // Full-test listening audio can be 100MB+; allow enough time for slower networks.
      timeout: 600_000,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`
        // Do NOT set Content-Type manually for FormData; the browser adds the boundary.
      },
      onUploadProgress: params.onUploadProgress
    });
    return response.data;
  } catch (error) {
    const mapped = toAdminApiError(error);

    if (mapped.status === 413) {
      throw new AdminApiError(
        "Upload too large. The backend (Nginx/Cloudflare/app server) is rejecting this file size. Increase the backend upload limit (for example Nginx `client_max_body_size 200m;`) and any app-level upload limits, then retry.",
        413,
        {},
        error
      );
    }

    if (mapped.status === 401) {
      // Try refreshing cookies and retrying once.
      try {
        await refreshDirectTokenCookie();
        const next = await fetchDirectAdminAuth();
        const retryUrl = `${next.baseUrl}/api/v1/admin/${params.path.replace(/^\//, "")}`;
        const retry = await axios.request<T>({
          url: retryUrl,
          method: params.method,
          data: params.body,
          withCredentials: false,
          timeout: 600_000,
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${next.accessToken}`
          },
          onUploadProgress: params.onUploadProgress
        });
        return retry.data;
      } catch {
        // fallthrough to original error
      }
    }

    // CORS failures usually surface as a network error with no status.
    if (!mapped.status || mapped.status === 0) {
      throw new AdminApiError(
        "Upload failed. The backend must allow CORS from this site (englishlabs.uz) for direct uploads, including the Authorization header.",
        0,
        {},
        error
      );
    }

    throw mapped;
  }
}

export function shouldBypassProxyUpload(file: File | null | undefined) {
  return file instanceof File && file.size > PROXY_UPLOAD_SOFT_LIMIT_BYTES;
}
