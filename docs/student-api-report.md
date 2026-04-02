# Student API Report (2026-03-28)

## 1. Unused APIs
- `POST /api/v1/student/review-center/`
  - Service implemented (`studentReviewCenterService.create`) but no current UI action creates a review item from this page.
- `PATCH /api/v1/student/review-center/{id}/`
  - Service implemented (`studentReviewCenterService.update`) but current Review Center UI has no edit modal/form.
- `PATCH /api/v1/student/profile/`
  - Service implemented (`studentProfileService.updateProfile`) but current Settings UI exposes full name only (handled via auth edit endpoint), not target band editing yet.
- `GET /api/v1/student/attempts/{id}/review/`
  - Service implemented and available; active Reading/Listening runners still use existing local review rendering paths.

## 2. UI Features That Need Backend (Not Fully Wired Yet)
- Listening runner for backend-only tests (`test_id` not found in local listening dataset) still falls back to summary card instead of full live runner mapping.
- Dashboard advanced cards (weak areas, achievements, recommendations) now accept backend overlays, but backend payload often lacks all fields needed for complete replacement.
- Analytics insight text and question-type labels still partially rely on translation/static keys when backend provides only numeric aggregates.
- Review Center chart blocks (module distribution, mistake-by-type) remain static unless backend returns matching structures.

## 3. Partial Data Issues
- `dashboard` payload shape is inconsistent across environments (summary and list blocks can be nested under different keys), requiring resilient key-based extraction.
- `analytics` payload often omits stable IDs/labels for chart points; frontend synthesizes IDs and labels to preserve chart rendering.
- `review-center` item schema may not include full `StudentSavedQuestion` fields (`options`, `correctAnswer`, `previousAnswer`, `reference`), so UI uses safe defaults.
- Attempt answer format is type-dependent in backend; frontend sends normalized `{answer}` or `{answers}` payloads, but richer per-question-type validation metadata is still missing from student endpoints.

## 4. Mapping Notes
- Backend-first + UI-locked strategy used:
  - UI component hierarchy and layout were preserved.
  - API data is mapped into existing UI view-models with fallback to existing static datasets when fields are missing.
- Dashboard mapping:
  - `/dashboard` drives summary, continue card, score progression, skills, weak areas, recent history, achievements when available.
  - `/tests` still used as fallback source for continue target and tests count.
- Analytics mapping:
  - `/analytics` maps to summary cards, charts, module performance, insights, recent activity.
  - Missing fields fall back to existing `data/student/progress-analytics` values.
- Review Center mapping:
  - `/review-center` list maps into existing `StudentSavedQuestion` structure with safe defaults.
  - Delete action now attempts backend delete first, then updates local UI state.
- Attempt flow mapping:
  - Reading attempt route prioritizes `attempt_id` over snapshot/local fallback.
  - Reading runner now autosaves to backend on answer changes (debounced) + every 30s, and submits on finish.
  - Listening route has attempt-priority/redirect guard parity; full backend-to-runner mapping remains pending for backend-only listening tests.
