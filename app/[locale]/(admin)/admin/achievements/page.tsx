import {redirect} from "next/navigation";

type AdminAchievementsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminAchievementsPage({params}: AdminAchievementsPageProps) {
  const {locale} = await params;
  redirect(`/${locale}/admin`);
}
