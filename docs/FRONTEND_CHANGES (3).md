# Frontend Integration — Premium Packages & Marathon Trial Days

Everything the frontend needs for two related backend changes:

1. **Marathon trial days** — premium gating moved from the whole marathon down to the day.
2. **Premium packages** — `is_premium` as a boolean is replaced by packages + subscriptions.

Read them in order; the second redefines what "premium user" means in the first.

---

# Part 1 — Concepts

## Premium is no longer a boolean

Before, `user.is_premium` answered every access question. Now the question is:

> **Does this user hold an active Subscription to a Package that this content lists?**

Three objects:

| Object | What it is |
|---|---|
| **Package** | A sellable plan. Name, tier, price in UZS, optional discount, purchase link. |
| **Subscription** | A user holds one package for N months, `starts_at` → `expires_at`. |
| **Content → Packages** | `Marathon.packages` and `PracticeTest.packages`, both many-to-many. |

`expires_at > now` is the source of truth, checked on every request. `user.is_premium` still
exists as a cached flag for admin list views and filters, but **nothing security-relevant
reads it**. A user whose subscription lapsed at 14:00 is denied at 14:01, whether or not the
nightly cleanup task has run.

## Tiers are NOT a hierarchy

`SILVER` / `GOLD` / `PLATINUM` are **display labels**, not ranks.

A PLATINUM subscriber gets **nothing** from a marathon that lists only GOLD. If you want
Platinum holders to reach Gold content, the admin must list *both* packages on that content.

A subscriber whose package is not listed on a piece of content is treated **exactly like a
free user**. For a marathon that means `TRIAL` if it offers three free days, `LOCKED`
otherwise.

## Exactly one live package per tier

There can be **at most one active package per tier** at any moment. Creating a second
Silver while a Silver is active returns **409**. The admin must delete (retire) the current
Silver first, then create the replacement.

Because delete is a soft-delete, the retired package keeps existing:

- Its subscribers **keep their access** until their subscription expires.
- It stops appearing in the student package list and can no longer be assigned.
- The tier is freed, so a new package of that tier can be created.

**Important:** marathons and practice tests keep pointing at the **old** package. A new
Silver unlocks nothing until an admin adds it to each marathon and test. Replacing a tier's
package is therefore a two-step job: retire + create, then re-link content.

## Expiry revokes access, never progress

When a subscription lapses, the user loses access. Nothing is deleted: marathon enrollments,
completed days, streaks, in-progress attempts and saved answers all survive. When they
re-subscribe they resume from exactly where they were cut off.

---

# Part 2 — Marathon access

## The three marathon states

| `for_premium_users` | `make_three_days_free` | Free user gets | `access_type` |
|---|---|---|---|
| `false` | must be `false` | all days | `FREE` |
| `true` | `true` | days 1–3 only | `TRIAL` |
| `true` | `false` | nothing | `LOCKED` |

`access_type` is always `FREE` for a user who holds a listed package, regardless of flags.

## Breaking changes

1. **`GET /api/v1/student/marathons/` no longer filters premium marathons out.** Every
   visible marathon is returned to every authenticated user. Branch on `access_type`, never
   on `for_premium_users`.

2. **`GET /api/v1/student/marathons/{id}/` returns 200 for a LOCKED marathon** (previously
   403). Deliberate: it lets you render an upsell page. No day data is reachable.

3. **`POST /api/v1/student/marathons/{id}/enroll/` returns 403 `PREMIUM_REQUIRED`** for a
   free user on a LOCKED marathon. Free users **can** enroll in a TRIAL marathon.

4. **`is_locked` on a day changed meaning.** It used to mean "not yet reached in sequence".
   It now means "locked for any reason". See `lock_reason`.

## Marathon payload — new fields

Present on both list (`/marathons/`) and detail (`/marathons/{id}/`):

| Field | Type | Meaning |
|---|---|---|
| `for_premium_users` | bool | Existing. Whether this marathon is premium at all. |
| `make_three_days_free` | bool | **New.** Days 1–3 open to non-subscribers. Only meaningful when `for_premium_users` is true. |
| `access_type` | `"FREE"` \| `"TRIAL"` \| `"LOCKED"` | **New.** Already resolved against the requesting user. |
| `free_days_count` | int | **New.** How many days this user may complete. |

