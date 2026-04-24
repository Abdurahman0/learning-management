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

function validateCreateOwnerChoice(payload: QuestionGroupPayload) {
  const hasListening = hasValidOwnerId(payload.listening_part);
  const hasReading = hasValidOwnerId(payload.reading_passage);
  const hasVariantSet = hasValidOwnerId(payload.variant_set);
  const activeCount = Number(hasListening) + Number(hasReading) + Number(hasVariantSet);

  if (activeCount !== 1) {
    throw new AdminApiError(
      "Question-group create/update must include exactly one of listening_part, reading_passage, or variant_set.",
      400
    );
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
    // We always use MCQ_SINGLE. For “Choose TWO letters”, use LIST_SELECTION (Selecting from a List).
    return "MCQ_SINGLE";
  }

  const mapped: Record<string, string> = {
    mcq_single: "MCQ_SINGLE",
    mcq_multiple: "MCQ_SINGLE",
    multiple_choice_single: "MCQ_SINGLE",
    multiple_choice_multiple: "MCQ_SINGLE",
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

function toKey(index: number) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let value = index + 1;
  let result = "";
  while (value > 0) {
    value -= 1;
    result = alphabet[value % 26] + result;
    value = Math.floor(value / 26);
  }
  return result || "A";
}

function toRoman(index: number) {
  const romans = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];
  return romans[index] ?? `h${index + 1}`;
}

function normalizeGroupContentByType(
  normalizedType: string,
  groupContent: unknown,
  from: number,
  to: number
) {
  const content = groupContent && typeof groupContent === "object" && !Array.isArray(groupContent)
    ? (groupContent as Record<string, unknown>)
    : {};

  if (normalizedType === "MCQ_SINGLE" || normalizedType === "MCQ_MULTIPLE" || normalizedType === "MATCH_PARA_INFO") {
    return null;
  }

  if (normalizedType === "MATCHING_HEADINGS") {
    const sourceRows = Array.isArray(content.headings) ? content.headings : [];
    const headings = sourceRows
      .map((item) => {
        if (typeof item === "string") return item;
        if (!item || typeof item !== "object") return "";
        const row = item as Record<string, unknown>;
        return String(row.text ?? row.label ?? row.key ?? "").trim();
      })
      .filter(Boolean);

    return {
      headings: headings.map((text, index) => ({key: toRoman(index), text}))
    };
  }

  if (normalizedType === "CLASSIFICATION") {
    const sourceRows = Array.isArray(content.categories)
      ? content.categories
      : Array.isArray(content.choices)
        ? content.choices
        : [];
    const categories = sourceRows
      .map((item) => {
        if (typeof item === "string") return item;
        if (!item || typeof item !== "object") return "";
        const row = item as Record<string, unknown>;
        return String(row.label ?? row.text ?? row.key ?? "").trim();
      })
      .filter(Boolean);

    return {
      categories: categories.map((label, index) => ({key: toKey(index), label}))
    };
  }

  if (normalizedType === "LIST_SELECTION") {
    const sourceRows = Array.isArray(content.options)
      ? content.options
      : Array.isArray(content.choices)
        ? content.choices
        : [];
    const options = sourceRows
      .map((item) => {
        if (typeof item === "string") return item;
        if (!item || typeof item !== "object") return "";
        const row = item as Record<string, unknown>;
        return String(row.text ?? row.label ?? row.key ?? "").trim();
      })
      .filter(Boolean);

    return {
      options: options.map((text, index) => ({key: toKey(index), text}))
    };
  }

  if (normalizedType === "PLAN_MAP_DIAGRAM") {
    const sourceRows = Array.isArray(content.labels)
      ? content.labels
      : Array.isArray(content.options)
        ? content.options
        : Array.isArray(content.choices)
          ? content.choices
          : [];
    const labels = sourceRows
      .map((item) => {
        if (typeof item === "string") return item;
        if (!item || typeof item !== "object") return "";
        const row = item as Record<string, unknown>;
        return String(row.text ?? row.label ?? row.key ?? "").trim();
      })
      .filter(Boolean);
    const image = String(content.image ?? "/media/diagrams/placeholder-map.png").trim() || "/media/diagrams/placeholder-map.png";

    return {
      image,
      labels: labels.map((text, index) => ({key: toKey(index), text}))
    };
  }

  if (normalizedType === "FORM_COMPLETION" || normalizedType === "NOTE_COMPLETION") {
    const templateText = String(content.template_text ?? "").trim();
    if (templateText) {
      return {template_text: templateText};
    }

    const safeFrom = Number.isFinite(from) ? from : 1;
    const safeTo = Number.isFinite(to) && to >= safeFrom ? to : safeFrom;
    const lines: string[] = [];
    for (let number = safeFrom; number <= safeTo; number += 1) {
      lines.push(`Item ${number}: {${number}}`);
    }
    return {template_text: lines.join("\n")};
  }

  return groupContent;
}

