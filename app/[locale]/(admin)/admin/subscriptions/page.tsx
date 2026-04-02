import {redirect} from "next/navigation";

type AdminSubscriptionsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminSubscriptionsPage({params}: AdminSubscriptionsPageProps) {
  const {locale} = await params;
  redirect(`/${locale}/admin`);
}

