# Frontend API Notes: Profile, Band Scoring, and Mistake Analysis

This file documents the backend changes for:

- official IELTS band calculation for Listening and Academic Reading
- extended student profile fields
- stronger mistake-analysis data in the review center

## 1. Band Score Rules

Band estimates for Listening and Reading now follow IELTS tables and should only appear in valid IELTS steps such as:

- `2.0`
- `2.5`
- `3.0`
- `3.5`
- `4.0`
- `4.5`
- `5.0`
- `5.5`
- `6.0`
- `6.5`
- `7.0`
- `7.5`
- `8.0`
- `8.5`
- `9.0`

Invalid values like `4.3`, `5.6`, `6.8`, `7.4` should no longer appear in backend responses for Listening/Reading estimates.

### Listening Raw Score Table

| Correct answers | Band |
|---|---|
| 39-40 | 9.0 |
| 37-38 | 8.5 |
| 35-36 | 8.0 |
| 32-34 | 7.5 |
| 30-31 | 7.0 |
| 26-29 | 6.5 |
| 23-25 | 6.0 |
| 18-22 | 5.5 |
| 16-17 | 5.0 |
| 13-15 | 4.5 |
| 10-12 | 4.0 |
| 8-9 | 3.5 |
| 6-7 | 3.0 |
| 4-5 | 2.5 |
| 0-3 | 2.0 |

### Academic Reading Raw Score Table

| Correct answers | Band |
|---|---|
| 39-40 | 9.0 |
| 37-38 | 8.5 |
| 35-36 | 8.0 |
| 33-34 | 7.5 |
| 30-32 | 7.0 |
| 27-29 | 6.5 |
| 23-26 | 6.0 |
| 19-22 | 5.5 |
| 15-18 | 5.0 |
| 13-14 | 4.5 |
| 10-12 | 4.0 |
| 8-9 | 3.5 |
| 6-7 | 3.0 |
| 4-5 | 2.5 |
| 0-3 | 2.0 |

### Affected Endpoints

- `POST /api/v1/student/attempts/<uuid:attempt_id>/submit/`
- `GET /api/v1/student/dashboard/`
- `GET /api/v1/student/analytics/`
- `GET /api/v1/admin/users/`
- `GET /api/v1/admin/users/<uuid:user_id>/`
- admin analytics endpoints that expose reading/listening band averages

Important:

- submitted attempt `band_score` is now calculated with the correct table for that module
- dashboard and admin estimates are normalized to valid IELTS band steps only

## 2. Student Profile Changes

Endpoint:

- `GET /api/v1/student/profile/`
- `PATCH /api/v1/student/profile/`

The profile response now includes these new fields:

```json
{
  "id": "uuid",
  "email": "student@example.com",
  "full_name": "Student Name",
  "exam_datetime": "2026-07-15T09:30:00Z",
  "target_band": "7.0",
  "target_listening_band": "7.5",
  "target_reading_band": "7.0",
  "target_speaking_band": "6.5",
  "target_writing_band": "6.0",
  "strongest_section": "READING",
  "weakest_section": "LISTENING",
  "study_hours_available": 4,
  "study_streak": 3,
  "last_activity_date": "2026-04-22",
  "updated_at": "2026-04-22T14:00:00Z"
}
```

### Field Meanings

- `exam_datetime`: IELTS exam datetime, nullable
- `target_listening_band`: target Listening band
- `target_reading_band`: target Reading band
- `target_speaking_band`: target Speaking band
- `target_writing_band`: target Writing band
- `strongest_section`: one of `LISTENING`, `READING`, `SPEAKING`, `WRITING`
- `weakest_section`: one of `LISTENING`, `READING`, `SPEAKING`, `WRITING`
- `study_hours_available`: integer hours

Important:

- `strongest_section` and `weakest_section` are allowed to be the same
- `target_band` is still returned for backward compatibility
- when any of the 4 target section bands are updated, backend automatically recalculates `target_band`

### PATCH Request Example

```http
PATCH /api/v1/student/profile/
Content-Type: application/json

{
  "exam_datetime": "2026-07-15T09:30:00Z",
  "target_listening_band": "7.5",
  "target_reading_band": "7.0",
  "target_speaking_band": "6.5",
  "target_writing_band": "6.0",
  "strongest_section": "READING",
  "weakest_section": "LISTENING",
  "study_hours_available": 4
}
```

### Validation Rules

- target band fields must be between `0.0` and `9.0`
- target band fields must use IELTS half-band steps only: `0.0`, `0.5`, `1.0`, ...
- `study_hours_available` must be an integer
- `exam_datetime` should be sent in ISO-8601 format

