import {adminHttpClient, toAdminApiError} from "./httpClient";
import type {AdminEntityId, AdminNotificationsResponse} from "./types";

export type AdminNotificationSeverity = "INFO" | "SUCCESS" | "WARNING" | string;

export type AdminNotificationRecord = {
  id: string;
  eventType: string;
  severity: AdminNotificationSeverity;
  title: string;
  message: string;
  targetUrl: string;
  metadata: Record<string, unknown>;
  sourceModel: string;
  sourceId: string;
  createdAt: string;
  isRead: boolean;
};

type StreamCallbacks = {
  onNotifications: (items: AdminNotificationRecord[]) => void;
  onUnreadCount: (count: number) => void;
  signal?: AbortSignal;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
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

function asNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeAdminNotification(value: unknown): AdminNotificationRecord {
  const record = asRecord(value);
  return {
    id: asString(record.id),
    eventType: asString(record.event_type ?? record.eventType),
    severity: asString(record.severity, "INFO"),
    title: asString(record.title),
    message: asString(record.message),
    targetUrl: asString(record.target_url ?? record.targetUrl),
    metadata: asRecord(record.metadata),
    sourceModel: asString(record.source_model ?? record.sourceModel),
    sourceId: asString(record.source_id ?? record.sourceId),
    createdAt: asString(record.created_at ?? record.createdAt),
    isRead: asBoolean(record.is_read ?? record.isRead)
  };
}

function normalizeNotificationsResponse(payload: unknown): AdminNotificationsResponse<AdminNotificationRecord> {
  const root = asRecord(payload);
  const results = asArray(Array.isArray(payload) ? payload : root.results).map(normalizeAdminNotification);
  return {
    count: asNumber(root.count, results.length),
    next: asString(root.next) || null,
    previous: asString(root.previous) || null,
    unread_count: asNumber(root.unread_count ?? root.unreadCount),
    results
  };
}

function parseSseEvent(rawEvent: string) {
  const lines = rawEvent.split("\n");
  const eventName = lines.find((line) => line.startsWith("event: "))?.replace("event: ", "").trim() || "message";
  const dataLines = lines.filter((line) => line.startsWith("data: ")).map((line) => line.replace("data: ", ""));
  if (dataLines.length === 0) return null;
  return {eventName, data: dataLines.join("\n")};
}

export const adminNotificationsService = {
  async list(params?: {unreadOnly?: boolean; page?: number; pageSize?: number}) {
    try {
      const response = await adminHttpClient.get<unknown>("/notifications/", {
        params: {
          ...(params?.unreadOnly ? {unread_only: true} : {}),
          ...(typeof params?.page === "number" ? {page: params.page} : {}),
          ...(typeof params?.pageSize === "number" ? {page_size: params.pageSize} : {})
        }
      });
      return normalizeNotificationsResponse(response.data);
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async markRead(id: AdminEntityId) {
    try {
      const response = await adminHttpClient.post<unknown>(`/notifications/${encodeURIComponent(String(id))}/read/`, {});
      return response.data ? normalizeAdminNotification(response.data) : null;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async markAllRead() {
    try {
      await adminHttpClient.post("/notifications/mark-all-read/", {});
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async connectStream({onNotifications, onUnreadCount, signal}: StreamCallbacks) {
    const response = await fetch("/api/admin-notifications-stream", {
      method: "GET",
      headers: {Accept: "text/event-stream"},
      signal,
      cache: "no-store"
    });

    if (!response.ok || !response.body) {
      throw new Error("Unable to connect notification stream.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const {value, done} = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, {stream: true});
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const rawEvent of events) {
        const parsed = parseSseEvent(rawEvent);
        if (!parsed) continue;

        try {
          const payload = JSON.parse(parsed.data) as unknown;
          const record = asRecord(payload);
          if (typeof record.unread_count === "number") {
            onUnreadCount(record.unread_count);
          }
          if (parsed.eventName === "notifications") {
            const items = asArray(record.results).map(normalizeAdminNotification).filter((item) => item.id);
            if (items.length > 0) onNotifications(items);
          }
        } catch {
          // Ignore malformed SSE payloads; the next event can still be valid.
        }
      }
    }
  }
};
