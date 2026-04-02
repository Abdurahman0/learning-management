import {redirect} from "next/navigation";

type StudentTeacherFeedbackPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function StudentTeacherFeedbackPage({params}: StudentTeacherFeedbackPageProps) {
  const {locale} = await params;
  redirect(`/${locale}/dashboard`);
}
