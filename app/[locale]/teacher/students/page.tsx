import {TeacherMyStudentsPageClient} from "./_components/TeacherMyStudentsPageClient";

type TeacherMyStudentsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export default async function TeacherMyStudentsPage({searchParams}: TeacherMyStudentsPageProps) {
  const query = await searchParams;
  const queryValue = firstParam(query.query) ?? "";
  const progress = firstParam(query.progress);
  const target = firstParam(query.target);
  const status = firstParam(query.status);
  const sort = firstParam(query.sort);
  const normalizedProgress = progress === "improving" || progress === "stable" || progress === "needs_help" ? progress : "all";
  const normalizedTarget =
    target === "6_plus" || target === "6_5_plus" || target === "7_plus" || target === "7_5_plus"
      ? target
      : "all";
  const normalizedStatus = status === "active" || status === "inactive" || status === "at_risk" ? status : "all";
  const normalizedSort =
    sort === "name"
    || sort === "highest_band"
    || sort === "lowest_band"
    || sort === "most_pending"
      ? sort
      : "recent_activity";
  const pageKey = `${queryValue}:${normalizedProgress}:${normalizedTarget}:${normalizedStatus}:${normalizedSort}`;

  return (
    <TeacherMyStudentsPageClient
      key={pageKey}
      initialFilters={{
        query: queryValue,
        progress: normalizedProgress,
        target: normalizedTarget,
        status: normalizedStatus,
        sort: normalizedSort
      }}
    />
  );
}
