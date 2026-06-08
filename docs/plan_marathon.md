# Marathon Feature — Implementation Plan

## 1. Overview

Marathon is a structured, day-by-day IELTS skill-improvement programme. Admin creates a marathon with a fixed number of days. Students self-enroll; their enrollment date becomes their personal Day 1. Each day may contain reading passages, listening parts, curated content, and external links. Students progress sequentially — they cannot skip ahead or view future days. Days with passages/parts can be "marked complete" only after solving all of them. A student finishes the marathon when every completable day is marked complete.

---

## 2. Existing Model Updates

### 2.1 `CustomUser` — add `is_premium`

`is_premium` currently exists only on `PracticeTest`. We need it on the user to gate marathon access.

```python
# apps/users/models/user.py — add field to CustomUser
is_premium = models.BooleanField(default=False, verbose_name="Premium User")
```

Migration required. Admin API for users (`AdminUsersV1DetailView`) must expose this field for read/write.

### 2.2 `ContentSource` — add `MARATHON`

```python
# apps/users/models/reading_listening.py
class ContentSource(models.TextChoices):
    CUSTOM_PRACTICE = "CUSTOM_PRACTICE", _("Custom Practice")
    CAMBRIDGE = "CAMBRIDGE", _("Cambridge")
    MARATHON = "MARATHON", _("Marathon")          # NEW
```

Marathon passages and parts are `ReadingPassage` / `ListeningPart` instances with `source=MARATHON` and `practice_test=None`. This reuses the entire existing question hierarchy (`QuestionGroup`, `Question`) and all scoring utilities (`answer_checker.py`, `band_score.py`) with zero changes.

**Guard rule**: Every existing admin and student queryset that fetches `ReadingPassage` or `ListeningPart` must add `.exclude(source=ContentSource.MARATHON)`. This is the only migration-side effect on existing code.

### 2.3 `StudentBadge.BadgeType` — add marathon badges

```python
MARATHON_FINISHER       = 'MARATHON_FINISHER',       _('Marathon Finisher')
MARATHON_PERFECT_DAY    = 'MARATHON_PERFECT_DAY',    _('Perfect Marathon Day')
MARATHON_WEEK_STREAK    = 'MARATHON_WEEK_STREAK',    _('7-Day Marathon Streak')
MARATHON_SPEED_RUNNER   = 'MARATHON_SPEED_RUNNER',   _('Marathon Speed Runner')
```

---

## 3. New Models

### 3.1 `Marathon`

```
db_table: marathons
```

