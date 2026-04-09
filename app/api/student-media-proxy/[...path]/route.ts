import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { clearAuthCookies, setAccessTokenCookie } from "@/lib/auth/token-cookies";
import { ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from "@/lib/auth/session";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

function resolveBackendBaseUrl() {
  const raw =
    process.env.AUTH_API_BASE_URL ??
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "";

  if (!raw) return "";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

function buildBackendMediaUrl(path: string[], searchParams: URLSearchParams) {
  const explicitOrigin = searchParams.get("__origin")?.trim() ?? "";
  const base = explicitOrigin || resolveBackendBaseUrl();
  if (!base) return null;
  const mediaPath = path.join("/");
  const nextParams = new URLSearchParams(searchParams);
  nextParams.delete("__origin");
  const query = nextParams.toString();
  return `${base}/${mediaPath}${query ? `?${query}` : ""}`;
}

async function refreshAccessToken(baseUrl: string, refreshToken: string) {
  try {
    const response = await fetch(`${baseUrl}/api/auth/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ refresh: refreshToken }),
      cache: "no-store"
    });

    if (!response.ok) return null;
    const payload = (await response.json().catch(() => null)) as { access?: unknown } | null;
    const access = typeof payload?.access === "string" ? payload.access.trim() : "";
    return access || null;
  } catch {
    return null;
  }
}

function copyMediaHeaders(source: Headers, target: Headers) {
  const passKeys = [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "etag",
    "last-modified",
    "cache-control",
    "content-disposition"
  ];
  for (const key of passKeys) {
    const value = source.get(key);
    if (value) {
      try {
        target.set(key, value);
      } catch {
        // Ignore invalid upstream header values.
      }
    }
  }
  if (!target.has("cache-control")) {
    target.set("cache-control", "no-store");
  }
}

async function handleMediaProxy(request: Request, context: RouteContext) {
  const { path } = await context.params;
  const parsedUrl = new URL(request.url);
  const backendUrl = buildBackendMediaUrl(path ?? [], parsedUrl.searchParams);
  const baseUrl = resolveBackendBaseUrl();

  if (!backendUrl || !baseUrl) {
    return NextResponse.json({ detail: "Student API base URL is not configured." }, { status: 500 });
  }

  const cookieStore = await cookies();
  let accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value?.trim() ?? "";
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value?.trim() ?? "";
  let preflightRefreshedToken: string | null = null;

  if (!accessToken && refreshToken) {
    const refreshed = await refreshAccessToken(baseUrl, refreshToken);
    if (refreshed) {
      accessToken = refreshed;
      preflightRefreshedToken = refreshed;
    }
  }

  if (!accessToken) {
    return NextResponse.json({ detail: "Authentication required." }, { status: 401 });
  }

  const rangeHeader = request.headers.get("range");
  const baseOrigin = (() => {
    try {
      return new URL(baseUrl).origin;
    } catch {
      return "";
    }
  })();
  const method = request.method.toUpperCase();
  const makeUpstreamRequest = async (token?: string | null) => {
    const headers: Record<string, string> = {
      Accept: "*/*",
      "User-Agent": "IELTS-MASTER-StudentMediaProxy/1.0",
      ...(baseOrigin ? { Referer: `${baseOrigin}/` } : {}),
      ...(baseOrigin ? { Origin: baseOrigin } : {}),
      ...(rangeHeader ? { Range: rangeHeader } : {})
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return fetch(backendUrl, {
      method,
      headers,
      cache: "no-store"
    });
  };

  try {
    let upstream = await makeUpstreamRequest(accessToken);
    let refreshedToken: string | null = null;

    if (upstream.status === 401 && refreshToken) {
      const nextToken = await refreshAccessToken(baseUrl, refreshToken);
      if (nextToken) {
        refreshedToken = nextToken;
        upstream = await makeUpstreamRequest(nextToken);
      }
    }

    // Some media hosts reject bearer auth on static files; retry anonymously.
    if (upstream.status === 403) {
      const anonymousAttempt = await makeUpstreamRequest(null);
      if (anonymousAttempt.ok || anonymousAttempt.status === 206) {
        upstream = anonymousAttempt;
      }
    }

    const response = new NextResponse(method === "HEAD" ? null : upstream.body, {
      status: upstream.status
    });
    copyMediaHeaders(upstream.headers, response.headers);

    if (preflightRefreshedToken) {
      setAccessTokenCookie(response, preflightRefreshedToken);
    }
    if (refreshedToken) {
      setAccessTokenCookie(response, refreshedToken);
    }
    if (upstream.status === 401) {
      clearAuthCookies(response);
    }

    return response;
  } catch {
    return NextResponse.json({ detail: "Media is unavailable right now." }, { status: 503 });
  }
}

export async function GET(request: Request, context: RouteContext) {
  return handleMediaProxy(request, context);
}

export async function HEAD(request: Request, context: RouteContext) {
  return handleMediaProxy(request, context);
}
