import type {SessionRole} from "./session";

type JsonRecord = Record<string, unknown>;

const ROLE_VALUE_KEYS = [
  "role",
  "user_role",
  "userRole",
  "account_role",
  "accountRole",
  "user_type",
  "userType",
  "type",
  "scope"
] as const;

const ROLE_ARRAY_KEYS = ["roles", "authorities", "groups", "permissions", "scopes"] as const;
const NESTED_KEYS = ["user", "profile", "account", "claims", "data"] as const;

function asRecord(value: unknown): JsonRecord | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as JsonRecord;
}

function normalizeRoleString(value: string): SessionRole | null {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  if (["admin", "administrator", "superadmin", "super_admin", "staff"].includes(normalized)) {
    return "admin";
  }

  if (["teacher", "instructor", "mentor", "tutor"].includes(normalized)) {
    return "teacher";
  }

  if (["user", "student", "learner", "candidate", "member"].includes(normalized)) {
    return "user";
  }

  if (normalized.includes("admin")) {
    return "admin";
  }

  if (normalized.includes("teacher") || normalized.includes("instructor") || normalized.includes("mentor")) {
    return "teacher";
  }

  if (normalized.includes("student") || normalized.includes("user")) {
    return "user";
  }

  return null;
}

function resolveRoleFromUnknown(value: unknown): SessionRole | null {
  if (typeof value === "string") {
    return normalizeRoleString(value);
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const role = resolveRoleFromUnknown(item);
      if (role) {
        return role;
      }
    }
  }

  const record = asRecord(value);
  if (!record) {
    return null;
  }

  for (const key of ROLE_VALUE_KEYS) {
    const role = resolveRoleFromUnknown(record[key]);
    if (role) {
      return role;
    }
  }

  if (record.is_superuser === true || record.is_staff === true || record.is_admin === true) {
    return "admin";
  }

  if (record.is_teacher === true || record.is_instructor === true) {
    return "teacher";
  }

  if (record.is_student === true || record.is_user === true) {
    return "user";
  }

  for (const key of ROLE_ARRAY_KEYS) {
    const role = resolveRoleFromUnknown(record[key]);
    if (role) {
      return role;
    }
  }

  for (const key of NESTED_KEYS) {
    const role = resolveRoleFromUnknown(record[key]);
    if (role) {
      return role;
    }
  }

  return null;
}

function decodeBase64(value: string): string | null {
  if (typeof globalThis.atob === "function") {
    try {
      return globalThis.atob(value);
    } catch {
      return null;
    }
  }

  if (typeof Buffer !== "undefined") {
    try {
      return Buffer.from(value, "base64").toString("utf8");
    } catch {
      return null;
    }
  }

  return null;
}

function decodeJwtPayload(token: string): JsonRecord | null {
  const value = token.trim();
  if (!value) {
    return null;
  }

  const parts = value.split(".");
  if (parts.length < 2) {
    return null;
  }

  const payloadPart = parts[1];
  const normalizedBase64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
  const paddedBase64 = normalizedBase64.padEnd(Math.ceil(normalizedBase64.length / 4) * 4, "=");
  const decoded = decodeBase64(paddedBase64);

  if (!decoded) {
    return null;
  }

  try {
    const parsed = JSON.parse(decoded);
    return asRecord(parsed);
  } catch {
    return null;
  }
}

export function resolveSessionRole(params: {responseData?: unknown; accessToken?: string}): SessionRole | null {
  const fromResponse = resolveRoleFromUnknown(params.responseData);
  if (fromResponse) {
    return fromResponse;
  }

  const payload = decodeJwtPayload(params.accessToken ?? "");
  if (!payload) {
    return null;
  }

  return resolveRoleFromUnknown(payload);
}

export function resolveSessionRoleWithFallback(
  params: {responseData?: unknown; accessToken?: string},
  fallback: SessionRole = "user"
): SessionRole {
  return resolveSessionRole(params) ?? fallback;
}