## 3. Admin User Detail Response

Endpoint:

- `GET /api/v1/admin/users/<uuid:user_id>/`

The admin user detail response now includes a nested `profile` object:

```json
{
  "id": "uuid",
  "full_name": "Student Name",
  "email": "student@example.com",
  "overall_band": "7.0",
  "target_band": "7.0",
  "profile": {
    "exam_datetime": "2026-07-15T09:30:00Z",
    "target_listening_band": "7.5",
    "target_reading_band": "7.0",
    "target_speaking_band": "6.5",
    "target_writing_band": "6.0",
    "strongest_section": "READING",
    "weakest_section": "LISTENING",
    "study_hours_available": 4
  }
}
```

## 4. Review Center / Mistake Analysis

Endpoint:

- `GET /api/v1/student/review-center/`

The mistake-analysis stats are now built from completed wrong answers, not only from already-existing review items.

This means:

- old users with completed tests should now see stats even if earlier review rows were missing
- backend also backfills missing wrong-answer review items when review center is opened
- `most_difficult_type` and `weakest_module` should not stay `null` if the student has actual wrong answers in completed attempts

### Response Shape

Response shape is unchanged:

```json
{
  "stats": {
    "total_to_review": 5,
    "most_difficult_type": "MATCHING_HEADINGS",
    "weakest_module": "Listening",
    "accuracy_trend": "+6%"
  },
  "mistakes_by_type": [
    { "question_type": "MATCHING_HEADINGS", "count": 3 }
  ],
  "mistakes_by_module": {
    "reading": 2,
    "listening": 3
  },
  "review_items": []
}
```

Important:

- `review_items` is still the review-center list
- `mistakes_by_type` and `mistakes_by_module` are now more reliable because they use completed wrong answers

## 5. Mistake Reason Solutions And Resources

Endpoints:

- `GET /api/v1/student/attempts/<uuid:attempt_id>/mistake-reasons/`
- `POST /api/v1/student/attempts/<uuid:attempt_id>/mistake-reasons/select/`
- `GET /api/v1/student/mistake-analysis/advice/`
- `GET /api/v1/admin/mistake-reasons/`
- `POST /api/v1/admin/mistake-reasons/`
- `PATCH /api/v1/admin/mistake-reasons/<uuid:reason_id>/`
- `DELETE /api/v1/admin/mistake-reasons/<uuid:reason_id>/remove-media/`

Mistake reason responses include a summarized solution plus learning resource fields.

```json
{
  "id": "uuid",
  "reason": "Note / Flow-chart completion - spelling errors cost marks",
  "module": "LISTENING",
  "mistake_category": "misspelled",
  "general_solution": "Build a short spelling-check habit for names, endings, and commonly misspelled IELTS words.",
  "solution_1": "In Listening, correct spelling is required...",
  "solution_2": "Write what you hear immediately...",
  "solution_3": "After the test, go back and check each answer word...",
  "is_file_consists": false,
  "file_url": null,
  "link_url": "https://drive.google.com/file/d/example/view",
  "resource_type": "link",
  "resource_url": "https://drive.google.com/file/d/example/view"
}
```

Resource rules:

- each admin-created reason must have exactly one resource: either `file` or `link_url`
- sending both `file` and `link_url` returns `400`
- sending neither `file` nor `link_url` returns `400`
- `resource_type` is `file` or `link`
- `resource_url` is the URL the frontend should open
- `file_url` remains for backward compatibility and is only populated for uploaded files
- `link_url` is a public URL, usually a Google Drive book/guide link
- after media is removed, `file_url`, `resource_type`, and `resource_url` are `null`, and `link_url` is `""`

Admin remove media:

```http
DELETE /api/v1/admin/mistake-reasons/<uuid:reason_id>/remove-media/
```

Use this when the admin presses remove on a mistake reason resource. Send only the reason UUID in the URL. The backend detects whether the reason currently has an uploaded file or a link:

- uploaded files are deleted from storage and cleared from the reason
- links are cleared from the reason
- the response is the updated mistake reason object

Response shape after removal:

```json
{
  "id": "uuid",
  "is_file_consists": false,
  "file_url": null,
  "link_url": "",
  "resource_type": null,
  "resource_url": null
}
```

Student advice behavior:

- `GET /api/v1/student/mistake-analysis/advice/` is no longer limited to 4 saved reasons.
- New matched reasons are appended to the student's existing advice list.
- Existing saved reasons are kept, and duplicate reasons are not added again.
- Keep rendering the returned array in order; do not hardcode a 4-item limit in the UI.