`free_days_count` resolves to:
- `marathon_days` when `FREE`
- `min(3, marathon_days)` when `TRIAL` — a 2-day trial marathon reports **2**, not 3
- `0` when `LOCKED`

```json
{
  "id": "8f3c...",
  "title": "30-Day Reading Sprint",
  "marathon_days": 30,
  "for_premium_users": true,
  "make_three_days_free": true,
  "access_type": "TRIAL",
  "free_days_count": 3
}
```

## Day payload — new fields

Present on the day list (`/marathons/{id}/days/`) and day detail (`/days/{n}/`):

| Field | Type | Meaning |
|---|---|---|
| `is_premium` | bool | **New.** Describes **the day's content**, not this user's access to it. |
| `lock_reason` | `"SEQUENCE"` \| `"PREMIUM"` \| `null` | **New.** Why this day is locked. |
| `is_locked` | bool | **Changed.** True iff `lock_reason != null`. |

**`is_premium` is user-independent.** Day 4 of a trial marathon reports `is_premium: true`
even to a subscriber who can open it — for them, `is_locked` is simply `false`. Do not use
`is_premium` to decide whether to let the user in; use `is_locked` / `lock_reason`.

**Sequence beats premium.** A day that is both unreached *and* premium reports `"SEQUENCE"`.
A subscriber therefore never sees `lock_reason: "PREMIUM"`.

```json
{
  "day_number": 4,
  "title": "Matching Headings",
  "is_premium": true,
  "is_locked": true,
  "lock_reason": "PREMIUM",
  "is_completed": false,
  "reading_passages_count": 1
}
```

Show an upgrade prompt when `lock_reason === "PREMIUM"`, and a "come back tomorrow" message
when it is `"SEQUENCE"`.

### Full day-list item

`id`, `day_number`, `title`, `difficulty`, `estimated_minutes`, `is_bonus_day`,
`is_completable`, `is_locked`, `is_premium`, `lock_reason`, `is_completed`,
`external_links_count`, `reading_passages_count`, `listening_parts_count`

### Full day-detail item

Everything above (minus the `_count` fields) plus `content`, `student_day_id`,
`time_spent_seconds`, `external_links`, `reading_passages`, `listening_parts`, `note`.

## How days unlock

```
current_day_number = min( max(days_since_enroll, highest_completed_day + 1), marathon_days )
```

A day opens either because a calendar day passed **or** because the previous day was
completed — whichever is further ahead. Because the calendar term advances regardless of
completion, **a premium day in the middle does not permanently wall off later free days**.
If days 1, 5 and 9 are free, a trial user reaches day 5 on calendar day 5 without ever
completing days 2–4.

The day list only returns days up to `current_day_number`, so in practice `lock_reason` in
the list is either `"PREMIUM"` or `null`.

## Which endpoints return `PREMIUM_REQUIRED`

Day detail · day complete · day note (GET/PUT/PATCH) · attempt create · attempt retake ·
attempt detail · attempt save · attempt submit · attempt review · marathon enroll.

The four attempt endpoints (`detail`, `save`, `submit`, `review`) re-check on **every**
call. A student holding an in-progress attempt on a day an admin later moves behind the
paywall is cut off mid-attempt. Their answers are kept.

## Completion semantics

A trial user who finishes days 1–3 does **not** finish the marathon. `is_finished_marathon`
stays `false` and no `MARATHON_FINISHER` badge is awarded. Completion still requires every
non-bonus day that has content.

---

# Part 3 — Practice tests are now really gated

`PracticeTest.is_premium` existed as a model field and was **never enforced anywhere**. It
is enforced now.

## Test list payload — new fields

| Field | Type | Meaning |
|---|---|---|
| `is_premium` | bool | **New in this payload.** Whether the test is premium content. |
| `is_accessible` | bool | **New.** Whether *this viewer* can open it. |

Premium tests are still **returned** in the list — flagged, not hidden — so you can render
an upgrade prompt:

```json
{
  "id": "1a2b...",
  "title": "Cambridge 18 Test 1",
  "is_premium": true,
  "is_accessible": false
}
```

For an anonymous viewer, `is_accessible` on a premium test is always `false`.

> **Breaking:** `is_premium` used to be deliberately withheld from this payload. It is now
> present. The `?premium=` query parameter is still **not** a filter — it never was.

