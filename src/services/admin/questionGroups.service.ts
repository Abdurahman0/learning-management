import {adminHttpClient, toAdminApiError, toListQuery} from "./httpClient";
import {AdminApiError} from "./types";
import type {AdminEntityId, AdminListQuery, AdminPaginatedResponse, QuestionGroupPayload, QuestionGroupRecord} from "./types";

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

function hasValidOwnerId(value: AdminEntityId | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0;
  }
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  return false;
}

function validateOwner(payload: QuestionGroupPayload) {
  const hasListening = hasValidOwnerId(payload.listening_part);
  const hasReading = hasValidOwnerId(payload.reading_passage);

  if (hasListening === hasReading) {
    throw new AdminApiError("Question group must belong to either listening_part or reading_passage.", 400);
  }
}

function normalizeQuestionTypeForApi(value: string, questionCount?: number) {
  const normalized = String(value ?? "")
    .trim()
    .replace(/[^\w]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();

  if (!normalized) {
    return "";
  }

  if (normalized === "multiple_choice") {
    return typeof questionCount === "number" && questionCount > 1 ? "MCQ_MULTIPLE" : "MCQ_SINGLE";
  }

  const mapped: Record<string, string> = {
    mcq_single: "MCQ_SINGLE",
    mcq_multiple: "MCQ_MULTIPLE",
    multiple_choice_single: "MCQ_SINGLE",
    multiple_choice_multiple: "MCQ_MULTIPLE",
    sentence_completion: "SENTENCE_COMPLETION",
    summary_completion: "SUMMARY_COMPLETION",
    table_completion: "TABLE_COMPLETION",
    flow_chart: "FLOW_CHART_COMPLETION",
    flow_chart_completion: "FLOW_CHART_COMPLETION",
    flowchart_completion: "FLOW_CHART_COMPLETION",
    short_answer: "SHORT_ANSWER",
    matching_headings: "MATCHING_HEADINGS",
    tfng: "TFNG",
    true_false_not_given: "TFNG",
    true_false_ng: "TFNG",
    yes_no_not_given: "YNNG",
    ynng: "YNNG",
    matching_information: "MATCH_PARA_INFO",
    matching_paragraph_info: "MATCH_PARA_INFO",
    match_para_info: "MATCH_PARA_INFO",
    selecting_from_a_list: "LIST_SELECTION",
    list_selection: "LIST_SELECTION",
    choosing_title: "CHOOSING_TITLE",
    matching_features: "CLASSIFICATION",
    classification: "CLASSIFICATION",
    matching_sentence_endings: "MATCH_SENT_ENDINGS",
    match_sent_endings: "MATCH_SENT_ENDINGS",
    diagram_labeling: "DIAGRAM_COMPLETION",
    diagram_labelling: "DIAGRAM_COMPLETION",
    diagram_completion: "DIAGRAM_COMPLETION",
    matching: "MATCHING",
    map: "PLAN_MAP_DIAGRAM",
    plan_map_diagram: "PLAN_MAP_DIAGRAM",
    form_completion: "FORM_COMPLETION",
    note_completion: "NOTE_COMPLETION"
  };

  return mapped[normalized] ?? normalized.toUpperCase();
}

function normalizeQuestionGroupPayload(payload: QuestionGroupPayload): QuestionGroupPayload {
  const questionCount =
    Number(payload.question_number_end ?? 0) - Number(payload.question_number_start ?? 0) + 1;

  return {
    ...payload,
    question_type: normalizeQuestionTypeForApi(payload.question_type, Number.isFinite(questionCount) ? questionCount : undefined)
  };
}

function normalizeQuestionGroupPatchPayload(payload: Partial<QuestionGroupPayload>): Partial<QuestionGroupPayload> {
  if (!payload.question_type) {
    return payload;
  }

  const hasStart = typeof payload.question_number_start === "number";
  const hasEnd = typeof payload.question_number_end === "number";
  const questionCount = hasStart && hasEnd ? payload.question_number_end! - payload.question_number_start! + 1 : undefined;

  return {
    ...payload,
    question_type: normalizeQuestionTypeForApi(payload.question_type, questionCount)
  };
}

export const questionGroupsService = {
  async list(
    params?: AdminListQuery & {
      listening_part?: AdminEntityId;
      reading_passage?: AdminEntityId;
      variant_set?: AdminEntityId;
      is_active?: boolean;
    }
  ) {
    try {
      const response = await adminHttpClient.get<AdminPaginatedResponse<QuestionGroupRecord> | QuestionGroupRecord[]>("/question-groups/", {
        params: {
          ...toListQuery(params),
          ...(hasValidOwnerId(params?.listening_part) ? {listening_part: params?.listening_part} : {}),
          ...(hasValidOwnerId(params?.reading_passage) ? {reading_passage: params?.reading_passage} : {}),
          ...(hasValidOwnerId(params?.variant_set) ? {variant_set: params?.variant_set} : {}),
          ...(typeof params?.is_active === "boolean" ? {is_active: params.is_active} : {})
        }
      });
      return normalizeListResponse(response.data);
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async getById(groupId: number | string) {
    try {
      const response = await adminHttpClient.get<QuestionGroupRecord>(`/question-groups/${groupId}/`);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async create(payload: QuestionGroupPayload) {
    try {
      const normalizedPayload = normalizeQuestionGroupPayload(payload);
      validateOwner(normalizedPayload);
      const response = await adminHttpClient.post<QuestionGroupRecord>("/question-groups/", normalizedPayload);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async update(groupId: number | string, payload: QuestionGroupPayload) {
    try {
      const normalizedPayload = normalizeQuestionGroupPayload(payload);
      validateOwner(normalizedPayload);
      const response = await adminHttpClient.put<QuestionGroupRecord>(`/question-groups/${groupId}/`, normalizedPayload);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async patch(groupId: number | string, payload: Partial<QuestionGroupPayload>) {
    try {
      const normalizedPayload = normalizeQuestionGroupPatchPayload(payload);

      if (normalizedPayload.listening_part !== undefined || normalizedPayload.reading_passage !== undefined) {
        const hasListening = hasValidOwnerId(normalizedPayload.listening_part);
        const hasReading = hasValidOwnerId(normalizedPayload.reading_passage);
        if (hasListening === hasReading) {
          throw new AdminApiError("Question group must belong to either listening_part or reading_passage.", 400);
        }
      }
      const response = await adminHttpClient.patch<QuestionGroupRecord>(`/question-groups/${groupId}/`, normalizedPayload);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async remove(groupId: number | string) {
    try {
      await adminHttpClient.delete(`/question-groups/${groupId}/`);
    } catch (error) {
      throw toAdminApiError(error);
    }
  }
};
