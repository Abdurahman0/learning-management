import type {ReactNode} from "react";

import {requireTeacherOrRedirect} from "@/lib/auth/guards";

type TeacherLayoutProps = {
  children: ReactNode;
  params: Promise<{locale: string}>;
};

export default async function Layout({children, params}: TeacherLayoutProps) {
  const {locale} = await params;
  await requireTeacherOrRedirect(locale);

  return <>{children}</>;
}
