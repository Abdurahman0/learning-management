# Student API Audit (2026-03-30)

## A. APIs Wired Into Active UI
- `GET /api/v1/student/dashboard/`
  - Used in dashboard hero + KPI + continue/recent/skills overlays.
  - Files: `app/[locale]/(app)/dashboard/_components/DashboardClient.tsx`, `src/services/student/dashboard.service.ts`
- `GET /api/v1/student/profile/`
  - Used in student settings/profile page load.
  - Files: `app/[locale]/(app)/settings/page.tsx`, `src/services/student/profile.service.ts`
- `PATCH /api/v1/student/profile/`
  - Used for `target_band` updates from settings.
  - Files: `app/[locale]/(app)/settings/page.tsx`, `src/services/student/profile.service.ts`
- `GET /api/v1/student/tests/`
  - Used for dashboard continue fallback + reading/listening fallback discovery.
  - Files: `app/[locale]/(app)/dashboard/_components/DashboardClient.tsx`, `app/[locale]/(app)/reading/[id]/page.tsx`, `app/[locale]/(app)/listening/[id]/page.tsx`, `src/services/student/tests.service.ts`
- `GET /api/v1/student/tests/reading/`
  - Used in reading listing (search/ordering + backend pagination fetch).
  - Files: `app/[locale]/(app)/reading/page.tsx`, `src/services/student/tests.service.ts`
- `GET /api/v1/student/tests/listening/`
  - Used in listening listing (search/ordering + backend pagination fetch).
  - Files: `app/[locale]/(app)/listening/page.tsx`, `src/services/student/tests.service.ts`
- `POST /api/v1/student/attempts/`
  - Used by reading/listening start pages before entering test UI.
  - Files: `app/[locale]/(app)/reading/start/page.tsx`, `app/[locale]/(app)/listening/start/page.tsx`, `src/services/student/attempts.service.ts`
- `GET /api/v1/student/attempts/{attempt_id}/`
  - Used for attempt resolver routes + fallback loading in test pages.
  - Files: `app/[locale]/(app)/reading/test/[attemptId]/page.tsx`, `app/[locale]/(app)/listening/test/[attemptId]/page.tsx`, `app/[locale]/(app)/reading/[id]/page.tsx`, `app/[locale]/(app)/listening/[id]/page.tsx`
- `PATCH /api/v1/student/attempts/{attempt_id}/save/`
  - Used for debounced answer-change save + periodic autosave in reading/listening test runners.
  - Files: `app/[locale]/(app)/reading/[id]/page.tsx`, `app/[locale]/(app)/listening/[id]/page.tsx`
- `POST /api/v1/student/attempts/{attempt_id}/submit/`
  - Used on finish/submit in reading/listening test runners.
  - Files: `app/[locale]/(app)/reading/[id]/page.tsx`, `app/[locale]/(app)/listening/[id]/page.tsx`
- `GET /api/v1/student/attempts/{attempt_id}/review/`
  - Used in reading/listening result + review pages (backend-first rendering, with safe static fallback).
  - Files: `app/[locale]/(app)/reading/[id]/result/_components/ReadingSummaryPageClient.tsx`, `app/[locale]/(app)/reading/[id]/review/_components/ReadingAnalysisPageClient.tsx`, `app/[locale]/(app)/listening/[id]/result/page.tsx`, `app/[locale]/(app)/listening/[id]/review/page.tsx`
- `GET /api/v1/student/analytics/`
  - Used in analytics page cards/charts/activity mapping.
  - Files: `app/[locale]/(app)/analytics/_components/StudentProgressAnalyticsClient.tsx`, `src/services/student/analytics.service.ts`
- `GET /api/v1/student/review-center/`
  - Used in review-center list/sync.
  - Files: `app/[locale]/(app)/review-center/_components/StudentReviewCenterClient.tsx`, `src/services/student/reviewCenter.service.ts`
- `DELETE /api/v1/student/review-center/{item_id}/`
  - Used by review-center remove action.
  - Files: `app/[locale]/(app)/review-center/_components/StudentReviewCenterClient.tsx`, `src/services/student/reviewCenter.service.ts`

## B. APIs Implemented In Service Layer But Not Used By Current UI
- `POST /api/v1/student/review-center/`
  - Implemented as `studentReviewCenterService.create`, but the current merged Review Center UI has no "add item" form/action.
- `PATCH /api/v1/student/review-center/{item_id}/`
  - Implemented as `studentReviewCenterService.update`, but current UI does not expose flag/save/weak-area edit controls.

## C. UI Functionalities That Need Backend Support
- Listening test runner for backend-only test IDs (not present in local static `listening-tests-full`) still falls back to a CTA card instead of entering full compact runner UI.
- Analytics charts/insight cards still need richer backend aggregates (question-type distribution, module heatmaps, stable activity labels/hrefs) for full static removal.
- Review Center charts (mistakes by type + module distribution + pattern cards) still need backend aggregate fields; current endpoint primarily returns item-level rows.
- Settings full-name editing remains read-only in this screen because student profile endpoint currently supports `target_band` only.

## D. Partial-Data Fallbacks Kept Intentionally
- Dashboard keeps static/default blocks when backend omits optional cards (weak-areas, achievements, recommendation copy, detailed recent history labels).
- Analytics page keeps static chart data for blocks where backend response is incomplete.
- Review Center keeps static chart/insight datasets while using real backend list/delete.
- Reading/Listening result/review pages keep local/static fallback logic when backend review payload is missing/empty.

## E. Backend Fields Needed To Fully Replace Remaining Static Data
- For listening runner parity on backend-only tests:
  - Attempt/detail payload mapping-ready block metadata per part (`block_type`, `prompt schema`, `options`, table/form/diagram structure), not only generic question groups.
- For analytics full replacement:
  - Stable series arrays with canonical keys/labels for band trend, weekly activity, accuracy trend.
  - Question-type and module aggregate breakdowns with percentages/counts.
  - Recent activity rows with normalized `date_label`, `question_type_key`, `action`, `href`.
- For review-center charts:
  - Aggregate payload section (question-type mistake counts, module distribution, pattern insights) in `GET /review-center/`.
- For profile parity:
  - `full_name` update support in student profile PATCH (or explicit profile-edit endpoint for student app surface).
