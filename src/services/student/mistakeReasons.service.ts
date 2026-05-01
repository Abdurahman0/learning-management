import {studentHttpClient, toStudentApiError} from "./httpClient";
import type {MistakeReasonCategory, MistakeReasonDetail, MistakeReasonModule, StudentMistakeAdvice} from "./types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const record = asRecord(value);
  const candidates = [record?.results, record?.items, record?.data];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

function toStringSafe(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizeModule(value: unknown): MistakeReasonModule {
  const normalized = toStringSafe(value, "BOTH").trim().toUpperCase();
  if (normalized === "READING" || normalized === "LISTENING" || normalized === "BOTH") {
    return normalized;
  }
  return "BOTH";
}

function normalizeCategory(value: unknown): MistakeReasonCategory {
  const normalized = toStringSafe(value, "fully_incorrect").trim().toLowerCase();
  if (normalized === "fully_incorrect" || normalized === "blank_answer" || normalized === "misspelled") {
    return normalized;
  }
  return "fully_incorrect";
}

function normalizeFileUrl(value: unknown) {
  const raw = toStringSafe(value).trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.toString();
    }
  } catch {
    return null;
  }

  return null;
}

function normalizeResourceType(value: unknown): "file" | "link" | null {
  const normalized = toStringSafe(value).trim().toLowerCase();
  if (normalized === "file" || normalized === "link") return normalized;
  return null;
}

function normalizeDetail(value: unknown): MistakeReasonDetail | null {
  const record = asRecord(value);
  if (!record) return null;

  const id = toStringSafe(record.id).trim();
  const reason = toStringSafe(record.reason).trim();
  if (!id || !reason) return null;

  const module = normalizeModule(record.module);
  return {
    id,
    reason,
    module,
    module_display: toStringSafe(record.module_display, module),
    mistake_category: normalizeCategory(record.mistake_category),
    mistake_category_display: toStringSafe(record.mistake_category_display, toStringSafe(record.mistake_category, "Fully incorrect")),
    is_file_consists: Boolean(record.is_file_consists),
    general_solution: toStringSafe(record.general_solution),
    solution_1: toStringSafe(record.solution_1),
    solution_2: toStringSafe(record.solution_2),
    solution_3: toStringSafe(record.solution_3),
    file_url: normalizeFileUrl(record.file_url),
    link_url: normalizeFileUrl(record.link_url),
    resource_type: normalizeResourceType(record.resource_type),
    resource_url: normalizeFileUrl(record.resource_url),
    created_at: toStringSafe(record.created_at) || null,
    updated_at: toStringSafe(record.updated_at) || null
  };
}

function normalizeAdvice(value: unknown): StudentMistakeAdvice | null {
  const record = asRecord(value);
  if (!record) return null;

  const reason = normalizeDetail(record.reason);
  const slot = Number(record.slot);
  const id = toStringSafe(record.id).trim();
  if (!id || !reason || ![1, 2, 3, 4].includes(slot)) return null;

  return {
    id,
    slot: slot as 1 | 2 | 3 | 4,
    updated_at: toStringSafe(record.updated_at) || null,
    reason
  };
}

export const studentMistakeReasonsService = {
  async listForAttempt(attemptId: string, category?: MistakeReasonCategory) {
    try {
      const normalizedAttemptId = encodeURIComponent(attemptId);
      const response = await studentHttpClient.get(`/attempts/${normalizedAttemptId}/mistake-reasons/`, {
        params: category ? {mistake_category: category} : undefined
      });
      return asArray(response.data).map(normalizeDetail).filter((item): item is MistakeReasonDetail => Boolean(item));
    } catch (error) {
      throw toStudentApiError(error);
    }
  },

  async advice() {
    try {
      const response = await studentHttpClient.get("/mistake-analysis/advice/");
      return asArray(response.data).map(normalizeAdvice).filter((item): item is StudentMistakeAdvice => Boolean(item));
    } catch (error) {
      throw toStudentApiError(error);
    }
  }
};
