# Marathon Test Integration Guide (Frontend)

This document explains how the **Marathon test CRUD** works end-to-end for both **admins** and **students**, and how it maps onto the existing (Cambridge / practice-test) flow. The marathon test engine **reuses the same content model** (`ReadingPassage`, `ListeningPart`, `QuestionGroup`, `Question`) and the **same scoring/answer-checking logic** as the regular practice tests. The only differences are:

- Marathon passages/parts use `source = "MARATHON"` and have `practice_test = null` (they live in a global pool, not inside a `PracticeTest`).
- They are grouped into **Marathon → Day → (passages/parts)** instead of **PracticeTest → (passages/parts)**.
- Student attempts use the `MarathonAttempt` / `MarathonQuestionAnswer` models instead of `TestAttempt` / `QuestionAnswer`, but the submit/scoring logic is identical.

> **Base URLs**
> - Admin marathon: `…/api/v1/admin/`
> - Shared admin content (question groups / questions): `…/api/v1/admin/`
> - Student marathon: `…/api/v1/student/marathons/`
>
> All endpoints require `Authorization: Bearer <access_token>`. Admin endpoints require an admin user; student endpoints require an authenticated student.

---

## Part A — Mental Model

```
MarathonSeries (optional grouping)
└── Marathon                      (title, marathon_days, difficulty, visibility, premium flag …)
    └── MarathonDay  (auto-created: day_number 1..marathon_days)
        ├── reading_passages  (M2M → ReadingPassage  where source=MARATHON)
        ├── listening_parts   (M2M → ListeningPart   where source=MARATHON)
        └── external_links    (extra resources per day)

ReadingPassage / ListeningPart (source=MARATHON, practice_test=null)
└── QuestionGroup   (question_type, number range …)
    └── Question     (question_number, options_json, correct_answer_json …)
```

**Key rule:** A passage/part is a **reusable pool item**. You first create it once (global pool), then **assign** it to one or more marathon days. Questions are attached to the passage/part — *not* to the day.

When a marathon is created with `marathon_days = N`, the backend **auto-creates N `MarathonDay` rows** (day_number `1..N`). You do not create days manually.

---

## Part B — Admin: Creating a Marathon Test

This is the full "test creation" path. It mirrors Cambridge test creation but with marathon-scoped passage/part endpoints. The **question group + question** steps use the **exact same shared admin endpoints** as Cambridge.

### Step 1 — (Optional) Create a series

```
POST /api/v1/admin/marathon-series/
```
```json
{ "name": "30-Day Reading Sprint", "description": "…", "is_active": true }
```

### Step 2 — Create the marathon

```
POST /api/v1/admin/marathons/
```
```json
{
  "title": "30-Day Reading Marathon",
  "description": "Daily reading practice",
  "marathon_days": 30,
  "difficulty": "INTERMEDIATE",
  "category": "READING_FOCUS",
  "target_band": "7.0",
  "streak_goal_days": 7,
  "max_enrollments": null,
  "for_premium_users": false,
  "is_visible": false,
  "series": "<series_uuid or null>"
}
```
- `marathon_days` (**required**, ≥ 1): backend auto-creates that many `MarathonDay` rows.
- `is_visible`: keep `false` while building; flip to `true` to publish to students.
- `category`: `READING_FOCUS` | `LISTENING_FOCUS` | `MIXED`.
- `difficulty`: `BEGINNER` | `INTERMEDIATE` | `ADVANCED`.

**Response** includes the marathon `id`. Use it for all `<marathon_id>` paths below.

> ⚠️ **Increasing `marathon_days` later** (via `PATCH`) appends new days. **Decreasing it is rejected** (would lose day content) — returns `400`.

### Step 3 — List the days (verify all N exist)

```
GET /api/v1/admin/marathons/<marathon_id>/days/
```
Returns a **plain array** of all days (un-paginated — a 30-day marathon returns all 30). Each item:
```json
{
  "id": "uuid",
  "day_number": 1,
  "title": "",
  "difficulty": null,
  "estimated_minutes": null,
  "is_bonus_day": false,
  "is_completable": false,
  "reading_passages_count": 0,
  "listening_parts_count": 0,
  "external_links_count": 0,
  "created_at": "…",
  "updated_at": "…"
}
```
> 🔧 **Fixed bug:** this endpoint used to be paginated (page size 20), so a 30-day marathon showed only 20 days. It now returns every day.

### Step 4 — Edit a day (title, content, difficulty)

