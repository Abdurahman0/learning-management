# Student UI + Backend Audit (2026-03-28)

## Scope
- Student-facing app routes under `app/[locale]/(app)`.
- Student API layer under `src/services/student`.
- Goal: keep last pushed student UI structure while preserving real backend integration.

## What Is Wired To Real Backend
- `GET /api/v1/student/tests/`
  - Used in dashboard enrichment and test discovery fallback.
  - Files:
    - `app/[locale]/(app)/dashboard/_components/DashboardClient.tsx`
    - `app/[locale]/(app)/reading/[id]/page.tsx`
    - `app/[locale]/(app)/listening/[id]/page.tsx`
- `GET /api/v1/student/tests/reading/`
  - Used on reading list and reading test fallback lookup.
  - Files:
    - `app/[locale]/(app)/reading/page.tsx`
    - `app/[locale]/(app)/reading/[id]/page.tsx`
- `GET /api/v1/student/tests/listening/`
  - Used on listening list and listening test fallback lookup.
  - Files:
    - `app/[locale]/(app)/listening/page.tsx`
    - `app/[locale]/(app)/listening/[id]/page.tsx`
- `POST /api/v1/student/attempts/`
  - Used when starting reading/listening attempts.
  - Files:
    - `app/[locale]/(app)/reading/start/page.tsx`
    - `app/[locale]/(app)/listening/start/page.tsx`
- `GET /api/v1/student/attempts/{id}/`
  - Used by attempt-id resolver routes to route into old UI flow.
  - Files:
    - `app/[locale]/(app)/reading/test/[attemptId]/page.tsx`
    - `app/[locale]/(app)/listening/test/[attemptId]/page.tsx`

## APIs In Service Layer Not Currently Used By Active UI
- `PATCH /api/v1/student/attempts/{id}/save/`
- `POST /api/v1/student/attempts/{id}/submit/`
- `GET /api/v1/student/attempts/{id}/review/`

Reason:
- These were previously used by an alternate student attempt runner UI that has been removed from active routing to restore original GitHub UI structure.

## Student UI Areas Still Mock/Static (Need Backend Contracts)
- Dashboard advanced cards:
  - score progression graph
  - skill snapshot bands
  - weak-area diagnostics
  - recent history table details
  - achievements
- Analytics page:
  - progression ranges
  - module performance breakdown
  - insights and weekly activity
- Review center page
- Assignments and assignment feedback/submission data
- Sessions page
- Messages page
- AI coach page
- Study bank page
- Vocabulary page
- Mistake analysis page
- Reading/listening result/review sub-pages that still rely on local answer datasets for detailed analysis views

Current blocker:
- No implemented student service endpoints/DTO contracts in this codebase for these domains yet.

## UI/Flow Fixes Applied In This Audit
- Removed non-original student route stack that caused visual inconsistency:
  - deleted `app/[locale]/(app)/tests`
  - deleted `app/[locale]/(app)/_components/tests`
- Restored attempt-id flow to original shell:
  - `reading/test/[attemptId]` and `listening/test/[attemptId]` now resolve attempt via backend and route into original reading/listening page flow.
- Preserved student sidebar visual structure while using real authenticated user identity.
- Stabilized backend fallback handling on reading/listening detail routes (no redirect loop when fallback data exists).
- Dashboard now consumes backend where available without changing visual hierarchy:
  - real user name
  - real total test count
  - backend-driven continue target

## Missing Backend Fields To Reach Full Production Data-Driven Student UI
- Attempt history list with timestamps and scores for charts/tables.
- Per-module and per-question-type aggregates for analytics.
- Review-center feed endpoint with status/state metadata.
- Vocabulary CRUD endpoints for personal words/decks.
- Assignment and session endpoints for student-facing workflow pages.
- Achievement and streak APIs (or a unified profile-progress endpoint).

## Recommendation
- Keep current restored UI structure unchanged.
- Expand `src/services/student` with domain-specific endpoints only after backend contracts are confirmed, then replace remaining mock datasets page-by-page behind stable adapters.
