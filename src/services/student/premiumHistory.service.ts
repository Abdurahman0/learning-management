import {studentHttpClient, toStudentApiError} from "./httpClient";

export type StudentPremiumHistoryEntry = {
  action: "ENABLED" | "DISABLED" | string;
  note: string;
  createdAt: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function normalizeEntry(item: unknown): StudentPremiumHistoryEntry {
  const row = asRecord(item) ?? {};
  return {
    action: typeof row.action === "string" ? row.action : "",
    note: typeof row.note === "string" ? row.note : "",
    createdAt: typeof row.created_at === "string" ? row.created_at : ""
  };
}

export const studentPremiumHistoryService = {
  async getHistory(): Promise<StudentPremiumHistoryEntry[]> {
    try {
      const response = await studentHttpClient.get<unknown>("/premium-history/");
      const data = asRecord(response.data) ?? {};
      const results = Array.isArray(data.results) ? data.results : Array.isArray(response.data) ? (response.data as unknown[]) : [];
      return results.map(normalizeEntry);
    } catch (error) {
      throw toStudentApiError(error);
    }
  }
};
