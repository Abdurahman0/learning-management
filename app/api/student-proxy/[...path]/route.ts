import {cookies} from "next/headers";
import {NextResponse} from "next/server";

import {clearAuthCookies, setAccessTokenCookie} from "@/lib/auth/token-cookies";
import {ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME} from "@/lib/auth/session";

type RouteContext = {
  params: Promise<{path: string[]}>;
};

type PreparedBody = {
  body?: BodyInit;
  contentType?: string;
};

function resolveBackendBaseUrl() {
  const raw =
    process.env.AUTH_API_BASE_URL ??
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "";

  if (!raw) return "";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

function buildBackendStudentUrl(path: string[], searchParams: URLSearchParams) {
  const base = resolveBackendBaseUrl();
  if (!base) return null;
  const studentPath = path.join("/");
  const query = searchParams.toString();
  return `${base}/api/v1/student/${studentPath}/${query ? `?${query}` : ""}`;
}

async function prepareBody(request: Request): Promise<PreparedBody> {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD") {
    return {};
  }

  if (method === "DELETE") {
    const contentLength = request.headers.get("content-length");
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType && (!contentLength || contentLength === "0")) {
      return {};
    }
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return {body: await request.formData()};
  }

  if (
    contentType.includes("application/json") ||
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.startsWith("text/")
  ) {
    return {body: await request.text(), contentType};
  }

  return {body: await request.arrayBuffer(), contentType};
}

async function refreshAccessToken(baseUrl: string, refreshToken: string) {
  try {
    const response = await fetch(`${baseUrl}/api/auth/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({refresh: refreshToken}),
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json().catch(() => null)) as {access?: unknown} | null;
    const access = typeof payload?.access === "string" ? payload.access.trim() : "";
    return access || null;
  } catch {
    return null;
  }
}

async function forwardToBackend(params: {
  url: string;
  method: string;
  accessToken: string;
  preparedBody: PreparedBody;
}) {
  const headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${params.accessToken}`);
  if (params.preparedBody.contentType) {
    headers.set("Content-Type", params.preparedBody.contentType);
  }

  return fetch(params.url, {
    method: params.method,
    headers,
    body: params.preparedBody.body,
    cache: "no-store"
  });
}

function copyHeaders(source: Headers, target: Headers, status: number) {
  const hasResponseBody = ![204, 205, 304].includes(status);
  const contentType = source.get("content-type");
  const contentDisposition = source.get("content-disposition");
  if (hasResponseBody && contentType) {
    try {
      target.set("content-type", contentType);
    } catch {
      // Ignore invalid upstream content-type values.
    }
  }
  if (contentDisposition) {
    try {
      target.set("content-disposition", contentDisposition);
    } catch {
      // Ignore invalid upstream content-disposition values.
    }
  }
  target.set("cache-control", "no-store");
}

async function toProxyResponse(response: Response) {
  const status = response.status;
  const shouldReadBody = ![204, 205, 304].includes(status);
  let body: ArrayBuffer | null = null;

  if (shouldReadBody) {
    try {
      body = await response.arrayBuffer();
    } catch {
      body = null;
    }
  }

  const proxy = new NextResponse(body, {status});
  copyHeaders(response.headers, proxy.headers, status);
  return proxy;
}

async function handleProxy(request: Request, context: RouteContext) {
  const {path} = await context.params;
  const parsedUrl = new URL(request.url);
  const backendUrl = buildBackendStudentUrl(path ?? [], parsedUrl.searchParams);
  const baseUrl = resolveBackendBaseUrl();

  if (!backendUrl || !baseUrl) {
    return NextResponse.json({detail: "Student API base URL is not configured."}, {status: 500});
  }

  const cookieStore = await cookies();
  let accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value?.trim() ?? "";
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value?.trim() ?? "";
  let preflightRefreshedToken: string | null = null;

  if (!accessToken && refreshToken) {
    const refreshed = await refreshAccessToken(baseUrl, refreshToken);
    if (refreshed) {
      accessToken = refreshed;
      preflightRefreshedToken = refreshed;
    }
  }

  if (!accessToken) {
    return NextResponse.json({detail: "Authentication required."}, {status: 401});
  }

  const preparedBody = await prepareBody(request);

  try {
    let backendResponse = await forwardToBackend({
      url: backendUrl,
      method: request.method,
      accessToken,
      preparedBody
    });

    let refreshedToken: string | null = null;

    if (backendResponse.status === 401 && refreshToken) {
      const nextToken = await refreshAccessToken(baseUrl, refreshToken);
      if (nextToken) {
        refreshedToken = nextToken;
        backendResponse = await forwardToBackend({
          url: backendUrl,
          method: request.method,
          accessToken: nextToken,
          preparedBody
        });
      }
    }

    const response = await toProxyResponse(backendResponse);

    if (preflightRefreshedToken) {
      setAccessTokenCookie(response, preflightRefreshedToken);
    }

    if (refreshedToken) {
      setAccessTokenCookie(response, refreshedToken);
    }

    if (backendResponse.status === 401) {
      clearAuthCookies(response);
    }

    return response;
  } catch (error) {
    console.error("[student-proxy] upstream request failed", {
      method: request.method,
      backendUrl,
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({detail: "Student API is unavailable right now."}, {status: 503});
  }
}

export async function GET(request: Request, context: RouteContext) {
  return handleProxy(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return handleProxy(request, context);
}

export async function PUT(request: Request, context: RouteContext) {
  return handleProxy(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
  return handleProxy(request, context);
}

export async function DELETE(request: Request, context: RouteContext) {
  return handleProxy(request, context);
}
