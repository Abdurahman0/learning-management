# IELTS Master — Student API Guide

Complete reference for the student-facing REST API.

---

## Table of Contents

1. [Connection & Setup](#connection--setup)
2. [Authentication](#authentication)
3. [Profile](#profile)
4. [Dashboard](#dashboard)
5. [Test Listing](#test-listing)
6. [Taking a Test](#taking-a-test)
   - [Start / Resume](#start--resume-attempt)
   - [Auto-Save Answers](#auto-save-answers)
   - [Submit Test](#submit-test)
7. [Review Answers](#review-answers)
8. [Analytics](#analytics)
9. [Review Center](#review-center)
10. [Error Reference](#error-reference)

---

## Connection & Setup

### Base URL

```
http://<your-host>/api/v1/student/
```

Local development:

```
http://localhost:8000/api/v1/student/
```

### Headers Required on Every Request

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <access_token>` |
| `Content-Type` | `application/json` |
| `Accept` | `application/json` |

---

## Authentication

All student endpoints require a valid JWT Bearer token for an active user (`is_active=True`). Obtain tokens from the auth endpoints:

```http
POST /api/auth/login/
Content-Type: application/json

{
  "email": "string@gmail.com",
  "password": "student123"
}
```

**Response:**
```json
{
  "access": "<jwt_access_token>",
  "refresh": "<jwt_refresh_token>",
  "user": {
    "id": "uuid",
    "email": "string@gmail.com",
    "full_name": "String User"
  }
}
```

Use `access` as the Bearer token. Refresh with `POST /api/auth/token/refresh/` when it expires.

---

## Profile

### Get Profile
```
GET /api/v1/student/profile/
```

**Response:**
```json
{
  "id": "uuid",
  "email": "string@gmail.com",
  "full_name": "String User",
  "target_band": "7.0",
  "study_streak": 5,
  "last_activity_date": "2026-03-27",
  "updated_at": "2026-03-27T10:00:00Z"
}
```

### Update Profile
```
PATCH /api/v1/student/profile/
```

Only `target_band` is writable.

```json
{
  "target_band": "7.5"
}
```

---

## Dashboard

```
GET /api/v1/student/dashboard/
```

Returns all data needed to render the student dashboard in a single call.

**Response:**
```json
{
  "current_band": 6.5,
  "tests_taken": 15,
  "reading_accuracy": 78,
  "listening_accuracy": 75,
  "study_streak": 5,
  "target_band": 7.0,
  "overall_journey_percent": 93,
  "in_progress_test": {
    "attempt_id": "uuid",
    "test_title": "Cambridge IELTS 18 Test 2",
    "test_type": "READING",
    "started_at": "2026-03-27T09:00:00Z",
    "progress_answered": 18,
    "progress_total": 40,
    "progress_percent": 45,
    "mode": "REAL"
  },
  "score_progress": [
    { "label": "Test 4", "band_score": 7.0, "test_title": "...", "completed_at": "..." },
    { "label": "Latest", "band_score": 6.5, "test_title": "...", "completed_at": "..." }
  ],
  "skills_snapshot": {
    "reading": 6.5,
    "listening": 7.0,
    "writing": 0.0,
    "speaking": 0.0
  },
  "weak_areas": [
    { "question_type": "MATCHING_HEADINGS", "accuracy": 78, "module": "Reading" },
    { "question_type": "MCQ_SINGLE", "accuracy": 75, "module": "Listening" }
  ],
  "recent_test_history": [
    {
      "attempt_id": "uuid",
      "test_name": "Cambridge IELTS 20 Test 1",
      "test_type": "READING",
      "completed_at": "2026-03-13T10:00:00Z",
      "score": 31,
      "total": 40,
      "band_score": 7.0
    }
  ],
  "achievements": [
    { "id": "uuid", "badge_type": "FIVE_DAY_STREAK", "badge_display": "5 Day Streak", "earned_at": "..." }
  ]
}
```

**Notes:**
- `in_progress_test` is `null` if no test is currently in progress.
- `score_progress` shows last 10 completed attempts, oldest first, latest last.
- `skills_snapshot.writing` and `.speaking` are `0.0` until writing/speaking modules are added.
- `study_streak` rule: +1 if one test completed today, reset to 1 if a day was skipped.

---

## Test Listing

### Reading Tests
```
GET /api/v1/student/tests/reading/
```

### Listening Tests
```
GET /api/v1/student/tests/listening/
```

### All Tests
```
GET /api/v1/student/tests/
```

**Pagination:** Results are paginated (default 20 per page). Response format:
```json
{
  "count": 10,
  "next": "http://localhost:8000/api/v1/student/tests/reading/?page=2",
  "previous": null,
  "results": [ ... ]
}
```
Use `?page=2&page_size=10` to paginate. Max `page_size` is 100.

**Query params:**

| Param | Values | Example |
|-------|--------|---------|
| `premium` | `true` / `false` | `?premium=false` returns FREE tests only |
| `difficulty` | `BEGINNER`, `INTERMEDIATE`, `ADVANCED` | `?difficulty=INTERMEDIATE` |
| `search` | text | `?search=Cambridge` |
| `ordering` | `created_at`, `-created_at`, `title`, `-title` | `?ordering=-created_at` |

**Response (Reading test item):**
```json
{
  "id": "uuid",
  "title": "Cambridge IELTS 18 Test 2",
  "description": null,
  "test_type": "READING",
  "type_display": "Reading",
  "difficulty_level": "BEGINNER",
  "difficulty_display": "Easy",
  "total_questions": 40,
  "time_limit_seconds": 3600,
  "is_premium": false,
  "reading_passages": [
    {
      "id": "uuid",
      "passage_number": "PASSAGE_1",
      "title": "Urban Gardens",
      "max_questions": 13,
      "difficulty_display": "Easy"
    },
    { "id": "uuid", "passage_number": "PASSAGE_2", "title": "Solar Architecture", "max_questions": 13, "difficulty_display": "Easy" },
    { "id": "uuid", "passage_number": "PASSAGE_3", "title": "Behavioral Economics", "max_questions": 14, "difficulty_display": "Easy" }
  ],
  "listening_parts": [],
  "user_attempt_status": {
    "attempt_id": "uuid",
    "status": "COMPLETED",
    "score": 31,
    "band_score": "7.0"
  }
}
```

`user_attempt_status` is `null` if the student has never attempted this test.

**Response (Listening test item):**
```json
{
  "id": "uuid",
  "title": "Cambridge IELTS 18 Listening Test 1",
  "test_type": "LISTENING",
  "is_premium": false,
  "reading_passages": [],
  "listening_parts": [
    { "id": "uuid", "part_number": "PART_1", "title": "Airport Shuttle Booking", "max_questions": 10, "difficulty_display": "Easy" },
    { "id": "uuid", "part_number": "PART_2", ... },
    { "id": "uuid", "part_number": "PART_3", ... },
    { "id": "uuid", "part_number": "PART_4", ... }
  ],
  "user_attempt_status": null
}
```

---

## Taking a Test

### Start / Resume Attempt

```http
POST /api/v1/student/attempts/
Content-Type: application/json

{
  "practice_test": "uuid-of-test",
  "mode": "REAL"
}
```

`mode` values: `REAL` (timed), `PRACTICE` (untimed).

**Behaviour:**
- If an `IN_PROGRESS` attempt already exists for this test, returns it (`200 OK`) instead of creating a duplicate.
- Otherwise creates a new attempt and pre-initialises `QuestionAnswer` records for all 40 questions (`201 Created`).

**Response (attempt detail for test-taking):**
```json
{
  "id": "uuid",
  "practice_test": "uuid",
  "practice_test_title": "Cambridge IELTS 18 Test 2",
  "test_type": "READING",
  "mode": "REAL",
  "status": "IN_PROGRESS",
  "started_at": "2026-03-27T09:00:00Z",
  "time_used_seconds": 0,
  "time_limit_seconds": 3600,
  "total_questions": 40,
  "answered_count": 0,
  "reading_passages": [
    {
      "id": "uuid",
      "passage_number": "PASSAGE_1",
      "title": "Urban Gardens and Public Health",
      "passage_text": "A\nUrban gardens are increasingly...",
      "max_questions": 13,
      "answered_count": 0,
      "question_groups": [
        {
          "id": "uuid",
          "question_type": "TFNG",
          "question_type_display": "True / False / Not Given",
          "group_order": 1,
          "instructions": "Do the following statements agree with the information given in Reading Passage 1?",
          "question_number_start": 1,
          "question_number_end": 5,
          "word_limit": null,
          "number_allowed": false,
          "group_content_json": null,
          "questions": [
            {
              "id": "uuid",
              "question_number": 1,
              "question_text": null,
              "options_json": { "statement": "Urban gardens are still treated only as informal hobbies." },
              "question_type": "TFNG",
              "question_type_display": "True / False / Not Given",
              "student_answer": null,
              "is_flagged": false
            }
          ]
        }
      ]
    }
  ],
  "listening_parts": []
}
```

**Note:** `correct_answer_json`, `explanation`, and `answer_evidence_json` are **never** returned during a test — only in review mode after submission.

### Resume an Attempt

```
GET /api/v1/student/attempts/<uuid>/
```

Returns the same shape as the start response, with `student_answer` and `is_flagged` populated for previously saved answers.

### Auto-Save Answers

Call this regularly during the test (e.g., every 30 seconds or on each answer change).

```http
PATCH /api/v1/student/attempts/<uuid>/save/
Content-Type: application/json

{
  "time_used_seconds": 245,
  "answers": [
    {
      "question_id": "uuid",
      "answer": { "answer": "TRUE" },
      "is_flagged": false,
      "time_spent_seconds": 30
    },
    {
      "question_id": "uuid",
      "answer": null,
      "is_flagged": true
    }
  ]
}
```

Send `"answer": null` to mark a question as skipped/unanswered. Only questions whose `question_id` appears in the list are updated — other questions are unaffected.

**Response:**
```json
{
  "answered": 12,
  "total": 40,
  "time_used_seconds": 245
}
```

### Submit Test

```http
POST /api/v1/student/attempts/<uuid>/submit/
Content-Type: application/json

{
  "time_used_seconds": 3540,
  "answers": [
    { "question_id": "uuid", "answer": { "answer": "FALSE" }, "is_flagged": false },
    { "question_id": "uuid", "answer": null }
  ]
}
```

**Behaviour:**
1. Saves any final answer changes.
2. Scores all 40 answers against the correct answers (case-insensitive for completion types; accepts `alternative_answers`).
3. Calculates band score from raw score using the standard IELTS mapping.
4. Marks attempt as `COMPLETED`.
5. Computes `question_type_stats_json` and `passage_stats_json`.
6. Updates study streak and awards any newly earned badges.
7. Auto-adds all wrong answers to the Review Center (tagged `is_wrong=true`).

**If the attempt is already `COMPLETED`**, returns the existing results without re-scoring.

**Response:**
```json
{
  "id": "uuid",
  "practice_test": "uuid",
  "practice_test_title": "Cambridge IELTS 18 Test 2",
  "test_type": "READING",
  "mode": "REAL",
  "status": "COMPLETED",
  "started_at": "2026-03-27T09:00:00Z",
  "completed_at": "2026-03-27T10:00:00Z",
  "time_used_seconds": 3540,
  "score": 31,
  "band_score": "7.0",
  "total_questions": 40,
  "correct_count": 31,
  "incorrect_count": 7,
  "unanswered_count": 2,
  "question_type_stats_json": {
    "TFNG": { "correct": 9, "total": 10, "accuracy_percent": 90 },
    "MATCHING_HEADINGS": { "correct": 6, "total": 8, "accuracy_percent": 75 },
    "MCQ_SINGLE": { "correct": 8, "total": 9, "accuracy_percent": 89 },
    "SENTENCE_COMPLETION": { "correct": 8, "total": 9, "accuracy_percent": 89 },
    "MATCH_PARA_INFO": { "correct": 0, "total": 4, "accuracy_percent": 0 }
  },
  "passage_stats_json": {
    "Passage 1": { "correct": 11, "total": 13 },
    "Passage 2": { "correct": 11, "total": 13 },
    "Passage 3": { "correct": 9, "total": 14 }
  }
}
```

**Band score mapping:**

| Raw Score | Band |
|-----------|------|
| 39–40 | 9.0 |
| 37–38 | 8.5 |
| 35–36 | 8.0 |
| 33–34 | 7.5 |
| 30–32 | 7.0 |
| 27–29 | 6.5 |
| 23–26 | 6.0 |
| 20–22 | 5.5 |
| 16–19 | 5.0 |
| 13–15 | 4.5 |
| 10–12 | 4.0 |
| 6–9 | 3.5 |
| 4–5 | 3.0 |
| 0–3 | 2.0 |

---

## Review Answers

```
GET /api/v1/student/attempts/<uuid>/review/
```

Only works on `COMPLETED` attempts. Returns the full test structure with correct answers, explanations, evidence highlights, and the student's answers.

**Response (Reading):**
```json
{
  "attempt_id": "uuid",
  "test_title": "Cambridge IELTS 18 Test 2",
  "test_type": "READING",
  "score": 31,
  "band_score": "7.0",
  "time_used_seconds": 3540,
  "question_type_stats": { ... },
  "passages": [
    {
      "id": "uuid",
      "passage_number": "PASSAGE_1",
      "title": "Urban Gardens and Public Health",
      "passage_text": "A\nUrban gardens are increasingly...",
      "max_questions": 13,
      "correct_count": 11,
      "total_count": 13,
      "performance_label": "GOOD",
      "question_groups": [
        {
          "id": "uuid",
          "question_type": "TFNG",
          "questions": [
            {
              "id": "uuid",
              "question_number": 1,
              "question_text": null,
              "options_json": { "statement": "Urban gardens are still treated only as informal hobbies." },
              "question_type": "TFNG",
              "correct_answer_json": { "answer": "FALSE" },
              "explanation": "Paragraph A states urban gardens are 'treated as part of public-health infrastructure rather than informal hobby projects'.",
              "answer_evidence_json": {
                "text_snippet": "treated as part of public-health infrastructure rather than informal hobby projects",
                "paragraph": "A"
              },
              "student_answer": { "answer": "TRUE" },
              "is_correct": false,
              "is_skipped": false,
              "is_flagged": false
            }
          ]
        }
      ]
    }
  ]
}
```

**Response (Listening):** Same shape but `parts` instead of `passages`. Each `ListeningPart` includes `transcript_text` and `audio_file_url`.

### Answer Evidence for Highlighting

The `answer_evidence_json` field provides the exact location of the answer in the source text:

**Reading (passage text highlighting):**
```json
{
  "text_snippet": "treated as part of public-health infrastructure rather than informal hobby projects",
  "paragraph": "A"
}
```
Use `text_snippet` to find and highlight the relevant sentence within `passage_text`.

**Listening (transcript highlighting):**
```json
{
  "text_snippet": "The passenger surname is Henderson",
  "timestamp": "00:45"
}
```
Use `text_snippet` to find and highlight the relevant line in `transcript_text`.

### Performance Labels

Each passage/part gets a `performance_label`:

| Label | Accuracy |
|-------|----------|
| `GOOD` | ≥ 80% |
| `AVERAGE` | 60–79% |
| `CRITICAL` | < 60% |

---

## Analytics

```
GET /api/v1/student/analytics/
```

Returns all data needed to render the Progress Analytics page.

**Response:**
```json
{
  "current_band": 6.5,
  "target_band": 7.0,
  "practice_sessions": 15,
  "average_accuracy": 77,
  "band_progression": [
    { "label": "Test 1", "band_score": 5.5, "test_title": "...", "completed_at": "..." },
    { "label": "Test 2", "band_score": 6.0, "test_title": "...", "completed_at": "..." },
    { "label": "Recent", "band_score": 6.5, "test_title": "...", "completed_at": "..." }
  ],
  "module_performance": {
    "reading": 78,
    "listening": 75,
    "writing": 65,
    "speaking": 68
  },
  "weekly_activity": [
    { "week": "W1", "sessions": 8 },
    { "week": "W2", "sessions": 3 },
    { "week": "W3", "sessions": 9 },
    { "week": "W4", "sessions": 5 }
  ],
  "accuracy_improvement": [
    { "week": "W1", "accuracy": 62 },
    { "week": "W2", "accuracy": 65 },
    { "week": "W3", "accuracy": 70 },
    { "week": "W4", "accuracy": 76 }
  ],
  "recent_activity": [
    {
      "attempt_id": "uuid",
      "completed_at": "2026-03-27T10:45:00Z",
      "test_title": "Cambridge IELTS 18 Test 2",
      "test_type": "READING",
      "accuracy": 78,
      "time_used_seconds": 720,
      "top_question_type": "MATCHING_HEADINGS",
      "score": 31,
      "total": 40
    }
  ],
  "learning_insights": [
    "Reading accuracy improved by 8% this month.",
    "Listening is your most consistent module."
  ]
}
```

---

## Review Center

### Get Review Center
```
GET /api/v1/student/review-center/
```

**Query params:**

| Param | Values |
|-------|--------|
| `module` | `READING`, `LISTENING` |
| `reason` | `wrong`, `saved`, `weak_area`, `flagged` |
| `search` | text search in question_text / explanation |

**Response:**
```json
{
  "stats": {
    "total_to_review": 5,
    "most_difficult_type": "MATCHING_HEADINGS",
    "weakest_module": "Writing",
    "accuracy_trend": "+6%"
  },
  "mistakes_by_type": [
    { "question_type": "MATCHING_HEADINGS", "count": 20 },
    { "question_type": "TFNG", "count": 15 },
    { "question_type": "MCQ_SINGLE", "count": 10 }
  ],
  "mistakes_by_module": {
    "reading": 25,
    "listening": 20
  },
  "review_items": [
    {
      "id": "uuid",
      "question": "uuid",
      "attempt": "uuid",
      "question_number": 6,
      "question_text": "Section B",
      "question_type": "MATCHING_HEADINGS",
      "question_type_display": "Matching Headings",
      "difficulty": "Intermediate",
      "correct_answer": { "answer": "ii" },
      "explanation": "...",
      "test_name": "Cambridge IELTS 18 Test 2",
      "source_label": "Cambridge IELTS 18 Test 2 / Passage 1",
      "student_answer": { "answer": "iv" },
      "is_wrong": true,
      "is_saved": true,
      "is_weak_area": false,
      "is_flagged": false,
      "reasons": ["wrong", "saved"],
      "created_at": "2026-03-27T10:00:00Z"
    }
  ]
}
```

### Add to Review Center
```http
POST /api/v1/student/review-center/
Content-Type: application/json

{
  "question_id": "uuid",
  "attempt_id": "uuid",
  "is_wrong": false,
  "is_saved": true,
  "is_weak_area": false,
  "is_flagged": false
}
```

If the question is already in the review center, its tags are updated (upsert). Returns `201` on create, `200` on update.

**Note:** Wrong answers are automatically added with `is_wrong=true` when a test is submitted. You don't need to call this manually for wrong answers.

### Update a Review Item
```http
PATCH /api/v1/student/review-center/<uuid>/
Content-Type: application/json

{
  "is_saved": true,
  "is_weak_area": true
}
```

### Remove from Review Center
```
DELETE /api/v1/student/review-center/<uuid>/
```

Returns `204 No Content`.

---

## Error Reference

All error responses follow this format:

```json
{
  "detail": "Not found."
}
```

Or for validation errors:

```json
{
  "field_name": ["This field is required."]
}
```

| HTTP Status | When |
|-------------|------|
| `200 OK` | Successful GET / PATCH / existing in-progress attempt returned on POST |
| `201 Created` | New resource created |
| `204 No Content` | Successful DELETE |
| `400 Bad Request` | Validation error — check field-level error details |
| `401 Unauthorized` | Missing or expired token |
| `403 Forbidden` | Valid token but insufficient permission |
| `404 Not Found` | Resource doesn't exist or belongs to another user |

---

## Badges Reference

Badges are awarded automatically after test submission:

| Badge Type | Condition |
|------------|-----------|
| `FIRST_TEST` | Completes first test |
| `FIVE_DAY_STREAK` | 5-day study streak |
| `TEN_DAY_STREAK` | 10-day study streak |
| `THIRTY_DAY_STREAK` | 30-day study streak |
| `BAND_6_SPRINT` | Achieves band ≥ 6.0 on any test |
| `BAND_7_SPRINT` | Achieves band ≥ 7.0 on any test |
| `BAND_8_SPRINT` | Achieves band ≥ 8.0 on any test |
| `PERFECT_SCORE` | Scores 40/40 on any test |

---

## Mock Data (Development)

Run the seed command to populate development data:

```bash
python manage.py seed_student_data
```

This creates:
- **Student:** `string@gmail.com` / `student123`
- **Admin:** `admin@ieltsmaster.com` / `admin123`
- **4 practice tests** (2 reading, 2 listening) with real passage text and 40 questions each
- **14 completed attempts** showing band progression from 5.5 → 6.5
- **1 in-progress attempt**
- **3 badges** earned
- **37 review items** (wrong answers auto-added)
