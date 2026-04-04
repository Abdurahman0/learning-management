# IELTS Master — Admin API Guide

Backend reference for the admin-facing REST API used to manage IELTS Master Reading and Listening content, users, dashboard metrics, analytics, and the reusable Content Bank.

## Base URL

```text
http://localhost:8000/api/v1/admin/
```

Swagger UI:

```text
http://localhost:8000/api/schema/swagger-ui/
```

All `/api/v1/admin/` endpoints require:

| Header | Value |
|---|---|
| `Authorization` | `Bearer <access_token>` |
| `Accept` | `application/json` |
| `Content-Type` | `application/json` |

Only staff users (`is_staff=true`) can access admin endpoints.

## Scope Rules

- Supported modules: `READING`, `LISTENING`
- Supported difficulties: `BEGINNER`, `INTERMEDIATE`, `ADVANCED`
- Supported content sources: `CUSTOM_PRACTICE`, `CAMBRIDGE`
- No Speaking/Writing data is returned from the new admin dashboard and analytics endpoints
- No payment/subscription endpoints were added for the new admin backend work

## Authentication

Log in through the auth API and reuse the access token for admin requests.

```http
POST /api/auth/login/
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "SecurePass123"
}
```

## Endpoint Map

### Overview

| Area | Method | URL |
|---|---|---|
| Dashboard | `GET` | `/api/v1/admin/dashboard/` |
| Analytics | `GET` | `/api/v1/admin/analytics/` |
| Admin users | `GET, POST` | `/api/v1/admin/users/` |
| Admin users | `GET, PATCH, DELETE` | `/api/v1/admin/users/<uuid>/` |
| Reset password | `POST` | `/api/v1/admin/users/<uuid>/reset-password/` |
| Send message | `POST` | `/api/v1/admin/users/<uuid>/send-message/` |
| Content Bank passages | `GET, POST` | `/api/v1/admin/content-bank/passages/` |
| Content Bank passages | `GET, PATCH, DELETE` | `/api/v1/admin/content-bank/passages/<module>/<uuid>/` |
| Attach bank content to test | `POST` | `/api/v1/admin/content-bank/passages/<module>/<uuid>/attach/` |
| Content Bank variant sets | `GET, POST` | `/api/v1/admin/content-bank/variant-sets/` |
| Content Bank variant sets | `GET, PATCH, DELETE` | `/api/v1/admin/content-bank/variant-sets/<uuid>/` |
| Practice tests | `GET, POST` | `/api/v1/admin/practice-tests/` |
| Practice tests | `GET, PATCH, PUT, DELETE` | `/api/v1/admin/practice-tests/<uuid>/` |
| Practice test import | `POST` | `/api/v1/admin/practice-tests/import/` |
| Listening parts | `GET, POST` | `/api/v1/admin/practice-tests/<test_id>/listening-parts/` |
| Listening part detail | `GET, PATCH, PUT, DELETE` | `/api/v1/admin/listening-parts/<uuid>/` |
| Reading passages | `GET, POST` | `/api/v1/admin/practice-tests/<test_id>/reading-passages/` |
| Reading passage detail | `GET, PATCH, PUT, DELETE` | `/api/v1/admin/reading-passages/<uuid>/` |
| Question groups | `GET, POST` | `/api/v1/admin/question-groups/` |
| Question groups | `GET, PATCH, PUT, DELETE` | `/api/v1/admin/question-groups/<uuid>/` |
| Questions | `GET, POST` | `/api/v1/admin/questions/` |
| Questions | `GET, PATCH, PUT, DELETE` | `/api/v1/admin/questions/<uuid>/` |
| Bulk create questions | `POST` | `/api/v1/admin/question-groups/<group_id>/questions/bulk/` |

### Legacy Compatibility

The older auth-based admin-user routes still exist:

- `GET, POST /api/auth/admin/users/`
- `GET, PATCH, DELETE /api/auth/admin/users/<uuid>/`

They remain available for backward compatibility, but `DELETE` now performs soft deactivation (`is_active=false`) instead of hard deletion.

## Content Model Changes

### Reusable Content Bank

`ReadingPassage` and `ListeningPart` now support both:

1. test-attached content (`practice_test` set, numbered passage/part)
2. reusable bank content (`practice_test=null`, `passage_number/part_number=null`)

