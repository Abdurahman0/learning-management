import {cookies} from "next/headers";
import {NextResponse} from "next/server";

import {ACCESS_TOKEN_COOKIE_NAME, AUTH_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME, parseSessionRole} from "@/lib/auth/session";
import {setAccessTokenCookie} from "@/lib/auth/token-cookies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({refresh: refreshToken}),
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json().catch(() => null)) as {access?: unknown} | null;
    const access = typeof payload?.access === "string" ? payload.access.trim() : "";
    return access || null;
  } catch {
    return null;
  }
}

export async function GET() {
  const baseUrl = resolveBackendBaseUrl();
  if (!baseUrl) {
    return NextResponse.json({detail: "API base URL is not configured."}, {status: 500});
  }

  const cookieStore = await cookies();
  const roleRaw = cookieStore.get(AUTH_COOKIE_NAME)?.value?.trim() ?? "";
  const role = parseSessionRole(roleRaw);
  if (role !== "admin") {
    return NextResponse.json({detail: "Admin authentication required."}, {status: 403});
  }

  let accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value?.trim() ?? "";
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value?.trim() ?? "";

  let refreshed: string | null = null;
  if (!accessToken && refreshToken) {
    refreshed = await refreshAccessToken(baseUrl, refreshToken);
    if (refreshed) {
      accessToken = refreshed;
    }
  }

  if (!accessToken) {
    return NextResponse.json({detail: "Authentication required."}, {status: 401});
  }

  const response = NextResponse.json(
    {
      accessToken,
      baseUrl
    },
    {
      headers: {
        "cache-control": "no-store"
      }
    }
  );

  if (refreshed) {
    setAccessTokenCookie(response, refreshed);
  }

  return response;
}

