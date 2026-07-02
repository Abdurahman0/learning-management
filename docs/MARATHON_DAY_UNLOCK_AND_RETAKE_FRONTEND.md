# Marathon: Progression-Based Day Unlock + Retake Feature — Frontend Integration Guide

**Audience:** frontend AI agent / frontend developers.
**Backend status:** implemented, migrated (`0020`), fully tested. All endpoints live under the existing base path:

```
/api/v1/student/marathons/
```

Auth: JWT Bearer token (unchanged). All endpoints require an authenticated, enrolled student (same rules as before).

---

## Change 1 — Days now unlock immediately after completing the previous day

### Old behavior
A student could only access day `N` after `N` calendar days had elapsed since enrollment. Finishing Day 1 on the enrollment day still left Day 2 locked until the next calendar day.

### New behavior
The unlocked day is now:

```
current_day_number = min( max(days_elapsed_since_enrollment, highest_completed_day + 1), marathon_days )
```

Meaning:

- **Completing a day instantly unlocks the next day.** Finish Day 1 → Day 2 is available immediately, same session.
- **Time-based unlocking still works** as a fallback: even if the student completes nothing, one new day still unlocks per calendar day (as before).
- The value is always capped at the marathon's total `marathon_days`.
- "Completing a day" means the day-complete endpoint succeeded: `POST /{marathon_id}/days/{day_number}/complete/`.

### What the frontend must change

**Nothing structural — no new endpoints.** The same fields simply return the new values:

| Where | Field | Behavior now |
|---|---|---|
| `GET /{marathon_id}/enrollment/` | `current_day_number` | Reflects progression unlock |
| `GET /{marathon_id}/days/` | list contents + `is_locked` | Newly unlocked day appears in the list with `is_locked: false` |
| `GET /{marathon_id}/days/{n}/` | `is_locked` | Same rule |

**Recommended UX update:** after a successful `POST .../days/{n}/complete/`, re-fetch the day list (or enrollment). The next day will already be unlocked — show a "Day N+1 unlocked!" transition instead of "come back tomorrow". The day-complete response itself is unchanged.

---

## Change 2 — Retake feature for marathon passages / listening parts

Students can now re-solve marathon content they have **already completed**. This applies **only to marathon items** — the general (non-marathon) practice tests are unchanged.

### Concept: `attempt_kind`

Every `MarathonAttempt` now carries an `attempt_kind`:

| Value | Meaning |
|---|---|
| `FIRST_TIME` | The original, scored attempt. Exactly one per passage/part per enrollment (as before). **This is the only attempt that counts** for day completion, day band score, streaks, badges and the leaderboard. |
| `RETAKE` | A practice re-attempt. Allowed only after the `FIRST_TIME` attempt is `COMPLETED`. Multiple retakes are allowed (one at a time — an unfinished retake is resumed, not duplicated). Retakes never affect progress, scores on the leaderboard, streaks or badges. |

All existing attempt endpoints (`detail`, `save`, `submit`, `review`) work identically for retake attempts — you drive a retake through the exact same solve flow, just with the retake attempt's `attempt_id`.

### New endpoint — start a retake

```
POST /api/v1/student/marathons/{marathon_id}/days/{day_number}/attempts/retake/
```

**Request body** (identical to the normal attempt-create endpoint — exactly one of):

```json
{ "passage_id": "<uuid>" }
```
or
```json
{ "part_id": "<uuid>" }
```

**Responses:**

| Case | Status | Body |
|---|---|---|
| First-time attempt completed → new retake created | `201` | Full attempt detail (same shape as attempt-create), with `"attempt_kind": "RETAKE"`, `"status": "IN_PROGRESS"`, fresh empty answers |
| An unfinished retake already exists | `200` | That existing retake's attempt detail (resume it) |
| Item never attempted, or first attempt not completed yet | `400` | `{ "detail": "You must complete this passage before retaking it.", "is_retakable": false }` |
| Day locked / not enrolled / premium gate / hidden marathon | `403` | Standard error |
| passage/part not on this day or inactive | `404` | Standard error |

