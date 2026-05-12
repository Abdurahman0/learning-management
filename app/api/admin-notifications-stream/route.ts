import {cookies} from "next/headers";
import {NextResponse} from "next/server";

import {clearAuthCookies, setAccessTokenCookie} from "@/lib/auth/token-cookies";
import {ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME} from "@/lib/auth/session";

export const runtime = "nodejs";

function resolveBackendBaseUrl() {
  const raw =
    process.env.AUTH_API_BASE_URL ??
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "";

  if (!raw) return "";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

async function refreshAccessToken(baseUrl: string, refreshToken: string) {
  try {
    const response = await fetch(`${baseUrl}/api/auth/token/refresh/`, {
      method: "POST",
      headers: {"Content-Type": "application/json", Accept: "application/json"},
      body: JSON.stringify({refresh: refreshToken}),
      cache: "no-store"
    });

    if (!response.ok) return null;
    const payload = (await response.json().catch(() => null)) as {access?: unknown} | null;
    const access = typeof payload?.access === "string" ? payload.access.trim() : "";
    return access || null;
  } catch {
    return null;
  }
}

async function openStream(baseUrl: string, accessToken: string, signal: AbortSignal) {
  return fetch(`${baseUrl}/api/v1/admin/notifications/stream/`, {
    method: "GET",
    headers: {
      Accept: "text/event-stream",
      Authorization: `Bearer ${accessToken}`
    },
    signal,
    cache: "no-store"
  });
}

async function fetchNotificationSnapshot(baseUrl: string, accessToken: string, signal: AbortSignal) {
  const response = await fetch(`${baseUrl}/api/v1/admin/notifications/`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    signal,
    cache: "no-store"
  });

  if (!response.ok) return null;
  return response.json().catch(() => null) as Promise<unknown | null>;
}

function createPollingSseStream(baseUrl: string, accessToken: string, requestSignal: AbortSignal) {
  const encoder = new TextEncoder();
  let closed = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const abortController = new AbortController();

  requestSignal.addEventListener(
    "abort",
    () => {
      closed = true;
      abortController.abort();
      if (timer) clearTimeout(timer);
    },
    {once: true}
  );

  return new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      const poll = async () => {
        if (closed) return;

        const snapshot = await fetchNotificationSnapshot(baseUrl, accessToken, abortController.signal).catch(() => null);
        if (snapshot) {
          send("notifications", snapshot);
        } else {
          send("heartbeat", {unread_count: 0});
        }

        if (!closed) {
          timer = setTimeout(() => void poll(), 15000);
        }
      };

      send("ready", {unread_count: 0});
      await poll();
    },
    cancel() {
      closed = true;
      abortController.abort();
      if (timer) clearTimeout(timer);
    }
  });
}

function toSseResponse(body: BodyInit, refreshedTokenForCookie: string | null) {
  const response = new NextResponse(body, {
    status: 200,
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-store, no-cache, must-revalidate",
      connection: "keep-alive"
    }
  });

  if (refreshedTokenForCookie) {
    setAccessTokenCookie(response, refreshedTokenForCookie);
  }

  return response;
}

export async function GET(request: Request) {
  const baseUrl = resolveBackendBaseUrl();
  if (!baseUrl) {
    return NextResponse.json({detail: "Admin API base URL is not configured."}, {status: 500});
  }

  const cookieStore = await cookies();
  let accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value?.trim() ?? "";
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value?.trim() ?? "";
  let refreshedTokenForCookie: string | null = null;

  if (!accessToken && refreshToken) {
    const refreshed = await refreshAccessToken(baseUrl, refreshToken);
    if (refreshed) {
      accessToken = refreshed;
      refreshedTokenForCookie = refreshed;
    }
  }

  if (!accessToken) {
    return NextResponse.json({detail: "Authentication required."}, {status: 401});
  }

  const abortController = new AbortController();
  request.signal.addEventListener("abort", () => abortController.abort(), {once: true});

  let backendResponse = await openStream(baseUrl, accessToken, abortController.signal);

  if (backendResponse.status === 401 && refreshToken) {
    const refreshed = await refreshAccessToken(baseUrl, refreshToken);
    if (refreshed) {
      refreshedTokenForCookie = refreshed;
      accessToken = refreshed;
      backendResponse = await openStream(baseUrl, refreshed, abortController.signal);
    }
  }

  if ((backendResponse.status === 404 || backendResponse.status === 406) && accessToken) {
    return toSseResponse(createPollingSseStream(baseUrl, accessToken, request.signal), refreshedTokenForCookie);
  }

  if (!backendResponse.ok || !backendResponse.body) {
    if (backendResponse.status === 401) {
      const response = NextResponse.json({detail: "Authentication required."}, {status: 401});
      clearAuthCookies(response);
      return response;
    }
    return NextResponse.json({detail: "Unable to connect notification stream."}, {status: backendResponse.status || 502});
  }

  return toSseResponse(backendResponse.body, refreshedTokenForCookie);
}
