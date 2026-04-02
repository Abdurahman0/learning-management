import {NextResponse} from "next/server";

import {clearAuthCookies} from "@/lib/auth/token-cookies";

export async function POST() {
  const response = NextResponse.json({ok: true});
  clearAuthCookies(response);
  return response;
}

