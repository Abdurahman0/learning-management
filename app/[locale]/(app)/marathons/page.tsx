import {cookies} from "next/headers";
import {redirect} from "next/navigation";

import {AUTH_COOKIE_NAME, parseSessionRole} from "@/lib/auth/session";

import {MarathonBrowseClient} from "./_components/MarathonBrowseClient";
import {MarathonSurface} from "./_components/MarathonSurface";

type MarathonPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function MarathonPage({params}: MarathonPageProps) {
  const {locale} = await params;
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
    <MarathonSurface
      title="Marathon"
      subtitle="Follow a structured IELTS roadmap, unlock each day in sequence, and build consistency through focused practice."
      showLeaderboardNav={false}
    >
      <MarathonBrowseClient />
    </MarathonSurface>
  );
}
