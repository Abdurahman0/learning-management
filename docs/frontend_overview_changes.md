# Frontend Overview — Backend Changes (2026-07)

This document lists every backend change from this round that the frontend must react to,
plus behavior changes that are transparent but worth knowing. Items are marked:

- **[REQUIRED]** — frontend must change or a flow breaks / renders wrong data
- **[RECOMMENDED]** — no hard break, but the UI will be wrong or suboptimal without it
- **[INFO]** — behavior improved server-side, no frontend work needed

---

## 1. Test list now includes locked tests for everyone — [REQUIRED]

`GET /api/v1/student/tests/`, `/tests/reading/`, `/tests/listening/`

- **Before:** guests (unauthenticated visitors) only received tests with
  `active_for_registered_users = false`. Premium tests were already listed to logged-in users.
- **Now:** every active test is returned to every viewer — including premium tests for
  free students and registered-only tests for guests.
- Each item carries the flags to gate the UI:
  - `is_accessible: boolean` — `false` means the viewer cannot solve it
    (premium test without a matching package, **or** registered-only test viewed by a guest)
  - `is_premium: boolean` — premium content, show upgrade prompt when not accessible
  - `active_for_registered_users: boolean` — registration-gated, show register/login prompt
    when the viewer is a guest

**What to change:**
- Render list cards with `is_accessible === false` in a locked state
  (lock badge + "Upgrade" for premium, "Sign up to solve" for registration-gated).
- Disable/redirect the "Start test" action when `is_accessible === false`.
  The backend still rejects attempt creation for inaccessible tests
  (`403` with `PREMIUM_REQUIRED` / `PERMISSION_DENIED`), so the button must not
  lead to a dead end.
- Do not assume the guest list only contains solvable tests anymore.

---

## 2. Marathon listening audio now works — [REQUIRED]

`GET /api/v1/student/listening-parts/{part_id}/audio/`

- **Before:** every audio request for a *marathon* listening part returned **404**
  (backend bug). Marathon listening days were unsolvable.
- **Now:** the same endpoint streams marathon audio. Access rules for marathon parts:
  - must be authenticated (guest → `403`)
  - must be enrolled in a visible marathon containing the part
  - the part's day must be unlocked (sequence) and not premium-locked
    (premium-locked → `403` with `PREMIUM_REQUIRED`)
- `audio_file_url` in the marathon day detail (`reading_passages`/`listening_parts` arrays)
  is now `null` when the part has no uploaded audio file. **Previously it was always a URL.**

**What to change:**
- Wire up the marathon listening player to `audio_file_url` — it is now functional.
- Handle `audio_file_url === null` (hide the player).
- Handle `403` on the audio URL (locked day / premium) with the same lock UI as the day itself.

---

## 3. Audio streaming supports seeking and caching — [INFO]

The audio endpoint (regular and marathon) now supports HTTP `Range` requests
(`206 Partial Content`, `Accept-Ranges: bytes`) and sends `Cache-Control: private, max-age=3600`.

- Browser `<audio>` elements pick this up automatically: seeking works without
  re-downloading the whole file, replays come from browser cache.
- No frontend change needed. If you use a custom fetch-based player, you may now send
  `Range` headers.

---

## 4. Marathon answer payloads are now validated — [REQUIRED]

`PATCH .../marathons/{id}/days/{n}/attempts/{attempt_id}/save/`
`POST  .../marathons/{id}/days/{n}/attempts/{attempt_id}/submit/`

- **Before:** any JSON was accepted (and could permanently break the attempt server-side).
- **Now:** each answer is validated against its question type — the **same rules as the
  regular (non-marathon) test flow**:
  - `TFNG`: `{"answer": "TRUE" | "FALSE" | "NOT_GIVEN"}`
  - `YNNG`: `{"answer": "YES" | "NO" | "NOT_GIVEN"}`
  - `MCQ_SINGLE` / matching types: `{"answer": "<non-empty string>"}`
  - `MCQ_MULTIPLE`: `{"answers": ["A", "C", ...]}` (non-empty strings, no duplicates)
  - completion types: `{"answer": "<non-empty string or number>"}`
  - `null` answer = clear/skip the question (still allowed)
