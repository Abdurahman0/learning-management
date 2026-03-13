import {cookies} from "next/headers";
import {redirect} from "next/navigation";

import {AUTH_COOKIE_NAME, parseSessionRole} from "@/lib/auth/session";

import {StudentAiCoachClient} from "./_components/StudentAiCoachClient";

type AiCoachPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AiCoachPage({params}: AiCoachPageProps) {
  const {locale} = await params;
  const cookieStore = await cookies();
  const role = parseSessionRole(cookieStore.get(AUTH_COOKIE_NAME)?.value);

  if (!role) {
    redirect(`/${locale}/reading`);
  }

  if (role === "admin") {
    redirect(`/${locale}/admin`);
  }

  if (role === "teacher") {
    redirect(`/${locale}/teacher`);
  }

  return <StudentAiCoachClient />;
}