```
GET   /api/v1/admin/marathons/<marathon_id>/days/<day_number>/
PUT   /api/v1/admin/marathons/<marathon_id>/days/<day_number>/
PATCH /api/v1/admin/marathons/<marathon_id>/days/<day_number>/
```
Writable fields: `title`, `content`, `difficulty` (`EASY|MEDIUM|HARD`), `estimated_minutes`, `is_bonus_day`, and (on PATCH) `reading_passages` / `listening_parts` as arrays of passage/part UUIDs.

### Step 5 — Create a marathon reading passage (global pool)

```
POST /api/v1/admin/marathon-reading-passages/
```
```json
{
  "title": "The History of Tea",
  "passage_text": "Full passage text …",
  "difficulty_level": "INTERMEDIATE",
  "topic": "History",
  "preview_text": "Short teaser …",
  "estimated_time_minutes": 20,
  "max_questions": 13,
  "time_limit_seconds": 1200,
  "is_active": true
}
```
- `source` is forced to `MARATHON` and `practice_test` to `null` by the backend — **do not send `passage_number`**, it is ignored.
- `max_questions` is **important**: it is the denominator used to scale the raw score onto the 0–40 IELTS band table (see Part D). Set it to the real number of questions on the passage.

> ⚠️ **This is a global-pool endpoint — there is NO `marathon_id` in the URL.** Passages are reusable across days/marathons.

### Step 5b — Create a marathon listening part (global pool)

```
POST /api/v1/admin/marathon-listening-parts/      (multipart/form-data — supports audio upload)
```
Fields: `title`, `transcript_text`, `difficulty_level`, `topic`, `preview_text`, `estimated_time_minutes`, `max_questions`, `time_limit_seconds`, `is_active`, and **`audio_file`** (file upload). `source`/`practice_test` are forced as above; `part_number` is ignored.

List / detail / update / delete:
```
GET    /api/v1/admin/marathon-reading-passages/           GET /…/<pk>/
PUT/PATCH/DELETE /api/v1/admin/marathon-reading-passages/<pk>/
GET    /api/v1/admin/marathon-listening-parts/            GET /…/<pk>/
PUT/PATCH/DELETE /api/v1/admin/marathon-listening-parts/<pk>/
```

### Step 6 — Add question groups + questions (SHARED Cambridge endpoints)

> 🟢 **This is identical to Cambridge test creation.** Marathon passages/parts plug straight into the existing question-group and question endpoints because those reference the passage/part by `id` and do **not** require a `practice_test`.

**6a. Create a question group** on the passage/part:
```
POST /api/v1/admin/question-groups/
```
```json
{
  "reading_passage": "<marathon_passage_uuid>",   // OR "listening_part": "<uuid>"
  "question_type": "TFNG",
  "group_order": 1,
  "instructions": "Choose TRUE, FALSE or NOT GIVEN.",
  "question_number_start": 1,
  "question_number_end": 5,
  "word_limit": null,
  "number_allowed": false,
  "group_content_json": null,
  "is_active": true
}
```
- Provide **exactly one** of `reading_passage` / `listening_part` / `variant_set`.
- `question_number_start ≤ question_number_end`.

**6b. Add questions** — one at a time:
```
POST /api/v1/admin/questions/
```
```json
{
  "question_group": "<group_uuid>",
  "question_number": 1,
  "question_text": "The author claims tea originated in China.",
  "options_json": { "options": [ {"key":"TRUE","text":"True"}, {"key":"FALSE","text":"False"}, {"key":"NOT_GIVEN","text":"Not Given"} ] },
  "correct_answer_json": { "answer": "TRUE" },
  "explanation": "Paragraph 2 states …",
  "answer_evidence_json": { "source": "paragraph 2" },
  "is_active": true
}
```
…or **bulk**:
```
POST /api/v1/admin/question-groups/<group_id>/questions/bulk/
```
```json
{ "questions": [ { "question_number": 1, "question_text": "…", "options_json": {…}, "correct_answer_json": {…} }, … ] }
```
- `question_number` must fall within the group's `question_number_start..end`.
- `options_json` / `correct_answer_json` are validated per `question_type` — see **Part E** for the exact JSON shape per type.

### Step 7 — Assign the passage/part to a day

