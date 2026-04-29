import {studentHttpClient, toStudentApiError} from "./httpClient";
import type {MistakeReasonBrief, MistakeReasonDetail, MistakeReasonModule, StudentMistakeAdvice} from "./types";

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

function normalizeBrief(value: unknown): MistakeReasonBrief | null {
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
    is_file_consists: Boolean(record.is_file_consists)
  };
}

function normalizeDetail(value: unknown): MistakeReasonDetail | null {
  const brief = normalizeBrief(value);
  const record = asRecord(value);
  if (!brief || !record) return null;

  return {
    ...brief,
    solution_1: toStringSafe(record.solution_1),
    solution_2: toStringSafe(record.solution_2),
    solution_3: toStringSafe(record.solution_3),
    file_url: normalizeFileUrl(record.file_url),
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
  async listForAttempt(attemptId: string) {
    try {
      const normalizedAttemptId = encodeURIComponent(attemptId);
      const response = await studentHttpClient.get(`/attempts/${normalizedAttemptId}/mistake-reasons/`);
      return asArray(response.data).map(normalizeBrief).filter((item): item is MistakeReasonBrief => Boolean(item));
    } catch (error) {
      throw toStudentApiError(error);
    }
  },

  async select(reasonId: string) {
    try {
      const normalizedReasonId = encodeURIComponent(reasonId);
      const response = await studentHttpClient.post(`/mistake-reasons/${normalizedReasonId}/select/`);
      const detail = normalizeDetail(response.data);
      if (!detail) {
        throw new Error("Invalid mistake reason response.");
      }
      return detail;
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