## Enforcement

Attempting to start, fetch, save, submit, or review an attempt on an inaccessible premium
test returns **403 `PREMIUM_REQUIRED`**. This applies to anonymous users too, since they
hold no package.

As with marathons, the check runs on every attempt call, so a student whose subscription
lapses mid-test is cut off and resumes the same attempt after re-subscribing.

---

# Part 4 — Packages: student endpoints

## `GET /api/v1/student/packages/`

Active packages only. **Un-paginated** — returns a plain array.

```json
[
  {
    "id": "c4d5...",
    "name": "Gold Monthly",
    "tier": "GOLD",
    "tier_display": "Gold",
    "price": "399000.00",
    "has_discount": true,
    "discounted_price": "299000.00",
    "effective_price": "299000.00",
    "purchase_url": "https://t.me/ieltsmaster_support"
  }
]
```

| Field | Type | Notes |
|---|---|---|
| `tier` | `"SILVER"` \| `"GOLD"` \| `"PLATINUM"` | Label, not a rank. |
| `tier_display` | string | Human-readable tier. |
| `price` | decimal string | **Always UZS.** No currency field exists. |
| `has_discount` | bool | |
| `discounted_price` | decimal string \| null | Non-null only when `has_discount`. |
| `effective_price` | decimal string | Read-only. `discounted_price` if discounted, else `price`. Use this for display. |
| `purchase_url` | string | Usually a Telegram link. There is **no payment gateway** — the admin assigns the package manually after payment. |

## `GET /api/v1/student/subscription/`

The requesting user's own subscription.

```json
{
  "active": true,
  "subscription": {
    "id": "77aa...",
    "package": "c4d5...",
    "package_name": "Gold Monthly",
    "package_tier": "GOLD",
    "months": 3,
    "starts_at": "2026-07-09T10:00:00Z",
    "expires_at": "2026-10-09T10:00:00Z",
    "status": "ACTIVE",
    "is_currently_active": true,
    "days_remaining": 92,
    "cancelled_at": null,
    "created_at": "2026-07-09T10:00:00Z"
  }
}
```

When there is no active subscription:

```json
{"active": false, "subscription": null}
```

`days_remaining` is floored at 0. An expired subscription reads as `"active": false` even
before the nightly task marks it `EXPIRED`.

---

# Part 5 — Packages: admin endpoints

## Package CRUD

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/admin/packages/` | Paginated. Filters: `tier`, `is_active`, `has_discount`. Search: `name`. Ordering: `tier`, `name`, `price`, `created_at`. |
| POST | `/api/v1/admin/packages/` | Create. |
| GET | `/api/v1/admin/packages/{package_id}/` | |
| PATCH / PUT | `/api/v1/admin/packages/{package_id}/` | |
| DELETE | `/api/v1/admin/packages/{package_id}/` | **Soft-delete** → sets `is_active=false`. Returns 204. Frees the tier. |

Delete is soft because subscriptions `PROTECT` the package row and content may still
reference it. History stays intact; the package simply stops being assignable and stops
appearing in the student list.

### Write payload

```json
{
  "name": "Gold Monthly",
  "tier": "GOLD",
  "price": "399000.00",
  "has_discount": true,
  "discounted_price": "299000.00",
  "purchase_url": "https://t.me/ieltsmaster_support",
  "is_active": true
}
```

Admin reads additionally return `tier_display`, `effective_price`, `created_at`,
`updated_at`.

### Discount validation

- `has_discount: true` **requires** `discounted_price` → else 400.
- `discounted_price` must be **strictly lower** than `price` → else 400.
- `has_discount: false` **requires** `discounted_price` to be null → else 400.

Validation resolves both fields against the existing instance, so a `PATCH` that touches
only one of them is still checked against the other.

### One active package per tier → 409

Creating a package for a tier that already has an active package returns **409**:

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "An active Silver package already exists (\"Silver Monthly\"). Delete it before creating a new one.",
    "details": {}
  }
}
```

The message names the incumbent package, so the UI can offer "Retire *Silver Monthly* and
create this one?" directly.

The same 409 fires when **reactivating** a retired package (`PATCH {"is_active": true}`)
while another package of that tier is live. Updating a live package **in place** (changing
its price, name, discount) never conflicts with itself.

