import {notFound} from "next/navigation";

import {getTeacherStudentProfileData} from "@/data/teacher/selectors";

import {TeacherStudentProfilePageClient} from "./_components/TeacherStudentProfilePageClient";

type TeacherStudentProfilePageProps = {
  params: Promise<{
    studentId: string;
  }>;
};

export default async function TeacherStudentProfilePage({params}: TeacherStudentProfilePageProps) {
  const {studentId} = await params;
  const profile = getTeacherStudentProfileData(studentId);

  if (!profile) {
    notFound();
  }

  return <TeacherStudentProfilePageClient key={profile.student.id} profile={profile} />;
}
