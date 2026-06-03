# Frontend Integration Guide — Three Feature Updates

## Overview

Three new features have been added to the IELTS practice test platform:

1. **Practice Test Ordering** — Admin can drag-and-drop reorder tests; student list respects that order
2. **Passage / Part Solving** — Students can solve a single reading passage or listening part from a full test
3. **Practice Test Groups** — Admin creates named groups (e.g., "Cambridge 8") and assigns tests to them

---

## 1. Practice Test Ordering (Drag & Drop)

### What Changed

- Every `PracticeTest` now has a `display_order` integer field (1-based)
- Student test list is ordered by `display_order` ascending by default
- Admin reorders by sending a single POST with the full desired order

### New Admin Endpoint

#### `POST /api/admin/practice-tests/reorder/`

Reorders all practice tests at once. Send the full list of test IDs in the desired order.

**Request:**
```json
{
  "ordered_ids": [
    "uuid-of-test-3",
    "uuid-of-test-1",
    "uuid-of-test-2"
  ]
}
```

**Response:** `200 OK` — Returns the reordered tests with updated `display_order` values.

```json
[
  {
    "id": "uuid-of-test-3",
    "title": "Cambridge Reading Test 3",
    "display_order": 1,
    ...
  },
  ...
]
```

**Error if any ID not found:** `400 Bad Request`
```json
{ "ordered_ids": "One or more practice test IDs not found." }
```

### Updated Practice Test Fields

`display_order` is now included in all practice test responses (admin list, admin detail, student list):

```json
{
  "id": "...",
  "title": "...",
  "display_order": 3,
  ...
}
```

### Student List Ordering

Default ordering is now `display_order` (ascending). The `?ordering=` query param still works:

| Value | Behaviour |
|---|---|
| `display_order` (default) | Admin-defined order |
| `title` | A–Z |
| `-title` | Z–A |
| `created_at` | Oldest first |
| `-created_at` | Newest first |

**Admin Write (Create/Update):** Pass `display_order` optionally. If omitted on create, auto-assigned to `max + 1` (last in list).

---

## 2. Passage / Part Solving

Students can now solve individual reading passages or listening parts from a full test, without needing to do the entire 40-question test. At the end they get full stats but **no IELTS band score**.

### New Student Endpoints

#### `GET /api/student/tests/<test_id>/passages/`

Lists all reading passages for a reading test.

**Response:**
```json
[
  {
    "id": "passage-uuid",
    "passage_number": "PASSAGE_1",
    "title": "The History of Tea",
    "max_questions": 13,
    "difficulty_display": "Intermediate"
  },
  {
    "id": "passage-uuid-2",
    "passage_number": "PASSAGE_2",
    "title": "Urban Migration",
    "max_questions": 13,
    "difficulty_display": "Advanced"
  },
  {
    "id": "passage-uuid-3",
    "passage_number": "PASSAGE_3",
    "title": "Renewable Energy",
    "max_questions": 14,
    "difficulty_display": "Advanced"
  }
]
```

#### `GET /api/student/tests/<test_id>/parts/`

Lists all listening parts for a listening test.

**Response:**
```json
[
  {
    "id": "part-uuid",
    "part_number": "PART_1",
    "title": "Daily Conversation",
    "max_questions": 10,
    "difficulty_display": "Beginner"
  },
  ...
]
```

#### `POST /api/student/passage-attempts/`

Creates a new attempt scoped to a single passage or part. Works exactly like `POST /api/student/attempts/` but scoped.

**Request (reading passage):**
```json
{
  "passage_id": "passage-uuid",
  "mode": "REAL"
}
```

**Request (listening part):**
```json
{
  "part_id": "part-uuid",
  "mode": "REAL"
}
```

> Note: Provide exactly one of `passage_id` or `part_id`.

**Response:** `201 Created` — Same structure as a normal attempt:
```json
{
  "id": "attempt-uuid",
  "practice_test": "test-uuid",
  "practice_test_title": "Cambridge Reading Test 4",
  "scoped_title": "Cambridge Reading Test 4 - Passage 1",
  "scoped_reading_passage_id": "passage-uuid",
  "scoped_listening_part_id": null,
  "test_type": "READING",
  "mode": "REAL",
  "status": "IN_PROGRESS",
  "total_questions": 13,
  "answered_count": 0,
  "reading_passages": [
    { ... only the scoped passage ... }
  ],
  "listening_parts": []
}
```

> If an in-progress scoped attempt already exists for the same passage/part, returns the existing attempt (`200 OK`).

### Updated Attempt Fields

All attempt responses now include:

| Field | Type | Description |
|---|---|---|
| `scoped_reading_passage_id` | UUID or null | Set if this is a single-passage attempt |
| `scoped_listening_part_id` | UUID or null | Set if this is a single-part attempt |
| `scoped_title` | string or null | e.g. `"Cambridge Test 4 - Passage 2"` |

