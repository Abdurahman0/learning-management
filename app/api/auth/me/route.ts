import {cookies} from "next/headers";
import {NextResponse} from "next/server";

import {AUTH_BACKEND_ENDPOINTS, extractDetail, postToAuthBackend, requestAuthBackend} from "@/lib/api/auth-server";
import {getSessionRoleFromUser, normalizeAuthCurrentUser} from "@/lib/auth/current-user";
import {ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME} from "@/lib/auth/session";
import {clearAuthCookies, setAccessTokenCookie, setRoleCookie} from "@/lib/auth/token-cookies";

type RefreshSuccessPayload = {
  access?: unknown;
};

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

async function refreshAccessToken(refreshToken: string) {
  const result = await postToAuthBackend<RefreshSuccessPayload>(AUTH_BACKEND_ENDPOINTS.refresh, {
    refresh: refreshToken
  });

  if (!result.ok || !result.data) {
    return null;
  }

  const access = asString(result.data.access).trim();
  return access || null;
}

export async function GET() {
  const cookieStore = await cookies();
  let accessToken = asString(cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value).trim();
  const refreshToken = asString(cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value).trim();
  let refreshedToken: string | null = null;

  if (!accessToken && refreshToken) {
    const nextToken = await refreshAccessToken(refreshToken);
    if (nextToken) {
      accessToken = nextToken;
      refreshedToken = nextToken;
    }
  }

  if (!accessToken) {
    const response = NextResponse.json({detail: "Authentication required."}, {status: 401});
    clearAuthCookies(response);
    return response;
  }

  let result = await requestAuthBackend<unknown>({
    endpointPath: AUTH_BACKEND_ENDPOINTS.me,
    method: "GET",
    accessToken
  });

  if (result.status === 401 && refreshToken) {
    const nextToken = await refreshAccessToken(refreshToken);
    if (nextToken) {
      accessToken = nextToken;
      refreshedToken = nextToken;
      result = await requestAuthBackend<unknown>({
        endpointPath: AUTH_BACKEND_ENDPOINTS.me,
        method: "GET",
        accessToken
      });
    }
  }

  if (!result.ok || !result.data) {
    const response = NextResponse.json(
      {detail: result.detail ?? "Failed to load current user."},
      {status: result.status >= 400 ? result.status : 400}
    );
    if (result.status === 401) {
      clearAuthCookies(response);
    }
    return response;
  }

  const user = normalizeAuthCurrentUser(result.data);
  if (!user) {
    return NextResponse.json(
      {detail: extractDetail(result.data) ?? "Current user response is invalid."},
      {status: 502}
    );
  }

  const role = getSessionRoleFromUser(user);
  const response = NextResponse.json(user);

  if (refreshedToken) {
    setAccessTokenCookie(response, refreshedToken);
  }
  setRoleCookie(response, role);

  return response;
}
