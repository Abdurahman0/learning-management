import {adminHttpClient, toAdminApiError, toListQuery} from "./httpClient";
import {validateBulkQuestions} from "./questionValidators";
import type {AdminEntityId, AdminListQuery, AdminPaginatedResponse, QuestionBulkPayload, QuestionPayload, QuestionRecord} from "./types";

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

export const questionsService = {
  async list(
    params?: AdminListQuery & {
      question_group?: AdminEntityId;
      is_active?: boolean;
    }
  ) {
    try {
      const response = await adminHttpClient.get<AdminPaginatedResponse<QuestionRecord> | QuestionRecord[]>("/questions/", {
        params: {
          ...toListQuery(params),
          ...(params?.question_group !== undefined && params?.question_group !== null ? {question_group: params.question_group} : {}),
          ...(typeof params?.is_active === "boolean" ? {is_active: params.is_active} : {})
        }
      });
      return normalizeListResponse(response.data);
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async create(payload: QuestionPayload) {
    try {
      const response = await adminHttpClient.post<QuestionRecord>("/questions/", payload);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async patch(questionId: AdminEntityId, payload: Partial<QuestionPayload>) {
    try {
      const response = await adminHttpClient.patch<QuestionRecord>(`/questions/${questionId}/`, payload);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async remove(questionId: AdminEntityId) {
    try {
      await adminHttpClient.delete(`/questions/${questionId}/`);
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async bulkCreate(groupId: number | string, questionType: string, payload: QuestionBulkPayload) {
    try {
      validateBulkQuestions(questionType, payload.questions);

      const response = await adminHttpClient.post<QuestionRecord[]>(`/question-groups/${groupId}/questions/bulk/`, payload);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  }
};
