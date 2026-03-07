import {NextResponse} from "next/server";

import {authenticateStaticUser, AUTH_COOKIE_NAME} from "@/lib/auth/session";

type LoginRequestBody = {
  email?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as LoginRequestBody | null;
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const role = authenticateStaticUser(email, password);

  if (!role) {
    return NextResponse.json({error: "Invalid credentials."}, {status: 401});
  }

  const response = NextResponse.json({ok: true, role});
  response.cookies.set(AUTH_COOKIE_NAME, role, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });

  return response;
}
