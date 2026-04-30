# Frontend Integration Guide — Mistake Reasons & Advice

> Base URL: `https://<your-backend-domain>`  
> All student endpoints require `Authorization: Bearer <access_token>`  
> All admin endpoints require `Authorization: Bearer <admin_access_token>`

---

## Table of Contents

1. [What Changed — Quick Summary](#1-what-changed--quick-summary)
2. [Mistake Analysis Page — Date Range Filter Fix](#2-mistake-analysis-page--date-range-filter-fix)
3. [Post-Test Flow — Mistake Reasons Panel](#3-post-test-flow--mistake-reasons-panel)
4. [Mistake Analysis Page — 4 Advice Slots](#4-mistake-analysis-page--4-advice-slots)
5. [Admin — Managing Mistake Reasons](#5-admin--managing-mistake-reasons)
6. [Full Response Schemas](#6-full-response-schemas)

---

## 1. What Changed — Quick Summary

| Area | Change |
|---|---|
| Mistake Analysis page | `date_range` filter now works on the chart and stats |
| After test ends | New panel: backend returns full performance-matched reasons and solutions automatically |
| Mistake Analysis page | New section: 4 rotating advice cards (slots 1-4) |
| Admin panel | New CRUD screens for managing Mistake Reason content |

---

## 2. Mistake Analysis Page — Date Range Filter Fix

The "Mistakes by Question Type" chart dropdown was previously decorative. It now filters all data returned by the Review Center endpoint.

### Endpoint

```
GET /api/v1/student/review-center/
```

### Query Parameters

| Param | Values | Description |
|---|---|---|
| `date_range` | `last_7_days` · `last_30_days` · `last_3_months` · `last_6_months` · `last_year` | Filters both chart data and stats to the chosen window. Omit for all-time. |
| `module` | `READING` · `LISTENING` | Filter by module (existing) |
| `reason` | `wrong` · `saved` · `weak_area` · `flagged` | Filter by reason type (existing) |
| `search` | any string | Full-text search (existing) |

### Integration

When the user selects a value from the dropdown, append `?date_range=<value>` to the request. The entire response — including `mistakes_by_type`, `mistakes_by_module`, and `stats` — reflects the chosen window.

```ts
// Example
const fetchMistakeAnalysis = (dateRange: string) =>
  fetch(`/api/v1/student/review-center/?date_range=${dateRange}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(r => r.json());

// Dropdown values to send:
// "Last 7 days"    → last_7_days
// "Last 30 days"   → last_30_days
// "Last 3 months"  → last_3_months
// "Last 6 months"  → last_6_months
// "Last year"      → last_year
```

---

## 3. Post-Test Flow — Mistake Reasons Panel

After a test is submitted and the result screen is shown, display a **"Learn from your mistakes"** panel. The backend now assigns matching reasons automatically, so the frontend only needs to load and render them.

### Load the assigned reasons

Immediately after the test result is available, fetch the reasons for that attempt:

```
GET /api/v1/student/attempts/{attempt_id}/mistake-reasons/
```

- No body required.
- The attempt must already be completed.
- The backend checks every answer from the attempt and detects which mistake categories occurred.
- Returns reasons relevant to the test module (Reading or Listening), plus any "BOTH" reasons, **only for categories that occurred at least once**.
- Returns full reason details, including solutions and file URL.
- The same matched reasons are automatically saved to the student's 4-slot advice store.

Optional category filter:

```
GET /api/v1/student/attempts/{attempt_id}/mistake-reasons/?mistake_category=misspelled
```

Allowed values: `fully_incorrect`, `blank_answer`, `misspelled`.

#### Mistake category logic

| Category | When it appears |
|---|---|
| `fully_incorrect` | At least one answered question is wrong and is not a spelling-near-match |
| `blank_answer` | At least one question was left blank / skipped |
| `misspelled` | At least one text-entry completion answer is close to a correct answer but not exactly correct |

If an attempt has 1+ mistakes in multiple categories, the endpoint returns all matching reasons for all of those categories.

The previous `POST /api/v1/student/mistake-reasons/{reason_id}/select/` endpoint has been removed. Remove any frontend usage of it; do not render a separate "select reason" action.

#### Response

```json
[
  {
    "id": "uuid",
    "reason": "Difficulty identifying True / False / Not Given distinctions",
    "module": "READING",
    "module_display": "Reading",
    "mistake_category": "fully_incorrect",
    "mistake_category_display": "Fully incorrect",
    "solution_1": "Read the statement carefully and locate the relevant section...",
    "solution_2": "A common trap: the passage discusses a related topic...",
    "solution_3": "Practice with timed drills: set 45 seconds per TFNG question...",
    "is_file_consists": false,
    "file_url": null,
    "created_at": "2026-04-29T10:00:00Z",
    "updated_at": "2026-04-29T10:00:00Z"
  },
  {
    "id": "uuid",
    "reason": "Short Answer questions exceed the word limit",
    "module": "READING",
    "module_display": "Reading",
    "mistake_category": "fully_incorrect",
    "mistake_category_display": "Fully incorrect",
    "solution_1": "Always re-read the instruction...",
    "solution_2": "",
    "solution_3": "",
    "is_file_consists": false,
    "file_url": null,
    "created_at": "2026-04-29T10:00:00Z",
    "updated_at": "2026-04-29T10:00:00Z"
  }
]
```

#### UI Suggestion

Render each reason as an expandable card. Show the `reason` text as the title, `mistake_category_display` as a category badge, and reveal `solution_1`, `solution_2`, and `solution_3` inside the card.

#### Notes on solutions

- `solution_1` is always present if the admin filled it in.
- `solution_2` and `solution_3` may be empty strings `""` — check before rendering.
- Display them sequentially (e.g. one paragraph at a time, or all together).
- The "AI streaming" effect is purely a frontend animation — render the text with a typing animation. The backend sends everything at once.

#### Notes on file download

- `is_file_consists: true` means a file is attached.
- `file_url` will be a full absolute URL, e.g. `https://backend.com/media/mistake_reason_files/guide.pdf`.
- Render a **Download** button that opens/downloads this URL directly — no extra API call needed.
- `file_url` is `null` when no file is attached.

#### Advice slot behavior (invisible to user, for your awareness)

Each completed registered-user test automatically saves the matched reasons into the student's advice store:
- Slots 1 → 2 → 3 → 4 → (overwrites oldest) → repeating.
- Re-loading `GET /attempts/{attempt_id}/mistake-reasons/` also backfills the same advice slots without duplicating existing reasons.
- The user never sees or interacts with this directly here — it just means the Mistake Analysis page will always show their most recent matching recommendations.

---

## 4. Mistake Analysis Page — 4 Advice Slots

On the Mistake Analysis page, show a dedicated **"Your Advice"** or **"Recommended for You"** section with up to 4 cards, one per slot.

### Endpoint

```
GET /api/v1/student/mistake-analysis/advice/
```

- No query parameters.
- Returns 0–4 items ordered by slot number (1 to 4).

#### Response

```json
[
  {
    "id": "uuid",
    "slot": 1,
    "updated_at": "2026-04-29T10:05:00Z",
    "reason": {
      "id": "uuid",
      "reason": "Difficulty identifying True / False / Not Given distinctions",
      "module": "READING",
      "module_display": "Reading",
      "solution_1": "Read the statement carefully...",
      "solution_2": "A common trap: the passage discusses...",
      "solution_3": "Practice with timed drills...",
      "is_file_consists": false,
      "file_url": null,
      "created_at": "2026-04-29T10:00:00Z",
      "updated_at": "2026-04-29T10:00:00Z"
    }
  },
  {
    "id": "uuid",
    "slot": 2,
    "updated_at": "2026-04-29T10:10:00Z",
    "reason": { ... }
  }
]
```

#### UI Suggestions

- Show the 4 cards ordered by `slot` (already sorted by the backend).
- Each card shows: `reason.reason` as the title, `reason.module_display` as a badge.
- Expand/collapse on tap to reveal `solution_1`, `solution_2`, `solution_3`.
- If `reason.is_file_consists` is `true`, show a download button linking to `reason.file_url`.
- If fewer than 4 slots are filled (e.g. a new user), show filled slots only — no empty placeholders needed.
- Refresh this section after a test submission or after loading post-test reasons so newly assigned advice appears immediately.

---

## 5. Admin — Managing Mistake Reasons

Admins create and manage the reason+solution content that students see.

### 5.1 List all reasons

```
GET /api/v1/admin/mistake-reasons/
```

Optional filters:

- `?module=READING` or `?module=LISTENING` or `?module=BOTH`
- `?mistake_category=fully_incorrect` or `?mistake_category=blank_answer` or `?mistake_category=misspelled`
- `?category=misspelled` is also accepted as a shorter alias.

#### Response

```json
[
  {
    "id": "uuid",
    "reason": "Difficulty identifying True / False / Not Given distinctions",
    "module": "READING",
    "mistake_category": "fully_incorrect",
    "mistake_category_display": "Fully incorrect",
    "solution_1": "...",
    "solution_2": "...",
    "solution_3": "...",
    "is_file_consists": false,
    "file_url": null,
    "created_at": "2026-04-29T10:00:00Z",
    "updated_at": "2026-04-29T10:00:00Z"
  }
]
```

---

### 5.2 Create a reason (with optional file)

```
POST /api/v1/admin/mistake-reasons/
Content-Type: multipart/form-data
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `reason` | string | Yes | Short label shown to students |
| `module` | string | Yes | `READING` / `LISTENING` / `BOTH` |
| `mistake_category` | string | Yes | `fully_incorrect` / `blank_answer` / `misspelled` |
| `solution_1` | string | No | First solution paragraph |
| `solution_2` | string | No | Second solution paragraph |
| `solution_3` | string | No | Third solution paragraph |
| `is_file_consists` | boolean | No | Set `true` if uploading a file |
| `file` | file | Conditional | Required if `is_file_consists` is `true` |

**If no file:** send as `application/json` (omit `file` and `is_file_consists`).  
**If file included:** must use `multipart/form-data`.

#### Category selector

Show a required selector named `mistake_category` in the admin create/edit form:

| Label | Value |
|---|---|
| Fully incorrect | `fully_incorrect` |
| Blank answer | `blank_answer` |
| Misspelled | `misspelled` |

#### Response — 201 Created

```json
{
  "id": "uuid",
  "reason": "...",
  "module": "READING",
  "mistake_category": "fully_incorrect",
  "mistake_category_display": "Fully incorrect",
  "solution_1": "...",
  "solution_2": "",
  "solution_3": "",
  "is_file_consists": true,
  "file_url": "https://backend.com/media/mistake_reason_files/guide.pdf",
  "created_at": "2026-04-29T10:00:00Z",
  "updated_at": "2026-04-29T10:00:00Z"
}
```

---

### 5.3 Get single reason

```
GET /api/v1/admin/mistake-reasons/{reason_id}/
```

Returns the same shape as a single item from the list.

---

### 5.4 Update a reason (partial)

```
PATCH /api/v1/admin/mistake-reasons/{reason_id}/
Content-Type: multipart/form-data   (if updating file)
Content-Type: application/json      (if no file change)
```

Send only the fields you want to change. All fields are optional on PATCH.

To **replace** an existing file: send a new `file` in `multipart/form-data`.  
To **remove** a file: set `is_file_consists: false` (and omit `file`).

#### Response — 200 OK

Returns the full updated object.

---

### 5.5 Delete a reason

```
DELETE /api/v1/admin/mistake-reasons/{reason_id}/
```

- Returns `204 No Content`.
- The attached file (if any) is also deleted from storage automatically.

---

## 6. Full Response Schemas

### MistakeReasonDetail — returned after test + in advice slots

```ts
interface MistakeReasonDetail {
  id: string;
  reason: string;
  module: "READING" | "LISTENING" | "BOTH";
  module_display: string;
  mistake_category: "fully_incorrect" | "blank_answer" | "misspelled";
  mistake_category_display: string;
  solution_1: string;   // may be ""
  solution_2: string;   // may be ""
  solution_3: string;   // may be ""
  is_file_consists: boolean;
  file_url: string | null;  // absolute URL, null if no file
  created_at: string;   // ISO 8601
  updated_at: string;
}
```

### StudentMistakeAdvice — used in advice slots list

```ts
interface StudentMistakeAdvice {
  id: string;
  slot: 1 | 2 | 3 | 4;
  updated_at: string;   // when this slot was last saved
  reason: MistakeReasonDetail;
}
```

---

## Summary of All New Endpoints

| Method | URL | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/student/review-center/?date_range=last_3_months` | Student | Mistake Analysis page with date filter |
| `GET` | `/api/v1/student/attempts/{id}/mistake-reasons/` | Student | Load full category-matched reasons after a test; also auto-saves advice |
| `GET` | `/api/v1/student/mistake-analysis/advice/` | Student | Load 4 advice cards for Mistake Analysis page |
| `GET` | `/api/v1/admin/mistake-reasons/` | Admin | List all reasons; supports `module` and `mistake_category` filters |
| `POST` | `/api/v1/admin/mistake-reasons/` | Admin | Create reason (JSON or multipart) |
| `GET` | `/api/v1/admin/mistake-reasons/{id}/` | Admin | Get single reason |
| `PATCH` | `/api/v1/admin/mistake-reasons/{id}/` | Admin | Update reason (partial) |
| `DELETE` | `/api/v1/admin/mistake-reasons/{id}/` | Admin | Delete reason + file |
