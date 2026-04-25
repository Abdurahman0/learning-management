import {NextResponse} from "next/server";

export const runtime = "nodejs";

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

export async function POST(request: Request) {
  const backendBase = resolveBackendBaseUrl();
  if (!backendBase) {
    return NextResponse.json({detail: "API base URL is not configured."}, {status: 500});
  }

  let bodyText = "";
  try {
    bodyText = await request.text();
  } catch {
    bodyText = "";
  }

  const candidates = [
    "/api/v1/student/attempts/",
    "/api/v1/public/attempts/",
    "/api/v1/attempts/"
  ];

  for (const endpoint of candidates) {
    const backendUrl = buildBackendUrl(endpoint);
    if (!backendUrl) continue;

    try {
      const response = await fetch(backendUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: bodyText,
        cache: "no-store"
      });

      const payload = await response.json().catch(() => null);

      // If the endpoint doesn't exist or is protected, try the next candidate.
      if (response.status === 404 || response.status === 401 || response.status === 403) {
        continue;
      }

      return NextResponse.json(payload, {status: response.status});
    } catch {
      return NextResponse.json({detail: "Student API is unavailable right now."}, {status: 503});
    }
  }

  return NextResponse.json(
    {detail: "Authentication required."},
    {status: 401}
  );
}

