import {getTeacherAnalyticsPageData} from "@/data/teacher/selectors";

import {TeacherAnalyticsPageClient} from "./_components/TeacherAnalyticsPageClient";

export default function TeacherAnalyticsPage() {
  const data = getTeacherAnalyticsPageData();

  return <TeacherAnalyticsPageClient data={data} />;
}
