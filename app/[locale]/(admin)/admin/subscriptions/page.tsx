import {SubscriptionsPageClient} from "./_components/SubscriptionsPageClient";

type AdminSubscriptionsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminSubscriptionsPage({params}: AdminSubscriptionsPageProps) {
  await params;
  return <SubscriptionsPageClient />;
}

