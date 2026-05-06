import {NextResponse} from "next/server";

import {AUTH_BACKEND_ENDPOINTS, postToAuthBackend} from "@/lib/api/auth-server";

type ResetPasswordRequestBody = {
  email?: unknown;
  new_password?: unknown;
  token?: unknown;
  activation_token?: unknown;
};

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidResetToken(token: string) {
  return /^[A-Za-z0-9._:-]{16,200}$/.test(token);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ResetPasswordRequestBody | null;
  const email = asString(body?.email).trim().toLowerCase();
  const newPassword = asString(body?.new_password);
  const resetToken = asString(body?.token ?? body?.activation_token).trim();

  if (email && !isValidEmail(email)) {
    return NextResponse.json({detail: "Please enter a valid email address."}, {status: 400});
  }

  if (newPassword.length < 8) {
    return NextResponse.json({detail: "Password must be at least 8 characters long."}, {status: 400});
  }

  if (!resetToken || !isValidResetToken(resetToken)) {
    return NextResponse.json({detail: "This reset link is invalid or expired. Please request a new password reset link."}, {status: 400});
  }

  let result = await postToAuthBackend<{detail?: string}>(AUTH_BACKEND_ENDPOINTS.resetPassword, {
    token: resetToken,
    new_password: newPassword
  });

  if (!result.ok && (result.status === 400 || result.status === 422)) {
    result = await postToAuthBackend<{detail?: string}>(AUTH_BACKEND_ENDPOINTS.resetPassword, {
      ...(email ? {email} : {}),
      activation_token: resetToken,
      new_password: newPassword
    });
  }

  if (!result.ok && (result.status === 400 || result.status === 422) && email) {
    result = await postToAuthBackend<{detail?: string}>(AUTH_BACKEND_ENDPOINTS.resetPassword, {
      email,
      token: resetToken,
      new_password: newPassword
    });
  }

  return NextResponse.json(
    {
      detail: result.detail ?? (result.ok ? "Password reset successfully." : "Password reset failed.")
    },
    {status: result.status}
  );
}
