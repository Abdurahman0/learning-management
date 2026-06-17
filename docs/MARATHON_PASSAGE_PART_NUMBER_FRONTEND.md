# Marathon Passage / Part Numbering — Frontend Integration Guide

Audience: the frontend AI agent building the marathon **admin** content screens
(and the marathon student day screen).

This documents the feature that lets an admin label a marathon reading passage as
**Passage 1 / 2 / 3** and a marathon listening part as **Part 1 / 2 / 3 / 4**, and
how the student side reads those labels back.

---

## 1. The problem this solves

When creating marathon content, the admin had **no way to say** whether a reading
passage was Passage 1, 2 or 3, or whether a listening part was Part 1–4.

Under the hood the fields (`passage_number`, `part_number`) already existed for
regular practice tests, but the marathon create/update endpoints **silently
dropped** them, and the model rejected the label on content that is not attached
to a practice test (all marathon content). So any value the frontend sent was
discarded.

**Now:** marathon passages/parts accept an optional number label, store it,
return it on read, and the student day screen exposes it (sorted by number).

---

## 2. What changed on the backend (no DB migration)

- Marathon reading passages accept `passage_number` ∈ `PASSAGE_1`, `PASSAGE_2`,
  `PASSAGE_3` (optional).
- Marathon listening parts accept `part_number` ∈ `PART_1`, `PART_2`, `PART_3`,
  `PART_4` (optional).
- The value is **normalized** server-side: case-insensitive, trimmed. You may send
  `"passage_1"` or `"PASSAGE_1"` — both store as `PASSAGE_1`.
- Omitting the field, or sending `null` / `""`, leaves the content **unlabeled**
  (`passage_number: null`).
- The label is **optional** and **not enforced unique** within the marathon pool —
  it's a display tag, not a key. Two passages can both be `PASSAGE_1` (e.g. used on
  different days / different marathons). If you want uniqueness, enforce it in the
  admin UI.
- Reads now return the raw value plus a human display string (`"Passage 1"`).
- Student day listings are **sorted** by this number (labeled items first, in
  numeric order; unlabeled items after).

---

## 3. Admin API — create / update marathon content

Base prefix: `/api/v1/admin/`. All require an admin bearer token.
Marathon passages/parts are a **global pool** (not scoped to one marathon); you
assign them to days separately.

### 3.1 Reading passages

| Action | Method + URL |
|---|---|
| List | `GET /api/v1/admin/marathon-reading-passages/` |
| Create | `POST /api/v1/admin/marathon-reading-passages/` |
| Retrieve | `GET /api/v1/admin/marathon-reading-passages/<id>/` |
| Update | `PUT` / `PATCH /api/v1/admin/marathon-reading-passages/<id>/` |
| Delete | `DELETE /api/v1/admin/marathon-reading-passages/<id>/` |

**Create / update body — relevant field:**
```json
{
  "passage_number": "PASSAGE_1",
  "title": "Urban Green Spaces",
  "passage_text": "…",
  "max_questions": 13
  // … other existing fields unchanged
}
```
- `passage_number`: optional. One of `"PASSAGE_1" | "PASSAGE_2" | "PASSAGE_3"`
  (lowercase accepted). Send `null` or omit to leave unlabeled.
- Do **not** send `source` or `practice_test` — they are forced to `MARATHON` /
  `null` by the server.

**Invalid value** (e.g. `"PASSAGE_X"`, `"1"`, `"foo"`) →
`400 { "passage_number": ["Must be in the format PASSAGE_1, PASSAGE_2, ..."] }`.

### 3.2 Listening parts

| Action | Method + URL |
|---|---|
| List | `GET /api/v1/admin/marathon-listening-parts/` |
| Create | `POST /api/v1/admin/marathon-listening-parts/` |
| Retrieve | `GET /api/v1/admin/marathon-listening-parts/<id>/` |
| Update | `PUT` / `PATCH /api/v1/admin/marathon-listening-parts/<id>/` |
| Delete | `DELETE /api/v1/admin/marathon-listening-parts/<id>/` |

