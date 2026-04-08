import type {ReactNode} from "react";

import {requireAdminOrRedirect} from "@/lib/auth/guards";

import {AdminBackendOnlyGate} from "./_components/AdminBackendOnlyGate";

type AdminLayoutProps = {
  children: ReactNode;
  params: Promise<{locale: string}>;
};

export default async function AdminLayout({children, params}: AdminLayoutProps) {
  const {locale} = await params;
  await requireAdminOrRedirect(locale);

  return <AdminBackendOnlyGate>{children}</AdminBackendOnlyGate>;
}
