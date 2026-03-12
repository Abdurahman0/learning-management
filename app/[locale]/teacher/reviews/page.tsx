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
  const data = getTeacherReviewsPageData({
    assignmentId: firstParam(query.assignmentId),
    studentId: firstParam(query.studentId),
    submissionId: firstParam(query.submissionId)
  });

  return <TeacherReviewsPageClient initialData={data} />;
}