Enforced by a database constraint (`unique_active_package_per_tier`, partial on
`is_active=true`) as well as the serializer, so a concurrent double-create also fails.

### Replacing a tier's package — the full flow

```
1. DELETE /api/v1/admin/packages/{old_silver_id}/      → 204, tier freed
2. POST   /api/v1/admin/packages/ {"tier": "SILVER"}   → 201
3. Re-link content: add the new package to every marathon
   and practice test that listed the old one
```

Step 3 is **not automatic**. Until it is done, subscribers to the new Silver can reach no
premium content. Existing subscribers to the old Silver are unaffected and keep their
access until their subscription expires.

## Assigning premium to a user

There are **two endpoint pairs that do the same thing**. Both route through one service
function, so they behave identically and both write the audit trail.

### Pair 1 — assign / cancel

```
POST /api/v1/admin/users/{user_id}/subscription/
{"package": "<package-uuid>", "months": 3, "note": "optional"}

POST /api/v1/admin/users/{user_id}/subscription/cancel/
```

### Pair 2 — premium enable / disable ⚠ contract changed

```
POST /api/v1/admin/users/{user_id}/premium/enable/
{"package": "<package-uuid>", "months": 3, "note": "manual grant"}

POST /api/v1/admin/users/{user_id}/premium/disable/
{"note": "optional"}
```

**`enable` now requires `package` and `months`.** It previously accepted only `note` and set
`is_premium = true` directly.

That old behavior became a bug the moment access started deriving from a subscription's
`expires_at`: flipping the flag alone returns 200 and grants the user **nothing**. The
endpoint now creates a real subscription.

### Both pairs

- `months` — integer, **1 to 120**.
- Assign returns **201** with the subscription payload; enable returns **200** with the user
  payload. Both run from now to `now + N calendar months`.
- Sets `user.is_premium = true` (a cache — see below).
- Records `assigned_by` / `performed_by` (the acting admin).
- Writes a `PremiumHistory` row (`ENABLED` / `DISABLED`).
- Only **active** packages can be assigned; an inactive one returns 400.

### Status codes, unified across both pairs

| Situation | Code |
|---|---|
| User already has an active subscription | **409 CONFLICT** |
| No active subscription to cancel / disable | **404** |
| Missing `package` or `months` | **400** |
| Inactive package | **400** |

> Two of these changed. `enable` on an already-premium user used to return **400** → now
> **409**. `disable` on a non-premium user used to return **400** → now **404**.

### `is_premium` is a cache, not a grant

A user with `is_premium = true` and no subscription row has **no access**. Never write that
flag directly — always go through one of the four endpoints above.

### Audit trail

```
GET /api/v1/admin/users/{user_id}/premium-history/   # admin view, includes performed_by
GET /api/v1/student/premium-history/                 # student's own, no admin identity
```

### Calendar months, not 30-day blocks

Expiry uses `relativedelta`. `31 Jan + 1 month` = **28 Feb** (or 29 in a leap year), not
2 March.

