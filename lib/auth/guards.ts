import {cookies} from "next/headers";
import {redirect} from "next/navigation";

import {AUTH_COOKIE_NAME, parseSessionRole} from "./session";

export async function requireAdminOrRedirect(locale: string) {
  const cookieStore = await cookies();
  const role = parseSessionRole(cookieStore.get(AUTH_COOKIE_NAME)?.value);

  if (role === "admin") {
    return;
  }

  if (role === "teacher") {
    redirect(`/${locale}/teacher`);
  }

  if (role === "user") {
    redirect(`/${locale}/reading`);
  }

  redirect(`/${locale}/login`);
}

export async function requireTeacherOrRedirect(locale: string) {
  const cookieStore = await cookies();
  const role = parseSessionRole(cookieStore.get(AUTH_COOKIE_NAME)?.value);

  if (role === "teacher") {
    return;
  }

  if (role === "admin") {
    redirect(`/${locale}/admin`);
  }

  if (role === "user") {
    redirect(`/${locale}/dashboard`);
  }

  redirect(`/${locale}/login`);
}