Accepts `multipart/form-data` (for audio upload) or JSON.

**Create / update body — relevant field:**
```json
{
  "part_number": "PART_1",
  "title": "Accommodation enquiry",
  "transcript_text": "…",
  "max_questions": 10
  // … other existing fields unchanged
}
```
- `part_number`: optional. One of `"PART_1" | "PART_2" | "PART_3" | "PART_4"`
  (lowercase accepted). Send `null` or omit to leave unlabeled.

**Invalid value** →
`400 { "part_number": ["Must be in the format PART_1, PART_2, ..."] }`.

### 3.3 Read shape (GET on the above)

The list/detail responses now include the stored label:
```json
{
  "id": "…",
  "passage_number": "PASSAGE_1",   // or null
  "title": "Urban Green Spaces",
  "max_questions": 13
  // … existing fields
}
```
Listening read includes `"part_number": "PART_1"` (or null) the same way.

> The read serializer returns the **raw** value (`PASSAGE_1`). For the admin list
> UI, render it as "Passage 1" client-side, or rely on the student display field
> in §4 if you reuse that serializer.

---

## 4. Student API — reading the label back

Endpoint (unchanged URL): day detail
`GET /api/v1/student/marathons/<marathon_id>/days/<day_number>/`

Each passage in `reading_passages[]` now includes:
```json
{
  "id": "…",
  "title": "Urban Green Spaces",
  "passage_number": "PASSAGE_1",
  "passage_number_display": "Passage 1",
  "max_questions": 13,
  "is_available_to_be_solved": true,
  "attempt_id": null,
  "attempt_status": null,
  "band_score": null,
  "question_groups_count": 3,
  "external_link": null
}
```

Each part in `listening_parts[]` now includes:
```json
{
  "id": "…",
  "title": "Accommodation enquiry",
  "part_number": "PART_1",
  "part_number_display": "Part 1",
  "max_questions": 10,
  "audio_file_url": "https://…",
  "is_available_to_be_solved": true,
  "...": "…"
}
```

Field meaning:
- `passage_number` / `part_number`: raw value (`PASSAGE_1` / `PART_1`) or `null`.
  Use for logic / sorting keys.
- `passage_number_display` / `part_number_display`: ready-to-show string
  (`"Passage 1"` / `"Part 1"`). Empty string `""` when unlabeled. Use this for UI
  labels.

**Ordering:** `reading_passages[]` and `listening_parts[]` arrive already sorted
by number (labeled ascending, unlabeled last). Render in array order — no client
sort needed.

---

## 5. Frontend checklist

Admin content editor:
1. Add a select for **Passage Number** (`PASSAGE_1/2/3`) on the marathon reading
   passage form; **Part Number** (`PART_1/2/3/4`) on the listening part form.
2. Include the chosen value as `passage_number` / `part_number` in the
   create/update payload. Allow "None / unlabeled" → send `null`.
3. On load (edit mode), prefill the select from the GET `passage_number` /
   `part_number`.
4. Surface the `400` validation message under the field if the value is rejected.
5. (Optional, your choice) prevent the admin from labeling two passages on the same
   day with the same number — the backend does not block it.

Student day screen:
6. Show `passage_number_display` / `part_number_display` as the card label
   (e.g. "Passage 1"); fall back to `title` when the display string is empty.
7. Trust server ordering of `reading_passages` / `listening_parts`.

---

## 6. Edge cases

| Case | Behavior |
|---|---|
| Field omitted on create | Stored as `null` (unlabeled). |
| `""` or `null` sent | Stored as `null`. |
| Lowercase `"part_1"` | Normalized to `PART_1`. |
| Out-of-range / malformed | `400` with `"Must be in the format …"`. |
| Two passages same number | Allowed (no uniqueness). Enforce in UI if undesired. |
| `passage_number_display` empty | Unlabeled content — show the title instead. |

> Existing marathon content created before this change has `passage_number` /
> `part_number` = `null`. Edit each item to assign a number; nothing is
> backfilled automatically.
