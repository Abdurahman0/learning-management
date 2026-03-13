import {cookies} from "next/headers";
import {redirect} from "next/navigation";

import {AUTH_COOKIE_NAME, parseSessionRole} from "@/lib/auth/session";

import {StudentStudyBankClient} from "./_components/StudentStudyBankClient";

type StudyBankPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function StudyBankPage({params}: StudyBankPageProps) {
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

  return <StudentStudyBankClient />;
}

