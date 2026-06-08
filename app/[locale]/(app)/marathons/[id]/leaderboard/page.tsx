import {cookies} from "next/headers";
import {redirect} from "next/navigation";

import {AUTH_COOKIE_NAME, parseSessionRole} from "@/lib/auth/session";

import {MarathonLeaderboardClient} from "../../_components/MarathonLeaderboardClient";
import {MarathonSurface} from "../../_components/MarathonSurface";

type MarathonLeaderboardPageProps = {
  params: Promise<{
    locale: string;
    id: string;
  }>;
};

export default async function MarathonLeaderboardPage({params}: MarathonLeaderboardPageProps) {
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
      title="Leaderboard Ranking"
      subtitle="See how students are performing inside this marathon."
      showLeaderboardNav
      hideHeader
    >
      <MarathonLeaderboardClient marathonId={id} />
    </MarathonSurface>
  );
}
