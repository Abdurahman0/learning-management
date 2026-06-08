import {cookies} from "next/headers";
import {redirect} from "next/navigation";

import {AUTH_COOKIE_NAME, parseSessionRole} from "@/lib/auth/session";

import {MarathonDayPageClient} from "../../../_components/MarathonDayPageClient";

type MarathonDayPageProps = {
  params: Promise<{
    locale: string;
    id: string;
    dayNumber: string;
  }>;
};

export default async function MarathonDayPage({params}: MarathonDayPageProps) {
  const {locale, id, dayNumber} = await params;
  const cookieStore = await cookies();
  const role = parseSessionRole(cookieStore.get(AUTH_COOKIE_NAME)?.value);

  if (!role) {
    redirect(`/${locale}/auth`);
  }

  if (role === "admin") {
    redirect(`/${locale}/admin`);
  }

  if (role === "teacher") {
    redirect(`/${locale}/teacher`);
  }

  return (
    <MarathonDayPageClient marathonId={id} dayNumber={Number(dayNumber)} />
  );
}
