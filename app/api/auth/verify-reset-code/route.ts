import {NextResponse} from "next/server";

import {AUTH_BACKEND_ENDPOINTS, postToAuthBackend} from "@/lib/api/auth-server";

type VerifyResetCodeRequestBody = {
  email?: unknown;
  code?: unknown;
};

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as VerifyResetCodeRequestBody | null;
  const email = asString(body?.email).trim().toLowerCase();
  const code = asString(body?.code).trim();

  if (!isValidEmail(email)) {
    return NextResponse.json({detail: "Please enter a valid email address."}, {status: 400});
  }

  if (!code) {
    return NextResponse.json({detail: "Reset code is required."}, {status: 400});
  }

  const result = await postToAuthBackend<{detail?: string; activation_token?: string; token?: string}>(
    AUTH_BACKEND_ENDPOINTS.verifyResetCode,
    {
    token: code
    }
  );

  const activationToken = asString(result.data?.activation_token ?? result.data?.token).trim();

  return NextResponse.json(
    {
      detail: result.detail ?? (result.ok ? "Reset code verification request completed." : "Reset code verification failed."),
      ...(activationToken ? {activation_token: activationToken} : {})
    },
    {status: result.status}
  );
}
