import {AdminMarathonQuestionBuilderClient} from "@/app/[locale]/(admin)/admin/marathons/_components/AdminMarathonQuestionBuilderClient";

type PageProps = {
  params: Promise<{id: string; passageId: string}>;
};

export default async function AdminMarathonReadingBuilderPage({params}: PageProps) {
  const {id, passageId} = await params;
  return <AdminMarathonQuestionBuilderClient marathonId={id} ownerId={passageId} module="reading" />;
}
