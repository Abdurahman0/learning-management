# Marathon — Per-Passage / Per-Part External Links (Frontend Handoff)

## What changed

A marathon day can have **content** assigned to it: reading passages and listening parts.
You can now attach **one optional external link** to **each** of those:

- 1 reading passage → 0 or 1 external link
- 1 listening part → 0 or 1 external link

Each link is `{ title, url }`. Links are scoped to **a specific day + specific passage/part** — the
same passage on a different day has its own independent link.

This is **separate** from the existing day-level `external_links` list (the generic
`.../external-links/` endpoints). That list is untouched. Don't confuse the two.

---

## Where the link shows up (read)

The link is embedded directly on each passage/part object in the **day detail** response, as a field
named `external_link`. It is `null` when no link is set.

### Admin — `GET /api/v1/admin/marathons/{marathon_id}/days/{day_number}/`

```jsonc
{
  "id": "…",
  "day_number": 1,
  "reading_passages": [
    {
      "id": "PASSAGE_UUID",
      "title": "Passage 1",
      // …existing fields…
      "external_link": {
        "id": "LINK_UUID",
        "title": "Vocab list",
        "url": "https://example.com/vocab"
      }
    }
  ],
  "listening_parts": [
    {
      "id": "PART_UUID",
      "title": "Part 1",
      // …existing fields…
      "external_link": null        // no link set
    }
  ]
}
```

### Student — `GET /api/v1/student/marathons/{marathon_id}/days/{day_number}/`

Same shape, but the link object has **no `id`** (students don't need it):

```jsonc
"external_link": { "title": "Vocab list", "url": "https://example.com/vocab" }   // or null
```

Render: if `external_link` is not null, show a link/button on that passage/part card using
`external_link.title` as label (fall back to a default label if title empty) and `external_link.url`
as href. Open in new tab.

---

## Managing links (admin only)

Links are keyed by the **passage/part id** (not a separate link id), because there's at most one per
passage/part per day. One endpoint does create + update via `PUT` (upsert).

Requires admin JWT. Tag in Swagger: **Admin Marathon**.

### Reading passage link

| Method | Path | Purpose |
|--------|------|---------|
| `PUT` | `/api/v1/admin/marathons/{marathon_id}/days/{day_number}/passage-links/{passage_id}/` | Create or replace |
| `GET` | same | Fetch single link |
| `DELETE` | same | Remove link |

### Listening part link

| Method | Path | Purpose |
|--------|------|---------|
| `PUT` | `/api/v1/admin/marathons/{marathon_id}/days/{day_number}/part-links/{part_id}/` | Create or replace |
| `GET` | same | Fetch single link |
| `DELETE` | same | Remove link |

### PUT request body

```json
{ "title": "Vocab list", "url": "https://example.com/vocab" }
```

- `url` — required, must be valid URL.
- `title` — optional (may be empty string).

### Responses

| Status | When |
|--------|------|
| `201 Created` | link did not exist, now created |
| `200 OK` | link existed, updated |
| `204 No Content` | DELETE success |
| `400 Bad Request` | passage/part **not assigned** to that day, or invalid/missing `url` |
| `404 Not Found` | marathon/day not found, or GET when no link set |

`PUT`/`GET` 200/201 body:

```json
{
  "id": "LINK_UUID",
  "reading_passage": "PASSAGE_UUID",   // or "listening_part" for parts
  "title": "Vocab list",
  "url": "https://example.com/vocab",
  "created_at": "…",
  "updated_at": "…"
}
```

---

## Important constraint

The passage/part **must already be assigned to the day** before you can set its link. Assign first:

- `POST /api/v1/admin/marathons/{marathon_id}/days/{day_number}/assign-passage/{passage_id}/`
- `POST /api/v1/admin/marathons/{marathon_id}/days/{day_number}/assign-part/{part_id}/`

Setting a link on an unassigned passage/part returns `400`.

Re-PUT on the same passage/part overwrites — it does **not** create a second link.

---

## Admin UI flow (suggested)

1. Open day editor → list assigned reading passages and listening parts (from day detail).
2. Per passage/part card, show its `external_link` if set, else an "Add link" button.
3. Add/Edit → form with `title` + `url` → `PUT` the matching `passage-links` / `part-links` endpoint.
4. Remove → `DELETE` same endpoint.
5. Refetch day detail (or patch local state) to reflect the change.

No new global setup needed. Migration `0019` adds the tables; backend already deployed-ready.
