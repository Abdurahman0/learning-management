import {getTeacherWeakAreasPageData} from "@/data/teacher/selectors";

import {TeacherWeakAreasPageClient} from "./_components/TeacherWeakAreasPageClient";

export default function TeacherWeakAreasPage() {
  const data = getTeacherWeakAreasPageData();

  return <TeacherWeakAreasPageClient data={data} />;
}
