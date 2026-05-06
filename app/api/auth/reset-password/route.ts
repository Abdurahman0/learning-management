import {NextResponse} from "next/server";

import {AUTH_BACKEND_ENDPOINTS, postToAuthBackend} from "@/lib/api/auth-server";

type ResetPasswordRequestBody = {
  new_password?: unknown;
  activation_token?: unknown;
};

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function isValidActivationToken(token: string) {
  return /^[A-Za-z0-9._:-]{16,200}$/.test(token);
}

function extractPasswordError(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const record = payload as Record<string, unknown>;
  const value = record.new_password;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ResetPasswordRequestBody | null;
  const newPassword = asString(body?.new_password);
  const activationToken = asString(body?.activation_token).trim();

  if (newPassword.length < 8) {
    return NextResponse.json({detail: "Password must be at least 8 characters long."}, {status: 400});
  }

  if (!activationToken || !isValidActivationToken(activationToken)) {
    return NextResponse.json({detail: "This reset link is invalid or expired. Please request a new password reset link."}, {status: 400});
  }

  const result = await postToAuthBackend<{detail?: string; new_password?: string[] | string}>(AUTH_BACKEND_ENDPOINTS.resetPassword, {
    activation_token: activationToken,
    new_password: newPassword
  });
  const passwordError = extractPasswordError(result.data);

  return NextResponse.json(
    {
      detail: result.detail ?? passwordError ?? (result.ok ? "Password has been reset." : "Password reset failed.")
    },
    {status: result.status}
  );
}
