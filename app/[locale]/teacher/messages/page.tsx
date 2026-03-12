import {TeacherSidebar} from "../_components/TeacherSidebar";
import {TeacherTopbar} from "../_components/TeacherTopbar";

type TeacherMessagesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TeacherMessagesPage({searchParams}: TeacherMessagesPageProps) {
  const params = await searchParams;
  const source = getFirstParam(params.source);
  const studentId = getFirstParam(params.studentId);
  const group = getFirstParam(params.group);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <TeacherSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TeacherTopbar title="Messages" />
          <main className="mx-auto min-w-0 w-full max-w-[1480px] space-y-5 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            <section className="rounded-2xl border border-border/70 bg-card/75 p-6">
              <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Messaging workspace placeholder is ready. Teacher actions now route here with context.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Source: {source ?? "direct"} {studentId ? `- Student: ${studentId}` : ""} {group ? `- Group: ${group}` : ""}
              </p>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