### 409 on an existing active subscription

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "This user already has an active subscription. Cancel it before assigning a new one.",
    "details": {}
  }
}
```

A user may hold **at most one active subscription**. This is enforced by a database
constraint, not just the view, so a concurrent double-assign also fails.

An **expired** or **cancelled** subscription does **not** block a new assignment — only an
active one does.

## Cancelling

```
POST /api/v1/admin/users/{user_id}/subscription/cancel/
```

- **200** with the cancelled subscription (`status: "CANCELLED"`, `cancelled_at` set).
- Sets `user.is_premium = false`.
- **404** if the user has no active subscription.

This is the escape hatch for the 409 above: cancel, then assign.

## Subscription history

```
GET /api/v1/admin/users/{user_id}/subscription/
```

Returns an array of **all** of the user's subscriptions, newest first, including expired and
cancelled ones. Fields: `id`, `user`, `user_email`, `package`, `package_name`,
`package_tier`, `months`, `starts_at`, `expires_at`, `status`, `is_currently_active`,
`days_remaining`, `cancelled_at`, `created_at`.

`status` is one of `ACTIVE` · `EXPIRED` · `CANCELLED`.

---

# Part 6 — Admin content changes

## Marathons

The admin marathon serializers (list, detail, write) gain two fields:

| Field | Type | Notes |
|---|---|---|
| `make_three_days_free` | bool | |
| `packages` | array of package UUIDs | |

### Validation

1. `make_three_days_free: true` with `for_premium_users: false` → **400**.
2. `for_premium_users: true` with an empty `packages` list → **400**.

Both rules resolve the flags against the existing instance. That means a `PATCH` clearing
`for_premium_users` while `make_three_days_free` is still set is **rejected** — the admin UI
must clear both in the same request:

```
PATCH /api/v1/admin/marathons/{id}/
{"for_premium_users": false, "make_three_days_free": false}
```

## Practice tests

The practice-test write serializer gains `packages` (array of package UUIDs).

### Validation

`is_premium: true` with an empty `packages` list → **400**.

So enabling a test as premium now *requires* choosing which packages unlock it, exactly as
with marathons.

## Passages and parts: `is_premium` is a consistency flag, not a gate

`ReadingPassage.is_premium` and `ListeningPart.is_premium` exist, but they are **never
checked against a student**. They are an admin-side integrity rule: a passage's premium
status must match its container's.

- A premium practice test cannot hold a free passage, and vice versa → **400**.
- A premium marathon cannot be assigned free content, and vice versa → **400**.
- Content-bank attach and marathon assign enforce the same match.

These are **not** given a `packages` M2M. The gate lives on the container — the practice test
or the marathon — which is what carries the packages. Putting packages on the passage too
would create a second source of truth for the same decision.

Both are filterable: `?is_premium=true` on the passage/part and content-bank list endpoints.

---

# Part 7 — Error codes

All `/api/v1/` errors are wrapped:

```json
{"error": {"code": "...", "message": "...", "details": {}}}
```

## New: `PREMIUM_REQUIRED`

```json
{
  "error": {
    "code": "PREMIUM_REQUIRED",
    "message": "This day requires a premium subscription.",
    "details": {}
  }
}
```

HTTP **403**. Previously every 403 under `/api/v1/` collapsed to `PERMISSION_DENIED`, so the
client could not tell "not yet unlocked" from "you must pay". Ordinary permission errors
still return `PERMISSION_DENIED`; only premium blocks return `PREMIUM_REQUIRED`.

## Existing codes still in play

`CONFLICT` (409) on double-assign · `PERMISSION_DENIED` (403) on sequence locks, hidden
marathons, and not-enrolled · `VALIDATION_ERROR` (400) on serializer failures ·
`NOT_FOUND` (404).

> Note: `/api/auth/` endpoints are **not** wrapped and keep DRF's plain `{"detail": ...}`
> shape. Only `/api/v1/` uses the `error` envelope.

---

# Part 8 — Backend operations (context, not frontend work)

## Celery is new to this project

There was previously no Celery, no broker, and no worker. Added:

- `celery==5.4.0` and `python-dateutil` in `requirements.txt`
- `config/celery.py`, exported from `config/__init__.py`
- `CELERY_*` settings, brokered on **Redis db 2**, results on **db 3** — deliberately not
  db 1 (the cache), so flushing the cache cannot drop queued tasks
- Two `docker-compose` services: `celery_worker` and `celery_beat`

## The nightly expiry task

`apps.users.tasks.expire_subscriptions`, scheduled at **00:15 UTC** daily.

What it does:
1. Marks subscriptions whose `expires_at` has passed as `EXPIRED`.
2. Clears `is_premium` for affected users who have no remaining valid subscription.

What it does **not** do: gate access. Access is already denied by the read-time
`expires_at > now` check. The task is bookkeeping. A downed worker or a missed run **cannot
grant anyone premium**. It is idempotent — running it twice changes nothing the second time.

The task accepts an explicit `as_of` timestamp (ISO string or datetime), which is how the
tests advance time for real rather than mocking the clock.

## Deploy checklist

- [ ] `pip install -r requirements.txt` (adds `celery`, `python-dateutil`)
- [ ] Start the `celery_worker` and `celery_beat` services
- [ ] Set `CELERY_BROKER_URL` / `CELERY_RESULT_BACKEND` if not using the Redis defaults
- [ ] Run migrations — see below
- [ ] **Set real package prices.** The seeded ones are placeholders.

## Migrations `0021` – `0023`

| Migration | What it does |
|---|---|
| `0021` | `PremiumHistory` audit model. |
| `0022` | `is_premium` on `ReadingPassage` and `ListeningPart`. |
| `0023` | Backfills passage/part `is_premium` from their parent test / marathon. |
| `0024` | Adds `Marathon.make_three_days_free` (default `false`). No data change. |
| `0025` | Adds `Package`, `Subscription`, `Marathon.packages`, `PracticeTest.packages`, and the one-active-subscription-per-user constraint. |
| `0026` | **Data migration.** See below. |
| `0027` | Adds the `unique_active_package_per_tier` constraint. Safe: `0026` seeds exactly one active package per tier. |

`0021`–`0023` came from a parallel branch; `0024`–`0027` were renumbered to chain after them
so the migration graph stays linear.

### What `0023` does to existing data

`0025` introduces two invariants that current data violates: premium content must list a
package (none exist), and premium access must come from a subscription row (none exist).
`0026` fixes both:

1. Seeds three packages — **Silver 199 000**, **Gold 399 000**, **Platinum 699 000** UZS.
   *These prices are placeholders.*
2. Attaches **all three** packages to every existing `for_premium_users=true` marathon and
   every `is_premium=true` practice test. This reproduces the old "any premium user can
   access" behavior exactly, so nothing silently breaks. Admins narrow them down by hand.
3. Mints a **Platinum subscription expiring 2099-01-01** for every existing
   `is_premium=true` user.

Step 3 over-grants on purpose: silently downgrading a paying customer is worse than letting
an admin correct individuals afterwards. To give these users a real finite term instead,
change `BACKFILL_EXPIRY` and `BACKFILL_MONTHS` at the top of
`apps/users/migrations/0026_seed_packages_and_backfill_premium.py` **before** deploying.

The migration reverses cleanly: it drops the seeded subscriptions and packages and leaves
`is_premium` untouched.

---

# Part 9 — Frontend migration checklist

**Marathon list / detail**
- [ ] Stop filtering on `for_premium_users`; read `access_type` instead
- [ ] Handle `access_type: "LOCKED"` detail pages returning 200 (render upsell)
- [ ] Handle 403 `PREMIUM_REQUIRED` on enroll for LOCKED marathons
- [ ] Show `free_days_count` on TRIAL marathons

**Marathon days**
- [ ] `is_locked` now covers premium too — switch to `lock_reason` for messaging
- [ ] `lock_reason === "PREMIUM"` → upgrade prompt; `"SEQUENCE"` → come-back-later
- [ ] Do not read `is_premium` as "user cannot enter"; it describes the content

**Practice tests**
- [ ] `is_premium` is now in the list payload — flag premium tests
- [ ] Use `is_accessible` to decide whether to enable the Start button
- [ ] Handle 403 `PREMIUM_REQUIRED` on attempt create/save/submit/review

**Packages**
- [ ] Build the upgrade screen from `GET /student/packages/`; display `effective_price`
- [ ] Send users to `purchase_url` (Telegram); there is no in-app payment
- [ ] Show subscription state and `days_remaining` from `GET /student/subscription/`

**Admin panel — packages**
- [ ] Package CRUD screen, with discount validation mirrored client-side
- [ ] Only one active package per tier: disable "create" for a tier that already has a live
      package, or handle the 409 by offering to retire the incumbent first
- [ ] After replacing a tier's package, prompt the admin to re-link marathons and practice
      tests — the new package unlocks nothing until they do
- [ ] Handle the 409 when reactivating a retired package whose tier is now taken

**Admin panel — subscriptions**
- [ ] Replace any "make premium" checkbox with: pick package + pick months
- [ ] `premium/enable/` now requires `package` and `months` — sending only `note` returns 400
- [ ] `enable` on an already-premium user: **400 → 409**
- [ ] `disable` on a non-premium user: **400 → 404**
- [ ] Handle 409 on assign → prompt the admin to cancel the existing subscription first
- [ ] Add a cancel button
- [ ] Never write `is_premium` directly — it grants nothing on its own
- [ ] Marathon form: require ≥1 package when `for_premium_users` is on; clear
      `make_three_days_free` in the same request when turning premium off
- [ ] Practice-test form: require ≥1 package when `is_premium` is on
