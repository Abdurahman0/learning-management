import {NextResponse} from "next/server";

import {AUTH_BACKEND_ENDPOINTS, postToAuthBackend} from "@/lib/api/auth-server";

type ResetPasswordRequestBody = {
  email?: unknown;
  new_password?: unknown;
};

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ResetPasswordRequestBody | null;
  const email = asString(body?.email).trim().toLowerCase();
  const newPassword = asString(body?.new_password);

  if (!isValidEmail(email)) {
    return NextResponse.json({detail: "Please enter a valid email address."}, {status: 400});
  }

  if (newPassword.length < 8) {
    return NextResponse.json({detail: "Password must be at least 8 characters long."}, {status: 400});
  }

  const result = await postToAuthBackend<{detail?: string}>(AUTH_BACKEND_ENDPOINTS.resetPassword, {
    email,
    new_password: newPassword
  });

  return NextResponse.json(
    {
      detail: result.detail ?? "Password reset request completed."
    },
    {status: result.status}
  );
}
