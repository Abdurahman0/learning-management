# Frontend Admin Real-Time Notifications Guide

This guide explains how to wire the admin notification bell so updates appear
without a page reload.

## What Creates Notifications

The backend creates durable admin notifications for:

- New student registration
- New feedback submission
- Feedback approved for public visibility
- Student test completion

Notifications are stored in the database, so admins can reconnect and still see
missed items. Read state is tracked per admin.

## REST Endpoints

All endpoints require an admin access token.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/admin/notifications/` | Paginated notification history |
| `GET` | `/api/v1/admin/notifications/?unread_only=true` | Only unread notifications |
| `POST` | `/api/v1/admin/notifications/{notification_id}/read/` | Mark one notification as read |
| `POST` | `/api/v1/admin/notifications/mark-all-read/` | Mark all notifications as read |
| `GET` | `/api/v1/admin/notifications/stream/` | Real-time Server-Sent Events stream |

List response:

```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "unread_count": 1,
  "results": [
    {
      "id": "d2e5d9c7-dc6d-4d06-977f-f15ef11938ac",
      "event_type": "FEEDBACK_SUBMITTED",
      "severity": "INFO",
      "title": "New feedback submitted",
      "message": "Please add more matching headings practice.",
      "target_url": "/admin/feedback/8f3a...",
      "metadata": {
        "feedback_id": "8f3a...",
        "user_id": "4a0b...",
        "is_visible": false
      },
      "source_model": "users.Feedback",
      "source_id": "8f3a...",
      "created_at": "2026-05-12T10:00:00Z",
      "is_read": false
    }
  ]
}
```

## Real-Time Stream

Use:

```http
GET /api/v1/admin/notifications/stream/
Authorization: Bearer <admin_access_token>
Accept: text/event-stream
```

The stream sends these event types:

| Event | Meaning |
| --- | --- |
| `ready` | Connection opened |
| `notifications` | One or more new notifications |
| `heartbeat` | Keepalive plus latest unread count |

Notification event payload:

```json
{
  "unread_count": 3,
  "results": [
    {
      "id": "d2e5d9c7-dc6d-4d06-977f-f15ef11938ac",
      "event_type": "TEST_COMPLETED",
      "severity": "SUCCESS",
      "title": "Test completed",
      "message": "Student completed Cambridge IELTS 20 Reading Test 4 with band 8.0.",
      "target_url": "/admin/users/4a0b...",
      "metadata": {
        "attempt_id": "1d2c...",
        "score": 36,
        "band_score": "8.0"
      },
      "created_at": "2026-05-12T10:01:00Z",
      "is_read": false
    }
  ]
}
```

## Important Browser Note

Native `EventSource` cannot send an `Authorization` header. Use one of these:

- A fetch-based SSE reader with `Authorization` header
- An EventSource polyfill that supports custom headers
- Cookie-based auth if the frontend later moves admin auth to secure cookies

## Fetch-Based SSE Example

```ts
type AdminNotification = {
  id: string;
  event_type: string;
  severity: "INFO" | "SUCCESS" | "WARNING";
  title: string;
  message: string;
  target_url: string;
  metadata: Record<string, unknown>;
  created_at: string;
  is_read: boolean;
};

export async function connectAdminNotifications({
  token,
  onNotifications,
  onUnreadCount,
  signal,
}: {
  token: string;
  onNotifications: (items: AdminNotification[]) => void;
  onUnreadCount: (count: number) => void;
  signal?: AbortSignal;
}) {
  const response = await fetch("/api/v1/admin/notifications/stream/", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "text/event-stream",
    },
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error("Unable to connect notification stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\\n\\n");
    buffer = events.pop() ?? "";

    for (const rawEvent of events) {
      const eventName = rawEvent
        .split("\\n")
        .find((line) => line.startsWith("event: "))
        ?.replace("event: ", "");
      const dataLine = rawEvent
        .split("\\n")
        .find((line) => line.startsWith("data: "));

      if (!dataLine) continue;
      const payload = JSON.parse(dataLine.replace("data: ", ""));

      if (typeof payload.unread_count === "number") {
        onUnreadCount(payload.unread_count);
      }
      if (eventName === "notifications" && Array.isArray(payload.results)) {
        onNotifications(payload.results);
      }
    }
  }
}
```

## Suggested Bell Flow

1. On admin layout mount, call `GET /api/v1/admin/notifications/` and set the
   initial dropdown items plus `unread_count`.
2. Open the SSE stream and keep it alive while the admin panel is mounted.
3. When a `notifications` event arrives, prepend new items to the dropdown and
   update the red badge from `unread_count`.
4. When the admin opens a notification, call
   `POST /api/v1/admin/notifications/{id}/read/`.
5. For “Mark all as read”, call
   `POST /api/v1/admin/notifications/mark-all-read/`.
6. If the stream disconnects, retry with backoff and refresh the REST list.

## Visual Mapping

Suggested severity styles:

| Severity | UI Treatment |
| --- | --- |
| `INFO` | Blue/neutral notification |
| `SUCCESS` | Green success notification |
| `WARNING` | Amber warning notification |

Use `target_url` to navigate when the admin clicks a notification.
