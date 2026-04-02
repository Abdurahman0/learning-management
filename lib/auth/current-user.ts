import type {SessionRole} from "./session";

export type AuthCurrentUser = {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function normalizeAuthCurrentUser(value: unknown): AuthCurrentUser | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const id = asString(record.id).trim();
  const fullName = asString(record.full_name).trim();
  const email = asString(record.email).trim();
  const dateJoined = asString(record.date_joined).trim();
  const isActive = typeof record.is_active === "boolean" ? record.is_active : false;
  const isStaff = typeof record.is_staff === "boolean" ? record.is_staff : false;

  if (!id || !fullName || !email || !dateJoined) {
    return null;
  }

  return {
    id,
    full_name: fullName,
    email,
    is_active: isActive,
    is_staff: isStaff,
    date_joined: dateJoined
  };
}

export function getSessionRoleFromUser(user: Pick<AuthCurrentUser, "is_staff">): SessionRole {
  return user.is_staff ? "admin" : "user";
}

export function getUserInitials(fullName: string) {
  const segments = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!segments.length) {
    return "U";
  }

  return segments.map((segment) => segment[0]?.toUpperCase() ?? "").join("") || "U";
}
