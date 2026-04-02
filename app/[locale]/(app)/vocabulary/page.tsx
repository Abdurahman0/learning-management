import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_COOKIE_NAME, parseSessionRole } from "@/lib/auth/session";

import { StudentVocabularyClient } from "./_components/StudentVocabularyClient";

type VocabularyPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function VocabularyPage({ params }: VocabularyPageProps) {
  const { locale } = await params;
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

  return <StudentVocabularyClient />;
}