Both models now store:

- `difficulty_level`
- `topic`
- `source`
- `preview_text`
- `estimated_time_minutes`
- `bank_origin`

### Question Variant Sets

`QuestionVariantSet` is the new variant layer for grouped question sets.

- exactly one parent: `reading_passage` or `listening_part`
- statuses: `DRAFT`, `PUBLISHED`, `USED`
- tracks `origin_variant_set` when a bank variant is cloned into a real practice test

`QuestionGroup` accepts an optional `variant_set`.

Manual question-group creation must include exactly one identifier:

```json
{
  "reading_passage": "<uuid>",
  "question_type": "TFNG",
  "...": "..."
}
```

Or you can create a question group from a variant set directly:

```json
{
  "variant_set": "<uuid>",
  "question_type": "TFNG",
  "...": "..."
}
```

## Dashboard API

### `GET /api/v1/admin/dashboard/`

Returns the backend payload for the admin dashboard.

```json
{
  "metrics": {
    "total_users": 120,
    "tests_completed": 980,
    "active_users": 45
  },
  "user_growth": [
    { "date": "2026-03-04", "new_users": 3, "total_users": 81 }
  ],
  "tests_completed_series": [
    { "date": "2026-03-20", "tests_completed": 17 }
  ],
  "platform_insights": {
    "average_score": 6.8,
    "hardest_question_types": [
      { "question_type": "MATCHING_HEADINGS", "accuracy_percent": 58, "attempts": 120 }
    ]
  },
  "recent_user_activity": [
    {
      "attempt_id": "uuid",
      "user_id": "uuid",
      "user_name": "Ali Karimov",
      "email": "ali@example.com",
      "test_title": "Cambridge 18 Reading Test 1",
      "module": "READING",
      "status": "COMPLETED",
      "score": 31,
      "band_score": 7.0,
      "timestamp": "2026-04-02T08:00:00Z"
    }
  ]
}
```

## Analytics API

### `GET /api/v1/admin/analytics/`

Optional query params:

| Param | Values |
|---|---|
| `module` | `READING`, `LISTENING` |
| `date_from` | `YYYY-MM-DD` |
| `date_to` | `YYYY-MM-DD` |
| `difficulty` | `BEGINNER`, `INTERMEDIATE`, `ADVANCED` |
| `source` | `CUSTOM_PRACTICE`, `CAMBRIDGE` |

Example:

```text
GET /api/v1/admin/analytics/?module=READING&difficulty=INTERMEDIATE&source=CAMBRIDGE
```

Response shape:

```json
{
  "metrics": {
    "total_completed_attempts": 340,
    "average_reading_band": 6.7,
    "average_listening_band": 0.0,
    "active_students": 28
  },
  "student_score_trend": [
    {
      "week_start": "2026-01-12",
      "week_end": "2026-01-18",
      "reading_band": 6.4,
      "listening_band": 0.0
    }
  ],
  "tests_per_day": [
    { "date": "2026-03-20", "tests_completed": 12 }
  ],
  "question_type_accuracy": [
    { "question_type": "TFNG", "attempts": 75, "accuracy_percent": 61 }
  ],
  "skill_distribution": {
    "reading": 6.7,
    "listening": 6.9
  },
  "hardest_questions": [
    {
      "question_id": "uuid",
      "question_label": "Question 7",
      "question_type": "MATCHING_HEADINGS",
      "module": "READING",
      "parent_title": "Solar Power",
      "attempts": 12,
      "accuracy_percent": 42
    }
  ],
  "passage_performance": [
    {
      "content_id": "uuid",
      "module": "READING",
      "title": "Solar Power",
      "attempts": 88,
      "accuracy_percent": 63
    }
  ],
  "insights": [
    "Listening trails reading and should be the next optimization focus."
  ]
}
```

## Admin Users API

### `GET /api/v1/admin/users/`

Supported query params:

| Param | Values |
|---|---|
| `role` | `STUDENT`, `ADMIN`, `ALL` |
| `status` | `ACTIVE`, `INACTIVE` |
| `search` | name or email fragment |
| `ordering` | `date_joined`, `-date_joined`, `full_name`, `-full_name`, `overall_band`, `-overall_band`, `tests_completed`, `-tests_completed`, `last_activity_at`, `-last_activity_at` |

