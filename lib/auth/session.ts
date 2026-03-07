export type SessionRole = "user" | "admin";

export const AUTH_COOKIE_NAME = "lms_role";

type StaticCredential = {
  name: string;
  initials: string;
  email: string;
  password: string;
  role: SessionRole;
};

const STATIC_CREDENTIALS: StaticCredential[] = [
  {name: "String User", initials: "SU", email: "string@gmail.com", password: "string1234", role: "user"},
  {name: "Admin User", initials: "AU", email: "admin@gmail.com", password: "admin1234", role: "admin"}
];

export type SessionProfile = {
  role: SessionRole;
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
  if (value === "user" || value === "admin") {
    return value;
  }

  return null;
}

export function getStaticProfile(role: SessionRole): SessionProfile {
  const found = STATIC_CREDENTIALS.find((item) => item.role === role);

  if (!found) {
    return {
      role,
      name: role === "admin" ? "Admin User" : "String User",
      email: role === "admin" ? "admin@gmail.com" : "string@gmail.com",
      initials: role === "admin" ? "AU" : "SU"
    };
  }

  return {
    role: found.role,
    name: found.name,
    email: found.email,
    initials: found.initials
  };
}
