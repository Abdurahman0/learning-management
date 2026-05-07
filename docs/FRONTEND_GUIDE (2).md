# Frontend API Integration Guide — IELTS Master

This document is the single source of truth for how the frontend should interact
with the backend during a test session. It covers the correct request flow,
what to avoid, and the exact contract for each endpoint used in the test lifecycle.

---

## Table of Contents

1. [Critical Mistakes to Fix](#1-critical-mistakes-to-fix)
2. [Correct Reading Test Flow](#2-correct-reading-test-flow)
3. [Correct Listening Test Flow](#3-correct-listening-test-flow)
4. [Autosave Strategy](#4-autosave-strategy)
5. [Submit Flow](#5-submit-flow)
6. [Result & Review Flow](#6-result--review-flow)
7. [Guest Flow & Sync](#7-guest-flow--sync)
8. [Auth Error Handling](#8-auth-error-handling)
9. [Endpoint Reference](#9-endpoint-reference)
10. [Question ID Reference](#10-question-id-reference)

---

## 1. Critical Mistakes to Fix

These are the highest-priority bugs in the current frontend implementation.
Fix these first — they are responsible for the majority of the slowness.

---

### 1.1 — Remove the GET before every PATCH /save/

**Current (wrong):**
```
Every autosave:
  GET  /api/student-proxy/attempts/{id}/       ← REMOVE THIS
  PATCH /api/student-proxy/attempts/{id}/save/
```

**Correct:**
```
Every autosave:
  PATCH /api/student-proxy/attempts/{id}/save/
```

**Why this is wrong:**
The GET is used to "refresh attempt-scoped question ids" (the `attempt_question_id`
mapping). But these IDs are `QuestionAnswer` record IDs — they are assigned once
when the attempt is created and **never change during the test**. The frontend
already has them from the initial `POST /attempts/` response.

Storing the `attempt_question_id` for each question in local state and never
re-fetching it eliminates ~50% of all backend requests during a test.

**What to do:**
When the attempt is first created (or loaded), store a local map:
```js
// Build once from POST /attempts/ response, never re-fetch
const attemptQuestionIdMap = {}  // { questionId: attemptQuestionId }

for (const passage of attemptData.reading_passages ?? []) {
  for (const group of passage.question_groups) {
    for (const question of group.questions) {
      attemptQuestionIdMap[question.question_id] = question.attempt_question_id
    }
  }
}
// Same for listening_parts
```

Use this map when building the PATCH /save/ payload. Never re-fetch `GET /attempts/{id}/`
during an active test session for this purpose.

---

### 1.2 — Increase autosave debounce from 900ms to at least 3000ms

**Current:** 900ms debounce after each answer/flag change
**Correct:** 3000ms (3 seconds) minimum, 5000ms (5 seconds) recommended

At 900ms, a student answering multiple questions in quick succession triggers
a server round-trip before they have even moved to the next question. 3 seconds
still feels immediate but reduces backend load by 3–5×.

The 30-second periodic save is fine to keep, but remove the GET before it too.

---

### 1.3 — Fix the Reading submit flow (3 calls → 1 call)

**Current (wrong):**
```
Submit button clicked:
  GET  /api/student-proxy/attempts/{id}/        ← unnecessary
  PATCH /api/student-proxy/attempts/{id}/save/  ← redundant
  POST  /api/student-proxy/attempts/{id}/submit/ with answers: []
```

**Correct:**
```
Submit button clicked:
  POST /api/student-proxy/attempts/{id}/submit/ with all current answers included
```

The `POST /submit/` endpoint accepts a full `answers` array. Send all current
answers directly in the submit call. The backend handles saving and scoring in
one transaction. Skip the pre-save GET and PATCH entirely.

---

### 1.4 — Add periodic autosave for Listening

Currently listening has **zero backend saves** during the test. If the browser
crashes or the tab is closed, the entire listening session is lost.

Fix: add a 60-second periodic PATCH /save/ during a listening test (same endpoint
and payload as reading). The backend already fully supports it.

---

## 2. Correct Reading Test Flow

### Step 1 — Open test page (registered user)

```
GET /api/student-proxy/tests/reading/?page=1&page_size=100
POST /api/student-proxy/attempts/
  Body: { "practice_test": "<testId>", "mode": "PRACTICE" | "REAL" }
```

The POST response includes the full attempt structure with `reading_passages`,
`question_groups`, and `questions`. Each question has:
- `question_id` — the stable Question UUID
- `attempt_question_id` — the QuestionAnswer UUID (store this, never re-fetch)
- `candidate_question_ids` — list containing both IDs

**Important:** If POST returns status `200` (not `201`), an existing IN_PROGRESS
attempt was found and returned. Use it directly — do not call GET again.

Optionally call `GET /api/student-proxy/attempts/{id}/` once only if the POST
response is genuinely missing question data (should not happen normally).

---

### Step 2 — Answer questions (no API call)

All answer state lives in `localStorage`. Backend autosave happens on debounce.

---

### Step 3 — Autosave (PATCH /save/ only)

```
PATCH /api/student-proxy/attempts/{id}/save/
Body:
{
  "time_used_seconds": 240,
  "answers": [
    {
      "question_id": "<questionId>",
      "attempt_question_id": "<attemptQuestionId>",
      "answer": { ... },
      "is_flagged": false,
      "time_spent_seconds": 45
    }
  ]
}
```

Response:
```json
{
  "answered": 12,
  "total": 40,
  "time_used_seconds": 240
}
```

Send only answers that have changed since the last save (dirty set).
Do not re-send all 40 answers on every autosave.

---

### Step 4 — Submit

```
POST /api/student-proxy/attempts/{id}/submit/
Body:
{
  "time_used_seconds": 3600,
  "answers": [ ... all 40 answers, including null for unanswered ... ]
}
```

Response: full result object with score, band_score, question_type_stats_json.
Navigate to result page using `attempt.id` from this response.

---

## 3. Correct Listening Test Flow

### Step 1 — Open test page

```
GET /api/student-proxy/tests/listening/?page=1&page_size=100
POST /api/student-proxy/attempts/
  Body: { "practice_test": "<testId>", "mode": "PRACTICE" | "REAL" }
```

**Bug to fix:** The current frontend always sends `"mode": "PRACTICE"` on initial
load even when the user chooses REAL mode later. The `mode` should match what the
user actually selected before clicking Start.

---

### Step 2 — During test (add autosave — currently missing)

```
Every 60 seconds:
PATCH /api/student-proxy/attempts/{id}/save/
  Body: { "time_used_seconds": 120, "answers": [ ... changed answers ... ] }
```

This protects against browser crashes and tab closes.

---

### Step 3 — Submit

```
POST /api/student-proxy/attempts/{id}/submit/
Body:
{
  "time_used_seconds": 2400,
  "answers": [ ... all current answers ... ]
}
```

This is the only call needed at submit time.

---

## 4. Autosave Strategy

### When to trigger a save

| Trigger | Debounce |
|---|---|
| Answer changes | 3s debounce |
| Flag (mark/unmark) changes | 3s debounce |
| Every 60 seconds | Force-save (no debounce) |
| Tab becomes hidden (`visibilitychange`) | Force-save immediately |
| `beforeunload` event | Sync save via `navigator.sendBeacon` |

### What to include in the payload

Only send answers that are dirty (changed since last successful save).
Maintain a `dirtySet` in state and clear it on each 2xx response.

```js
async function autosave() {
  const dirtyAnswers = [...dirtySet].map(qid => ({
    question_id: qid,
    attempt_question_id: attemptQuestionIdMap[qid],
    answer: currentAnswers[qid] ?? null,
    is_flagged: flaggedSet.has(qid),
  }))

  if (dirtyAnswers.length === 0 && !timeChanged) return

  const res = await patchSave({
    time_used_seconds: elapsedSeconds,
    answers: dirtyAnswers,
  })
  if (res.ok) {
    dirtySet.clear()
    timeChanged = false
  }
}
```

### Error recovery for stale question IDs

If PATCH /save/ returns 400 with errors like:
```json
{ "answers": { "<qid>": { "question_id": ["Question does not belong to this attempt."] } } }
```

Do this **once**:
1. Call `GET /attempts/{id}/` to refresh the ID mapping
2. Update `attemptQuestionIdMap` for the affected questions only
3. Retry the PATCH once with the corrected IDs

This is a rare edge case (e.g. attempt was re-created after an empty-attempt recovery).
Do not loop — if the retry also fails, drop those answers from the current save and
log the error.

---

## 5. Submit Flow

### Reading submit payload

```json
{
  "time_used_seconds": 3600,
  "answers": [
    {
      "question_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "attempt_question_id": "7c4d2e5a-...",
      "answer": { "value": "TRUE" },
      "is_flagged": false
    },
    {
      "question_id": "...",
      "attempt_question_id": "...",
      "answer": null,
      "is_flagged": false
    }
  ]
}
```

Include all questions. For unanswered questions send `"answer": null`.

### Listening submit payload

Identical structure to reading.

### Recovery: if no backend attempt exists at submit time

```
POST /api/student-proxy/attempts/
  Body: { "practice_test": "<testId>", "mode": "<mode>" }

POST /api/student-proxy/attempts/{newAttemptId}/submit/
  Body: { "time_used_seconds": ..., "answers": [...all answers...] }
```

### After a successful submit

1. Save result snapshot to `localStorage` keyed by `attemptId`
2. Navigate to: `/{locale}/{type}/{testId}/result?attempt={backendAttemptId}`

---

## 6. Result & Review Flow

### Result page — all three calls in parallel

```
Promise.all([
  GET /api/student-proxy/attempts/{id}/review/,
  GET /api/student-proxy/attempts/{id}/,
  GET /api/student-proxy/attempts/{id}/mistake-reasons/,
])
```

These are independent reads. Fire them simultaneously, not sequentially.

### AI Analysis — select mistake reasons

```
POST /api/student-proxy/attempts/{id}/mistake-reasons/select/
Body: { "reason_ids": ["<uuid>", "<uuid>"] }
```

**Response 200:** AI allowed, returns full reason/solution detail.
**Response 403:** Weekly quota exceeded. Show the `usage_status` from the
response body to tell the user when the quota resets.

### Review mode (re-open completed test)

Route: `/{locale}/{type}/{testId}?review=1&attempt={backendAttemptId}`

```
GET /api/student-proxy/tests/{type}/?page=1&page_size=100
GET /api/student-proxy/attempts/{id}/
GET /api/student-proxy/attempts/{id}/review/
```

**Do not** call `POST /attempts/` in review mode. Check for `review=1` in the URL
before any attempt creation logic runs.

---

## 7. Guest Flow & Sync

### Open test as guest

```
GET /api/public/tests/{type}?page_size=100
POST /api/public/attempts
  Body: { "practice_test": "<testId>", "mode": "PRACTICE" }
```

Response includes `attempt_access_token`. Store it in memory/session for the
duration of the test. Send it as a header on all subsequent calls to this attempt:
```
X-Attempt-Access-Token: <token>
```

### During test

Save to `localStorage` only. No backend calls.

### At submit

Save result to `localStorage`. Add to a sync queue:
```js
// localStorage key: "guest_sync_queue"
[
  {
    practice_test_id: "...",
    mode: "PRACTICE",
    time_used_seconds: 1200,
    answers: [...],
    completed_at: "2026-05-07T10:30:00Z"
  }
]
```

### After login — drain the sync queue

For each item in the queue:
```
POST /api/student-proxy/attempts/
  Body: { "practice_test": "<id>", "mode": "<mode>" }

POST /api/student-proxy/attempts/{newAttemptId}/submit/
  Body: { "time_used_seconds": ..., "answers": [...] }
```

Remove the item from the queue after a successful submit.
If submit fails, keep it in the queue for the next login.

---

## 8. Auth Error Handling

Implement a single global HTTP interceptor (not per-request logic).

```
On any /api/student-proxy/* request returning 401:
  POST /api/auth/token/refresh
    → On 200: update stored access token, retry original request once
    → On 401: POST /api/auth/logout, clear tokens, redirect to /login
```

**Never retry more than once.** If the retried request also returns 401, log out.

---

## 9. Endpoint Reference

### Student proxy (requires JWT auth)

| Method | Path | When to call |
|---|---|---|
| GET | `/api/student-proxy/tests/reading/` | Test list page |
| GET | `/api/student-proxy/tests/listening/` | Test list page |
| POST | `/api/student-proxy/attempts/` | Start a new test |
| GET | `/api/student-proxy/attempts/{id}/` | Only when POST doesn't return question data, or in review mode |
| PATCH | `/api/student-proxy/attempts/{id}/save/` | Autosave (debounced + periodic) |
| POST | `/api/student-proxy/attempts/{id}/submit/` | Submit test |
| GET | `/api/student-proxy/attempts/{id}/review/` | Result page |
| GET | `/api/student-proxy/attempts/{id}/mistake-reasons/` | Result page (parallel) |
| POST | `/api/student-proxy/attempts/{id}/mistake-reasons/select/` | User clicks AI Analysis |

### Public (no auth)

| Method | Path | When to call |
|---|---|---|
| GET | `/api/public/tests/reading` | Guest test list |
| GET | `/api/public/tests/listening` | Guest test list |
| POST | `/api/public/attempts` | Guest starts test |

### Auth

| Method | Path | When |
|---|---|---|
| POST | `/api/auth/token/refresh` | Interceptor on 401 |
| POST | `/api/auth/logout` | Refresh fails or explicit logout |

---

## 10. Question ID Reference

Two IDs exist per question. Both are returned in the `POST /attempts/` response
and **neither changes during the test**.

| Field | What it is | Source |
|---|---|---|
| `question_id` | The `Question` model's primary key | Database — permanent |
| `attempt_question_id` | The `QuestionAnswer` record's PK tied to this attempt | Created at attempt start — fixed |

### Building the local ID map

```js
function buildIdMap(attemptData) {
  const map = {}  // { questionId: attemptQuestionId }
  const sections = [
    ...(attemptData.reading_passages ?? []),
    ...(attemptData.listening_parts ?? []),
  ]
  for (const section of sections) {
    for (const group of section.question_groups ?? []) {
      for (const question of group.questions ?? []) {
        if (question.question_id && question.attempt_question_id) {
          map[question.question_id] = question.attempt_question_id
        }
      }
    }
  }
  return map
}
```

Call `buildIdMap()` once when the attempt loads. Persist it in component/store
state for the lifetime of the test. Do not re-build it from a GET call.

### Sending answers

Always include both IDs:
```json
{
  "question_id": "<question_id>",
  "attempt_question_id": "<attempt_question_id>",
  "answer": { "value": "B" },
  "is_flagged": false
}
```

For unanswered questions:
```json
{
  "question_id": "<question_id>",
  "attempt_question_id": "<attempt_question_id>",
  "answer": null,
  "is_flagged": false
}
```

---

## Summary: Correct Request Counts

### Reading registered — 60-minute test, 40 questions

| Operation | Wrong (current) | Correct |
|---|---|---|
| Open test | 2–3 calls | 1–2 calls |
| Autosave per change (×~40 triggers) | 2 calls each = **80** | 1 call each = **40** |
| 30-second heartbeats (×~120) | 2 calls each = **240** | 1 call each = **120** |
| Submit | 3 calls | 1 call |
| Result page | 3 parallel calls | 3 parallel calls |
| **Total** | **~330** | **~165** |

Even at the conservative estimate, the correct flow is **2× fewer calls**.
With the debounce increased to 3–5s, autosave triggers drop by another 3–5×,
putting the total at **~50–60 calls** for the same session — a **5–6× reduction**.

### Listening registered — same session

| Operation | Wrong (current) | Correct |
|---|---|---|
| Open test | 2–3 calls | 1–2 calls |
| During test | 0 backend calls | 1 PATCH per 60s (~40 total) |
| Submit | 1 call | 1 call |
| Result page | 2 parallel calls | 2 parallel calls |
