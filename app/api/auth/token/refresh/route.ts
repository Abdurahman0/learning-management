import {cookies} from "next/headers";
import {NextResponse} from "next/server";

import {AUTH_BACKEND_ENDPOINTS, extractDetail, postToAuthBackend, requestAuthBackend} from "@/lib/api/auth-server";
import {getSessionRoleFromUser, normalizeAuthCurrentUser} from "@/lib/auth/current-user";
import {REFRESH_TOKEN_COOKIE_NAME} from "@/lib/auth/session";
import {setAccessTokenCookie, setRoleCookie} from "@/lib/auth/token-cookies";

type RefreshRequestBody = {
  refresh?: unknown;
};

type RefreshSuccessPayload = {
  access?: unknown;
};

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RefreshRequestBody | null;
  const cookieStore = await cookies();
  const refreshFromBody = asString(body?.refresh).trim();
  const refreshFromCookie = asString(cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value).trim();
  const refresh = refreshFromBody || refreshFromCookie;

  if (!refresh) {
    return NextResponse.json({detail: "Refresh token is required."}, {status: 400});
  }

  const result = await postToAuthBackend<RefreshSuccessPayload>(AUTH_BACKEND_ENDPOINTS.refresh, {
    refresh
  });

  if (!result.ok || !result.data) {
    return NextResponse.json(
      {detail: result.detail ?? "Token refresh failed."},
      {status: result.status >= 400 ? result.status : 400}
    );
  }

  const access = asString(result.data.access);

  if (!access) {
    return NextResponse.json(
      {detail: extractDetail(result.data) ?? "Token refresh response is missing access token."},
      {status: 502}
    );
  }

  const currentUserResult = await requestAuthBackend<unknown>({
    endpointPath: AUTH_BACKEND_ENDPOINTS.me,
    method: "GET",
    accessToken: access
  });
  const currentUser = normalizeAuthCurrentUser(currentUserResult.data);
  const role = currentUser ? getSessionRoleFromUser(currentUser) : null;
  const response = NextResponse.json(role ? {access, role} : {access});
  setAccessTokenCookie(response, access);
  if (role) {
    setRoleCookie(response, role);
  }

  return response;
}
