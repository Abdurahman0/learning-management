import {NextResponse} from "next/server";

import {AUTH_BACKEND_ENDPOINTS, postToAuthBackend} from "@/lib/api/auth-server";

type ActivateResetTokenRequestBody = {
  token?: unknown;
};

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function isValidResetEmailToken(token: string) {
  return /^[A-Za-z0-9._:-]{16,200}$/.test(token);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ActivateResetTokenRequestBody | null;
  const token = asString(body?.token).trim();

  if (!token || !isValidResetEmailToken(token)) {
    return NextResponse.json({detail: "Reset link is invalid or has expired."}, {status: 400});
  }

  const result = await postToAuthBackend<{detail?: string; activation_token?: string; token?: string}>(
    AUTH_BACKEND_ENDPOINTS.verifyResetCode,
    {token}
  );
  const activationToken = asString(result.data?.activation_token ?? result.data?.token).trim();

  return NextResponse.json(
    {
      detail: result.detail ?? (result.ok ? "Reset link verified." : "Reset link is invalid or has expired."),
      ...(activationToken ? {activation_token: activationToken} : {})
    },
    {status: result.status}
  );
}
