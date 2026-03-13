import {cookies} from "next/headers";
import {redirect} from "next/navigation";

import {AUTH_COOKIE_NAME, parseSessionRole} from "@/lib/auth/session";

import {StudentAssignmentSubmissionClient} from "./_components/StudentAssignmentSubmissionClient";

const REFERENCE_NOW_TS = Date.parse("2026-03-13T00:00:00.000Z");

type AssignmentSubmissionPageProps = {
  params: Promise<{
    locale: string;
    assignmentId: string;
  }>;
};

export default async function AssignmentSubmissionPage({params}: AssignmentSubmissionPageProps) {
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

  return <StudentAssignmentSubmissionClient assignmentId={assignmentId} nowTimestamp={REFERENCE_NOW_TS} />;
}
