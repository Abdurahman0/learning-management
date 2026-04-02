import {adminHttpClient, toAdminApiError, toListQuery} from "./httpClient";
import type {AdminPaginatedResponse} from "./types";

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function asArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => item as Record<string, unknown>);
}

function asString(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function asBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return fallback;
}

function asNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function normalizeListResponse<T>(data: AdminPaginatedResponse<T> | T[]) {
  if (Array.isArray(data)) {
    return {
      count: data.length,
      next: null,
      previous: null,
      results: data
    };
  }

  return {
    count: asNumber(data.count),
    next: data.next ?? null,
    previous: data.previous ?? null,
    results: Array.isArray(data.results) ? data.results : []
  };
}

export type AdminUserListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  role?: "STUDENT" | "ADMIN" | "ALL";
  status?: "ACTIVE" | "INACTIVE";
};

export type AdminUserListItem = {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  isStaff: boolean;
  dateJoined: string;
  role: string;
  targetBand: number;
  overallBand: number;
  readingBand: number;
  listeningBand: number;
  testsCompleted: number;
  lastActivityAt: string;
  raw: Record<string, unknown>;
};

export type AdminUsersListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminUserListItem[];
  metrics: {
    totalUsers: number;
    activeToday: number;
    newThisMonth: number;
  };
  raw: Record<string, unknown>;
};

export type AdminUserDetailResponse = {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  isStaff: boolean;
  dateJoined: string;
  role: string;
  targetBand: number;
  overallBand: number;
  readingBand: number;
  listeningBand: number;
  testsCompleted: number;
  lastActivityAt: string;
  modulePerformance: {
    reading: number;
    listening: number;
  };
  bandProgression: Array<{
    label: string;
    bandScore: number;
    testTitle: string;
    completedAt: string;
  }>;
  weakAreas: Array<{
    questionType: string;
    questionTypeLabel: string;
    module: string;
    accuracy: number;
  }>;
  recentAttempts: Array<{
    attemptId: string;
    testTitle: string;
    module: string;
    score: number;
    total: number;
    bandScore: number;
    completedAt: string;
  }>;
  raw: Record<string, unknown>;
};

function normalizeListItem(payload: unknown): AdminUserListItem {
  const row = asRecord(payload);
  return {
    id: asString(row.id),
    fullName: asString(row.full_name ?? row.fullName),
    email: asString(row.email),
    isActive: asBoolean(row.is_active ?? row.isActive),
    isStaff: asBoolean(row.is_staff ?? row.isStaff),
    dateJoined: asString(row.date_joined ?? row.dateJoined),
    role: asString(row.role),
    targetBand: asNumber(row.target_band ?? row.targetBand),
    overallBand: asNumber(row.overall_band ?? row.overallBand),
    readingBand: asNumber(row.reading_band ?? row.readingBand),
    listeningBand: asNumber(row.listening_band ?? row.listeningBand),
    testsCompleted: asNumber(row.tests_completed ?? row.testsCompleted),
    lastActivityAt: asString(row.last_activity_at ?? row.lastActivityAt),
    raw: row
  };
}

function normalizeDetailResponse(payload: unknown): AdminUserDetailResponse {
  const root = asRecord(payload);
  const modulePerformance = asRecord(root.module_performance ?? root.modulePerformance);

  return {
    id: asString(root.id),
    fullName: asString(root.full_name ?? root.fullName),
    email: asString(root.email),
    isActive: asBoolean(root.is_active ?? root.isActive),
    isStaff: asBoolean(root.is_staff ?? root.isStaff),
    dateJoined: asString(root.date_joined ?? root.dateJoined),
    role: asString(root.role),
    targetBand: asNumber(root.target_band ?? root.targetBand),
    overallBand: asNumber(root.overall_band ?? root.overallBand),
    readingBand: asNumber(root.reading_band ?? root.readingBand),
    listeningBand: asNumber(root.listening_band ?? root.listeningBand),
    testsCompleted: asNumber(root.tests_completed ?? root.testsCompleted),
    lastActivityAt: asString(root.last_activity_at ?? root.lastActivityAt),
    modulePerformance: {
      reading: asNumber(modulePerformance.reading),
      listening: asNumber(modulePerformance.listening)
    },
    bandProgression: asArray(root.band_progression ?? root.bandProgression).map((item, index) => ({
      label: asString(item.label) || `Point ${index + 1}`,
      bandScore: asNumber(item.band_score ?? item.bandScore),
      testTitle: asString(item.test_title ?? item.testTitle),
      completedAt: asString(item.completed_at ?? item.completedAt)
    })),
    weakAreas: asArray(root.weak_areas ?? root.weakAreas).map((item) => ({
      questionType: asString(item.question_type ?? item.questionType),
      questionTypeLabel: asString(item.question_type_display ?? item.questionTypeDisplay ?? item.question_type),
      module: asString(item.module),
      accuracy: asNumber(item.accuracy)
    })),
    recentAttempts: asArray(root.recent_attempts ?? root.recentAttempts).map((item) => ({
      attemptId: asString(item.attempt_id ?? item.attemptId),
      testTitle: asString(item.test_title ?? item.testTitle ?? item.test_name ?? item.testName),
      module: asString(item.test_type ?? item.testType ?? item.module),
      score: asNumber(item.score),
      total: asNumber(item.total),
      bandScore: asNumber(item.band_score ?? item.bandScore),
      completedAt: asString(item.completed_at ?? item.completedAt)
    })),
    raw: root
  };
}

export const adminUsersService = {
  async list(query?: AdminUserListQuery): Promise<AdminUsersListResponse> {
    try {
      const response = await adminHttpClient.get<AdminPaginatedResponse<unknown> | unknown[]>("/users/", {
        params: {
          ...toListQuery(query),
          ...(query?.role ? {role: query.role} : {}),
          ...(query?.status ? {status: query.status} : {})
        }
      });

      const normalized = normalizeListResponse(response.data);
      const root = asRecord(response.data);
      const metrics = asRecord(root.metrics);

      return {
        ...normalized,
        results: normalized.results.map((item) => normalizeListItem(item)),
        metrics: {
          totalUsers: asNumber(metrics.total_users ?? metrics.totalUsers ?? normalized.count),
          activeToday: asNumber(metrics.active_today ?? metrics.activeToday),
          newThisMonth: asNumber(metrics.new_this_month ?? metrics.newThisMonth)
        },
        raw: root
      };
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async getById(userId: string) {
    try {
      const response = await adminHttpClient.get<unknown>(`/users/${userId}/`);
      return normalizeDetailResponse(response.data);
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async create(payload: {full_name: string; email: string; password: string; is_active?: boolean; is_staff?: boolean}) {
    try {
      const response = await adminHttpClient.post<unknown>("/users/", payload);
      return normalizeDetailResponse(response.data);
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async patch(userId: string, payload: Partial<{full_name: string; email: string; password: string; is_active: boolean; is_staff: boolean}>) {
    try {
      const response = await adminHttpClient.patch<unknown>(`/users/${userId}/`, payload);
      return normalizeDetailResponse(response.data);
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async deactivate(userId: string) {
    try {
      await adminHttpClient.delete(`/users/${userId}/`);
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async resetPassword(userId: string, newPassword: string) {
    try {
      await adminHttpClient.post(`/users/${userId}/reset-password/`, {
        new_password: newPassword
      });
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async sendMessage(userId: string, payload: {subject: string; message: string}) {
    try {
      await adminHttpClient.post(`/users/${userId}/send-message/`, payload);
    } catch (error) {
      throw toAdminApiError(error);
    }
  }
};

