import {getTeacherProfilePageData} from "@/data/teacher/selectors";

import {TeacherProfilePageClient} from "./_components/TeacherProfilePageClient";

export default function TeacherProfilePage() {
  const initialData = getTeacherProfilePageData();

  return <TeacherProfilePageClient initialData={initialData} />;
}
