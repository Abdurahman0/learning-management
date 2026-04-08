import {NextResponse} from "next/server";

import {AUTH_BACKEND_ENDPOINTS, requestAuthBackend} from "@/lib/api/auth-server";

type GoogleUrlPayload = {
  authorization_url?: unknown;
  redirect_uri?: unknown;
  detail?: unknown;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const nextParam = requestUrl.searchParams.get("next")?.trim() ?? "";
  const endpointPath = nextParam
    ? `${AUTH_BACKEND_ENDPOINTS.googleUrl}?next=${encodeURIComponent(nextParam)}`
    : AUTH_BACKEND_ENDPOINTS.googleUrl;

  const result = await requestAuthBackend<GoogleUrlPayload>({
    endpointPath,
    method: "GET"
  });

  return NextResponse.json(
    {
      authorization_url: asString(result.data?.authorization_url),
      redirect_uri: asString(result.data?.redirect_uri),
      detail: result.detail
    },
    {status: result.status}
  );
}
