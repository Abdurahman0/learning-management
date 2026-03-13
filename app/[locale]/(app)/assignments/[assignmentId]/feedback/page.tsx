import {cookies} from "next/headers";
import {redirect} from "next/navigation";

import {AUTH_COOKIE_NAME, parseSessionRole} from "@/lib/auth/session";

import {StudentTeacherFeedbackClient} from "./_components/StudentTeacherFeedbackClient";

type StudentTeacherFeedbackPageProps = {
  params: Promise<{
    locale: string;
    assignmentId: string;
  }>;
};

export default async function StudentTeacherFeedbackPage({params}: StudentTeacherFeedbackPageProps) {
  const {locale, assignmentId} = await params;
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

  return <StudentTeacherFeedbackClient assignmentId={assignmentId} />;
}
