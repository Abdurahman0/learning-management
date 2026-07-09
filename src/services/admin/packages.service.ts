import {adminHttpClient, toAdminApiError, toListQuery} from "./httpClient";
import type {AdminPaginatedResponse} from "./types";

export type AdminPackageTier = "SILVER" | "GOLD" | "PLATINUM";

export type AdminPackage = {
  id: string;
  name: string;
  tier: AdminPackageTier;
  tier_display: string;
  price: string;
  has_discount: boolean;
  discounted_price: string | null;
  effective_price: string;
  purchase_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AdminPackageWritePayload = {
  name: string;
  tier: AdminPackageTier;
  price: string;
  has_discount: boolean;
  discounted_price?: string | null;
  purchase_url: string;
  is_active?: boolean;
};

export type AdminPackageListQuery = {
  page?: number;
  pageSize?: number;
  tier?: AdminPackageTier;
  is_active?: boolean;
  has_discount?: boolean;
};

export const adminPackagesService = {
  async list(query?: AdminPackageListQuery): Promise<{results: AdminPackage[]; count: number}> {
    try {
      const response = await adminHttpClient.get<AdminPaginatedResponse<AdminPackage> | AdminPackage[]>("/packages/", {
        params: {
          ...toListQuery(query),
          ...(query?.tier ? {tier: query.tier} : {}),
          ...(typeof query?.is_active === "boolean" ? {is_active: query.is_active} : {}),
          ...(typeof query?.has_discount === "boolean" ? {has_discount: query.has_discount} : {})
        }
      });

      if (Array.isArray(response.data)) {
        return {count: response.data.length, results: response.data};
      }

      return {
        count: typeof response.data.count === "number" ? response.data.count : 0,
        results: Array.isArray(response.data.results) ? response.data.results : []
      };
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async create(payload: AdminPackageWritePayload): Promise<AdminPackage> {
    try {
      const response = await adminHttpClient.post<AdminPackage>("/packages/", payload);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async getById(id: string): Promise<AdminPackage> {
    try {
      const response = await adminHttpClient.get<AdminPackage>(`/packages/${id}/`);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async update(id: string, payload: Partial<AdminPackageWritePayload>): Promise<AdminPackage> {
    try {
      const response = await adminHttpClient.patch<AdminPackage>(`/packages/${id}/`, payload);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await adminHttpClient.delete(`/packages/${id}/`);
    } catch (error) {
      throw toAdminApiError(error);
    }
  }
};
