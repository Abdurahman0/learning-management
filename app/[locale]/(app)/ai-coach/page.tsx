import {redirect} from "next/navigation";

type AiCoachPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AiCoachPage({params}: AiCoachPageProps) {
  const {locale} = await params;
  redirect(`/${locale}/dashboard`);
}
