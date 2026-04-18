# Frontend Guide — Full Listening Audio

This file explains the new admin-only full listening audio workflow.

The goal is simple:

- admin uploads one full listening test audio file
- admin provides 4 time ranges for `PART_1` to `PART_4`
- backend stores the full source file
- backend splits that file into 4 normal per-part audio files
- student APIs stay unchanged and continue using the existing part audio URLs

---

## What Changed

New admin endpoint added:

- `GET /api/v1/admin/practice-tests/<uuid:test_id>/full-listening-audio/`
- `POST /api/v1/admin/practice-tests/<uuid:test_id>/full-listening-audio/`
- `PATCH /api/v1/admin/practice-tests/<uuid:test_id>/full-listening-audio/`
- `DELETE /api/v1/admin/practice-tests/<uuid:test_id>/full-listening-audio/`

This is a new workflow. It does not replace the existing per-part upload endpoints.

Existing student behavior is unchanged:

- student still receives per-part audio URLs
- student still streams audio from the existing listening part endpoint

---

## Important Rules

- This works only for `LISTENING` practice tests.
- The practice test must already have all 4 attached listening parts:
  - `PART_1`
  - `PART_2`
  - `PART_3`
  - `PART_4`
- Time values are in integer seconds.
- Segments must be sent in this exact order:
  - `PART_1`
  - `PART_2`
  - `PART_3`
  - `PART_4`
- Segments must not overlap.
- `end_seconds` must be greater than `start_seconds`.
- Uploading or updating full listening audio always regenerates and replaces all 4 part audio files.
- Deleting full listening audio removes only the stored full source metadata/file. It does not delete the already-generated part audio files.

---

## Auth And Headers

Use the same admin authentication used by the other `/api/v1/admin/` endpoints.

Typical headers:

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <admin_access_token>` |
| `Accept` | `application/json` |

For `POST` and `PATCH` with file upload, use `multipart/form-data`.

---

## Response Shape

### Successful `GET` / `POST` / `PATCH`

```json
{
  "id": "uuid",
  "practice_test": "uuid",
  "source_audio_file": "/media/full_listening_audio/full-listening.mp3",
  "created_at": "2026-04-17T14:20:00Z",
  "updated_at": "2026-04-17T14:25:00Z",
  "segments": [
    {
      "id": "uuid",
      "listening_part": "uuid",
      "part_number": "PART_1",
      "title": "Part 1 title",
      "start_seconds": 0,
      "end_seconds": 300
    },
    {
      "id": "uuid",
      "listening_part": "uuid",
      "part_number": "PART_2",
      "title": "Part 2 title",
      "start_seconds": 300,
      "end_seconds": 600
    },
    {
      "id": "uuid",
      "listening_part": "uuid",
      "part_number": "PART_3",
      "title": "Part 3 title",
      "start_seconds": 600,
      "end_seconds": 900
    },
    {
      "id": "uuid",
      "listening_part": "uuid",
      "part_number": "PART_4",
      "title": "Part 4 title",
      "start_seconds": 900,
      "end_seconds": 1200
    }
  ]
}
```

### Error Shape

Like the other `v1` APIs, errors are wrapped:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation error.",
    "details": {
      "segments": [
        "segments must be ordered as PART_1, PART_2, PART_3, PART_4."
      ]
    }
  }
}
```

---

## Admin UI Flow

Recommended frontend flow:

1. Load the practice test details and its attached listening parts.
2. Confirm the test is `LISTENING`.
3. Confirm all 4 parts exist: `PART_1` to `PART_4`.
4. Call `GET /full-listening-audio/`.
5. If it returns `200`, open edit mode with existing file metadata and segment values.
6. If it returns `404`, open create mode.
7. On save, send file and segments using `multipart/form-data`.

Recommended screen fields:

- full listening source audio file
- 4 locked rows, one for each part
- each row shows:
  - `part_number`
  - linked part title
  - `start_seconds`
  - `end_seconds`

Frontend should not allow:

- missing rows
- extra rows
- reordering rows
- negative seconds
- end less than or equal to start

---

## Create

### Route

```http
POST /api/v1/admin/practice-tests/<uuid:test_id>/full-listening-audio/
```

### Content Type

`multipart/form-data`

### FormData Fields

- `source_audio_file`: file
- `segments`: JSON string

### `segments` Format

