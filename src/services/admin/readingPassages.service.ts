import {adminHttpClient, toAdminApiError, toListQuery} from "./httpClient";
import type {AdminListQuery, AdminPaginatedResponse, ReadingPassagePayload, ReadingPassageRecord} from "./types";

function normalizeListResponse<T>(data: AdminPaginatedResponse<T> | T[]): AdminPaginatedResponse<T> {
  if (Array.isArray(data)) {
    return {
      count: data.length,
      next: null,
      previous: null,
      results: data
    };
  }

  return {
    count: Number(data.count ?? 0),
    next: data.next ?? null,
    previous: data.previous ?? null,
    results: Array.isArray(data.results) ? data.results : []
  };
}

function normalizePassageNumber(value: string | number) {
  const raw = String(value ?? "").trim();
  if (!raw) return "PASSAGE_1";
  if (/^PASSAGE_\d+$/i.test(raw)) {
    const numeric = raw.match(/\d+/)?.[0] ?? "1";
    return `PASSAGE_${numeric}`;
  }
  const numeric = raw.match(/\d+/)?.[0] ?? "1";
  return `PASSAGE_${numeric}`;
}

function normalizeReadingPayload(payload: ReadingPassagePayload): ReadingPassagePayload {
  return {
    ...payload,
    passage_number: normalizePassageNumber(payload.passage_number),
    passage_text: payload.passage_text.trim() || "Placeholder passage text.",
    time_limit_seconds: Number.isFinite(payload.time_limit_seconds) && payload.time_limit_seconds > 0 ? payload.time_limit_seconds : 1200
  };
}

export const readingPassagesService = {
  async listByPracticeTest(testId: number | string, params?: AdminListQuery) {
    try {
      const response = await adminHttpClient.get<AdminPaginatedResponse<ReadingPassageRecord> | ReadingPassageRecord[]>(
        `/practice-tests/${testId}/reading-passages/`,
        {params: toListQuery(params)}
      );
      return normalizeListResponse(response.data);
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async create(testId: number | string, payload: ReadingPassagePayload) {
    try {
      const response = await adminHttpClient.post<ReadingPassageRecord>(
        `/practice-tests/${testId}/reading-passages/`,
        normalizeReadingPayload(payload)
      );
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async getById(readingPassageId: number | string) {
    try {
      const response = await adminHttpClient.get<ReadingPassageRecord>(`/reading-passages/${readingPassageId}/`);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async update(readingPassageId: number | string, payload: ReadingPassagePayload) {
    try {
      const response = await adminHttpClient.put<ReadingPassageRecord>(
        `/reading-passages/${readingPassageId}/`,
        normalizeReadingPayload(payload)
      );
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async patch(readingPassageId: number | string, payload: Partial<ReadingPassagePayload>) {
    try {
      const normalizedPayload = {
        ...payload,
        ...(payload.passage_number !== undefined ? {passage_number: normalizePassageNumber(payload.passage_number)} : {}),
        ...(payload.passage_text !== undefined ? {passage_text: payload.passage_text.trim() || "Placeholder passage text."} : {}),
        ...(payload.time_limit_seconds !== undefined
          ? {
              time_limit_seconds:
                Number.isFinite(payload.time_limit_seconds) && Number(payload.time_limit_seconds) > 0
                  ? Number(payload.time_limit_seconds)
                  : 1200
            }
          : {})
      };

      const response = await adminHttpClient.patch<ReadingPassageRecord>(`/reading-passages/${readingPassageId}/`, normalizedPayload);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async remove(readingPassageId: number | string) {
    try {
      await adminHttpClient.delete(`/reading-passages/${readingPassageId}/`);
    } catch (error) {
      throw toAdminApiError(error);
    }
  }
};
