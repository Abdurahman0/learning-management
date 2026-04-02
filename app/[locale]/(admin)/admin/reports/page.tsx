import {redirect} from "next/navigation";

type AdminReportsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminReportsPage({params}: AdminReportsPageProps) {
  const {locale} = await params;
  redirect(`/${locale}/admin`);
}
