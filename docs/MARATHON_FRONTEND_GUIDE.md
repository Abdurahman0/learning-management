# Marathon Feature — Frontend Integration Guide

This document covers every API endpoint, every response shape, all state transitions, and design recommendations for building the Marathon feature in the frontend. It is intended to be handed directly to a frontend developer or AI agent.

---

## Table of Contents

1. [Base URLs & Auth](#1-base-urls--auth)
2. [Data Models (What the API Returns)](#2-data-models)
3. [Student API — Complete Reference](#3-student-api)
4. [Admin API — Complete Reference](#4-admin-api)
5. [Error Response Shape](#5-error-responses)
6. [State Machine: Enrollment & Day Flow](#6-state-machine)
7. [Gamification Design Guide](#7-gamification-design-guide)
8. [Screen-by-Screen UX Recommendations](#8-screen-by-screen-ux)
9. [Edge Cases & Gotchas](#9-edge-cases--gotchas)

---

## 1. Base URLs & Auth

```
Student endpoints: /api/v1/student/marathons/
Admin endpoints:   /api/v1/admin/marathons/
                   /api/v1/admin/marathon-series/
                   /api/v1/admin/marathon-reading-passages/
                   /api/v1/admin/marathon-listening-parts/
```

All endpoints require `Authorization: Bearer <access_token>` header.

---

## 2. Data Models

### Marathon (in list)
```json
{
  "id": "uuid",
  "title": "30-Day IELTS Sprint",
  "description": "...",
  "marathon_days": 30,
  "difficulty": "INTERMEDIATE",
  "difficulty_display": "Intermediate",
  "category": "MIXED",
  "category_display": "Mixed",
  "target_band": "7.0",
  "for_premium_users": false,
  "external_link": "https://...",
  "external_link_title": "Official resource",
  "enrollment": null | {
    "id": "uuid",
    "status": "ENROLLED" | "ACTIVE" | "COMPLETED" | "ABANDONED",
    "is_finished_marathon": false,
    "current_streak": 3,
    "enrolled_at": "2026-05-01T10:00:00Z"
  }
}
```

### Marathon (detail)
Same as list, plus:
```json
{
  "total_days": 30,
  "streak_goal_days": 7,
  "enrollment": {
    "id": "uuid",
    "marathon": "uuid",
    "status": "ACTIVE",
    "enrolled_at": "...",
    "last_activity_at": "...",
    "completed_at": null,
    "is_finished_marathon": false,
    "current_streak": 3,
    "longest_streak": 5,
    "days_missed": 1,
    "total_score": "42.50",
    "total_time_seconds": 7200,
    "current_day_number": 4,
    "days_completed": 3,
    "progress_percentage": 10.0
  }
}
```

### MarathonDay (in list)
```json
{
  "id": "uuid",
  "day_number": 1,
  "title": "Introduction to IELTS Reading",
  "difficulty": "EASY" | "MEDIUM" | "HARD" | null,
  "estimated_minutes": 45,
  "is_bonus_day": false,
  "is_completable": true,
  "is_locked": false,
  "is_completed": false,
  "external_links_count": 2,
  "reading_passages_count": 1,
  "listening_parts_count": 0
}
```

### MarathonDay (detail)
```json
{
  "id": "uuid",
  "day_number": 1,
  "title": "...",
  "content": "Plain text content written by admin...",
  "difficulty": "EASY",
  "estimated_minutes": 45,
  "is_bonus_day": false,
  "is_completable": true,
  "is_locked": false,
  "is_completed": false,
  "student_day_id": "uuid" | null,
  "time_spent_seconds": 1200,
  "external_links": [
    { "id": "uuid", "title": "BBC English", "url": "https://...", "order": 0 }
  ],
  "reading_passages": [
    {
      "id": "uuid",
      "title": "The History of Maps",
      "max_questions": 13,
      "difficulty_level": "INTERMEDIATE",
      "estimated_time_minutes": 20,
      "is_available_to_be_solved": true,
      "attempt_id": null | "uuid",
      "attempt_status": null | "IN_PROGRESS" | "COMPLETED",
      "band_score": null | "7.0",
      "question_groups_count": 3
    }
  ],
  "listening_parts": [
    {
      "id": "uuid",
      "title": "Airport Conversation",
      "max_questions": 10,
      "difficulty_level": "INTERMEDIATE",
      "estimated_time_minutes": 10,
      "audio_file_url": "https://...",
      "is_available_to_be_solved": true,
      "attempt_id": null | "uuid",
      "attempt_status": null | "IN_PROGRESS" | "COMPLETED",
      "band_score": null | "6.5",
      "question_groups_count": 2
    }
  ],
  "note": null | {
    "id": "uuid",
    "note_text": "Remember to skim first...",
    "updated_at": "2026-05-03T15:30:00Z"
  }
}
```

### MarathonAttempt (during attempt)
```json
{
  "id": "uuid",
  "enrollment": "uuid",
  "day": "uuid",
  "reading_passage": "uuid" | null,
  "listening_part": "uuid" | null,
  "status": "IN_PROGRESS" | "COMPLETED",
  "score": null | 9,
  "band_score": null | "7.0",
  "started_at": "...",
  "completed_at": null | "...",
  "time_used_seconds": 0,
  "questions_answered": 3,
  "total_questions": 13,
  "content": { /* full reading passage object with question groups */ }
}
```

### MarathonAttemptResult (after submit)
```json
{
  "id": "uuid",
  "status": "COMPLETED",
  "score": 9,
  "band_score": "7.0",
  "question_type_stats_json": { "TRUE_FALSE_NOT_GIVEN": { "correct": 4, "total": 6 } },
  "time_used_seconds": 1140,
  "started_at": "...",
  "completed_at": "...",
  "correct_count": 9,
  "incorrect_count": 3,
  "skipped_count": 1,
  "answers": [
    {
      "id": "uuid",
      "question": "uuid",
      "question_number": 1,
      "question_text": "The author claims...",
      "question_type": "TRUE_FALSE_NOT_GIVEN",
      "student_answer_json": { "answer": "TRUE" },
      "correct_answer_json": { "answer": "TRUE" },
      "is_correct": true,
      "is_skipped": false,
      "is_flagged": false,
      "explanation": "Line 4 states...",
      "answer_evidence_json": { "source": "paragraph 2" }
    }
  ]
}
```

### Leaderboard entry
```json
{
  "rank": 1,
  "student_full_name": "Ali Karimov",
  "total_score": "87.50",
  "current_streak": 12,
  "is_finished_marathon": false,
  "days_completed": 14,
  "is_self": true
}
```

---

## 3. Student API

### 3.1 List Marathons
```
GET /api/v1/student/marathons/
```
- Returns paginated list (`count`, `results`)
- Free users: only non-premium Marathons returned
- Premium users: all visible Marathons returned
- Each item includes inline `enrollment` object if student is enrolled

**When to call:** Marathon discovery/browse screen. Call on mount.

---

### 3.2 Marathon Detail
```
GET /api/v1/student/marathons/{marathon_id}/
```
- Returns full Marathon with nested `enrollment` (full enrollment object if enrolled, null if not)
- **403** if Marathon is hidden or premium-only and user is not premium

**When to call:** When student taps a Marathon card to view it.

---

### 3.3 Enroll
```
POST /api/v1/student/marathons/{marathon_id}/enroll/
```
- No request body needed
- **201** on first enrollment, **200** if already enrolled
- **400** if enrollment cap is full
- **403** if premium-only and student is free

**Response:** Full enrollment object

**When to call:** Student taps "Start Marathon" / "Enroll" button.

---

### 3.4 Enrollment Detail
```
GET /api/v1/student/marathons/{marathon_id}/enrollment/
```
- Returns full enrollment object including `current_day_number`, `progress_percentage`, streaks
- **403** if not enrolled

**When to call:** Marathon home screen (after enrollment) to refresh progress.

---

### 3.5 Day List
```
GET /api/v1/student/marathons/{marathon_id}/days/
```
- Returns only **unlocked** days (up to `current_day_number`)
- Each item has `is_locked`, `is_completed`, `is_completable`
- **403** if not enrolled

**When to call:** Marathon day-grid / progress screen.

---

### 3.6 Day Detail
```
GET /api/v1/student/marathons/{marathon_id}/days/{day_number}/
```
- **403** if day number > current day (locked day)
- Returns full day with content, external links, passage/part list with attempt state
- Side effect: creates `StudentMarathonDay` record on first visit (increments retry_count on subsequent visits)

**When to call:** Student opens a day.

---

### 3.7 Mark Day Complete
```
POST /api/v1/student/marathons/{marathon_id}/days/{day_number}/complete/
```
No request body.

**Success response:**
```json
{
  "detail": "Day marked as complete.",
  "is_completed": true,
  "day_band_score": "7.0",
  "current_streak": 4,
  "is_finished_marathon": false
}
```

**400** responses:
- Day has no passages/parts: `"This day has no passages or parts — it cannot be marked complete."`
- Incomplete attempts: returns `{ "detail": "...", "incomplete": [{ "type": "reading_passage", "id": "...", "title": "..." }] }`

**Already completed (idempotent):**
```json
{ "detail": "Day already completed.", "is_completed": true }
```

**When to call:** Student taps "Mark as Complete" button. Show results modal with streak/score info.

---

### 3.8 Day Note (GET / PUT / PATCH)
```
GET    /api/v1/student/marathons/{marathon_id}/days/{day_number}/note/
PUT    /api/v1/student/marathons/{marathon_id}/days/{day_number}/note/
PATCH  /api/v1/student/marathons/{marathon_id}/days/{day_number}/note/
```
- GET returns `{ "note_text": null }` if no note exists
- PUT replaces entirely, PATCH updates partially
- Body: `{ "note_text": "..." }`

**When to call:** Note editor on day detail screen.

---

### 3.9 Start Attempt
```
POST /api/v1/student/marathons/{marathon_id}/days/{day_number}/attempts/
```
Body (provide exactly one):
```json
{ "passage_id": "uuid" }
// or
{ "part_id": "uuid" }
```

**201** — new attempt created, returns `MarathonAttemptDetail`
**200** — IN_PROGRESS attempt already exists, returned as-is
**400** — passage/part already COMPLETED for this enrollment: `{ "detail": "...", "is_available_to_be_solved": false }`
**403** — day is locked

**When to call:** Student taps a passage/part card to begin.

---

### 3.10 Get Attempt Detail
```
GET /api/v1/student/marathons/{marathon_id}/days/{day_number}/attempts/{attempt_id}/
```
Returns current attempt state with `content` (reading passage + questions).

---

### 3.11 Save Answers (auto-save)
```
PATCH /api/v1/student/marathons/{marathon_id}/days/{day_number}/attempts/{attempt_id}/save/
```
Body:
```json
{
  "time_used_seconds": 240,
  "answers": [
    {
      "question_id": "uuid",
      "answer": { "answer": "TRUE" },
      "is_flagged": false,
      "time_spent_seconds": 20
    }
  ]
}
```
Response: `{ "answered": 5, "total": 13, "time_used_seconds": 240 }`

**Only works on IN_PROGRESS attempts.**

**When to call:** Every 30–60 seconds during an active attempt, and on tab/visibility change.

---

### 3.12 Submit Attempt
```
POST /api/v1/student/marathons/{marathon_id}/days/{day_number}/attempts/{attempt_id}/submit/
```
Body: `{ "time_used_seconds": 1200 }` (optional)

Returns `MarathonAttemptResult`.

If already COMPLETED, returns result immediately (idempotent).

**When to call:** Student taps "Submit" at end of attempt.

---

### 3.13 Review Attempt
```
GET /api/v1/student/marathons/{marathon_id}/days/{day_number}/attempts/{attempt_id}/review/
```
Returns `MarathonAttemptResult` (only for COMPLETED attempts — 404 if IN_PROGRESS).

**When to call:** Student taps "Review" from day detail to see past results.

---

### 3.14 Leaderboard
```
GET /api/v1/student/marathons/{marathon_id}/leaderboard/
```
- **403** if not enrolled
- Returns ranked list, includes `is_self: true` on the student's own entry

---

## 4. Admin API

All admin endpoints require `is_staff = true` on the user.

### Marathon CRUD
```
GET    /api/v1/admin/marathons/          — list (paginated)
POST   /api/v1/admin/marathons/          — create
GET    /api/v1/admin/marathons/{id}/     — detail
PATCH  /api/v1/admin/marathons/{id}/     — update
DELETE /api/v1/admin/marathons/{id}/     — delete
```

**Create body fields:**
```json
{
  "title": "string (required)",
  "description": "string",
  "marathon_days": 30,
  "difficulty": "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
  "category": "READING_FOCUS" | "LISTENING_FOCUS" | "MIXED",
  "target_band": "7.0",
  "streak_goal_days": 7,
  "is_visible": false,
  "for_premium_users": false,
  "max_enrollments": null,
  "external_link": "https://...",
  "external_link_title": "string",
  "series": "uuid | null"
}
```

> Creating a Marathon auto-creates `marathon_days` Day records.
> `marathon_days` cannot be reduced once set (would destroy content).

---

### Series CRUD
```
GET/POST   /api/v1/admin/marathon-series/
GET/PATCH/DELETE /api/v1/admin/marathon-series/{id}/
```
Fields: `name`, `description`, `is_active`

---

### Day Management
```
GET   /api/v1/admin/marathons/{marathon_id}/days/               — list all days
GET   /api/v1/admin/marathons/{marathon_id}/days/{day_number}/  — day detail
PATCH /api/v1/admin/marathons/{marathon_id}/days/{day_number}/  — update day
```
Editable day fields: `title`, `content`, `difficulty`, `estimated_minutes`, `is_bonus_day`

---

### External Links per Day
```
GET/POST  /api/v1/admin/marathons/{marathon_id}/days/{day_number}/external-links/
PATCH/DELETE /api/v1/admin/marathons/{marathon_id}/days/{day_number}/external-links/{link_id}/
```
Fields: `title`, `url`, `order`

---

### Marathon Reading Passages
```
GET/POST  /api/v1/admin/marathons/{marathon_id}/reading-passages/
GET/PATCH/DELETE /api/v1/admin/marathon-reading-passages/{pk}/
```
Create body (same as regular reading passage but `passage_number` optional):
```json
{
  "title": "string",
  "passage_text": "string",
  "difficulty_level": "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
  "topic": "string",
  "estimated_time_minutes": 20,
  "max_questions": 13,
  "time_limit_seconds": 1200,
  "is_active": true
}
```
Response always includes `"source": "MARATHON"` — these passages are isolated from regular content.

---

### Marathon Listening Parts
```
GET/POST  /api/v1/admin/marathons/{marathon_id}/listening-parts/
GET/PATCH/DELETE /api/v1/admin/marathon-listening-parts/{pk}/
```
Same pattern as passages. `part_number` optional.

---

### Assign / Remove Passage or Part to a Day
```
POST   /api/v1/admin/marathons/{marathon_id}/days/{day_number}/assign-passage/{pk}/
DELETE /api/v1/admin/marathons/{marathon_id}/days/{day_number}/assign-passage/{pk}/

POST   /api/v1/admin/marathons/{marathon_id}/days/{day_number}/assign-part/{pk}/
DELETE /api/v1/admin/marathons/{marathon_id}/days/{day_number}/assign-part/{pk}/
```
POST → 200, DELETE → 204. No body needed.

---

### Enrollments
```
GET /api/v1/admin/marathons/{marathon_id}/enrollments/
```
Paginated. Returns all enrollments with student info, progress, streak.

---

### Admin Leaderboard
```
GET /api/v1/admin/marathons/{marathon_id}/leaderboard/
```
Same shape as student leaderboard but without `is_self`.

---

## 5. Error Responses

All `/api/v1/` errors are wrapped:
```json
{
  "error": {
    "code": "VALIDATION_ERROR" | "PERMISSION_DENIED" | "NOT_FOUND" | "BAD_REQUEST" | ...,
    "message": "Human-readable message here.",
    "details": { "field_name": "specific error" }
  }
}
```

**Check `response.data.error.message`** — not `response.data.detail`.

Common codes:
- `VALIDATION_ERROR` → 400
- `PERMISSION_DENIED` → 403 (not enrolled, premium gate, hidden Marathon, locked day)
- `NOT_FOUND` → 404
- `AUTHENTICATION_ERROR` → 401

---

## 6. State Machine

### Enrollment Status
```
(not enrolled)
    ↓ POST /enroll/
ENROLLED
    ↓ first day completed
ACTIVE
    ↓ all completable days done
COMPLETED
```

### Attempt Status
```
(no attempt)
    ↓ POST /attempts/
IN_PROGRESS
    ↓ POST /attempts/{id}/submit/
COMPLETED
```

### Day `is_locked` logic
```
is_locked = day_number > enrollment.current_day_number
current_day_number = min((today - enrolled_at.date()).days + 1, marathon_days)
```
Day 1 = enrollment day. Day 2 = next calendar day. Etc.

### `is_completable` vs `is_completed`
- `is_completable`: admin has added at least one active passage or part to this day
- `is_completed`: student has marked this day complete

A day can be `is_completable: false` (no content added by admin yet) — in that case "Mark Complete" button is not available.

---

## 7. Gamification Design Guide

### Philosophy

Marathon gamification should feel **earned**, not decorative. Every visual reward — a badge, a streak number, a rank — must correspond to something the student actually achieved. Avoid participation trophies or animations that trigger for no-ops.

---

### 7.1 Day Grid — The Core Experience

**Inspiration: Khan Academy Unit Map + Duolingo Path**

Render the day list as a visual path, not a boring table. Think of it as a trail:

```
[Day 1 ✓] → [Day 2 ✓] → [Day 3 🔓 current] → [Day 4 🔒] → [Day 5 🔒] → ...
```

- **Completed days**: solid fill, checkmark, show band score badge if available
- **Current day** (= `current_day_number`): pulsing ring or glow, "Today" label, prominent CTA
- **Locked days**: muted/gray, lock icon, show day number only — no content preview to create anticipation
- **Bonus days**: distinct visual marker (star icon, dashed border)

**Path layout options:**
- Straight horizontal scroll (simple, mobile-friendly)
- Zigzag/snake path (like Khan Academy units) — gives a sense of journey
- Calendar grid (for longer marathons, 30+ days) — shows days 1-7 per row

For short Marathons (≤14 days): snake/path layout
For long Marathons (≥21 days): calendar grid with weekly rows

---

### 7.2 Streak Counter

**Where to show it:**
- Marathon home screen: large, prominent (think Duolingo flame)
- Day completion modal: animated increment
- Day grid header: compact flame icon + number

**Design details:**
- Use a flame icon — universal "streak" metaphor
- Color: orange/amber when active, gray when streak = 0
- On completing a day: animate the counter incrementing with a bounce
- If student's streak just hit the Marathon's `streak_goal_days`: special animation + badge reveal

**When streak resets** (skipped a day):
- Do NOT show a destructive red "you broke your streak" message on day open
- Instead: show it gently in the Marathon home screen header — "Streak reset. Start fresh today."
- Don't shame, redirect.

---

### 7.3 Progress Bar

Use `enrollment.progress_percentage` to drive a top-of-screen progress bar on the Marathon home.

```
[===========================-------]  73%  Day 22 of 30
```

- Show days completed / total days
- Animate fill when it changes
- Color shift as it fills: blue → teal → green near completion

---

### 7.4 Badges — When and How to Show

**Badge reveal moment** is critical — it should feel special, not routine.

| Badge | Trigger | UI moment |
|---|---|---|
| Marathon Finisher | All days complete | Full-screen celebration modal |
| Perfect Marathon Day | All band 9.0 on one day | Inline in day-complete modal |
| 7-Day Streak | Streak hits streak_goal_days | Popup banner during day-complete flow |
| Speed Runner | Finish before total days elapsed | Part of Marathon Finisher modal |

**Design principles:**
- Use a **modal / bottom sheet** to reveal badges — full attention, not a toast
- Show badge icon + name + a short description of what the student did to earn it
- "Tap to share" (optional) or "Continue" CTA
- Badges should be collectible — show a badges section on the student profile

**Where to display earned badges:**
- On enrollment card in Marathon list: show small badge icons below
- On Marathon detail: "Your Achievements" section
- On global profile: a "Marathon Badges" collection

---

### 7.5 Day Completion Modal

After `POST .../complete/` returns success, show a modal (not just a toast). This is the core emotional moment.

Modal should show:
1. **Checkmark animation** (lottie or CSS)
2. **Day X complete!** heading
3. Day band score (if available): "Today's Band Score: **7.0**"
4. Streak info: "🔥 4-day streak"
5. If `is_finished_marathon: true` → transition to Marathon Completion screen
6. If badge earned → badge reveal after dismissing the score

Avoid cramming everything in one modal. Use a sequence:
- Step 1: Score + streak
- Step 2 (if badge earned): Badge reveal
- Step 3 (if marathon finished): Full celebration

---

### 7.6 Marathon Completion Screen

When `is_finished_marathon: true` after day complete — show a dedicated celebration screen:

- Full-screen with confetti/particle animation
- "You completed [Marathon Name]!" heading
- Stats summary:
  - Total days: X
  - Highest streak: `enrollment.longest_streak`
  - Total score: `enrollment.total_score`
  - Time taken: X days (vs marathon_days target)
- Badges earned during this Marathon
- CTA: "See Leaderboard" / "Browse More Marathons"

---

### 7.7 Leaderboard

**Where:** A tab on the Marathon screen, visible after enrollment.

**Design:**
- Podium (top 3) at top with larger cards
- Scrollable list below
- **Highlight the current student's row** (use `is_self: true`) — sticky or visually distinct
- Show: rank, name (first name + last initial for privacy), total score, streak, days done
- Sort is by `total_score` desc, then `current_streak` desc (handled server-side)

**Don't show leaderboard before enrollment** — it should feel like a reward for participating.

---

### 7.8 Attempt Flow (Passage / Part)

From the day detail screen:
1. Student sees passage/part card with `is_available_to_be_solved`
2. If `attempt_status === "COMPLETED"` → show band score chip on the card, "Review" button
3. If `attempt_status === "IN_PROGRESS"` → show "Continue" button
4. If `attempt_status === null` → show "Start" button

**In-attempt screen:**
- Same layout as regular practice test (reuse existing attempt UI)
- Add a top banner: "Marathon Day X — [Passage Title]"
- Auto-save every 60 seconds via `PATCH .../save/`
- Show answered/total counter: "5 / 13 answered"

**After submit:**
- Transition to result screen showing score + band + question-by-question review
- Back button returns to day detail — student can now see the band score on the passage card
- "Mark Day Complete" button becomes active when all passages/parts are COMPLETED

---

### 7.9 Premium Gate UI

When a free student encounters a premium Marathon:
- Show the Marathon card with a gold lock icon / "Premium" badge
- On tap: show an upgrade prompt, not a raw 403 error
- Do NOT hide premium Marathons entirely — showing them drives upgrade motivation

On enrollment attempt for premium Marathon:
- API returns 403
- Show: "This Marathon is for Premium members. Upgrade to unlock."

---

### 7.10 Enrollment Cap UI

If `enrollment.max_enrollments` is set and the Marathon is full:
- Show "Full" badge on Marathon card
- Disable enroll button (check via detail API before showing button, or handle 400 gracefully)
- API returns 400 with `error.message` containing "full" / "closed"

---

### 7.11 External Links per Day

Show as a "Resources" section at the bottom of the day detail screen:
- Icon + title + arrow → opens in browser
- Group under a "📎 Resources for today" collapsible section
- Don't show section if `external_links_count === 0`

---

### 7.12 Day Notes

- Collapsible sticky note section at the bottom of the day detail
- Autosave on blur (use PATCH)
- Show last updated timestamp
- Placeholder: "Write your notes for today..."
- Soft yellow/cream background to distinguish from main content

---

### 7.13 When NOT to Use Gamification

Gamification hurts when:
- **The student is struggling**: if band score is < 5.0 on most passages, don't emphasize score prominently. Show encouragement instead: "Keep going — your next day is unlocked."
- **The Marathon has no content yet**: don't show progress bar at 0% with dramatic fanfare. Show a neutral "Day 1 coming soon" if no passages assigned.
- **Re-attempting a day**: incrementing retry_count is tracked internally but don't surface this to students as a negative. Don't show "3rd attempt" badges.
- **Leaderboard with one person**: if only 1 enrollment, don't show leaderboard (check `count` on enrollments response first).

---

## 8. Screen-by-Screen UX

### Screen 1: Marathon Browse (`/marathons`)
- Grid or list of Marathon cards
- Filters: difficulty, category, premium/free
- Each card shows: title, days, difficulty chip, category chip, premium badge (if applicable), enrollment status badge ("Enrolled", "Completed", "Active")
- Sort: newest first (default API ordering)

### Screen 2: Marathon Detail (`/marathons/{id}`)
- If not enrolled: show overview + Enroll button
- If enrolled: show progress bar, streak, days grid, quick-action "Continue Day X" button

### Screen 3: Day Grid (part of Marathon Detail or separate)
- Snake/path layout or calendar grid (based on total days)
- Clearly separate: completed / current / locked sections
- "Today" marker on current day

### Screen 4: Day Detail (`/marathons/{id}/days/{n}`)
- Top: day title + estimated time + difficulty
- Body: plain-text content (render as formatted text, support newlines/paragraphs)
- Section: Passages (cards with attempt state)
- Section: Listening Parts (cards with audio button + attempt state)
- Section: Resources (external links)
- Section: My Notes (sticky note editor)
- Bottom CTA: "Mark as Complete" — enabled only when all passages/parts COMPLETED

### Screen 5: Attempt Screen
- Reuse existing attempt UI
- Marathon context banner at top

### Screen 6: Results Screen (after submit)
- Score, band, correct/incorrect/skipped breakdown
- Per-question review (correct answer shown)
- "Back to Day" CTA

### Screen 7: Day Complete Modal
- Sequential: score → badge (if any) → marathon-complete (if any)

### Screen 8: Leaderboard
- Podium + scrollable list
- Own row highlighted

### Screen 9: Enrollment Screen (first time)
- Simple: Marathon title + brief description + "Enroll" CTA
- Post-enroll: transition to Day Grid with Day 1 highlighted

---

## 9. Edge Cases & Gotchas

| Situation | API behavior | UI recommendation |
|---|---|---|
| Student visits Day 3 but only Day 1 is unlocked | GET day detail → 403 | Lock day cards, don't route to locked days |
| Student tries to complete a day with no passages | POST complete → 400 "cannot be marked complete" | Hide "Mark Complete" button when `is_completable: false` |
| Student already completed a passage | POST attempt create → 400 `is_available_to_be_solved: false` | Show "Completed" chip on passage card, "Review" button |
| IN_PROGRESS attempt resumed | POST attempt create → 200 (existing attempt) | Resume seamlessly, don't show "already started" warning |
| Marathon is full | POST enroll → 400 | Show "Full" state on card before enrollment attempt |
| Premium Marathon, free user | GET detail → 403 | Show upgrade prompt, not generic error |
| Leaderboard, student not enrolled | GET leaderboard → 403 | Don't show leaderboard tab until enrolled |
| Day has bonus flag | `is_bonus_day: true` | Mark visually as optional, don't count toward completion check |
| Day complete — already done | POST complete → 200 idempotent | Treat same as first completion, no duplicate animation |
| Marathon days extended by admin | New days appear as locked | Day grid should refresh after navigation |
| `progress_percentage` is 0.0 | No days completed yet | Show empty progress bar, not "0%" text prominently |
