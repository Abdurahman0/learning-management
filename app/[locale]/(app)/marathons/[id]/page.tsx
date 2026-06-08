import {cookies} from "next/headers";
import {redirect} from "next/navigation";

import {AUTH_COOKIE_NAME, parseSessionRole} from "@/lib/auth/session";

import {MarathonDetailClient} from "../_components/MarathonDetailClient";
import {MarathonSurface} from "../_components/MarathonSurface";

type MarathonDetailPageProps = {
  params: Promise<{
    locale: string;
    id: string;
  }>;
};

export default async function MarathonDetailPage({params}: MarathonDetailPageProps) {
  const {locale, id} = await params;
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
      title="Marathon Journey"
      subtitle="Move through the unlocked day path, finish each practice set, and track your position as the marathon progresses."
      showLeaderboardNav
      hideHeader
    >
      <MarathonDetailClient marathonId={id} />
    </MarathonSurface>
  );
}
