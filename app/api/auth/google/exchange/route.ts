import {NextResponse} from "next/server";

import {AUTH_BACKEND_ENDPOINTS, extractDetail, postToAuthBackend, requestAuthBackend} from "@/lib/api/auth-server";
import {getSessionRoleFromUser, normalizeAuthCurrentUser} from "@/lib/auth/current-user";
import {resolveSessionRoleWithFallback} from "@/lib/auth/role-resolver";
import {setAuthCookies} from "@/lib/auth/token-cookies";

type ExchangeRequestBody = {
  code?: unknown;
};

type ExchangeSuccessPayload = {
  access?: unknown;
  refresh?: unknown;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ExchangeRequestBody | null;
  const code = asString(body?.code);

  if (!code) {
    return NextResponse.json({detail: "Google exchange code is required."}, {status: 400});
  }

  const result = await postToAuthBackend<ExchangeSuccessPayload>(AUTH_BACKEND_ENDPOINTS.googleExchange, {code});

  if (!result.ok || !result.data) {
    return NextResponse.json(
      {detail: result.detail ?? "Google exchange failed."},
      {status: result.status >= 400 ? result.status : 400}
    );
  }

  const access = asString(result.data.access);
  const refresh = asString(result.data.refresh);

  if (!access || !refresh) {
    return NextResponse.json(
      {detail: extractDetail(result.data) ?? "Google exchange response is missing tokens."},
      {status: 502}
    );
  }

  const currentUserResult = await requestAuthBackend<unknown>({
    endpointPath: AUTH_BACKEND_ENDPOINTS.me,
    method: "GET",
    accessToken: access
  });

  const currentUser = normalizeAuthCurrentUser(currentUserResult.data);
  const role = currentUser
    ? getSessionRoleFromUser(currentUser)
    : resolveSessionRoleWithFallback({responseData: result.data, accessToken: access}, "user");

  const response = NextResponse.json({role});
  setAuthCookies(response, {access, refresh}, role);
  return response;
}
