# Frontend Feedback API Guide

This guide explains how the frontend should integrate student feedback creation
and public feedback display.

## Auth Requirement

Creating feedback is only available to authenticated users.

Create requests must include the normal student access token:

```http
Authorization: Bearer <access_token>
```

Unauthenticated create requests return `401`.

Public feedback listing and public feedback detail do not require authentication.
They return only feedback where `is_visible` is `true`.

## Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/student/feedback/` | Create feedback |
| `GET` | `/api/v1/student/feedback/` | Public list of visible feedback |
| `GET` | `/api/v1/student/feedback/{feedback_id}/` | Public read for one visible feedback item |
| `GET` | `/api/v1/admin/feedback/` | Admin list of all feedback |
| `PATCH` | `/api/v1/admin/feedback/{feedback_id}/` | Admin visibility toggle |

## Create Feedback

```http
POST /api/v1/student/feedback/
Authorization: Bearer <access_token>
Content-Type: application/json
```

Request body:

```json
{
  "feedback_text": "I would like more detailed explanations after listening tests."
}
```

Successful response: `201 Created`

```json
{
  "id": "7a08b4ec-1cc1-43ff-bc63-03ed091b8e30",
  "feedback_text": "I would like more detailed explanations after listening tests.",
  "is_visible": false,
  "created_at": "2026-05-12T06:30:00Z",
  "updated_at": "2026-05-12T06:30:00Z"
}
```

New feedback is hidden from the public list by default. An admin must approve it
by setting `is_visible` to `true`.

Validation error for empty text: `400 Bad Request`

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "feedback_text": ["Feedback text cannot be empty."]
    }
  }
}
```

## List Feedback

```http
GET /api/v1/student/feedback/
```

Response: `200 OK`

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "7a08b4ec-1cc1-43ff-bc63-03ed091b8e30",
      "feedback_text": "I would like more detailed explanations after listening tests.",
      "is_visible": true,
      "created_at": "2026-05-12T06:30:00Z",
      "updated_at": "2026-05-12T06:30:00Z"
    }
  ]
}
```

Only feedback with `is_visible: true` is returned. This endpoint is safe to call
from public pages.

## Read One Feedback Item

```http
GET /api/v1/student/feedback/{feedback_id}/
```

Response: `200 OK`

```json
{
  "id": "7a08b4ec-1cc1-43ff-bc63-03ed091b8e30",
  "feedback_text": "I would like more detailed explanations after listening tests.",
  "is_visible": true,
  "created_at": "2026-05-12T06:30:00Z",
  "updated_at": "2026-05-12T06:30:00Z"
}
```

If the feedback is hidden or does not exist, the API returns `404`.

## Admin Visibility Toggle

Admins can list all feedback, including hidden feedback:

```http
GET /api/v1/admin/feedback/
Authorization: Bearer <admin_access_token>
```

Admin list response items include user metadata:

```json
{
  "id": "7a08b4ec-1cc1-43ff-bc63-03ed091b8e30",
  "user": "336868b7-21f7-46e2-a5e8-28d190df4a82",
  "user_email": "student@example.com",
  "user_full_name": "Student Name",
  "feedback_text": "I would like more detailed explanations after listening tests.",
  "is_visible": false,
  "created_at": "2026-05-12T06:30:00Z",
  "updated_at": "2026-05-12T06:30:00Z"
}
```

To approve feedback for public display:

```http
PATCH /api/v1/admin/feedback/{feedback_id}/
Authorization: Bearer <admin_access_token>
Content-Type: application/json
```

```json
{
  "is_visible": true
}
```

To hide it again, send `false`.

## Suggested Frontend Flow

1. Show a feedback form only when the user is authenticated.
2. Send only `feedback_text` in the request body.
3. Disable submit while the request is in progress.
4. On `201`, clear the textarea and show a success toast. The submitted feedback
   will not appear publicly until an admin approves it.
5. On `400`, show the `feedback_text` validation message.
6. On `401`, redirect to login or show the normal auth-required state.
7. For public testimonials/feedback sections, call `GET /api/v1/student/feedback/`
   without auth and render the returned `results`.
