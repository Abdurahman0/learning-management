import {redirect} from "next/navigation";

type AssignmentsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AssignmentsPage({params}: AssignmentsPageProps) {
  const {locale} = await params;
  redirect(`/${locale}/dashboard`);
}
