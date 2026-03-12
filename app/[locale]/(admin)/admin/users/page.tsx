import {UsersPageClient} from "./_components/UsersPageClient";

type AdminUsersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminUsersPage({searchParams}: AdminUsersPageProps) {
  const params = await searchParams;
  const query = firstParam(params.query) ?? "";

  return <UsersPageClient key={query} initialQuery={query} />;
}

