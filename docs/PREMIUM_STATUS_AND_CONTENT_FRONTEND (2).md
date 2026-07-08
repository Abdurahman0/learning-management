# Premium Status & Premium Content — Frontend Integration Guide

This document covers everything added in this change set so the frontend can wire up
admin-managed premium user status, its history, and premium-aware passage/part
management for full tests and marathons. All endpoints are already implemented,
tested, and migrated on the backend.

---

## 1. User premium status (admin-managed)

`CustomUser.is_premium` (boolean, already existed) is now managed exclusively through
dedicated admin endpoints, with every change recorded to a `PremiumHistory` audit log.

### Admin endpoints

All require `IsAdmin` (staff) auth.

- **`POST /api/v1/admin/users/<uuid:user_id>/premium/enable/`**
  Body: `{ "note": "optional free-text reason" }` (note is optional).
  Returns the full `AdminUserDetailSerializer` payload (same shape as `GET
  /api/v1/admin/users/<id>/`), now including `is_premium`.
  Returns **400** if the user is already premium (no-op is rejected, not silently
  accepted — check `is_premium` in the UI before enabling/disabling to avoid a
  needless failed call).

- **`POST /api/v1/admin/users/<uuid:user_id>/premium/disable/`**
  Same shape, reverse direction. 400 if already non-premium.

- **`GET /api/v1/admin/users/<uuid:user_id>/premium-history/`**
  Paginated (standard `{count, next, previous, results}` envelope). Each result:
  ```json
  {
    "id": "uuid",
    "action": "ENABLED" | "DISABLED",
    "performed_by_id": "uuid or null",
    "performed_by_email": "email or null",
    "note": "string, may be empty",
    "created_at": "ISO datetime"
  }
  ```
  Ordered newest-first.

- **`GET /api/v1/admin/users/`** and **`GET /api/v1/admin/users/<id>/`** now also
  return `is_premium` in their existing response shapes (list item and detail).

### Student-facing endpoint

- **`GET /api/v1/student/premium-history/`** — `IsAuthenticated`. Returns the
  logged-in student's own history only, **without admin identity fields**:
  ```json
  {
    "count": 2,
    "next": null,
    "previous": null,
    "results": [
      { "action": "DISABLED", "note": "", "created_at": "..." },
      { "action": "ENABLED", "note": "manual grant", "created_at": "..." }
    ]
  }
  ```
  No `id`, `performed_by_id`, or `performed_by_email` — students never see who
  granted/revoked their premium status, only what happened and when.

### UI notes
- Toggle should be a simple enable/disable action per user row in the admin users
  table — driven off the `is_premium` field already present in the list response.
- A "Premium History" tab/modal on the user detail page can hit the admin history
  endpoint; a "why am I premium" panel on the student profile page can hit the
  student-facing one.

---

## 2. Premium status on passages/parts (new)

`ReadingPassage` and `ListeningPart` now both have an `is_premium` boolean field
(default `false`), mirroring the existing `is_active` field. This applies uniformly
across all three roles these models play: test-attached content, content-bank
(reusable) items, and marathon-pool items.

### The rule being enforced

- A **premium** `PracticeTest` (full test) cannot contain a **free** passage/part, and
  vice versa — a **free** test cannot contain a **premium** passage/part.
- A **premium** `Marathon` cannot have a **free** passage/part assigned to any of its
  days, and vice versa.
- This is enforced **server-side** at every attach/create/toggle point (see below) —
  the frontend does not need to replicate this logic, but **should** surface the
  error messages and, ideally, pre-filter choices to avoid the round-trip failure.

### Where `is_premium` now appears in responses

- `ReadingPassageAdminReadSerializer` / `ListeningPartAdminReadSerializer` (used by
  `GET /api/v1/admin/practice-tests/<id>/reading-passages/` and
  `.../listening-parts/`, and their detail endpoints).
- `ReadingPassageAdminWriteSerializer` / `ListeningPartAdminWriteSerializer` (POST/PATCH
  body accepts `is_premium`).
- Content-bank list/detail/write serializers (`ContentBankPassageListItemSerializer`,
  `ContentBankPassageDetailSerializer`, `ContentBankPassageWriteSerializer`) — all
  content-bank endpoints under `/api/v1/admin/content-bank/passages/...`.
- Marathon-pool write serializers (`MarathonReadingPassageWriteSerializer`,
  `MarathonListeningPartWriteSerializer`) — `/api/v1/admin/marathon-reading-passages/`
  and `/api/v1/admin/marathon-listening-parts/`.

### New filters (query params, all admin list endpoints for passages/parts)

