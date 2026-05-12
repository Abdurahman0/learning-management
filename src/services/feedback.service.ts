import axios from "axios";

import {adminHttpClient, toAdminApiError} from "./admin/httpClient";
import {studentHttpClient, toStudentApiError} from "./student/httpClient";
import type {AdminEntityId, AdminPaginatedResponse} from "./admin/types";
import type {StudentPaginatedResponse} from "./student/types";

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function asArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item && typeof item === "object").map((item) => item as Record<string, unknown>);
}

function asString(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function asBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return fallback;
}

function normalizeFeedbackItem(value: unknown): FeedbackRecord {
  const record = asRecord(value);
  const name =
    asString(record.user_full_name).trim() ||
    asString(record.user_name).trim() ||
    asString(record.full_name).trim() ||
    asString(record.name).trim();

  return {
    id: asString(record.id),
    user: asString(record.user),
    userEmail: asString(record.user_email),
    userFullName: name,
    feedbackText: asString(record.feedback_text),
    isVisible: asBoolean(record.is_visible),
    createdAt: asString(record.created_at),
    updatedAt: asString(record.updated_at)
  };
}

function normalizePaginated<T>(payload: unknown, mapper: (item: unknown) => T): StudentPaginatedResponse<T> {
  const root = asRecord(payload);
  const resultsSource = Array.isArray(payload) ? payload : root.results;
  const results = asArray(resultsSource).map(mapper);
  const countRaw = root.count;
  const count = typeof countRaw === "number" && Number.isFinite(countRaw) ? countRaw : results.length;

  return {
    count,
    next: asString(root.next) || null,
    previous: asString(root.previous) || null,
    results
  };
}

export type FeedbackRecord = {
  id: string;
  user: string;
  userEmail: string;
  userFullName: string;
  feedbackText: string;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

export const publicFeedbackService = {
  async list() {
    const response = await axios.get<unknown>("/api/public/feedback", {
      headers: {Accept: "application/json"},
      withCredentials: false
    });
    return normalizePaginated(response.data, normalizeFeedbackItem);
  }
};

export const studentFeedbackService = {
  async create(feedbackText: string) {
    try {
      const response = await studentHttpClient.post<unknown>("/feedback/", {
        feedback_text: feedbackText
      });
      return normalizeFeedbackItem(response.data);
    } catch (error) {
      throw toStudentApiError(error);
    }
  }
};

export const adminFeedbackService = {
  async list(): Promise<AdminPaginatedResponse<FeedbackRecord>> {
    try {
      const response = await adminHttpClient.get<unknown>("/feedback/");
      return normalizePaginated(response.data, normalizeFeedbackItem);
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async setVisibility(id: AdminEntityId, isVisible: boolean) {
    try {
      const response = await adminHttpClient.patch<unknown>(`/feedback/${encodeURIComponent(String(id))}/`, {
        is_visible: isVisible
      });
      return normalizeFeedbackItem(response.data);
    } catch (error) {
      throw toAdminApiError(error);
    }
  }
};