```json
[
  {
    "listening_part": "uuid-part-1",
    "start_seconds": 0,
    "end_seconds": 300
  },
  {
    "listening_part": "uuid-part-2",
    "start_seconds": 300,
    "end_seconds": 600
  },
  {
    "listening_part": "uuid-part-3",
    "start_seconds": 600,
    "end_seconds": 900
  },
  {
    "listening_part": "uuid-part-4",
    "start_seconds": 900,
    "end_seconds": 1200
  }
]
```

### Browser Example

```js
const formData = new FormData();
formData.append("source_audio_file", file);
formData.append("segments", JSON.stringify([
  { listening_part: part1Id, start_seconds: 0, end_seconds: 300 },
  { listening_part: part2Id, start_seconds: 300, end_seconds: 600 },
  { listening_part: part3Id, start_seconds: 600, end_seconds: 900 },
  { listening_part: part4Id, start_seconds: 900, end_seconds: 1200 },
]));
```

### Notes

- Create works only if full listening audio does not already exist for that test.
- If it already exists, backend returns validation error and frontend should switch to `PATCH`.

---

## Update

### Route

```http
PATCH /api/v1/admin/practice-tests/<uuid:test_id>/full-listening-audio/
```

### Content Type

`multipart/form-data`

### What Can Be Updated

- `source_audio_file`
- `segments`
- both together

### Recommended Behavior

- if only times changed, send just `segments`
- if file changed, send `source_audio_file`
- if both changed, send both in the same request

### Browser Example

```js
const formData = new FormData();
formData.append("segments", JSON.stringify([
  { listening_part: part1Id, start_seconds: 0, end_seconds: 250 },
  { listening_part: part2Id, start_seconds: 250, end_seconds: 550 },
  { listening_part: part3Id, start_seconds: 550, end_seconds: 850 },
  { listening_part: part4Id, start_seconds: 850, end_seconds: 1100 },
]));

if (newFile) {
  formData.append("source_audio_file", newFile);
}
```

### Important

Every successful update regenerates all 4 part audio files.

---

## Get Existing Full Listening Audio

### Route

```http
GET /api/v1/admin/practice-tests/<uuid:test_id>/full-listening-audio/
```

### Frontend Usage

Use this to:

- know whether the test already has full listening audio
- prefill the timing editor
- show the currently stored source file URL

### Expected Outcomes

- `200`: full listening audio exists
- `404`: not created yet

---

## Delete

### Route

```http
DELETE /api/v1/admin/practice-tests/<uuid:test_id>/full-listening-audio/
```

### Behavior

- removes the full listening audio record
- removes the stored full source file
- keeps the already-generated `ListeningPart.audio_file` values

### Frontend Reminder

After delete:

- clear the full-audio editor state
- do not assume part audio disappeared
- student playback may still work through the generated part files

---

## Validation Cases Frontend Should Expect

### Wrong test type

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "practice_test": [
        "Full listening audio is only available for LISTENING practice tests."
      ]
    }
  }
}
```

### Missing one or more required parts

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "practice_test": [
        "Listening practice test must have PART_1 through PART_4 attached before uploading full audio."
      ]
    }
  }
}
```

### Wrong segment order

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "segments": [
        "segments must be ordered as PART_1, PART_2, PART_3, PART_4."
      ]
    }
  }
}
```

### Time range invalid

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "segments": [
        "end_seconds must be greater than start_seconds for every segment."
      ]
    }
  }
}
```

### Segments overlap

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "segments": [
        "Segments must not overlap and must follow the part order."
      ]
    }
  }
}
```

### End time exceeds audio duration

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "segments": [
        "Segment end times must not exceed the full audio duration."
      ]
    }
  }
}
```

### Create attempted when record already exists

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "non_field_errors": [
        "Full listening audio already exists for this practice test. Use PATCH to update it."
      ]
    }
  }
}
```

---

## Frontend Recommendations

- Build this as a separate admin form, not as part of the existing listening-part upload form.
- Render the 4 rows from actual attached listening parts, but lock the order by `PART_1` to `PART_4`.
- Use `GET` first to decide whether the save action should call `POST` or `PATCH`.
- Show a warning that saving full listening audio overwrites all 4 part audio files.
- Keep the existing per-part upload UI available, because backend still supports it.

---

## Student Side Impact

No student integration change is needed for this feature.

The frontend student app can keep using:

- existing test detail endpoints
- existing per-part `audio_file_url`
- existing audio playback logic

The backend now just has one more way to generate those per-part files.