- `?is_premium=true` / `?is_premium=false` now works on:
  - `GET /api/v1/admin/practice-tests/<id>/reading-passages/`
  - `GET /api/v1/admin/practice-tests/<id>/listening-parts/`
  - `GET /api/v1/admin/marathon-reading-passages/`
  - `GET /api/v1/admin/marathon-listening-parts/`
  - `GET /api/v1/admin/content-bank/passages/` (uses `true`/`false`/`1`/`0`, not
    django-filter's exact boolean parsing — same practical usage)

Use this to let an admin building a premium test/marathon day filter the content-bank
or marathon pool down to premium-only items (and vice versa for free tests), instead
of discovering the mismatch only on submit.

### Enforcement points & the error shape to expect

All validation errors come back as standard DRF 400 responses via the existing
`custom_exception_handler`, e.g.:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }
```
or a field-keyed 400 depending on the exact call — treat any 400 from these
endpoints as "show this message to the admin," not a client bug.

1. **Create passage/part directly under a test**
   `POST /api/v1/admin/practice-tests/<id>/reading-passages/` (and listening-parts
   equivalent):
   - If you **omit** `is_premium` in the request body, it is auto-set to match the
     parent test's `is_premium`. Simplest integration: just don't send the field
     unless the admin explicitly wants to override.
   - If you **send** `is_premium` explicitly and it conflicts with the test's value,
     you get a 400.

2. **Edit an already-attached passage/part**
   `PATCH /api/v1/admin/reading-passages/<id>/` / `listening-parts/<id>/`:
   - Sending `is_premium` that conflicts with the parent test's `is_premium` → 400.
   - Bank items (not attached to any test) can have `is_premium` edited freely.

3. **Toggle a full test's `is_premium`**
   `PATCH`/`PUT` on `/api/v1/admin/practice-tests/<id>/` (the `AdminPracticeTestViewSet`):
   - If you change `is_premium` and any attached passage/part has a different
     `is_premium`, you get a 400 telling the admin to reconcile content first.
   - **Recommended UI**: before allowing the toggle, check whether all attached
     passages/parts already match the desired new value (you already have this data
     from the test's detail response) and warn/disable the toggle proactively.

4. **Attach a content-bank item to a test** (clone)
   `POST /api/v1/admin/content-bank/passages/<module>/<id>/attach/`:
   - 400 if the bank item's `is_premium` doesn't match the target test's
     `is_premium`.
   - On success, the newly cloned passage/part **inherits** `is_premium` from the
     target practice test (not from the bank item, though they're guaranteed equal
     by the check above).

5. **Assign a marathon-pool passage/part to a marathon day**
   `POST /api/v1/admin/marathons/<marathon_id>/days/<day_number>/assign-passage/<pk>/`
   (and `assign-part/<pk>/`):
   - 400 if the content's `is_premium` doesn't match the marathon's
     `for_premium_users`.

6. **Toggle a marathon's `for_premium_users`**
   `PATCH`/`PUT` on `/api/v1/admin/marathons/<id>/`:
   - 400 if any passage/part currently assigned to any of its days has a mismatched
     `is_premium`. Same "reconcile content first" pattern as full tests.

### Existing data (migration note)

A backfill migration ran on deploy: existing passages/parts attached to a premium
`PracticeTest` or assigned to a premium `Marathon` day were automatically flagged
`is_premium=true` to stay consistent. Everything else defaulted to `false`. No
frontend action needed here — this was a one-time backend data fix — but don't be
surprised if some previously-"plain" bank items now show as premium in the content
bank if they were already used inside a premium test/marathon.

---

## 3. Suggested frontend work

1. **User management table**: show premium badge/toggle per row; wire toggle to the
   enable/disable endpoints; add a history view (modal or side panel) per user.
2. **Student profile / billing page**: show premium status + "premium history"
   (self, no admin identity) if you want to expose this to end users.
3. **Test builder (admin)**: show `is_premium` on passage/part rows in both the
   content-bank picker and the direct-create form; add an `is_premium` filter toggle
   next to existing difficulty/source/status filters; when creating new content
   under a test, don't show an `is_premium` input at all by default (let it inherit)
   — only expose it as an advanced/override option.
4. **Marathon builder (admin)**: same pattern — filter the marathon pool picker by
   `is_premium` matching the marathon's own `for_premium_users`, and surface the 400
   error text if an admin forces a mismatched assignment via direct API use.
5. **Full-test / marathon premium toggle**: before calling the update endpoint with
   a changed `is_premium`/`for_premium_users`, check locally whether all attached
   content already matches (data you already have) to avoid an avoidable round-trip
   error — but always handle the 400 gracefully regardless, since content can be
   modified concurrently by another admin.
