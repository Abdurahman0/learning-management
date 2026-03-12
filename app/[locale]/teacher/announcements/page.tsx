import {getTeacherAnnouncementsPageData} from "@/data/teacher/selectors";

import {TeacherAnnouncementsPageClient} from "./_components/TeacherAnnouncementsPageClient";

export default function TeacherAnnouncementsPage() {
  const initialData = getTeacherAnnouncementsPageData();

  return <TeacherAnnouncementsPageClient initialData={initialData} />;
}
