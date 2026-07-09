import { studentHttpClient, toStudentApiError } from "./httpClient";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StudentPackage {
  id: string;
  name: string;
  tier: string;
  tier_display: string;
  price: string;
  has_discount: boolean;
  discounted_price: string | null;
  effective_price: string;
  purchase_url: string;
}

export interface StudentSubscription {
  id: string;
  package: string;
  package_name: string;
  package_tier: string;
  months: number | null;
  starts_at: string | null;
  expires_at: string | null;
  status: string;
  is_currently_active: boolean;
  days_remaining: number | null;
  cancelled_at: string | null;
  created_at: string | null;
}

export interface StudentSubscriptionResponse {
  active: boolean;
  subscription: StudentSubscription | null;
}

// ---------------------------------------------------------------------------
// Internal helpers (same defensive pattern as profile.service.ts)
// ---------------------------------------------------------------------------

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function toStringSafe(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function toNumberOrNull(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toBooleanSafe(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function toNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

// ---------------------------------------------------------------------------
// Normalizers
// ---------------------------------------------------------------------------

function normalizePackage(data: unknown): StudentPackage {
  const r = asRecord(data);
  return {
    id: toStringSafe(r?.id),
    name: toStringSafe(r?.name),
    tier: toStringSafe(r?.tier),
    tier_display: toStringSafe(r?.tier_display),
    price: toStringSafe(r?.price),
    has_discount: toBooleanSafe(r?.has_discount),
    discounted_price: toNullableString(r?.discounted_price),
    effective_price: toStringSafe(r?.effective_price),
    purchase_url: toStringSafe(r?.purchase_url),
  };
}

function normalizeSubscription(data: unknown): StudentSubscription {
  const r = asRecord(data);
  return {
    id: toStringSafe(r?.id),
    package: toStringSafe(r?.package),
    package_name: toStringSafe(r?.package_name),
    package_tier: toStringSafe(r?.package_tier),
    months: toNumberOrNull(r?.months),
    starts_at: toNullableString(r?.starts_at),
    expires_at: toNullableString(r?.expires_at),
    status: toStringSafe(r?.status),
    is_currently_active: toBooleanSafe(r?.is_currently_active),
    days_remaining: toNumberOrNull(r?.days_remaining),
    cancelled_at: toNullableString(r?.cancelled_at),
    created_at: toNullableString(r?.created_at),
  };
}

function normalizeSubscriptionResponse(data: unknown): StudentSubscriptionResponse {
  const r = asRecord(data);
  const active = toBooleanSafe(r?.active);
  const rawSub = r?.subscription;
  const subscription = rawSub != null && typeof rawSub === "object" && !Array.isArray(rawSub)
    ? normalizeSubscription(rawSub)
    : null;
  return { active, subscription };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const studentPackagesService = {
  async listPackages(): Promise<StudentPackage[]> {
    try {
      const response = await studentHttpClient.get("/packages/");
      const data = response.data;
      if (!Array.isArray(data)) {
        return [];
      }
      return data.map(normalizePackage);
    } catch (error) {
      throw toStudentApiError(error);
    }
  },

  async getSubscription(): Promise<StudentSubscriptionResponse> {
    try {
      const response = await studentHttpClient.get("/subscription/");
      return normalizeSubscriptionResponse(response.data);
    } catch (error) {
      throw toStudentApiError(error);
    }
  },
};
