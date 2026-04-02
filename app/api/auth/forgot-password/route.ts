import {NextResponse} from "next/server";

import {AUTH_BACKEND_ENDPOINTS, postToAuthBackend} from "@/lib/api/auth-server";

type ForgotPasswordRequestBody = {
  email?: unknown;
};

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ForgotPasswordRequestBody | null;
  const email = asString(body?.email).trim().toLowerCase();

  if (!isValidEmail(email)) {
    return NextResponse.json({detail: "Please enter a valid email address."}, {status: 400});
  }

  const result = await postToAuthBackend<{detail?: string}>(AUTH_BACKEND_ENDPOINTS.forgotPassword, {
    email
  });

  return NextResponse.json(
    {
      detail: result.detail ?? "Password reset request completed."
    },
    {status: result.status}
  );
}
