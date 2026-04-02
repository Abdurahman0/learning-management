export type SessionRole = "user" | "teacher" | "admin";

export const AUTH_COOKIE_NAME = "lms_role";
export const ACCESS_TOKEN_COOKIE_NAME = "lms_access_token";
export const REFRESH_TOKEN_COOKIE_NAME = "lms_refresh_token";

type StaticCredential = {
  id?: string;
  title?: string;
  name: string;
  initials: string;
  email: string;
  password: string;
  role: SessionRole;
};

const STATIC_CREDENTIALS: StaticCredential[] = [
  {name: "String User", initials: "SU", email: "string@gmail.com", password: "string1234", role: "user"},
  {
    id: "teacher-1",
    title: "Senior IELTS Instructor",
    name: "Dr. Sarah Jenkins",
    initials: "SJ",
    email: "teacher@gmail.com",
    password: "teacher1234",
    role: "teacher"
  },
  {name: "Admin User", initials: "AU", email: "admin@gmail.com", password: "admin1234", role: "admin"}
];

export type SessionProfile = {
  id?: string;
  role: SessionRole;
  title?: string;
  name: string;
  email: string;
  initials: string;
};

export function authenticateStaticUser(email: string, password: string): SessionRole | null {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();

  const matched = STATIC_CREDENTIALS.find(
    (item) => item.email === normalizedEmail && item.password === normalizedPassword
  );

  return matched?.role ?? null;
}

export function parseSessionRole(value: string | undefined): SessionRole | null {
  if (value === "user" || value === "teacher" || value === "admin") {
    return value;
  }

  return null;
}

export function getStaticProfile(role: SessionRole): SessionProfile {
  const found = STATIC_CREDENTIALS.find((item) => item.role === role);

  if (!found) {
    return {
      id: role === "teacher" ? "teacher-1" : undefined,
      role,
      title: role === "teacher" ? "Senior IELTS Instructor" : undefined,
      name: role === "admin" ? "Admin User" : role === "teacher" ? "Dr. Sarah Jenkins" : "String User",
      email: role === "admin" ? "admin@gmail.com" : role === "teacher" ? "teacher@gmail.com" : "string@gmail.com",
      initials: role === "admin" ? "AU" : role === "teacher" ? "SJ" : "SU"
    };
  }

  return {
    id: found.id,
    role: found.role,
    title: found.title,
    name: found.name,
    email: found.email,
    initials: found.initials
  };
}