function normalizeQuestionGroupPayload(payload: QuestionGroupPayload): QuestionGroupPayload {
  const questionCount =
    Number(payload.question_number_end ?? 0) - Number(payload.question_number_start ?? 0) + 1;
  const normalizedType = normalizeQuestionTypeForApi(payload.question_type, Number.isFinite(questionCount) ? questionCount : undefined);

  const start = Number(payload.question_number_start ?? 1);
  const end = Number(payload.question_number_end ?? start);
  const from = Number.isFinite(start) ? start : 1;
  const to = Number.isFinite(end) && end >= from ? end : from;
  const normalizedGroupContent = normalizeGroupContentByType(normalizedType, payload.group_content_json, from, to);

  return {
    ...payload,
    question_type: normalizedType,
    group_content_json: normalizedGroupContent
  };
}

function normalizeQuestionGroupPatchPayload(payload: Partial<QuestionGroupPayload>): Partial<QuestionGroupPayload> {
  if (!payload.question_type) {
    return payload;
  }

  const hasStart = typeof payload.question_number_start === "number";
  const hasEnd = typeof payload.question_number_end === "number";
  const questionCount = hasStart && hasEnd ? payload.question_number_end! - payload.question_number_start! + 1 : undefined;

  const normalizedType = normalizeQuestionTypeForApi(payload.question_type, questionCount);
  const start = Number(payload.question_number_start ?? 1);
  const end = Number(payload.question_number_end ?? start);
  const from = Number.isFinite(start) ? start : 1;
  const to = Number.isFinite(end) && end >= from ? end : from;
  const normalizedGroupContent =
    payload.group_content_json !== undefined
      ? normalizeGroupContentByType(normalizedType, payload.group_content_json, from, to)
      : (normalizedType === "MCQ_SINGLE" || normalizedType === "MCQ_MULTIPLE" || normalizedType === "MATCH_PARA_INFO" ? null : undefined);

  return {
    ...payload,
    question_type: normalizedType,
    ...(normalizedGroupContent !== undefined ? {group_content_json: normalizedGroupContent} : {})
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
      validateCreateOwnerChoice(normalizedPayload);
      const response = await adminHttpClient.post<QuestionGroupRecord>("/question-groups/", normalizedPayload);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async update(groupId: number | string, payload: QuestionGroupPayload) {
    try {
      const normalizedPayload = normalizeQuestionGroupPayload(payload);
      validateCreateOwnerChoice(normalizedPayload);
      const response = await adminHttpClient.put<QuestionGroupRecord>(`/question-groups/${groupId}/`, normalizedPayload);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async patch(groupId: number | string, payload: Partial<QuestionGroupPayload>) {
    try {
      const normalizedPayload = normalizeQuestionGroupPatchPayload(payload);

      if (
        normalizedPayload.listening_part !== undefined ||
        normalizedPayload.reading_passage !== undefined ||
        normalizedPayload.variant_set !== undefined
      ) {
        const hasListening = hasValidOwnerId(normalizedPayload.listening_part);
        const hasReading = hasValidOwnerId(normalizedPayload.reading_passage);
        const hasVariantSet = hasValidOwnerId(normalizedPayload.variant_set);
        const activeCount = Number(hasListening) + Number(hasReading) + Number(hasVariantSet);
        if (activeCount !== 1) {
          throw new AdminApiError(
            "Question-group patch must include exactly one of listening_part, reading_passage, or variant_set when parent identifiers are provided.",
            400
          );
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
