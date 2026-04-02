import {NextResponse} from "next/server";

import {AUTH_BACKEND_ENDPOINTS, postToAuthBackend} from "@/lib/api/auth-server";

type RegisterRequestBody = {
  full_name?: unknown;
  fullName?: unknown;
  email?: unknown;
  password?: unknown;
};

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RegisterRequestBody | null;
  const fullName = asString(body?.full_name ?? body?.fullName).trim();
  const email = asString(body?.email).trim().toLowerCase();
  const password = asString(body?.password);

  if (fullName.length < 2) {
    return NextResponse.json({detail: "Full name is required."}, {status: 400});
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({detail: "Please enter a valid email address."}, {status: 400});
  }

  if (password.length < 8) {
    return NextResponse.json({detail: "Password must be at least 8 characters long."}, {status: 400});
  }

  const result = await postToAuthBackend<{detail?: string}>(AUTH_BACKEND_ENDPOINTS.register, {
    full_name: fullName,
    email,
    password
  });

  return NextResponse.json(
    {
      detail: result.detail ?? "Registration request completed."
    },
    {status: result.status}
  );
}
