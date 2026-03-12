import {getTeacherReviewsPageData} from "@/data/teacher/selectors";

import {TeacherReviewsPageClient} from "./_components/TeacherReviewsPageClient";

type TeacherReviewsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export default async function TeacherReviewsPage({searchParams}: TeacherReviewsPageProps) {
  const query = await searchParams;
  const assignmentId = firstParam(query.assignmentId);
  const studentId = firstParam(query.studentId);
  const submissionId = firstParam(query.submissionId);
  const initialSearch = firstParam(query.query) ?? "";
  const data = getTeacherReviewsPageData({
    assignmentId,
    studentId,
    submissionId
  });

  return <TeacherReviewsPageClient key={`${initialSearch}:${assignmentId ?? ""}:${studentId ?? ""}:${submissionId ?? ""}`} initialData={data} initialSearch={initialSearch} />;
}
