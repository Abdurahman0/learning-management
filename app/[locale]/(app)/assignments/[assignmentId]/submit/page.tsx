import {redirect} from "next/navigation";

type AssignmentSubmissionPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AssignmentSubmissionPage({params}: AssignmentSubmissionPageProps) {
  const {locale} = await params;
  redirect(`/${locale}/dashboard`);
}
