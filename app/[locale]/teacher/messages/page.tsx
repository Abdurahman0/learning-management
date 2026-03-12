import {
  getTeacherMessagesConversationData,
  getTeacherMessagesPageData
} from "@/data/teacher/selectors";

import {TeacherMessagesPageClient} from "./_components/TeacherMessagesPageClient";

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
  const query = getFirstParam(params.query) ?? "";
  const data = getTeacherMessagesPageData({source, studentId, group});
  const selectedConversation = data.selectedConversationId
    ? getTeacherMessagesConversationData(data.selectedConversationId)
    : null;

  return (
    <TeacherMessagesPageClient
      key={`${query}:${source ?? ""}:${studentId ?? ""}:${group ?? ""}`}
      initialData={data}
      initialConversation={selectedConversation}
      initialSearch={query}
    />
  );
}