### Existing Attempt Endpoints Work Unchanged

After creating a passage attempt, all standard endpoints work exactly the same:

- `GET /api/student/attempts/<attempt_id>/` — Get attempt (only shows the one scoped passage/part)
- `PATCH /api/student/attempts/<attempt_id>/save/` — Save answers mid-test
- `POST /api/student/attempts/<attempt_id>/submit/` — Submit
- `GET /api/student/attempts/<attempt_id>/review/` — Review answers

### Submit Result — No Band Score

For scoped (passage/part) attempts, `band_score` will be `null` (no IELTS band — not enough questions):

```json
{
  "id": "attempt-uuid",
  "scoped_title": "Cambridge Test 4 - Passage 1",
  "score": 9,
  "band_score": null,
  "total_questions": 13,
  "correct_count": 9,
  "incorrect_count": 3,
  "unanswered_count": 1,
  "question_type_stats_json": { ... },
  "passage_stats_json": { ... }
}
```

> **Important:** `band_score` is now nullable in ALL attempt results. For full-test attempts it remains a decimal string (e.g. `"7.0"`). For scoped attempts it is `null`. Update any code that assumes `band_score` is always present.

---

## 3. Practice Test Groups

Admin can create named groups and assign tests to them. Each test belongs to at most one group.

### New Admin Endpoints

#### `GET /api/admin/practice-test-groups/`

List all groups.

**Response:**
```json
[
  {
    "id": "group-uuid",
    "name": "Cambridge IELTS 8",
    "description": "Official Cambridge IELTS Practice Tests Book 8",
    "is_active": true,
    "test_count": 4,
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z"
  }
]
```

#### `POST /api/admin/practice-test-groups/`

Create a group.

**Request:**
```json
{
  "name": "Cambridge IELTS 9",
  "description": "Book 9 tests"
}
```

#### `GET /api/admin/practice-test-groups/<group_id>/`

Get single group.

#### `PATCH /api/admin/practice-test-groups/<group_id>/`

Update group name/description/is_active.

#### `DELETE /api/admin/practice-test-groups/<group_id>/`

Delete group. All associated tests will have `group` set to `null` (tests are NOT deleted).

### Assigning a Test to a Group

When creating or updating a practice test, include the `group` field (UUID or null):

**`PATCH /api/admin/practice-tests/<test_id>/`**
```json
{
  "group": "group-uuid"
}
```

To remove from group:
```json
{
  "group": null
}
```

### Group Info in Practice Test Responses

All practice test list and detail responses now include `group_id` and `group_name`:

**Admin list (`GET /api/admin/practice-tests/`):**
```json
{
  "id": "test-uuid",
  "title": "Cambridge IELTS 8 – Test 1 Reading",
  "group_id": "group-uuid",
  "group_name": "Cambridge IELTS 8",
  "display_order": 1,
  ...
}
```

If not in a group:
```json
{
  "group_id": null,
  "group_name": null
}
```

**Student list (`GET /api/student/tests/`):**
```json
{
  "id": "test-uuid",
  "title": "...",
  "group_id": "group-uuid",
  "group_name": "Cambridge IELTS 8",
  "display_order": 1,
  ...
}
```

### Filtering Student List by Group

```
GET /api/student/tests/?group_id=<group-uuid>
```

Returns only tests belonging to that group.

---

## Breaking Changes Summary

| Change | Impact |
|---|---|
| `band_score` is now nullable | Update result screens — check for `null` before displaying. For scoped attempts: show "N/A" or hide band score section. |
| Default ordering changed from newest-first to `display_order` | Student test list order now matches admin-configured order. If you were relying on newest-first default, pass `?ordering=-created_at` explicitly. |
| New fields on all practice test responses | `display_order`, `group_id`, `group_name` — safe to ignore if not needed, but add them to your type definitions. |
| New fields on all attempt responses | `scoped_reading_passage_id`, `scoped_listening_part_id`, `scoped_title` — safe to ignore for full-test flow. |

---

## Quick Reference — New Endpoints

| Method | URL | Description |
|---|---|---|
| `POST` | `/api/admin/practice-tests/reorder/` | Bulk reorder tests (drag & drop save) |
| `GET` | `/api/admin/practice-test-groups/` | List all groups |
| `POST` | `/api/admin/practice-test-groups/` | Create group |
| `GET` | `/api/admin/practice-test-groups/<id>/` | Get group |
| `PATCH` | `/api/admin/practice-test-groups/<id>/` | Update group |
| `DELETE` | `/api/admin/practice-test-groups/<id>/` | Delete group |
| `GET` | `/api/student/tests/<test_id>/passages/` | List passages for a test |
| `GET` | `/api/student/tests/<test_id>/parts/` | List parts for a test |
| `POST` | `/api/student/passage-attempts/` | Start scoped passage/part attempt |
