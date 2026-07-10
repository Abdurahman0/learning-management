import type {AxiosProgressEvent} from "axios";

import {adminHttpClient, toAdminApiError, toListQuery} from "./httpClient";
import {listeningPartsService} from "./listeningParts.service";
import {readingPassagesService} from "./readingPassages.service";
import type {
  AdminEntityId,
  AdminListQuery,
  AdminPaginatedResponse,
  PracticeTestCreatePayload,
  PracticeTestDetailRecord,
  PracticeTestGroupRecord,
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
      const mapped = toAdminApiError(error);

      // Backward/partial backend compatibility: if the backend rejects newly introduced fields,
      // retry once without them so test creation still works across environments.
      if (mapped.status === 400) {
        try {
          const nextPayload = {...payload} as PracticeTestCreatePayload & {
            practice_source?: unknown;
            active_for_registered_users?: unknown;
          };

          if (Object.prototype.hasOwnProperty.call(mapped.fieldErrors, "practice_source")) {
            delete nextPayload.practice_source;
          }
          if (Object.prototype.hasOwnProperty.call(mapped.fieldErrors, "active_for_registered_users")) {
            delete nextPayload.active_for_registered_users;
          }

          // If the backend returned a generic 400 without field errors, fall back to dropping `practice_source`
          // first (most likely to be rejected by older servers).
          if (!Object.keys(mapped.fieldErrors ?? {}).length && Object.prototype.hasOwnProperty.call(nextPayload, "practice_source")) {
            delete nextPayload.practice_source;
          }

          const retry = await adminHttpClient.post<PracticeTestDetailRecord>("/practice-tests/", normalizePracticePayload(nextPayload));
          return retry.data;
        } catch (retryError) {
          throw toAdminApiError(retryError);
        }
      }

      throw mapped;
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
      const mapped = toAdminApiError(error);
      if (mapped.status === 400) {
        try {
          const nextPayload = {...payload} as PracticeTestPatchPayload & {
            practice_source?: unknown;
            active_for_registered_users?: unknown;
          };
          let changed = false;

          if (Object.prototype.hasOwnProperty.call(mapped.fieldErrors, "practice_source")) {
            delete nextPayload.practice_source;
            changed = true;
          }
          if (Object.prototype.hasOwnProperty.call(mapped.fieldErrors, "active_for_registered_users")) {
            delete nextPayload.active_for_registered_users;
            changed = true;
          }

          if (changed) {
            const retry = await adminHttpClient.patch<PracticeTestDetailRecord>(`/practice-tests/${testId}/`, normalizePracticePatchPayload(nextPayload));
            return retry.data;
          }
        } catch (retryError) {
          throw toAdminApiError(retryError);
        }
      }

      throw mapped;
    }
  },

  /**
   * The backend rejects changing a test's `is_premium` while attached
   * passages/parts carry a different premium status ("Update their is_premium
   * first"), so align every child to the target status before touching the
   * test itself. No-op for children that already match.
   */
  async alignContentPremium(testId: number | string, isPremium: boolean, detail?: PracticeTestDetailRecord) {
    const resolvedDetail = detail ?? (await practiceTestsService.getById(testId));
    const target = Boolean(isPremium);

    for (const passage of resolvedDetail.reading_passages ?? []) {
      if (passage.id != null && Boolean(passage.is_premium) !== target) {
        await readingPassagesService.patch(passage.id, {is_premium: target});
      }
    }

    for (const part of resolvedDetail.listening_parts ?? []) {
      if (part.id != null && Boolean(part.is_premium) !== target) {
        await listeningPartsService.patch(part.id, {is_premium: target});
      }
    }

    return resolvedDetail;
  },

  /**
   * Sets the test's premium status + unlocking packages in the order the
   * backend requires: children first, then the test.
   */
  async setPremium(testId: number | string, options: {isPremium: boolean; packages: AdminEntityId[]}) {
    await practiceTestsService.alignContentPremium(testId, options.isPremium);
    return practiceTestsService.patch(testId, {
      is_premium: Boolean(options.isPremium),
      packages: options.isPremium ? options.packages : []
    });
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
  },

  async reorder(orderedIds: Array<number | string>) {
    try {
      const response = await adminHttpClient.post<PracticeTestRecord[]>("/practice-tests/reorder/", {
        ordered_ids: orderedIds
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw toAdminApiError(error);
    }
  }
};

export const practiceTestGroupsService = {
  async list(params?: AdminListQuery & {is_active?: boolean}) {
    try {
      const response = await adminHttpClient.get<AdminPaginatedResponse<PracticeTestGroupRecord> | PracticeTestGroupRecord[]>(
        "/practice-test-groups/",
        {
          params: {
            ...toListQuery(params),
            ...(typeof params?.is_active === "boolean" ? {is_active: params.is_active} : {})
          }
        }
      );
      return normalizeListResponse(response.data);
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async create(payload: {name: string; description?: string; is_active?: boolean}) {
    try {
      const response = await adminHttpClient.post<PracticeTestGroupRecord>("/practice-test-groups/", payload);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async patch(groupId: number | string, payload: Partial<{name: string; description: string; is_active: boolean}>) {
    try {
      const response = await adminHttpClient.patch<PracticeTestGroupRecord>(`/practice-test-groups/${groupId}/`, payload);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async remove(groupId: number | string) {
    try {
      await adminHttpClient.delete(`/practice-test-groups/${groupId}/`);
    } catch (error) {
      throw toAdminApiError(error);
    }
  }
};
