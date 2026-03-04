import { AuthShell, type AuthMode } from "./components/AuthShell";

type AuthPageProps = {
  searchParams: Promise<{ mode?: string }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  const initialMode: AuthMode = params.mode === "signin" ? "signin" : "signup";

  return <AuthShell initialMode={initialMode} />;
}