```
POST   /api/v1/admin/marathons/<marathon_id>/days/<day_number>/assign-passage/<passage_id>/
DELETE /api/v1/admin/marathons/<marathon_id>/days/<day_number>/assign-passage/<passage_id>/
POST   /api/v1/admin/marathons/<marathon_id>/days/<day_number>/assign-part/<part_id>/
DELETE /api/v1/admin/marathons/<marathon_id>/days/<day_number>/assign-part/<part_id>/
```
`POST` → `{ "detail": "Assigned." }` (200). `DELETE` → `204`. The passage/part must have `source=MARATHON`.

Once a day has at least one active passage/part **with questions**, its `is_completable` becomes `true`.

### Step 8 — (Optional) Per-day external links

```
GET/POST          /api/v1/admin/marathons/<marathon_id>/days/<day_number>/external-links/
PUT/PATCH/DELETE  /api/v1/admin/marathons/<marathon_id>/days/<day_number>/external-links/<link_id>/
```
Body: `{ "title": "Vocabulary list", "url": "https://…", "order": 0 }`.

### Step 9 — Publish

`PATCH` the marathon with `{ "is_visible": true }`. Students can now see and enroll.

### Admin monitoring

```
GET /api/v1/admin/marathons/<marathon_id>/enrollments/   (paginated: count/results)
GET /api/v1/admin/marathons/<marathon_id>/leaderboard/    (ranked array)
```

---

## Part C — Student: Solving & Submitting (the test-taking flow)

This mirrors the Cambridge attempt flow (`start → save → submit → review`) one-to-one.

### C0. Discover & enroll
```
GET  /api/v1/student/marathons/                              → paginated list (count/results)
GET  /api/v1/student/marathons/<marathon_id>/                → detail (includes inline enrollment if any)
POST /api/v1/student/marathons/<marathon_id>/enroll/         → 201 (new) | 200 (already)
GET  /api/v1/student/marathons/<marathon_id>/enrollment/     → enrollment progress
```
Students **must be enrolled** to access days/attempts (else `403`).

### C1. See unlocked days
```
GET /api/v1/student/marathons/<marathon_id>/days/
```
Returns only days up to the student's `current_day_number` (one day unlocks per calendar day since enrollment). Future days return `403` on access.

### C2. Open a day (see its passages/parts)
```
GET /api/v1/student/marathons/<marathon_id>/days/<day_number>/
```
- **Side effect:** creates the `StudentMarathonDay` record on first visit; increments `retry_count` on later visits.
- Each passage/part includes `is_available_to_be_solved`, `attempt_id`, `attempt_status`, `band_score`, `question_groups_count`, and (listening) `audio_file_url`.

### C3. Start an attempt on one passage/part
```
POST /api/v1/student/marathons/<marathon_id>/days/<day_number>/attempts/
```
```json
{ "passage_id": "<uuid>" }        // OR { "part_id": "<uuid>" }
```
Behavior:
- New → `201` with the attempt detail (questions + empty answer slots). The backend pre-creates one `MarathonQuestionAnswer` per active question (all `is_skipped=true`).
- Existing **IN_PROGRESS** → `200`, returns the same attempt (resume).
- Existing **COMPLETED** → `400` `{ "detail": "...already completed...", "is_available_to_be_solved": false }`.

> One attempt per `(enrollment, passage)` / `(enrollment, part)` — enforced by a DB unique constraint.

### C4. Save progress (autosave, optional, repeatable)
```
PATCH /api/v1/student/marathons/<marathon_id>/days/<day_number>/attempts/<attempt_id>/save/
```
```json
{
  "time_used_seconds": 320,
  "answers": [
    { "question_id": "<uuid>", "answer": { "answer": "TRUE" }, "is_flagged": false, "time_spent_seconds": 25 },
    { "question_id": "<uuid>", "answer": null }
  ]
}
```
- `answer: null` ⇒ marks that question skipped.
- Response: `{ "answered": N, "total": max_questions, "time_used_seconds": … }`.
- Only works while the attempt is `IN_PROGRESS`.

### C5. Submit (final scoring)
```
POST /api/v1/student/marathons/<marathon_id>/days/<day_number>/attempts/<attempt_id>/submit/
```
```json
{
  "time_used_seconds": 1140,
  "answers": [ { "question_id": "<uuid>", "answer": { "answer": "TRUE" } }, … ]
}
```
- You may include the final `answers` here directly (or rely on prior `save` calls — both work; submitted answers overwrite saved ones for matching questions).
- Idempotent: submitting an already-COMPLETED attempt re-returns the result (no re-scoring).
- **Response = `MarathonAttemptResult`** (see Part D).

