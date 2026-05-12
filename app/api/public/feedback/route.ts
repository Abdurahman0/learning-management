import {NextResponse} from "next/server";

export const runtime = "nodejs";

function resolveBackendBaseUrl() {
  const raw =
    process.env.AUTH_API_BASE_URL ??
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "";

  if (!raw) return "";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

function copyHeaders(source: Headers, target: Headers, status: number) {
  const hasBody = ![204, 205, 304].includes(status);
  const contentType = source.get("content-type");
  if (hasBody && contentType) {
    target.set("content-type", contentType);
  }
  target.set("cache-control", "no-store");
}

export async function GET(request: Request) {
  const baseUrl = resolveBackendBaseUrl();
  if (!baseUrl) {
    return NextResponse.json({detail: "Public API base URL is not configured."}, {status: 500});
  }

  const requestUrl = new URL(request.url);
  const backendUrl = `${baseUrl}/api/v1/student/feedback/${requestUrl.search}`;

  try {
    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {Accept: "application/json"},
      cache: "no-store"
    });

    const body = ![204, 205, 304].includes(response.status) ? await response.arrayBuffer().catch(() => null) : null;
    const proxy = new NextResponse(body, {status: response.status});
    copyHeaders(response.headers, proxy.headers, response.status);
    return proxy;
  } catch {
    return NextResponse.json({detail: "Could not load feedback."}, {status: 502});
  }
}
