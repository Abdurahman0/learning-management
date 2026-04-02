import {redirect} from "next/navigation";

type ReviewCenterPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function ReviewCenterPage({params}: ReviewCenterPageProps) {
  const {locale} = await params;
  redirect(`/${locale}/dashboard`);
}
