import {notFound} from "next/navigation";

import {getTeacherStudentProgressData} from "@/data/teacher/selectors";

import {TeacherStudentProgressPageClient} from "./_components/TeacherStudentProgressPageClient";

type TeacherStudentProgressPageProps = {
  params: Promise<{
    studentId: string;
  }>;
};

export default async function TeacherStudentProgressPage({params}: TeacherStudentProgressPageProps) {
  const {studentId} = await params;
  const progress = getTeacherStudentProgressData(studentId);

  if (!progress) {
    notFound();
  }

  return <TeacherStudentProgressPageClient key={progress.student.id} progress={progress} />;
}
