# Premium Toggle & `cascade_premium` — Frontend Guide

How to turn a Practice Test (or Marathon) premium/free when it already has
passages/parts attached, and how the new `cascade_premium` flag removes the
manual step.

---

## Why the error happened

Premium status is stored **independently** on three levels:

| Level | Model | Field |
| --- | --- | --- |
| Test | `PracticeTest` | `is_premium` |
| Passage | `ReadingPassage` | `is_premium` |
| Listening part | `ListeningPart` | `is_premium` |

(For marathons the container field is `Marathon.for_premium_users`; its assigned
`ReadingPassage` / `ListeningPart` still use `is_premium`.)

The backend **refuses to let a container and its children disagree**. So when you
PATCH a test to `is_premium: true` while it still has a free passage attached, you get:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation error.",
    "details": {
      "is_premium": "Cannot change premium status: this test has attached passages/parts with a different premium status. Update their is_premium first, or resend with cascade_premium=true to update them automatically."
    }
  }
}
```

This is intentional — it prevents a premium test from silently exposing free
content (or vice versa).

---

## The fix: `cascade_premium: true`

Add `cascade_premium: true` to the **same PATCH body**. The backend then, in one
atomic transaction:

1. Updates the test's `is_premium`.
2. Sets every attached passage & listening part to the same `is_premium`.

No extra requests, no per-child loop on the frontend.

### Practice test — corrected payload

`PATCH /api/v1/admin/practice-tests/{id}/`

```json
{
  "title": "Real exam practise test 1",
  "difficulty_level": "INTERMEDIATE",
  "active_for_registered_users": true,
  "is_premium": true,
  "packages": ["954cb0ac-5811-47f7-9489-bb6cb19619d8"],
  "practice_source": "REAL_TEST",
  "is_active": true,
  "cascade_premium": true
}
```

Returns `200` with the updated test. All attached passages/parts are now `is_premium: true`.

### Marathon — same flag

`PATCH /api/v1/admin/marathons/{id}/`

```json
{
  "for_premium_users": true,
  "packages": ["<package-uuid>"],
  "cascade_premium": true
}
```

Cascades to every passage/part assigned to any day of that marathon.

---

## Rules to keep in mind

- **`cascade_premium` is optional.** Omit it (or `false`) to keep the old strict
  behavior — the request is rejected if children mismatch. Send `true` only when
  the admin's intent is "make everything match the test."
- **Going premium requires `packages`.** When `is_premium: true`
  (`for_premium_users: true` for marathons) you must send at least one package
  UUID, or you get a separate `packages` validation error. Free → no packages needed.
- **Direction works both ways.** `cascade_premium` also cascades premium → free
  (`is_premium: false`); no packages required in that direction.
- **`cascade_premium` is not stored.** It's a per-request action flag; it never
  appears in any GET response.
- Passages/parts have **no** `packages` field of their own — package unlock is
  defined only on the test/marathon. Cascade only touches the child `is_premium`
  boolean.

### Recommended UX

When the admin flips the premium switch on a test/marathon that has children:

1. First PATCH without `cascade_premium`.
2. If it returns the `VALIDATION_ERROR` above, show a confirm dialog:
   *"This test has N passages/parts with a different premium status. Also update
   them to premium?"*
3. On confirm, re-send the same PATCH with `cascade_premium: true`.

This keeps the admin aware that child content is being changed, rather than
cascading silently every time.

---

## Related endpoints (manual per-child updates)

If you prefer to update children individually instead of cascading:

| Action | Method & path |
| --- | --- |
| Update a reading passage | `PATCH /api/v1/admin/reading-passages/{id}/` — body `{ "is_premium": true }` |
| Update a listening part | `PATCH /api/v1/admin/listening-parts/{id}/` — body `{ "is_premium": true }` |
| List passages under a test | `GET /api/v1/admin/practice-tests/{test_id}/reading-passages/` |
| List parts under a test | `GET /api/v1/admin/practice-tests/{test_id}/listening-parts/` |
| Test detail (includes children + their `is_premium`) | `GET /api/v1/admin/practice-tests/{id}/` |
| Filter passages by premium | `GET /api/v1/admin/reading-passages/?is_premium=true` |

Marathon content:

| Action | Method & path |
| --- | --- |
| Assign passage to a day (must match marathon premium) | `POST /api/v1/admin/marathons/{marathon_id}/days/{day_number}/assign-passage/{pk}/` |
| Assign part to a day | `POST /api/v1/admin/marathons/{marathon_id}/days/{day_number}/assign-part/{pk}/` |
| Marathon detail | `GET /api/v1/admin/marathons/{id}/` |

> Note on marathon cascade: marathon passages/parts (`source=MARATHON`) can in
> principle be assigned to more than one marathon day. `cascade_premium` on a
> marathon updates every passage/part attached to **any** day of that marathon —
> if the same content object is shared with another marathon, it changes there
> too. Practice-test passages/parts are owned by a single test, so no such
> overlap applies there.

---

## Endpoints changed

- `apps/users/views/admin_views.py` — `AdminPracticeTestViewSet.perform_update`
- `apps/users/views/marathon_admin_views.py` — `MarathonViewSet.perform_update`

Both now accept `cascade_premium` in the PATCH/PUT body.