After the `201`/`200`, continue with the **existing** endpoints using the returned attempt `id`:

```
GET   .../days/{n}/attempts/{attempt_id}/           # attempt detail
PATCH .../days/{n}/attempts/{attempt_id}/save/      # autosave answers
POST  .../days/{n}/attempts/{attempt_id}/submit/    # submit & score
GET   .../days/{n}/attempts/{attempt_id}/review/    # full review with evidence
```

The submit result for a retake is scored exactly like a first-time attempt (score, `band_score`, `question_type_stats_json`) — it just carries `"attempt_kind": "RETAKE"` and has no side effects on marathon progress.

### Changed endpoint behavior — attempt create

`POST .../days/{day_number}/attempts/` (the original endpoint) still refuses already-completed items with `400`, but the payload now hints at the retake option:

```json
{
  "detail": "You have already completed this passage. Use the retake endpoint to solve it again.",
  "is_available_to_be_solved": false,
  "is_retakable": true
}
```

→ When you receive `is_retakable: true` here, offer a **"Retake"** button that calls the retake endpoint.

### New fields in day detail

`GET /{marathon_id}/days/{day_number}/` — each item in `reading_passages[]` and `listening_parts[]` now includes:

```json
{
  "id": "…",
  "title": "…",
  "is_available_to_be_solved": false,
  "attempt_id": "…",              // first-time attempt (unchanged semantics)
  "attempt_status": "COMPLETED",  // first-time attempt status (unchanged)
  "band_score": "7.0",            // first-time band score (unchanged)

  "is_retakable": true,           // NEW — first-time attempt is COMPLETED
  "retakes_count": 2,             // NEW — number of retake attempts (any status)
  "latest_retake": {              // NEW — newest retake, or null if none
    "attempt_id": "…",
    "status": "COMPLETED",        // or "IN_PROGRESS"
    "score": 11,
    "band_score": "8.0",          // null until submitted
    "completed_at": "2026-07-02T10:15:00+00:00"
  }
}
```

Notes:
- `attempt_id` / `attempt_status` / `band_score` **always refer to the FIRST_TIME attempt** — existing UI keeps working unchanged.
- `latest_retake.status === "IN_PROGRESS"` → show **"Continue retake"** (calling the retake endpoint returns this same attempt).
- `latest_retake.status === "COMPLETED"` → show **"Retake again"** plus the retake's own result.

### New field in attempt payloads

- Attempt detail (create/retake/detail responses): `attempt_kind` — `"FIRST_TIME"` or `"RETAKE"`.
- Submit result: `attempt_kind` added.
- Review (`.../review/`): top-level `attempt_kind` added.

Use it to label the solve screen and the results screen (e.g. a "Practice retake" badge) and to know the result won't change marathon progress.

### What retakes do NOT do (important for UX copy)

- Do **not** change `day_band_score`, day completion, or `is_completed`.
- Do **not** change streaks, badges, leaderboard `total_score`, or marathon completion.
- Do **not** change the first-time attempt's score/band shown on the day card.
- A completed retake for an item whose first attempt was never finished is impossible via the API.

---

## Suggested UI flow summary

1. **Day card / passage list** (`GET days/{n}/`):
   - `is_available_to_be_solved: true` → "Start" (attempts endpoint, as today).
   - `attempt_status: "IN_PROGRESS"` → "Continue" (as today).
   - `is_retakable: true` → show result + "Retake" button → `POST .../attempts/retake/`.
   - `latest_retake` present → also surface latest retake result / "Continue retake".
2. **Solve screen:** identical for both kinds; read `attempt_kind` to show a "Retake — practice only" banner.
3. **After day complete:** re-fetch day list; next day is already unlocked — navigate/celebrate immediately.

## Full marathon "tests"

Marathon days contain reading passages and listening parts only (no separate full-test entity). Retaking a whole day = retaking each of its passages/parts individually via the same retake endpoint.