- Invalid payloads now return **`400`** with the error shape:

```json
{
  "answers": {
    "<question_id>": { "answer": ["answer must be one of TRUE, FALSE, NOT_GIVEN."] }
  }
}
```

- Sending a `question_id` that does not belong to the attempt is now a `400`
  (**previously silently ignored**).
- `submit` accepts `answers` as an optional array field (same item shape as `save`).

**What to change:**
- Send only typed, well-formed answer objects (if the marathon solver reuses the regular
  test solver components, this is already the case).
- Surface per-question validation errors from the `400` response instead of assuming
  save/submit always succeeds.
- Remove any workaround for attempts stuck "in progress after submit error" — the root
  cause is fixed.

---

## 5. Dashboard & analytics payload semantics changed — [RECOMMENDED]

`GET /api/v1/student/dashboard/` and `GET /api/v1/student/analytics/`

Scoped attempts (single passage / single part practice) no longer pollute full-test metrics:

| Field | Change |
|---|---|
| `tests_taken` (dashboard) | counts **full tests only** (scoped practice runs no longer inflate it) |
| `current_band`, `skills_snapshot` | estimated from full tests only — values will jump up for students who practiced passages (previously dragged toward band 2) |
| `score_progress`, `recent_test_history` (dashboard) | full tests only; no more `band_score: 0` entries from scoped attempts |
| `band_progression` (analytics) | now the **latest 10** full tests in chronological order (previously frozen on the oldest 10) |
| `recent_activity` (analytics) | still includes scoped attempts, but `total` and `accuracy` are now computed from the attempt's own question count (a perfect 13/13 passage run now shows 100%, not 33%) |
| `weak_areas` (dashboard) | entries are now split per module — the same `question_type` can appear twice (once `"Reading"`, once `"Listening"`). **Key list items by `question_type + module`, not by `question_type` alone.** |

**What to change:**
- If any chart/list uses `question_type` as a unique React key in `weak_areas`, switch to
  `question_type + module`.
- Copy that says "tests taken" now genuinely means full tests; adjust wording if it was
  presented as "practice sessions". (`practice_sessions` in analytics still counts everything.)

---

## 6. Marathon behavior fixes — [INFO] unless noted

- **Double-click safety:** starting a test/attempt twice, submitting twice, or completing a
  day twice now returns the same single result instead of creating duplicates or `500`s.
  Any frontend debounce workarounds can stay but are no longer load-bearing.
- **Band score `.5` boundaries:** marathon attempt band now rounds half up
  (5/16 correct → band 4.5, was 4.0). Values may differ from previously displayed ones.
- **`retry_count`** on the student day object now means "number of retakes started"
  (previously it incremented on every page view). If displayed, the label "retries" is now
  accurate.
- **Hidden marathons:** attempt detail/save/submit/review endpoints now return `403` when a
  marathon is hidden by the admin (previously they still worked). Handle `403` by exiting to
  the marathon list — the same handling the other marathon endpoints already need.
- **`time_used_seconds`:** submitting without the field no longer wipes the value saved
  during the test; the frontend may keep sending it as before.

## 7. Admin panel: day content premium check — [RECOMMENDED]

`PATCH /api/v1/.../marathons/{id}/days/{n}/` now rejects (`400`) `reading_passages` /
`listening_parts` whose `is_premium` does not match the marathon's `for_premium_users`
(the assign-passage/assign-part endpoints already did this). The admin UI should surface
this validation error on the day editor's content picker.

---

## Not changed (no frontend impact)

- All URL paths, auth, pagination, and response envelopes are unchanged.
- Marathon enrollment, day list/detail shape, leaderboard, notes: unchanged fields.
- Review endpoints: unchanged.