| Field | Type | Notes |
|---|---|---|
| `id` | UUIDField PK | |
| `title` | CharField(255) | marathon_title |
| `description` | TextField blank | optional intro |
| `marathon_days` | PositiveSmallIntegerField | total days, e.g. 30 |
| `external_link` | URLField(1000) blank | single link for the marathon overall |
| `external_link_title` | CharField(255) blank | display label |
| `is_visible` | BooleanField default=False | controls student visibility |
| `for_premium_users` | BooleanField default=False | if True, only is_premium users see it |
| `difficulty` | CharField choices=BEGINNER/INTERMEDIATE/ADVANCED | gamification idea #3 |
| `category` | CharField choices=READING_FOCUS/LISTENING_FOCUS/MIXED | gamification idea #4 |
| `target_band` | DecimalField(3,1) null | recommended band level |
| `streak_goal_days` | PositiveSmallIntegerField default=7 | streak challenge goal (idea #7) |
| `max_enrollments` | PositiveIntegerField null | enrollment cap, null=unlimited |
| `series` | ForeignKey → `MarathonSeries` null | grouping for related marathons (idea #23 / future) |
| `created_by` | ForeignKey → User null | |
| `created_at` / `updated_at` | DateTimeField | |

**Signal / `save()` hook**: When `marathon_days` is set on creation, auto-create `MarathonDay` rows for day_number 1..N (blank, admin fills content later). If `marathon_days` increases after creation, append missing day rows. Days are never auto-deleted if count decreases (admin must delete manually to prevent data loss).

**Access logic** (enforced in student API):
- `is_visible=False` → hidden from all students
- `is_visible=True, for_premium_users=False` → all authenticated students
- `is_visible=True, for_premium_users=True` → only `request.user.is_premium=True`

---

### 3.2 `MarathonDay`

```
db_table: marathon_days
```

| Field | Type | Notes |
|---|---|---|
| `id` | UUIDField PK | |
| `marathon` | ForeignKey → Marathon CASCADE | |
| `day_number` | PositiveSmallIntegerField | 1-based |
| `title` | CharField(255) blank | optional day title |
| `content` | TextField blank | rich plain text (admin fills) |
| `difficulty` | CharField choices=EASY/MEDIUM/HARD null | per-day difficulty tag (idea) |
| `estimated_minutes` | PositiveSmallIntegerField null | time hint for student |
| `is_bonus_day` | BooleanField default=False | bonus days don't block marathon completion |
| `reading_passages` | ManyToManyField → ReadingPassage blank | source must be MARATHON |
| `listening_parts` | ManyToManyField → ListeningPart blank | source must be MARATHON |
| `created_at` / `updated_at` | DateTimeField | |

**Constraints**:
- `UniqueConstraint(fields=['marathon', 'day_number'])` — no duplicate day numbers per marathon
- `ordering = ['day_number']`

**Computed property `is_completable`**: `True` if the day has ≥1 reading_passage or ≥1 listening_part. Content-only days (no passages/parts) are informational; students browse but cannot "mark complete."

---

### 3.3 `MarathonDayExternalLink`

```
db_table: marathon_day_external_links
```

| Field | Type | Notes |
|---|---|---|
| `id` | UUIDField PK | |
| `day` | ForeignKey → MarathonDay CASCADE | |
| `title` | CharField(255) | display label |
| `url` | URLField(1000) | link target |
| `order` | PositiveSmallIntegerField default=0 | display order |
| `created_at` | DateTimeField auto | |

`ordering = ['order', 'created_at']`

---

### 3.4 `MarathonEnrollment`

Tracks each student's lifecycle in a marathon.

```
db_table: marathon_enrollments
```

| Field | Type | Notes |
|---|---|---|
| `id` | UUIDField PK | |
| `student` | ForeignKey → User CASCADE | |
| `marathon` | ForeignKey → Marathon CASCADE | |
| `status` | CharField choices=ENROLLED/ACTIVE/COMPLETED/ABANDONED | idea #21 |
| `enrolled_at` | DateTimeField auto_add | student's personal Day 1 anchor |
| `last_activity_at` | DateTimeField null | updated on any day activity |
| `completed_at` | DateTimeField null | set when `is_finished_marathon` becomes True |
| `is_finished_marathon` | BooleanField default=False | True when all completable non-bonus days done |
| `current_streak` | PositiveSmallIntegerField default=0 | consecutive days completed (idea #8) |
| `longest_streak` | PositiveSmallIntegerField default=0 | personal best streak (idea #9) |
| `days_missed` | PositiveSmallIntegerField default=0 | days where day elapsed but not completed (idea #10) |
| `total_score` | DecimalField(5,2) default=0 | sum of day band scores, leaderboard ready (idea #15) |
| `total_time_seconds` | PositiveIntegerField default=0 | cumulative time across all days |

**Constraints**: `UniqueConstraint(fields=['student', 'marathon'])` — one enrollment per student per marathon.

**Access cap**: If `marathon.max_enrollments` is set, reject enrollment when `MarathonEnrollment.objects.filter(marathon=marathon).count() >= max_enrollments`.

**`is_finished_marathon` rule**: Set to True (and `completed_at=now`, `status=COMPLETED`) when all `MarathonDay` rows where `is_completable=True AND is_bonus_day=False` have a corresponding `StudentMarathonDay` with `is_completed=True`.

---

### 3.5 `StudentMarathonDay`

Per-student per-day state. Created on first access (lazy creation when student opens the day).

```
db_table: student_marathon_days
```

| Field | Type | Notes |
|---|---|---|
| `id` | UUIDField PK | |
| `enrollment` | ForeignKey → MarathonEnrollment CASCADE | |
| `day` | ForeignKey → MarathonDay CASCADE | |
| `is_completed` | BooleanField default=False | set by "Mark as complete" |
| `completed_at` | DateTimeField null | |
| `time_spent_seconds` | PositiveIntegerField default=0 | cumulative active time |
| `day_band_score` | DecimalField(3,1) null | avg band from attempts that day |
| `retry_count` | PositiveSmallIntegerField default=0 | times student reopened day (engagement metric, idea #20) |
| `created_at` / `updated_at` | DateTimeField | |

**Constraints**: `UniqueConstraint(fields=['enrollment', 'day'])`

---

### 3.6 `StudentMarathonDayNote`

Student personal notes per day. (idea #12)

```
db_table: student_marathon_day_notes
```

| Field | Type | Notes |
|---|---|---|
| `id` | UUIDField PK | |
| `student` | ForeignKey → User CASCADE | |
| `day` | ForeignKey → MarathonDay CASCADE | |
| `note_text` | TextField | |
| `created_at` / `updated_at` | DateTimeField | |

**Constraints**: `UniqueConstraint(fields=['student', 'day'])` — one note doc per student per day (update in place).

---

### 3.7 `MarathonAttempt`

Tracks a student solving a single reading passage or listening part within a marathon day. Separate from `TestAttempt` to keep marathon context clean.

```
db_table: marathon_attempts
```

| Field | Type | Notes |
|---|---|---|
| `id` | UUIDField PK | |
| `enrollment` | ForeignKey → MarathonEnrollment CASCADE | |
| `day` | ForeignKey → MarathonDay CASCADE | |
| `reading_passage` | ForeignKey → ReadingPassage null | must have source=MARATHON |
| `listening_part` | ForeignKey → ListeningPart null | must have source=MARATHON |
| `status` | CharField choices=IN_PROGRESS/COMPLETED/ABANDONED | |
| `score` | PositiveSmallIntegerField default=0 | raw correct count |
| `band_score` | DecimalField(3,1) null | computed on submit |
| `question_type_stats_json` | JSONField null | per question-type breakdown |
| `started_at` | DateTimeField auto_add | |
| `completed_at` | DateTimeField null | |
| `time_used_seconds` | PositiveIntegerField default=0 | |

**Constraints**:
- Exactly one of `reading_passage` / `listening_part` must be set (enforced in `clean()`)
- `UniqueConstraint(fields=['enrollment', 'reading_passage'], condition=Q(reading_passage__isnull=False), name='unique_marathon_attempt_per_passage')`
- `UniqueConstraint(fields=['enrollment', 'listening_part'], condition=Q(listening_part__isnull=False), name='unique_marathon_attempt_per_part')`

**"Solved once" rule**: The unique constraint prevents a second attempt on the same passage/part within the same enrollment. On attempt-create, check if a COMPLETED attempt already exists for this passage/part → return 403 with `is_available_to_be_solved=False`.

**Reuse existing utilities**: `answer_checker.check_answer_correct()` and `band_score.calculate_band_score()` are pure functions — call them directly on submit, identical to how `student_views.py` uses them for `TestAttempt`.

---

### 3.8 `MarathonQuestionAnswer`

```
db_table: marathon_question_answers
```

| Field | Type | Notes |
|---|---|---|
| `id` | UUIDField PK | |
| `attempt` | ForeignKey → MarathonAttempt CASCADE | |
| `question` | ForeignKey → Question CASCADE | (existing Question model, unchanged) |
| `student_answer_json` | JSONField null | |
| `is_correct` | BooleanField default=False | |
| `is_skipped` | BooleanField default=True | |
| `is_flagged` | BooleanField default=False | |
| `time_spent_seconds` | PositiveIntegerField default=0 | |
| `created_at` / `updated_at` | DateTimeField | |

**Constraints**: `UniqueConstraint(fields=['attempt', 'question'])`

---

### 3.9 `MarathonSeries` (Phase 2)

Groups related marathons into a learning path.

```
db_table: marathon_series
```

| Field | Type | Notes |
|---|---|---|
| `id` | UUIDField PK | |
| `name` | CharField(255) | e.g. "30-Day Reading Bootcamp" |
| `description` | TextField blank | |
| `is_active` | BooleanField default=True | |
| `created_at` / `updated_at` | DateTimeField | |

---

## 4. Business Logic Rules

### 4.1 Day Access Control

Student's accessible day range: `[1, current_day_number]` where:

```python
from datetime import date
current_day_number = (date.today() - enrollment.enrolled_at.date()).days + 1
current_day_number = min(current_day_number, marathon.marathon_days)
```

- `day.day_number <= current_day_number` → accessible (student can view content, links, attempt passages/parts if not yet solved)
- `day.day_number > current_day_number` → locked (API returns 403; no content, no titles, no metadata leaked)

### 4.2 "Mark as Complete" Logic

When student POSTs to mark a day complete:

```
1. Verify day.is_completable == True (has passages or parts)
2. Fetch all reading_passages + listening_parts assigned to that day
3. For each: check MarathonAttempt.objects.filter(enrollment=..., [passage|part]=..., status=COMPLETED).exists()
4. If any incomplete → return 400 with list of incomplete items
5. If all complete → create/update StudentMarathonDay(is_completed=True, completed_at=now)
6. Update enrollment: recalculate streak, update total_score, check is_finished_marathon
```

### 4.3 `is_available_to_be_solved`

Computed per passage/part per student. `False` if a `COMPLETED` `MarathonAttempt` exists for this enrollment + passage/part. Returned in day-detail API response so frontend can disable the attempt button while still showing passage title and metadata.

### 4.4 Streak Calculation (ideas #7, #8, #9)

On each "Mark as complete":
```
1. Check if yesterday also had a completed completable day → if yes, increment current_streak
2. If no completable day yesterday (or it was skipped) → reset current_streak to 1
3. Update longest_streak = max(longest_streak, current_streak)
4. If current_streak >= marathon.streak_goal_days → award MARATHON_WEEK_STREAK badge
```

Non-completable days (content-only) do not break or advance the streak.

### 4.5 `days_missed` Calculation (idea #10)

A day is "missed" if:
- `day.day_number < current_day_number` (day has elapsed)
- `day.is_completable == True`
- No `StudentMarathonDay(is_completed=True)` exists

This can be computed on-the-fly or updated nightly via management command / celery task.

### 4.6 `is_finished_marathon`

```python
completable_non_bonus_days = marathon.days.filter(is_bonus_day=False).annotate(
    has_passage=..., has_part=...
).filter(has_passage OR has_part)

completed_count = StudentMarathonDay.objects.filter(
    enrollment=enrollment, day__in=completable_non_bonus_days, is_completed=True
).count()

if completed_count == completable_non_bonus_days.count():
    enrollment.is_finished_marathon = True
    enrollment.completed_at = now()
    enrollment.status = 'COMPLETED'
    # award MARATHON_FINISHER badge
    # check MARATHON_SPEED_RUNNER: completed_at.date() - enrolled_at.date() < marathon.marathon_days days
```

### 4.7 Badge Awards

| Badge | Trigger |
|---|---|
| `MARATHON_FINISHER` | `is_finished_marathon` becomes True |
| `MARATHON_PERFECT_DAY` | All attempts on a day score band >= 9.0 (or 100%) |
| `MARATHON_WEEK_STREAK` | `current_streak >= marathon.streak_goal_days` |
| `MARATHON_SPEED_RUNNER` | Marathon completed in fewer days than `marathon_days` |

Use existing `StudentBadge` model with `get_or_create` to prevent duplicates.

---

## 5. API Endpoints

### 5.1 Admin API (`/api/v1/admin/marathons/`)

| Method | URL | Action |
|---|---|---|
| GET/POST | `/marathons/` | list + create marathons |
| GET/PUT/PATCH/DELETE | `/marathons/<id>/` | detail |
| GET/POST | `/marathons/<id>/days/` | list days, admin fills content |
| GET/PUT/PATCH | `/marathons/<id>/days/<day_number>/` | update day content |
| GET/POST/DELETE | `/marathons/<id>/days/<day_number>/external-links/` | manage day links |
| PUT/PATCH/DELETE | `/marathons/<id>/days/<day_number>/external-links/<link_id>/` | detail |
| GET/POST | `/marathons/<marathon_id>/reading-passages/` | create marathon-scoped passage (source=MARATHON) |
| GET/PUT/PATCH/DELETE | `/marathons/<marathon_id>/reading-passages/<id>/` | detail |
| GET/POST | `/marathons/<marathon_id>/listening-parts/` | create marathon-scoped part (source=MARATHON) |
| GET/PUT/PATCH/DELETE | `/marathons/<marathon_id>/listening-parts/<id>/` | detail |
| POST | `/marathons/<marathon_id>/reading-passages/<id>/assign/` | assign passage to a day |
| DELETE | `/marathons/<marathon_id>/reading-passages/<id>/assign/` | remove from day |
| POST | `/marathons/<marathon_id>/listening-parts/<id>/assign/` | assign part to a day |
| DELETE | `/marathons/<marathon_id>/listening-parts/<id>/assign/` | remove from part |
| GET | `/marathons/<id>/enrollments/` | list enrolled students + stats |
| GET | `/marathons/<id>/leaderboard/` | ranked by total_score (idea #16) |
| GET/PUT/PATCH | `/users/<user_id>/marathon-premium/` | update user is_premium flag |

Question groups and questions for marathon passages/parts use existing admin endpoints (`/question-groups/`, `/questions/`) — they work unchanged since marathon passages are still `ReadingPassage` with source=MARATHON, and `QuestionGroup.reading_passage` FK accepts them.

### 5.2 Student API (`/api/v1/student/marathons/`)

| Method | URL | Action |
|---|---|---|
| GET | `/marathons/` | list visible, accessible marathons (filtered by is_visible + premium) |
| GET | `/marathons/<id>/` | marathon detail + enrollment status |
| POST | `/marathons/<id>/enroll/` | self-enroll (creates MarathonEnrollment) |
| GET | `/marathons/<id>/days/` | list days accessible to student (day_number <= current) |
| GET | `/marathons/<id>/days/<day_number>/` | day detail: content, links, passages, parts, is_available_to_be_solved per item |
| POST | `/marathons/<id>/days/<day_number>/complete/` | mark day complete (runs completion logic) |
| GET/PUT/PATCH | `/marathons/<id>/days/<day_number>/note/` | read/write personal note (idea #12) |
| POST | `/marathons/<id>/days/<day_number>/attempts/` | create MarathonAttempt for a passage or part |
| GET | `/marathons/<id>/days/<day_number>/attempts/<attempt_id>/` | get attempt + questions |
| POST | `/marathons/<id>/days/<day_number>/attempts/<attempt_id>/save/` | save answers mid-attempt |
| POST | `/marathons/<id>/days/<day_number>/attempts/<attempt_id>/submit/` | submit + score |
| GET | `/marathons/<id>/days/<day_number>/attempts/<attempt_id>/review/` | post-submit review |
| GET | `/marathons/<id>/leaderboard/` | student-facing leaderboard (idea #16) |
| GET | `/marathons/<id>/enrollment/` | current student's enrollment stats + streak |

---

## 6. Serializers

### Admin serializers (new file: `serializers/marathon_admin_serializers.py`)
- `MarathonAdminWriteSerializer` — create/update Marathon
- `MarathonAdminDetailSerializer` — full detail incl. days summary
- `MarathonDayAdminSerializer` — day CRUD with external links nested
- `MarathonExternalLinkSerializer`
- `MarathonReadingPassageAdminWriteSerializer` — wraps existing `ReadingPassageAdminWriteSerializer`, forces source=MARATHON
- `MarathonListeningPartAdminWriteSerializer` — same pattern
- `MarathonEnrollmentAdminSerializer` — admin view of enrollments
- `MarathonLeaderboardSerializer`

### Student serializers (new file: `serializers/marathon_student_serializers.py`)
- `MarathonListSerializer` — title, category, difficulty, day count, enrollment status
- `MarathonDetailSerializer` — full detail + student enrollment state
- `MarathonDayListSerializer` — day_number, title, is_completable, is_completed (per student), is_locked
- `MarathonDayDetailSerializer` — full day: content, links, passages/parts with `is_available_to_be_solved`
- `MarathonAttemptStartSerializer` — create attempt
- `MarathonAttemptDetailSerializer` — attempt + questions
- `MarathonAttemptSubmitSerializer`
- `MarathonAttemptResultSerializer` — score, band, question review
- `MarathonDayNoteSerializer`
- `MarathonEnrollmentSerializer` — streak, total_score, days_missed, is_finished_marathon

---

## 7. Views

### Admin views (add to `views/admin_views.py` or new `views/marathon_admin_views.py`)
- `MarathonViewSet` (ModelViewSet)
- `MarathonDayListUpdateView`
- `MarathonDayExternalLinkView`
- `MarathonPassageListCreateView` / `MarathonPassageDetailView`
- `MarathonPartListCreateView` / `MarathonPartDetailView`
- `MarathonPassageAssignView` / `MarathonPartAssignView`
- `MarathonEnrollmentListView`
- `MarathonLeaderboardAdminView`

### Student views (new `views/marathon_student_views.py`)
- `MarathonListView`
- `MarathonDetailView`
- `MarathonEnrollView`
- `MarathonDayListView`
- `MarathonDayDetailView`
- `MarathonDayCompleteView`
- `MarathonDayNoteView`
- `MarathonAttemptCreateView`
- `MarathonAttemptDetailView`
- `MarathonAttemptSaveView`
- `MarathonAttemptSubmitView`
- `MarathonAttemptReviewView`
- `MarathonLeaderboardView`
- `MarathonEnrollmentDetailView`

---

## 8. URL Routing

```python
# config/urls.py additions
path("api/v1/admin/marathons/", include("apps.users.urls.marathon_admin_urls")),
path("api/v1/student/marathons/", include("apps.users.urls.marathon_student_urls")),
```

---

## 9. Permissions

- All admin marathon endpoints: `permission_classes = [IsAdmin]` (existing)
- Student marathon list/detail: `IsAuthenticated` + premium check inline
- Marathon attempt/complete/note: `IsAuthenticated` + enrollment verified inline

---

## 10. Migrations

1. `0002_customuser_is_premium.py` — add `is_premium` to `CustomUser`
2. `0003_contentsource_marathon.py` — add MARATHON to ContentSource choices (data migration — no schema change, just updating choices)
3. `0004_marathon_models.py` — all new marathon models in one migration
4. `0005_studentbadge_marathon_badges.py` — add 4 new BadgeType values

---

## 11. Existing Code Guards (Critical)

All places that query `ReadingPassage` or `ListeningPart` for non-marathon purposes must add `.exclude(source='MARATHON')`:

- `AdminReadingPassageListCreateView`
- `AdminListeningPartListCreateView`
- `ContentBankPassageListCreateView`
- `PassageListView` (student)
- `PartListView` (student)
- Any filter/search that returns passages/parts to non-marathon contexts

This prevents marathon content from bleeding into regular test creation or student test flows.

---

## 12. Gamification Summary (selected ideas implemented)

| Idea | Where | Notes |
|---|---|---|
| #1 `MarathonEnrollment` model | §3.4 | full lifecycle tracking |
| #2 `StudentMarathonDay` model | §3.5 | per-student per-day state |
| #3 `Marathon.difficulty` | §3.1 | BEGINNER/INTERMEDIATE/ADVANCED |
| #4 `Marathon.category` | §3.1 | READING_FOCUS/LISTENING_FOCUS/MIXED |
| #7 `streak_goal_days` | §3.1 + §4.4 | marathon-level streak challenge |
| #8 `current_streak` | §3.4 + §4.4 | live streak on enrollment |
| #9 `longest_streak` | §3.4 + §4.4 | personal best |
| #10 `days_missed` | §3.4 + §4.5 | missed day counter |
| #12 `StudentMarathonDayNote` | §3.6 | student notes per day |
| #13 Marathon badges | §2.3 + §4.7 | 4 new BadgeType values |
| #15 `total_score` | §3.4 | cumulative band score sum |
| #16 Leaderboard | §5.1 + §5.2 | ranked by total_score within marathon |
| #21 `status` on enrollment | §3.4 | ENROLLED/ACTIVE/COMPLETED/ABANDONED |

---

## 13. Implementation Phases

### Phase 1 — Foundation (models + migrations)
- Add `is_premium` to `CustomUser`
- Add `MARATHON` to `ContentSource`
- Create all models (§3.1–3.8)
- Add marathon badges to `StudentBadge.BadgeType`
- Guard existing passage/part queries with `.exclude(source='MARATHON')`

### Phase 2 — Admin API
- Marathon CRUD
- Day management (auto-create on marathon save, admin fills content)
- External links CRUD per day
- Marathon-scoped passage/part creation + question group/question creation (reuse existing question admin endpoints)
- Passage/part assignment to days
- Enrollment list + leaderboard

### Phase 3 — Student API
- Marathon list + detail + enrollment
- Day list (access-controlled) + day detail
- `is_available_to_be_solved` per item in day detail
- Marathon attempt create → save → submit → review (reusing answer_checker + band_score)
- Mark day complete (with validation)
- `is_finished_marathon` logic + badge awards
- Streak calculation on completion
- Personal notes

### Phase 4 — Gamification & Polish
- Leaderboard endpoint
- `days_missed` tracking (nightly management command or computed on request)
- Speed runner badge check
- `MarathonSeries` model + series grouping

---

## 14. Open Questions / Future Work

- **Pause/resume**: `status=PAUSED` on enrollment — student can pause marathon; paused days don't count as missed. Not in current scope.
- **Completion certificate**: `Marathon.completion_certificate_enabled` flag. Frontend renders certificate when `is_finished_marathon=True`.
- **Reminder emails**: Hook into existing email infra — send reminder if `last_activity_at` is > 24h and marathon is active.
- **Admin analytics**: Marathon-level analytics (avg completion rate, avg band per day, dropout rate) — extend `AdminAnalyticsView`.
- **`MarathonSeries`**: Full path grouping for marathon bundles — Phase 4.
