export type SessionRole = "user" | "teacher" | "admin";

export const AUTH_COOKIE_NAME = "lms_role";
export const ACCESS_TOKEN_COOKIE_NAME = "lms_access_token";
export const REFRESH_TOKEN_COOKIE_NAME = "lms_refresh_token";

export function parseSessionRole(value: string | undefined): SessionRole | null {
  if (value === "user" || value === "teacher" || value === "admin") {
    return value;
  }

  return null;
}
