import {adminHttpClient, toAdminApiError} from "./httpClient";
import type {AdminPaginatedResponse, MistakeReasonModule, MistakeReasonPayload, MistakeReasonRecord} from "./types";

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
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
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

function normalizeReason(value: unknown): MistakeReasonRecord | null {
  const record = asRecord(value);
  if (!record) return null;

  const id = toStringSafe(record.id).trim();
  const reason = toStringSafe(record.reason).trim();
  if (!id || !reason) return null;

  return {
    id,
    reason,
    module: normalizeModule(record.module),
    solution_1: toStringSafe(record.solution_1),
    solution_2: toStringSafe(record.solution_2),
    solution_3: toStringSafe(record.solution_3),
    is_file_consists: Boolean(record.is_file_consists),
    file_url: normalizeFileUrl(record.file_url),
    created_at: toStringSafe(record.created_at) || null,
    updated_at: toStringSafe(record.updated_at) || null
  };
}

function toRequestBody(payload: MistakeReasonPayload | Partial<MistakeReasonPayload>) {
  const hasFile = payload.file instanceof File;

  if (hasFile) {
    const formData = new FormData();
    for (const [key, value] of Object.entries(payload)) {
      if (value === undefined || value === null) continue;
      if (key === "file" && value instanceof File) {
        formData.append("file", value);
        continue;
      }
      formData.append(key, typeof value === "boolean" ? String(value) : String(value));
    }
    return formData;
  }

  const json: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (key === "file" || value === undefined) continue;
    json[key] = value;
  }
  return json;
}

function normalizeList(data: unknown): AdminPaginatedResponse<MistakeReasonRecord> {
  const root = asRecord(data);
  const results = asArray(data).map(normalizeReason).filter((item): item is MistakeReasonRecord => Boolean(item));

  return {
    count: typeof root?.count === "number" ? root.count : results.length,
    next: typeof root?.next === "string" ? root.next : null,
    previous: typeof root?.previous === "string" ? root.previous : null,
    results
  };
}

export const mistakeReasonsService = {
  async list(params?: {module?: MistakeReasonModule | "all"}) {
    try {
      const response = await adminHttpClient.get("/mistake-reasons/", {
        params: params?.module && params.module !== "all" ? {module: params.module} : undefined
      });
      return normalizeList(response.data);
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async create(payload: MistakeReasonPayload) {
    try {
      const response = await adminHttpClient.post("/mistake-reasons/", toRequestBody(payload));
      const record = normalizeReason(response.data);
      if (!record) throw new Error("Invalid mistake reason response.");
      return record;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async update(id: string, payload: Partial<MistakeReasonPayload>) {
    try {
      const response = await adminHttpClient.patch(`/mistake-reasons/${encodeURIComponent(id)}/`, toRequestBody(payload));
      const record = normalizeReason(response.data);
      if (!record) throw new Error("Invalid mistake reason response.");
      return record;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async remove(id: string) {
    try {
      await adminHttpClient.delete(`/mistake-reasons/${encodeURIComponent(id)}/`);
      return {ok: true as const};
    } catch (error) {
      throw toAdminApiError(error);
    }
  }
};