The response is paginated and includes top metrics.

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "full_name": "Ali Karimov",
      "email": "ali@example.com",
      "is_active": true,
      "is_staff": false,
      "date_joined": "2026-03-25T10:00:00Z",
      "role": "STUDENT",
      "target_band": "7.5",
      "overall_band": "6.8",
      "reading_band": "6.5",
      "listening_band": "7.0",
      "tests_completed": 2,
      "last_activity_at": "2026-04-02T08:00:00Z"
    }
  ],
  "metrics": {
    "total_users": 1,
    "active_today": 1,
    "new_this_month": 1
  }
}
```

### `POST /api/v1/admin/users/`

Same create payload as the auth admin endpoint:

```json
{
  "full_name": "New Student",
  "email": "student@example.com",
  "password": "SecurePass123",
  "is_active": true,
  "is_staff": false
}
```

### `GET /api/v1/admin/users/<uuid>/`

Returns the user-detail payload used by the admin detail panel:

- overall band
- target band
- module performance for Reading and Listening
- band progression timeline
- weak areas
- recent attempts

### `PATCH /api/v1/admin/users/<uuid>/`

Supports:

- `full_name`
- `email`
- `password`
- `is_active`
- `is_staff`

Admins cannot deactivate themselves or remove their own staff access.

### `DELETE /api/v1/admin/users/<uuid>/`

Soft delete only:

- sets `is_active=false`
- returns `204 No Content`

### `POST /api/v1/admin/users/<uuid>/reset-password/`

```json
{
  "new_password": "BetterPass123"
}
```

### `POST /api/v1/admin/users/<uuid>/send-message/`

```json
{
  "subject": "Progress Update",
  "message": "Keep going with your Reading and Listening practice."
}
```

Uses Django’s configured email backend.

## Content Bank API

### `GET /api/v1/admin/content-bank/passages/`

Supported query params:

| Param | Values |
|---|---|
| `module` | `READING`, `LISTENING` |
| `difficulty` | `BEGINNER`, `INTERMEDIATE`, `ADVANCED` |
| `topic` | partial topic match |
| `source` | `CUSTOM_PRACTICE`, `CAMBRIDGE` |
| `status` | `ACTIVE`, `ARCHIVED` |
| `search` | title/topic/preview fragment |
| `ordering` | `created_at`, `-created_at`, `updated_at`, `-updated_at`, `title`, `-title`, `difficulty_level`, `-difficulty_level`, `variants_count`, `-variants_count`, `used_in_tests_count`, `-used_in_tests_count` |

List item shape:

```json
{
  "id": "uuid",
  "module": "READING",
  "title": "The Future of Solar Design",
  "difficulty_level": "INTERMEDIATE",
  "difficulty_display": "Intermediate",
  "topic": "Architecture",
  "source": "CAMBRIDGE",
  "source_display": "Cambridge",
  "variants_count": 2,
  "used_in_tests_count": 5,
  "is_active": true,
  "created_at": "2026-04-02T09:00:00Z",
  "updated_at": "2026-04-02T09:00:00Z"
}
```

### `POST /api/v1/admin/content-bank/passages/`

Unified create payload:

```json
{
  "module": "READING",
  "title": "The Future of Solar Design",
  "difficulty_level": "INTERMEDIATE",
  "topic": "Architecture",
  "source": "CAMBRIDGE",
  "full_text": "Solar architecture combines passive design with modern materials.",
  "estimated_time_minutes": 18,
  "is_active": true
}
```

For listening bank items, change `module` to `LISTENING` and pass transcript text through `full_text`.

### `GET /api/v1/admin/content-bank/passages/<module>/<uuid>/`

Detail response includes:

- preview text
- full text
- computed `word_count`
- `estimated_time_label`
- `variant_sets`
- `used_in_tests_count`

### `PATCH /api/v1/admin/content-bank/passages/<module>/<uuid>/`

Uses the same payload shape as create.

### `DELETE /api/v1/admin/content-bank/passages/<module>/<uuid>/`

Soft archive only:

- sets `is_active=false`
- returns `204 No Content`

### `GET /api/v1/admin/content-bank/variant-sets/`

Supported query params:

| Param | Values |
|---|---|
| `module` | `READING`, `LISTENING` |
| `status` | `DRAFT`, `PUBLISHED`, `USED` |
| `is_active` | `true`, `false` |
| `search` | variant-set name or parent title |
| `ordering` | `name`, `-name`, `created_at`, `-created_at`, `used_in_tests_count`, `-used_in_tests_count` |

### `POST /api/v1/admin/content-bank/variant-sets/`

```json
{
  "reading_passage": "<uuid>",
  "name": "Variant Set A",
  "status": "PUBLISHED",
  "is_active": true
}
```

For listening bank items use `listening_part` instead.

### `PATCH /api/v1/admin/content-bank/variant-sets/<uuid>/`

Supports:

- `name`
- `status`
- `is_active`

Parent reassignment is allowed only to other bank items.

### `DELETE /api/v1/admin/content-bank/variant-sets/<uuid>/`

Soft archive only:

- sets `is_active=false`
- returns `204 No Content`

### `POST /api/v1/admin/content-bank/passages/<module>/<uuid>/attach/`

Clones a reusable bank item plus one selected variant set into an actual practice test.

```json
{
  "practice_test": "<reading_or_listening_test_uuid>",
  "variant_set": "<variant_set_uuid>"
}
```

Rules:

- test type must match the content module
- only bank items (`practice_test=null`) can be attached
- the selected variant set must belong to the selected bank item
- the next available `passage_number` or `part_number` is auto-assigned
- cloned content stores `bank_origin`
- cloned variant sets store `origin_variant_set`

## Practice Test CRUD

The original IELTS content CRUD endpoints still exist and now include the new metadata fields on `ReadingPassage` and `ListeningPart`.

### Practice Tests

`GET/POST /api/v1/admin/practice-tests/`

`GET/PATCH/PUT/DELETE /api/v1/admin/practice-tests/<uuid>/`

`DELETE` soft-deletes by default (`is_active=false`). Add `?hard=true` for permanent deletion.

### One-Shot Import

`POST /api/v1/admin/practice-tests/import/`

The import flow now auto-creates a default `Variant Set A` for each imported listening part or reading passage and attaches imported question groups to it.

### Listening Parts and Reading Passages

Nested routes still create test-attached content only:

- `GET, POST /api/v1/admin/practice-tests/<test_id>/listening-parts/`
- `GET, PATCH, PUT, DELETE /api/v1/admin/listening-parts/<uuid>/`
- `GET, POST /api/v1/admin/practice-tests/<test_id>/reading-passages/`
- `GET, PATCH, PUT, DELETE /api/v1/admin/reading-passages/<uuid>/`

These routes are still strict:

- listening parts require a `LISTENING` practice test
- reading passages require a `READING` practice test

## Question Groups and Questions

### `GET, POST /api/v1/admin/question-groups/`

Create requests must provide exactly one of `listening_part`, `reading_passage`, or `variant_set`.

Example:

```json
{
  "reading_passage": "<uuid>",
  "question_type": "TFNG",
  "group_order": 1,
  "instructions": "Do the following statements agree with the information given in the reading passage?",
  "question_number_start": 1,
  "question_number_end": 5,
  "group_content_json": null,
  "is_active": true
}
```

### `GET, POST /api/v1/admin/questions/`

Unchanged question payload shape.

### `POST /api/v1/admin/question-groups/<group_id>/questions/bulk/`

Unchanged bulk-create payload shape.

## Error Format

All `/api/v1/` endpoints use the wrapped error shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation error.",
    "details": {
      "field_name": "Error message"
    }
  }
}
```

Common codes:

| HTTP | Code |
|---|---|
| `400` | `VALIDATION_ERROR` |
| `401` | `AUTHENTICATION_ERROR` |
| `403` | `PERMISSION_DENIED` |
| `404` | `NOT_FOUND` |
| `409` | `CONFLICT` |

## Postman

Import `ielts_master_admin.postman_collection.json`.

The updated collection now includes folders for:

- `Dashboard`
- `Users`
- `Analytics`
- `Content Bank`

New collection variables:

- `user_id`
- `content_bank_passage_id`
- `variant_set_id`

Existing manual question-group requests can now use either `listening_part`, `reading_passage`, or `variant_set`.
