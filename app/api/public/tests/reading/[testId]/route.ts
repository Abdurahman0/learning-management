import {NextResponse} from "next/server";

function resolveBackendBaseUrl() {
  const rawBaseUrl =
    process.env.STUDENT_API_BASE_URL ??
    process.env.API_BASE_URL ??
    process.env.AUTH_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "";

  return rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
}

function buildBackendUrl(endpointPath: string) {
  const baseUrl = resolveBackendBaseUrl();
  if (!baseUrl) {
    return null;
  }

  const endpoint = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;

  try {
    const parsedBaseUrl = new URL(baseUrl);
    const basePath = parsedBaseUrl.pathname.endsWith("/")
      ? parsedBaseUrl.pathname.slice(0, -1)
      : parsedBaseUrl.pathname;
    const hasSamePrefix =
      basePath.length > 0 && basePath !== "/" && (endpoint === basePath || endpoint.startsWith(`${basePath}/`));
    const finalPath = hasSamePrefix ? endpoint : `${basePath === "/" ? "" : basePath}${endpoint}`;
    return `${parsedBaseUrl.origin}${finalPath}`;
  } catch {
    return `${baseUrl}${endpoint}`;
  }
}

export async function GET(_: Request, context: {params: Promise<{testId: string}>}) {
  const {testId} = await context.params;

  const candidates = [
    `/api/v1/student/tests/reading/${encodeURIComponent(testId)}/`,
    `/api/v1/student/tests/${encodeURIComponent(testId)}/`,
    `/api/v1/public/tests/reading/${encodeURIComponent(testId)}/`,
    `/api/v1/public/tests/${encodeURIComponent(testId)}/`
  ];

  for (const endpoint of candidates) {
    const backendUrl = buildBackendUrl(endpoint);
    if (!backendUrl) {
      return NextResponse.json({detail: "API base URL is not configured."}, {status: 500});
    }

    try {
      const response = await fetch(backendUrl, {
        method: "GET",
        headers: {Accept: "application/json"},
        cache: "no-store"
      });

      if (!response.ok) {
        // Try next candidate for 404/401, otherwise forward error.
        if (response.status === 404 || response.status === 401 || response.status === 403) {
          continue;
        }
      }

      const payload = await response.json().catch(() => null);
      return NextResponse.json(payload, {status: response.status});
    } catch {
      // If backend is down, do not keep retrying candidates.
      return NextResponse.json({detail: "Failed to load reading test detail."}, {status: 503});
    }
  }

  return NextResponse.json({detail: "Not found."}, {status: 404});
}

