import {TestBuilderClient} from "./_components/TestBuilderClient";

type AdminTestBuilderPageProps = {
  params: Promise<{testId: string}>;
  searchParams: Promise<{
    structure?: string;
    mode?: string;
  }>;
};

export default async function AdminTestBuilderPage({params, searchParams}: AdminTestBuilderPageProps) {
  const {testId} = await params;
  const query = await searchParams;

  return <TestBuilderClient testId={testId} initialStructureId={query.structure} initialMode={query.mode} />;
}
