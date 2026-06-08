import {AdminMarathonDetailPageClient} from "./_components/AdminMarathonDetailPageClient";

type AdminMarathonDetailPageProps = {
  params: Promise<{id: string}>;
};

export default async function AdminMarathonDetailPage({params}: AdminMarathonDetailPageProps) {
  const {id} = await params;

  return <AdminMarathonDetailPageClient marathonId={id} />;
}
