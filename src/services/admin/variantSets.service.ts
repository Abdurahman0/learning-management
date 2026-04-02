import {adminHttpClient, toAdminApiError, toListQuery} from "./httpClient";
import {AdminApiError} from "./types";
import type {AdminEntityId, AdminListQuery, AdminPaginatedResponse} from "./types";

type VariantSetModule = "READING" | "LISTENING";

export type VariantSetRecord = {
  id: AdminEntityId;
  name?: string;
  status?: string;
  is_active?: boolean;
  module?: string;
  reading_passage?: AdminEntityId | null;
  listening_part?: AdminEntityId | null;
  used_in_tests_count?: number;
  used_in_tests?: Array<AdminEntityId>;
  question_groups_count?: number;
  created_at?: string;
  updated_at?: string;
};

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

function normalizeModule(module: "reading" | "listening"): VariantSetModule {
  return module === "listening" ? "LISTENING" : "READING";
}

function hasSameOwner(value: AdminEntityId | null | undefined, ownerId: AdminEntityId) {
  return String(value ?? "").trim() !== "" && String(value) === String(ownerId);
}

export const variantSetsService = {
  async list(
    params?: AdminListQuery & {
      module?: VariantSetModule;
      status?: "DRAFT" | "PUBLISHED" | "USED";
      is_active?: boolean;
    }
  ) {
    try {
      const response = await adminHttpClient.get<AdminPaginatedResponse<VariantSetRecord> | VariantSetRecord[]>(
        "/content-bank/variant-sets/",
        {
          params: {
            ...toListQuery(params),
            ...(params?.module ? {module: params.module} : {}),
            ...(params?.status ? {status: params.status} : {}),
            ...(typeof params?.is_active === "boolean" ? {is_active: params.is_active} : {})
          }
        }
      );

      return normalizeListResponse(response.data);
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async listAll(
    params?: Omit<
      AdminListQuery & {
        module?: VariantSetModule;
        status?: "DRAFT" | "PUBLISHED" | "USED";
        is_active?: boolean;
      },
      "page" | "pageSize"
    >
  ) {
    const rows: VariantSetRecord[] = [];
    let page = 1;

    while (page <= 100) {
      const response = await this.list({
        ...params,
        page,
        pageSize: 200
      });
      rows.push(...response.results);
      if (!response.next) break;
      page += 1;
    }

    return rows;
  },

  async create(payload: {
    module: "reading" | "listening";
    ownerId: AdminEntityId;
    name?: string;
    status?: "DRAFT" | "PUBLISHED" | "USED";
    is_active?: boolean;
  }) {
    const moduleKey = normalizeModule(payload.module);

    try {
      const response = await adminHttpClient.post<VariantSetRecord>("/content-bank/variant-sets/", {
        ...(moduleKey === "READING" ? {reading_passage: payload.ownerId} : {listening_part: payload.ownerId}),
        name: payload.name ?? "Variant Set A",
        status: payload.status ?? "DRAFT",
        is_active: payload.is_active ?? true
      });
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async patch(
    variantSetId: AdminEntityId,
    payload: Partial<{
      name: string;
      status: "DRAFT" | "PUBLISHED" | "USED";
      is_active: boolean;
      reading_passage: AdminEntityId | null;
      listening_part: AdminEntityId | null;
    }>
  ) {
    try {
      const response = await adminHttpClient.patch<VariantSetRecord>(`/content-bank/variant-sets/${variantSetId}/`, payload);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async remove(variantSetId: AdminEntityId) {
    try {
      await adminHttpClient.delete(`/content-bank/variant-sets/${variantSetId}/`);
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async findForOwner(payload: {module: "reading" | "listening"; ownerId: AdminEntityId}) {
    const moduleKey = normalizeModule(payload.module);

    try {
      let page = 1;
      while (page <= 20) {
        const listed = await this.list({
          module: moduleKey,
          is_active: true,
          page,
          pageSize: 200,
          ordering: "-created_at"
        });

        const matched = listed.results.find((item) =>
          moduleKey === "READING"
            ? hasSameOwner(item.reading_passage, payload.ownerId)
            : hasSameOwner(item.listening_part, payload.ownerId)
        );
        if (matched?.id !== undefined && matched?.id !== null) {
          return matched;
        }

        if (!listed.next) break;
        page += 1;
      }
    } catch {
      // Ignore listing failures and return null so caller can handle.
    }
    return null;
  },

  ensureId(value: AdminEntityId | null | undefined) {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    throw new AdminApiError("Variant set id is invalid.", 400);
  }
};
