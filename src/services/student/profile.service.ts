import { studentHttpClient, toStudentApiError } from "./httpClient";
import type { StudentProfileResponse, StudentProfileUpdatePayload } from "./types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function toStringSafe(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function toNumberOrNull(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeProfile(data: unknown): StudentProfileResponse {
  const record = asRecord(data);
  return {
    id: toStringSafe(record?.id),
    full_name: toStringSafe(record?.full_name ?? record?.name),
    email: toStringSafe(record?.email),
    target_band: toNumberOrNull(record?.target_band ?? record?.targetBand),
    study_streak: typeof record?.study_streak === "number" ? record.study_streak : 0,
    last_activity_date: typeof record?.last_activity_date === "string" ? record.last_activity_date : null,
    updated_at: typeof record?.updated_at === "string" ? record.updated_at : null,
    is_active: typeof record?.is_active === "boolean" ? record.is_active : undefined,
    is_premium: typeof record?.is_premium === "boolean" ? record.is_premium : undefined,
    date_joined: typeof record?.date_joined === "string" ? record.date_joined : null,
    raw: record
  };
}

export const studentProfileService = {
  async getProfile() {
    try {
      const response = await studentHttpClient.get("/profile/");
      return normalizeProfile(response.data);
    } catch (error) {
      throw toStudentApiError(error);
    }
  },

  async updateProfile(payload: StudentProfileUpdatePayload) {
    try {
      const response = await studentHttpClient.patch("/profile/", payload);
      return normalizeProfile(response.data);
    } catch (error) {
      throw toStudentApiError(error);
    }
  }
};
