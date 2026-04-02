import type {NextResponse} from "next/server";

import {ACCESS_TOKEN_COOKIE_NAME, AUTH_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME, type SessionRole} from "./session";

const COOKIE_BASE = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/"
};

const ACCESS_MAX_AGE_SECONDS = 60 * 15;
const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function setAuthCookies(
  response: NextResponse,
  tokens: {access: string; refresh: string},
  role: SessionRole = "user"
) {
  response.cookies.set(ACCESS_TOKEN_COOKIE_NAME, tokens.access, {
    ...COOKIE_BASE,
    maxAge: ACCESS_MAX_AGE_SECONDS
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE_NAME, tokens.refresh, {
    ...COOKIE_BASE,
    maxAge: REFRESH_MAX_AGE_SECONDS
  });
  response.cookies.set(AUTH_COOKIE_NAME, role, {
    ...COOKIE_BASE,
    maxAge: REFRESH_MAX_AGE_SECONDS
  });
}

export function setAccessTokenCookie(response: NextResponse, accessToken: string) {
  response.cookies.set(ACCESS_TOKEN_COOKIE_NAME, accessToken, {
    ...COOKIE_BASE,
    maxAge: ACCESS_MAX_AGE_SECONDS
  });
}

export function setRoleCookie(response: NextResponse, role: SessionRole) {
  response.cookies.set(AUTH_COOKIE_NAME, role, {
    ...COOKIE_BASE,
    maxAge: REFRESH_MAX_AGE_SECONDS
  });
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE_NAME, "", {
    ...COOKIE_BASE,
    maxAge: 0
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE_NAME, "", {
    ...COOKIE_BASE,
    maxAge: 0
  });
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    ...COOKIE_BASE,
    maxAge: 0
  });
}
