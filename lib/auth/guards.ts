import {cookies} from "next/headers";
import {redirect} from "next/navigation";

import {AUTH_COOKIE_NAME, parseSessionRole} from "./session";

export async function requireAdminOrRedirect(locale: string) {
  const cookieStore = await cookies();
  const role = parseSessionRole(cookieStore.get(AUTH_COOKIE_NAME)?.value);

  if (role === "admin") {
    return;
  }

  if (role === "user") {
    redirect(`/${locale}/reading`);
  }

  redirect(`/${locale}/login`);
}
