import type { ReactNode } from "react";

import {requireAdminOrRedirect} from "@/lib/auth/guards";

type AdminLayoutProps = {
  children: ReactNode;
  params: Promise<{locale: string}>;
};

export default async function Layout({ children, params }: AdminLayoutProps) {
  const {locale} = await params;
  await requireAdminOrRedirect(locale);

  return <>{children}</>;
}
