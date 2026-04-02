import {NextResponse} from "next/server";

function resolveGoogleClientId() {
  const candidates = [
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_ID,
    process.env.AUTH_GOOGLE_CLIENT_ID
  ];

  for (const candidate of candidates) {
    const value = typeof candidate === "string" ? candidate.trim() : "";
    if (value) {
      return value;
    }
  }

  return "";
}

export async function GET() {
  const clientId = resolveGoogleClientId();

  if (!clientId) {
    return NextResponse.json(
      {
        detail: "Google sign-in is not configured. Missing Google client ID."
      },
      {
        status: 503,
        headers: {"Cache-Control": "no-store"}
      }
    );
  }

  return NextResponse.json(
    {
      client_id: clientId
    },
    {
      headers: {"Cache-Control": "no-store"}
    }
  );
}
