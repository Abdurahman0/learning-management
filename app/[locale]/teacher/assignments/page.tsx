import {
  getTeacherAssignmentPrefillContext,
  getTeacherAssignmentsPageData
} from "@/data/teacher/selectors";

import {TeacherAssignmentsPageClient} from "./_components/TeacherAssignmentsPageClient";

type TeacherAssignmentsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export default async function TeacherAssignmentsPage({searchParams}: TeacherAssignmentsPageProps) {
  const query = await searchParams;
  const prefill = getTeacherAssignmentPrefillContext({
    studentId: getParamValue(query.studentId),
    recommendationSkill: getParamValue(query.recommendationSkill),
    title: getParamValue(query.title),
    instructions: getParamValue(query.instructions)
  });

  const data = getTeacherAssignmentsPageData();

  return <TeacherAssignmentsPageClient initialData={data} prefill={prefill} />;
}
