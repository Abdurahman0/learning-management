import {redirect} from "next/navigation";

type SessionsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function SessionsPage({params}: SessionsPageProps) {
  const {locale} = await params;
  redirect(`/${locale}/dashboard`);
}
