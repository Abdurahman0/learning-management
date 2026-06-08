import {AdminMarathonQuestionBuilderClient} from "@/app/[locale]/(admin)/admin/marathons/_components/AdminMarathonQuestionBuilderClient";

type PageProps = {
  params: Promise<{id: string; partId: string}>;
};

export default async function AdminMarathonListeningBuilderPage({params}: PageProps) {
  const {id, partId} = await params;
  return <AdminMarathonQuestionBuilderClient marathonId={id} ownerId={partId} module="listening" />;
}
