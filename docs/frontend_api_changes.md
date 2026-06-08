# Frontend API Changes

## 1. Student Profile — `phone_number` field added

### Endpoints affected

| Method | URL |
|--------|-----|
| `GET`  | `/api/v1/student/profile/` |
| `PATCH` | `/api/v1/student/profile/` |

### What changed

`phone_number` is now a field on the student profile. It is optional (`null` if not set).

**Format:** Uzbek phone number — `+998XXXXXXXXX` (9 digits after `+998`)

Input accepts both:
- `+998901234567` (raw)
- `+998 90-123-45-67` (formatted with spaces/hyphens)

Stored and returned as normalized: `+998901234567`

---

### GET response — new field

```json
{
  "id": "...",
  "email": "student@example.com",
  "full_name": "John Doe",
  "exam_datetime": null,
  "target_band": "7.0",
  "strongest_section": "READING",
  "weakest_section": "WRITING",
  "phone_number": "+998901234567",
  ...
}
```

If not set: `"phone_number": null`

---

### PATCH request — set phone number

```http
PATCH /api/v1/student/profile/
Authorization: Bearer <token>
Content-Type: application/json

{
  "phone_number": "+998 90-123-45-67"
}
```

**Success response (200):**
```json
{
  "phone_number": "+998901234567",
  ...
}
```

**Validation error (400):**
```json
{
  "phone_number": ["Phone must be a valid Uzbek number: +998 XX-XXX-XX-XX"]
}
```

---

## 2. Test List — `last_attempt_accuracy_percent` added

### Endpoints affected

| Method | URL | Description |
|--------|-----|-------------|
| `GET` | `/api/v1/student/tests/` | All tests |
| `GET` | `/api/v1/student/tests/reading/` | Reading tests only |
| `GET` | `/api/v1/student/tests/listening/` | Listening tests only |

### What changed

Each test object already had a `user_attempt_status` field (null for unattempted tests, object for attempted). That object now includes `last_attempt_accuracy_percent`.

**Formula:** `round(correct_answers / total_questions * 100, 1)`

---

### Response shape

**Unattempted test** — `user_attempt_status` is `null`, no change:
```json
{
  "id": "...",
  "title": "Reading Test 1",
  "user_attempt_status": null
}
```

**Attempted test** — new `last_attempt_accuracy_percent` field:
```json
{
  "id": "...",
  "title": "Reading Test 2",
  "user_attempt_status": {
    "attempt_id": "uuid-here",
    "status": "COMPLETED",
    "score": 32,
    "band_score": "7.0",
    "last_attempt_accuracy_percent": 80.0
  }
}
```

### Notes

- `last_attempt_accuracy_percent` is `null` if the test has no questions (edge case, shouldn't happen in production)
- Based on the **last** attempt only, not best attempt
- Unauthenticated users receive `user_attempt_status: null` for all tests (no change)
- `score` = number of correct answers; `total_questions` = total questions in the test
