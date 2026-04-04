import type {AxiosProgressEvent} from "axios";

import {adminHttpClient, toAdminApiError, toListQuery} from "./httpClient";
import type {
  AdminListQuery,
  AdminPaginatedResponse,
  PracticeTestCreatePayload,
  PracticeTestDetailRecord,
  PracticeTestPatchPayload,
  PracticeTestRecord
} from "./types";

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

function normalizeTestType(value: string | undefined) {
  if (!value) return value;
  const normalized = value.trim().toLowerCase();
  if (normalized === "reading") return "READING";
  if (normalized === "listening") return "LISTENING";
  return value.trim();
}

function normalizePracticePayload(payload: PracticeTestCreatePayload) {
  return {
    ...payload,
    test_type: normalizeTestType(payload.test_type) ?? payload.test_type
  };
}

function normalizePracticePatchPayload(payload: PracticeTestPatchPayload) {
  if (typeof payload.test_type !== "string") {
    return payload;
  }

  return {
    ...payload,
    test_type: normalizeTestType(payload.test_type)
  };
}

export const practiceTestsService = {
  async list(
    params?: AdminListQuery & {
      test_type?: string;
      difficulty_level?: string;
      is_active?: boolean;
    }
  ) {
    try {
      const response = await adminHttpClient.get<AdminPaginatedResponse<PracticeTestRecord> | PracticeTestRecord[]>("/practice-tests/", {
        params: {
          ...toListQuery(params),
          ...(params?.test_type ? {test_type: params.test_type} : {}),
          ...(params?.difficulty_level ? {difficulty_level: params.difficulty_level} : {}),
          ...(typeof params?.is_active === "boolean" ? {is_active: params.is_active} : {})
        }
      });
      return normalizeListResponse(response.data);
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async getById(testId: number | string) {
    try {
      const response = await adminHttpClient.get<PracticeTestDetailRecord>(`/practice-tests/${testId}/`);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async create(payload: PracticeTestCreatePayload) {
    try {
      const response = await adminHttpClient.post<PracticeTestDetailRecord>("/practice-tests/", normalizePracticePayload(payload));
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async update(testId: number | string, payload: PracticeTestCreatePayload) {
    try {
      const response = await adminHttpClient.put<PracticeTestDetailRecord>(`/practice-tests/${testId}/`, normalizePracticePayload(payload));
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async patch(testId: number | string, payload: PracticeTestPatchPayload) {
    try {
      const response = await adminHttpClient.patch<PracticeTestDetailRecord>(`/practice-tests/${testId}/`, normalizePracticePatchPayload(payload));
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async remove(testId: number | string, options?: {hard?: boolean}) {
    try {
      await adminHttpClient.delete(`/practice-tests/${testId}/`, {
        params: options?.hard ? {hard: "true"} : undefined
      });
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async importJson(
    file: File,
    options?: {
      onUploadProgress?: (progress: AxiosProgressEvent) => void;
    }
  ) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("json_file", file);

    try {
      const response = await adminHttpClient.post("/practice-tests/import/", formData, {
        onUploadProgress: options?.onUploadProgress
      });
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  }
};