Reason/solution weekly limit:

- Each student has 2 reason/solution uses per week for Reading and 2 per week for Listening.
- Reading and Listening counts are independent.
- The weekly window is based on the student's account creation time. Example: if the account was created on March 23, 2026 at 03:00, that student's first window ends on March 30, 2026 at 03:00.
- Completing a test does not consume the limit.
- `GET /api/v1/student/attempts/<uuid:attempt_id>/mistake-reasons/` returns recommended reason summaries for the attempt. It stores the attempt/reason matches, but it does not consume the weekly limit and does not add anything to Mistake Analysis.
- `POST /api/v1/student/attempts/<uuid:attempt_id>/mistake-reasons/select/` consumes 1 use for that attempt's module, no matter how many reason IDs are selected.
- Re-selecting for the same attempt does not consume another use.
- If the student never opens/selects reasons for a completed test, the count is not incremented.
- When the weekly window moves forward, the old period is closed and a new active period is created automatically.

The submit response now includes quota status:

```json
{
  "id": "attempt-uuid",
  "status": "COMPLETED",
  "test_type": "READING",
  "is_ai_allowed": true,
  "ai_usage_status": {
    "is_ai_allowed": true,
    "module": "READING",
    "limit": 2,
    "used_count": 0,
    "remaining_count": 2,
    "period_starts_at": "2026-03-23T03:00:00+05:00",
    "period_ends_at": "2026-03-30T03:00:00+05:00",
    "reset_message": "Your Reading reason/solution limit resets on 2026-03-30 at 03:00."
  }
}
```

Recommended reasons endpoint:

```http
GET /api/v1/student/attempts/<uuid:attempt_id>/mistake-reasons/
```

Response:

```json
{
  "is_ai_allowed": true,
  "usage_status": {
    "is_ai_allowed": true,
    "module": "READING",
    "limit": 2,
    "used_count": 0,
    "remaining_count": 2,
    "period_starts_at": "2026-03-23T03:00:00+05:00",
    "period_ends_at": "2026-03-30T03:00:00+05:00",
    "already_used_for_attempt": false,
    "reset_message": "Your Reading reason/solution limit resets on 2026-03-30 at 03:00."
  },
  "results": [
    {
      "id": "reason-uuid",
      "reason": "Blank answer recovery",
      "module": "READING",
      "module_display": "Reading",
      "mistake_category": "blank_answer",
      "mistake_category_display": "Blank answer",
      "is_file_consists": false
    }
  ]
}
```

Important:

- This endpoint returns reason summaries only; it does not return `general_solution`, `solution_1`, `solution_2`, `solution_3`, `resource_url`, or `link_url`.
- It can be used to render the post-test reason selection UI.
- The selected reason IDs must come from this endpoint's `results`.

Select reasons endpoint:

```http
POST /api/v1/student/attempts/<uuid:attempt_id>/mistake-reasons/select/
Content-Type: application/json

{
  "reason_ids": ["reason-uuid-1", "reason-uuid-2"]
}
```

Response:

```json
{
  "is_ai_allowed": true,
  "usage_status": {
    "is_ai_allowed": true,
    "module": "READING",
    "limit": 2,
    "used_count": 1,
    "remaining_count": 1,
    "period_starts_at": "2026-03-23T03:00:00+05:00",
    "period_ends_at": "2026-03-30T03:00:00+05:00",
    "already_used_for_attempt": true,
    "reset_message": "Your Reading reason/solution limit resets on 2026-03-30 at 03:00."
  },
  "results": [
    {
      "id": "reason-uuid-1",
      "reason": "Blank answer recovery",
      "general_solution": "Make a best guess before moving to the next question.",
      "solution_1": "Use elimination...",
      "solution_2": "",
      "solution_3": "",
      "resource_type": "link",
      "resource_url": "https://drive.google.com/file/d/example/view"
    }
  ]
}
```

The selected reasons are saved into `GET /api/v1/student/mistake-analysis/advice/` only after this select endpoint succeeds.

Frontend behavior:

- After submit, use `is_ai_allowed` to enable/disable the reason selection UI.
- If `is_ai_allowed` is `false`, hide or disable the reason selection action for that module until `ai_usage_status.period_ends_at`.
- Do not decrement the frontend count locally on submit or on the recommendations GET. The backend only consumes the limit when the select endpoint succeeds.
- The recommendations endpoint and select endpoint return `403` if the module limit is exhausted for a new attempt.
- `GET /api/v1/student/profile/` now includes `reason_usage_limits.reading` and `reason_usage_limits.listening` for profile-level tracking.
- Deployment/backfill command for existing users:

```bash
python manage.py create_reason_usage_periods --close-old
```

Optional custom window:

```bash
python manage.py create_reason_usage_periods --start-date "2026-03-23T03:00:00+05:00" --end-date "2026-03-30T03:00:00+05:00" --close-old
```

Limit-exhausted response:

```json
{
  "detail": "Weekly reason/solution usage limit reached for this module.",
  "is_ai_allowed": false,
  "module": "READING",
  "limit": 2,
  "used_count": 2,
  "remaining_count": 0,
  "period_starts_at": "2026-03-23T03:00:00+05:00",
  "period_ends_at": "2026-03-30T03:00:00+05:00",
  "already_used_for_attempt": false,
  "reset_message": "Your Reading reason/solution limit resets on 2026-03-30 at 03:00."
}
```

Admin create examples:

```http
POST /api/v1/admin/mistake-reasons/
Content-Type: application/json

{
  "reason": "Work on spelling",
  "module": "BOTH",
  "mistake_category": "misspelled",
  "general_solution": "Build a repeatable spelling review habit after every test.",
  "solution_1": "Compare your answer letter by letter with the transcript.",
  "solution_2": "",
  "solution_3": "",
  "link_url": "https://drive.google.com/file/d/example/view"
}
```

```http
POST /api/v1/admin/mistake-reasons/
Content-Type: multipart/form-data

reason=Attached PDF guide
module=READING
mistake_category=blank_answer
general_solution=Read the compact PDF before your next timed practice.
solution_1=Focus on answer-location habits.
file=<uploaded file>
```

## 6. Frontend Implementation Notes

- Update any band-display component to assume backend returns only valid IELTS band steps.
- Replace the old single-target-band profile UI with 4 section targets plus the new profile fields.
- Keep showing `target_band` only if the UI still needs an overall target summary.
- Use dropdowns for `strongest_section` and `weakest_section`.
- Use a datetime picker for `exam_datetime`.
- Use an integer input for `study_hours_available`.
- Do not hardcode invalid decimal band values anywhere in charts or cards.
- In mistake-reason cards, show `general_solution` as the short summary before the three detailed solution fields.
- Render the learning resource from `resource_url`; use `resource_type` to decide whether the action text/icon should represent a file or an external link.
- If `resource_url` is `null`, hide or disable the resource action for that reason.
- Do not cap mistake-analysis advice cards at 4 items; render all items returned by the backend.
- Use submit response `is_ai_allowed` / `ai_usage_status` to control the reason selection UI.

---

## 6. Mistake Reasons Flow — Updates (this release)

A round of changes was made to how mistake reasons are saved on test submission, when the AI quota is consumed, and how admins can configure that quota. Frontend impact summary first, then per-endpoint detail.

### What changed at a glance

