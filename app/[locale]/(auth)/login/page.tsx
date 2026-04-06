import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, ACCESS_TOKEN_COOKIE_NAME } from "@/lib/auth/session";

import { AuthShell } from "../auth/components/AuthShell";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME);
  const role = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (token) {
    if (role === "admin") {
      redirect(`/${locale}/admin`);
    } else if (role === "teacher") {
      redirect(`/${locale}/teacher`);
    } else {
      redirect(`/${locale}/reading`);
    }
  }

  return <AuthShell initialMode="signin" />;
}
