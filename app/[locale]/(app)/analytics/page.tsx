import {redirect} from "next/navigation";

type AnalyticsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AnalyticsPage({params}: AnalyticsPageProps) {
  const {locale} = await params;
  redirect(`/${locale}/dashboard`);
}