| Area | Before | After |
|---|---|---|
| Submitting a practice test | Reasons were lazily computed only on first GET to `/mistake-reasons/`. | Reasons matched against the attempt are saved automatically on submit (still don't consume the AI quota). |
| `GET /api/v1/student/attempts/{id}/mistake-reasons/` | Returned `403` once the weekly limit was reached. | Always returns `200` with the matched reasons, even when the limit is exhausted. The `is_ai_allowed` / `usage_status` fields tell the UI whether the **select** action is available. |
| `POST /api/v1/student/attempts/{id}/mistake-reasons/select/` | Returned `403` when over the limit (unchanged). | Same — this is the **only** endpoint that consumes the weekly quota. |
| Weekly limit value | Hardcoded `2` per module. | Configurable per module (READING / LISTENING) via a new admin endpoint. |

### 6.1 Submission flow

- After `POST /api/v1/student/attempts/{id}/submit/` returns `200` for a registered student, the backend has already populated the per-attempt mistake-reason list. No extra API call is required to "trigger" it.
- The submit response continues to include `is_ai_allowed` and `ai_usage_status`, both reflecting the **current configured limit** (see §6.4).
- Calling submit again for an already-completed attempt is idempotent and will also populate reasons retroactively for older attempts that pre-date this release.

### 6.2 GET attempt mistake reasons

```
GET /api/v1/student/attempts/{attempt_id}/mistake-reasons/
GET /api/v1/student/attempts/{attempt_id}/mistake-reasons/?mistake_category=fully_incorrect
```

Always `200` for a completed attempt. Response shape (unchanged):

```json
{
  "is_ai_allowed": true,
  "usage_status": {
    "is_ai_allowed": true,
    "module": "READING",
    "limit": 5,
    "used_count": 1,
    "remaining_count": 4,
    "period_starts_at": "2026-04-29T00:00:00Z",
    "period_ends_at": "2026-05-06T00:00:00Z",
    "already_used_for_attempt": false,
    "reset_message": "Your Reading reason/solution limit resets on 2026-05-06 at 00:00."
  },
  "results": [ /* MistakeReasonListSerializer items */ ]
}
```

UI behavior:
- Render the `results` list on the post-test screen regardless of `is_ai_allowed`.
- If `is_ai_allowed` is `false`, **disable the "Select" / "See solutions" button** and show `usage_status.reset_message` as a tooltip or inline note. Do not hide the reason cards themselves.
- If `is_ai_allowed` is `true`, enable selection (which calls the endpoint in §6.3).

### 6.3 POST select reasons

```
POST /api/v1/student/attempts/{attempt_id}/mistake-reasons/select/
Body: { "reason_ids": ["uuid", "uuid", ...] }
```

- Consumes one quota slot from the active weekly period (idempotent per `attempt_id` — repeating the call for the same attempt does **not** consume a second slot).
- `200` with `is_ai_allowed`, `usage_status`, and full `MistakeReasonDetailSerializer` results (with solutions, file/link).
- `403` with `usage_status` when the limit is reached on a brand-new attempt.

### 6.4 Admin — per-student weekly limit configuration

The weekly mistake-reason / solution limit is configured **per student**, not globally. The admin updates each user explicitly. Only `GET` and `PATCH` are supported — `PUT` is not exposed.

```
GET   /api/v1/admin/users/{user_id}/reason-usage-limits/
PATCH /api/v1/admin/users/{user_id}/reason-usage-limits/
```

Auth: admin Bearer token. `user_id` is the target student's UUID.

#### GET response

```json
{
  "reading_limit": 2,
  "listening_limit": 2,
  "updated_at": "2026-05-02T14:00:00Z"
}
```

If the student has never had a row created, the backend creates one on the fly with the system defaults (`reading_limit: 2`, `listening_limit: 2`) and returns it.

#### PATCH body (either or both fields)

Send only the field(s) you want to change:

```json
{ "reading_limit": 5 }
```

```json
{ "reading_limit": 5, "listening_limit": 3 }
```

#### Response (`200 OK`)

```json
{
  "reading_limit": 5,
  "listening_limit": 3,
  "updated_at": "2026-05-02T14:05:21Z"
}
```

Validation:
- Both fields must be integers `>= 0`.
- Setting a limit to `0` turns the feature off for that module **for this student only** — their `is_ai_allowed` becomes `false` for that module until the limit is raised again.
- Other students are unaffected.

Effect on existing data:
- The student's currently-active `StudentReasonUsagePeriod` row(s) for the affected module(s) are updated immediately, so the new limit applies within their current week.
- The next weekly period created for that student also picks up the new value.

Errors:
- `404` — the `user_id` does not exist.
- `400` — invalid payload (e.g. negative integer or non-integer).

#### Suggested admin UI

On the per-user admin detail screen, add a "Weekly mistake-reason limit" panel scoped to that user:

| Field | Label | Notes |
|---|---|---|
| `reading_limit` | Reading limit per week | Number input, min 0 |
| `listening_limit` | Listening limit per week | Number input, min 0 |

- On page load, `GET /api/v1/admin/users/{user_id}/reason-usage-limits/` and pre-fill the inputs.
- On save, `PATCH` only the changed field(s).
- Re-fetch after save (or use the response payload directly) and show a success toast.
- There is no bulk endpoint — to update multiple students, call PATCH once per affected user.

### 6.5 Default seed content

Backend operators can run `python manage.py seed_mistake_reasons` (or `--overwrite` to refresh solutions on existing rows) to populate one default reason per `(module × mistake_category)` combination. Frontend impact: none beyond knowing that the GET reasons endpoint will return content out-of-the-box even before the admin authors custom reasons.

### 6.6 Migration / rollout checklist

- Run `python manage.py migrate` for `users.0013_reasonusagelimitconfig`.
- Optionally run `python manage.py seed_mistake_reasons` to bootstrap content.
- Frontend: stop treating `403` from `GET /mistake-reasons/` as a blocking error; gate the **Select** action on `is_ai_allowed`.
- Frontend (admin): wire up the new `users/{user_id}/reason-usage-limits/` endpoint in the per-user admin detail screen (GET + PATCH only).

finish