### C6. Review a completed attempt
```
GET /api/v1/student/marathons/<marathon_id>/days/<day_number>/attempts/<attempt_id>/review/
```
Returns the same `MarathonAttemptResult` shape (only for `COMPLETED` attempts).

### C7. Complete the day & progress
```
POST /api/v1/student/marathons/<marathon_id>/days/<day_number>/complete/
```
- Requires **all** active passages/parts on the day to have a COMPLETED attempt, else `400` with an `incomplete: [...]` list.
- On success: marks the day done, computes `day_band_score` (avg of that day's attempt bands), updates streak/score, awards badges, and may finish the marathon.

Notes / leaderboard:
```
GET/PUT/PATCH /api/v1/student/marathons/<marathon_id>/days/<day_number>/note/
GET           /api/v1/student/marathons/<marathon_id>/leaderboard/
```

---

## Part D — Result / Analysis Payload (`MarathonAttemptResult`)

Returned by **submit** and **review**. This now matches the Cambridge result shape.

```json
{
  "id": "uuid",
  "status": "COMPLETED",
  "score": 9,
  "band_score": "7.0",
  "question_type_stats_json": {
    "TFNG": { "correct": 4, "total": 6, "accuracy_percent": 67 },
    "MCQ_SINGLE": { "correct": 5, "total": 7, "accuracy_percent": 71 }
  },
  "time_used_seconds": 1140,
  "started_at": "…",
  "completed_at": "…",
  "correct_count": 9,
  "incorrect_count": 3,
  "skipped_count": 1,
  "answers": [
    {
      "id": "uuid",
      "question": "uuid",
      "question_number": 1,
      "question_text": "…",
      "question_type": "TFNG",
      "student_answer_json": { "answer": "TRUE" },
      "correct_answer_json": { "answer": "TRUE" },
      "is_correct": true,
      "is_skipped": false,
      "is_flagged": false,
      "explanation": "…",
      "answer_evidence_json": { "source": "paragraph 2" }
    }
  ]
}
```

**Field meaning**
- `score` — raw number correct (e.g. 9 of 13).
- `band_score` — the raw score **scaled to a 0–40 IELTS scale** (`round(score / max_questions * 40)`), then mapped through the standard Academic Reading / Listening band table. `null` if the passage/part has no questions.
- `correct_count` = answers with `is_correct=true`.
- `incorrect_count` = answered but wrong (`is_correct=false AND is_skipped=false`).
- `skipped_count` = `is_skipped=true`.
- `question_type_stats_json` — per question-type breakdown `{correct, total, accuracy_percent}`.

> 🔧 **Fixed bugs in this payload (this release):**
> 1. **Submit used to 500** — the band-score helper was called with the wrong arguments. Fixed.
> 2. **Raw score wasn't scaled** to the 0–40 band scale, so single-passage bands were wrong. Fixed.
> 3. **`question_type_stats_json` always showed `correct: 0`** ("0 0 0 0") — the correct-counter was never incremented. Fixed, and `accuracy_percent` added for parity with Cambridge.

---

## Part E — Answer JSON shapes per `question_type`

The student `answer` object and the admin `correct_answer_json` use the same shapes. Scoring (`check_answer_correct`) is **shared** with Cambridge.

| `question_type` | answer JSON | Match rule |
|---|---|---|
| `MCQ_SINGLE` | `{ "answer": "A" }` | exact key match |
| `MCQ_MULTIPLE` | `{ "answers": ["A","C"] }` | set equality |
| `TFNG` | `{ "answer": "TRUE" \| "FALSE" \| "NOT_GIVEN" }` | case-insensitive |
| `YNNG` | `{ "answer": "YES" \| "NO" \| "NOT_GIVEN" }` | case-insensitive |
| `MATCHING_HEADINGS`, `MATCHING`, `CLASSIFICATION`, `LIST_SELECTION`, `CHOOSING_TITLE`, `MATCH_PARA_INFO`, `MATCH_SENT_ENDINGS`, `PLAN_MAP_DIAGRAM` | `{ "answer": "iii" }` | trimmed, case-insensitive |
| `SENTENCE_COMPLETION`, `SHORT_ANSWER`, `SUMMARY_COMPLETION`, `TABLE_COMPLETION`, `FLOW_CHART_COMPLETION`, `DIAGRAM_COMPLETION`, `FORM_COMPLETION`, `NOTE_COMPLETION` | `{ "answer": "photosynthesis" }` | trimmed, lowercase; also matches `correct_answer_json.alternative_answers[]`; tolerant of minor misspellings |

`answer: null` (or omitting a question) ⇒ skipped.

---

## Part F — Marathon vs Cambridge: what's the same, what differs

| Concern | Cambridge | Marathon | Same? |
|---|---|---|---|
| Passage / part content model | `ReadingPassage` / `ListeningPart` | same (with `source=MARATHON`, `practice_test=null`) | ✅ |
| Question group / question CRUD | `/admin/question-groups/`, `/admin/questions/`, bulk | **same endpoints** | ✅ |
| Answer checking | `check_answer_correct` | same fn | ✅ |
| Band score table | `calculate_band_score` (0–40) | same fn (raw scaled to /40) | ✅ |
| Submit scoring loop | score + per-type `{correct,total,accuracy_percent}` | **now identical** | ✅ |
| Attempt models | `TestAttempt` / `QuestionAnswer` | `MarathonAttempt` / `MarathonQuestionAnswer` | parallel |
| Grouping | `PracticeTest` → passages | `Marathon` → `Day` → passages | differs by design |
| Passage creation endpoint | `/admin/practice-tests/<id>/reading-passages/` | `/admin/marathon-reading-passages/` (global pool, no test id) | differs by design |
| Full-test band | computed over the whole 40-question test | per single passage/part, scaled to /40 | differs (marathon is single-section) |
| Mistake-reason analysis & Review Center | wired (`stored_attempt_mistake_reasons`, `ReviewItem`) | **not wired** for marathon | ⚠️ gap (see below) |

### Known intentional gap
Cambridge submit also feeds the **mistake-reason analysis** and the **Review Center** (`ReviewItem`). Those features are bound to the `TestAttempt` model and are **not** currently wired for `MarathonAttempt`. If you need marathon wrong-answers to appear in the Review Center / mistake analytics, that's a separate backend task — flag it and it can be added.

---

## Part G — Quick reference (all marathon test endpoints)

**Admin**
```
POST   /api/v1/admin/marathon-series/
GET    /api/v1/admin/marathons/                                   POST /api/v1/admin/marathons/
GET    /api/v1/admin/marathons/<id>/   PUT/PATCH/DELETE /api/v1/admin/marathons/<id>/
GET    /api/v1/admin/marathons/<id>/days/
GET/PUT/PATCH  /api/v1/admin/marathons/<id>/days/<day_number>/
GET/POST       /api/v1/admin/marathon-reading-passages/      ·   /…/<pk>/ (GET/PUT/PATCH/DELETE)
GET/POST       /api/v1/admin/marathon-listening-parts/       ·   /…/<pk>/ (GET/PUT/PATCH/DELETE)
POST   /api/v1/admin/question-groups/                        (shared)
POST   /api/v1/admin/questions/   ·  /api/v1/admin/question-groups/<gid>/questions/bulk/  (shared)
POST/DELETE /api/v1/admin/marathons/<id>/days/<day_number>/assign-passage/<pid>/
POST/DELETE /api/v1/admin/marathons/<id>/days/<day_number>/assign-part/<pid>/
GET/POST       /api/v1/admin/marathons/<id>/days/<day_number>/external-links/   ·  /…/<link_id>/
GET    /api/v1/admin/marathons/<id>/enrollments/    ·   /api/v1/admin/marathons/<id>/leaderboard/
```

**Student**
```
GET    /api/v1/student/marathons/
GET    /api/v1/student/marathons/<id>/
POST   /api/v1/student/marathons/<id>/enroll/
GET    /api/v1/student/marathons/<id>/enrollment/
GET    /api/v1/student/marathons/<id>/days/
GET    /api/v1/student/marathons/<id>/days/<day_number>/
POST   /api/v1/student/marathons/<id>/days/<day_number>/complete/
GET/PUT/PATCH /api/v1/student/marathons/<id>/days/<day_number>/note/
POST   /api/v1/student/marathons/<id>/days/<day_number>/attempts/
GET    /api/v1/student/marathons/<id>/days/<day_number>/attempts/<aid>/
PATCH  /api/v1/student/marathons/<id>/days/<day_number>/attempts/<aid>/save/
POST   /api/v1/student/marathons/<id>/days/<day_number>/attempts/<aid>/submit/
GET    /api/v1/student/marathons/<id>/days/<day_number>/attempts/<aid>/review/
GET    /api/v1/student/marathons/<id>/leaderboard/
```
