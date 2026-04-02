import {redirect} from "next/navigation";

type AdminMistakesAnalysisPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminMistakesAnalysisPage({params}: AdminMistakesAnalysisPageProps) {
  const {locale} = await params;
  redirect(`/${locale}/admin`);
}

