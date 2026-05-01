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
- `GET /api/v1/student/mistake-analysis/advice/`
- `GET /api/v1/admin/mistake-reasons/`
- `POST /api/v1/admin/mistake-reasons/`
- `PATCH /api/v1/admin/mistake-reasons/<uuid:reason_id>/`

Mistake reason responses now include a summarized solution plus exactly one learning resource.

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
