import {NextResponse} from "next/server";

import {AUTH_BACKEND_ENDPOINTS, extractDetail, postToAuthBackend, requestAuthBackend} from "@/lib/api/auth-server";
import {getSessionRoleFromUser, normalizeAuthCurrentUser} from "@/lib/auth/current-user";
import {setAuthCookies} from "@/lib/auth/token-cookies";
import type {SessionRole} from "@/lib/auth/session";

type LoginRequestBody = {
  email?: unknown;
  password?: unknown;
};

type LoginSuccessPayload = {
  access?: unknown;
  refresh?: unknown;
  user?: unknown;
};

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

async function resolveRoleFromAccessToken(accessToken: string, fallbackUser: unknown): Promise<SessionRole> {
  const fallbackNormalizedUser = normalizeAuthCurrentUser(fallbackUser);
  if (fallbackNormalizedUser) {
    return getSessionRoleFromUser(fallbackNormalizedUser);
  }

  const meResult = await requestAuthBackend<unknown>({
    endpointPath: AUTH_BACKEND_ENDPOINTS.me,
    method: "GET",
    accessToken
  });

  const meUser = normalizeAuthCurrentUser(meResult.data);
  if (meUser) {
    return getSessionRoleFromUser(meUser);
  }

  return "user";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as LoginRequestBody | null;
  const email = asString(body?.email).trim().toLowerCase();
  const password = asString(body?.password);

  if (!email || !password) {
    return NextResponse.json({error: "Email and password are required."}, {status: 400});
  }

  const loginResult = await postToAuthBackend<LoginSuccessPayload>(AUTH_BACKEND_ENDPOINTS.login, {
    email,
    password
  });

  if (!loginResult.ok || !loginResult.data) {
    return NextResponse.json(
      {error: loginResult.detail ?? "Invalid credentials."},
      {status: loginResult.status >= 400 ? loginResult.status : 401}
    );
  }

  const access = asString(loginResult.data.access).trim();
  const refresh = asString(loginResult.data.refresh).trim();

  if (!access || !refresh) {
    return NextResponse.json(
      {
        error: extractDetail(loginResult.data) ?? "Login response is missing token fields."
      },
      {status: 502}
    );
  }

  const role = await resolveRoleFromAccessToken(access, loginResult.data.user);
  const response = NextResponse.json({ok: true, role});
  setAuthCookies(response, {access, refresh}, role);
  return response;
}

