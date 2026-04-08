import type {ReactNode} from "react";

import {redirect} from "next/navigation";

type TeacherLayoutProps = {
  children: ReactNode;
  params: Promise<{locale: string}>;
};

export default async function Layout({params}: TeacherLayoutProps) {
  const {locale} = await params;
  redirect(`/${locale}/dashboard`);
}
