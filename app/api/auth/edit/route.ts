import {cookies} from "next/headers";
import {NextResponse} from "next/server";

import {AUTH_BACKEND_ENDPOINTS, extractDetail, postToAuthBackend, requestAuthBackend} from "@/lib/api/auth-server";
import {getSessionRoleFromUser, normalizeAuthCurrentUser} from "@/lib/auth/current-user";
import {ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME} from "@/lib/auth/session";
import {clearAuthCookies, setAccessTokenCookie, setRoleCookie} from "@/lib/auth/token-cookies";

type RefreshSuccessPayload = {
  access?: unknown;
};

type EditRequestBody = {
  full_name?: unknown;
};

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
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

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as EditRequestBody | null;
  const fullName = asString(body?.full_name).trim();

  if (!fullName || fullName.length < 2) {
    return NextResponse.json(
      {full_name: ["Full name must be at least 2 characters."]},
      {status: 400}
    );
  }

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
    endpointPath: AUTH_BACKEND_ENDPOINTS.edit,
    method: "PATCH",
    accessToken,
    body: {
      full_name: fullName
    }
  });

  if (result.status === 401 && refreshToken) {
    const nextToken = await refreshAccessToken(refreshToken);
    if (nextToken) {
      accessToken = nextToken;
      refreshedToken = nextToken;
      result = await requestAuthBackend<unknown>({
        endpointPath: AUTH_BACKEND_ENDPOINTS.edit,
        method: "PATCH",
        accessToken,
        body: {
          full_name: fullName
        }
      });
    }
  }

  if (!result.ok || !result.data) {
    const status = result.status >= 400 ? result.status : 400;
    const payload = asRecord(result.data) ?? {detail: result.detail ?? "Failed to update profile."};
    const response = NextResponse.json(payload, {status});
    if (status === 401) {
      clearAuthCookies(response);
    }
    return response;
  }

  const user = normalizeAuthCurrentUser(result.data);
  if (!user) {
    return NextResponse.json(
      {detail: extractDetail(result.data) ?? "Profile update response is invalid."},
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
