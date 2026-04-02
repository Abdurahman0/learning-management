import {NextResponse} from "next/server";

import {AUTH_BACKEND_ENDPOINTS, postToAuthBackend} from "@/lib/api/auth-server";

type ActivateRequestBody = {
  token?: unknown;
};

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ActivateRequestBody | null;
  const token = asString(body?.token).trim();

  if (!token) {
    return NextResponse.json({detail: "Activation token is required."}, {status: 400});
  }

  const result = await postToAuthBackend<{detail?: string}>(AUTH_BACKEND_ENDPOINTS.activate, {
    token
  });

  return NextResponse.json(
    {
      detail: result.detail ?? "Activation request completed."
    },
    {status: result.status}
  );
}
