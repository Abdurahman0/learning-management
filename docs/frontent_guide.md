# Frontend Guide for Attempt Question Validation

## Scope

This file answers the questions in `BACKEND_DIAGNOSTIC_QUESTIONS.md` from the code that exists in this repository.

Two important limits:

- This backend repo does **not** contain any `/api/student-proxy/...` implementation. The only student attempt routes here are under `/api/v1/student/...`.
- The exact production attempt `aca5f7b8-d708-4fd9-bc04-808defb77189` and question `29da5006-6d74-41f9-a3fd-5b831b3d49fe` do **not** exist in the bundled local test database, so I cannot honestly dump that exact record from this repo alone.

## Executive Summary

- The backend does **not** have an `AttemptQuestion` model.
- The actual models are `TestAttempt`, `Question`, and `QuestionAnswer`.
- Attempt membership is validated through `QuestionAnswer` rows, not through a many-to-many `attempt.questions` relation.
- Before this change, the attempt detail response returned only the canonical question `id`.
- The backend now also returns `question_id`, `attempt_question_id`, and `candidate_question_ids` in the attempt detail question payload.
- The backend now accepts either `question_id` or `attempt_question_id` on save/submit, so the frontend can send both safely.
- The backend also now persists `time_spent_seconds` per question, which was previously accepted by the serializer but not written to the database.

## 1. Question ID Mapping And Storage

### Q1.1 What IDs are stored when an attempt is created?

Actual backend model names:

- `TestAttempt.id`: attempt UUID
- `TestAttempt.student_id`: owning student UUID
- `TestAttempt.practice_test_id`: test UUID
- `Question.id`: canonical question UUID
- `Question.question_group_id`: parent group UUID
- `QuestionAnswer.id`: attempt-specific answer row UUID
- `QuestionAnswer.attempt_id`: owning attempt UUID
- `QuestionAnswer.question_id`: canonical question UUID

There is no separate `AttemptQuestion` model and no `attempt.questions` many-to-many table in this codebase.

Relevant code:

- `apps/users/models/student.py:33`
- `apps/users/models/student.py:76`
- `apps/users/models/reading_listening.py:782`

When an attempt is created, the backend pre-creates one `QuestionAnswer` row for every active question in the selected test:

```python
questions = Question.objects.filter(
    Q(question_group__reading_passage__practice_test=practice_test) |
    Q(question_group__listening_part__practice_test=practice_test),
    is_active=True,
)
QuestionAnswer.objects.bulk_create([
    QuestionAnswer(attempt=attempt, question=q, is_skipped=True)
    for q in questions
])
```

Source:

- `apps/users/views/student_views.py:463`

I could not dump the exact production attempt `aca5f7b8-d708-4fd9-bc04-808defb77189` from this repo because it is not present locally.

### Q1.2 What does GET `/api/v1/student/attempts/{attempt_id}/` return?

Verified from the local test database, a question object now looks like this:

```json
{
  "id": "77e64217-f1f9-41dc-abab-8c60e820f144",
  "question_id": "77e64217-f1f9-41dc-abab-8c60e820f144",
  "attempt_question_id": "bed134d1-2cd7-438f-b7fa-096953a6ac1e",
  "candidate_question_ids": [
    "77e64217-f1f9-41dc-abab-8c60e820f144",
    "bed134d1-2cd7-438f-b7fa-096953a6ac1e"
  ],
  "question_number": 1,
  "question_text": "Question 1",
  "options_json": {
    "options": [
      { "key": "A", "text": "A" },
      { "key": "B", "text": "B" }
    ]
  },
  "question_type": "MCQ_SINGLE",
  "question_type_display": "Multiple Choice - Single Answer",
  "student_answer": null,
  "is_flagged": false
}
```

Current serializer source:

- `apps/users/serializers/student_serializers.py:81`
- `apps/users/serializers/student_serializers.py:220`

Answer to the null/missing question:

- `id`: present
- `question_id`: present
- `attempt_question_id`: present when a `QuestionAnswer` row exists for that attempt/question pair
- `candidate_question_ids`: present
- `attempt_question`: still **not** returned by this backend

Because the backend pre-creates `QuestionAnswer` rows during attempt creation, `attempt_question_id` should normally be present for every question in a valid attempt.

### Q1.3 What validation fails when the frontend submits a question ID?

The backend checks whether the submitted identifier resolves to a `QuestionAnswer` row for the current attempt.

That means the failure is not “does this `Question` exist globally?”

It is:

- “Does this attempt have a `QuestionAnswer` row for this `question_id`?”
- or now, “Does this attempt have a `QuestionAnswer` row for this `attempt_question_id`?”

If not, the backend raises:

```json
{
  "answers": {
    "<submitted-id>": {
      "question_id": ["Question does not belong to this attempt."]
    }
  }
}
```

or the same under `attempt_question_id` if that was the submitted field.

Validation source:

- `apps/users/views/student_views.py:138`

## 2. Validation Logic Investigation

### Q2.1 Exact code that rejects the question

This is the relevant logic:

```python
existing_answers_qs = QuestionAnswer.objects.filter(attempt=attempt).filter(
    Q(question_id__in=question_ids) | Q(id__in=attempt_question_ids)
).select_related('question__question_group')

qa_by_question_id = existing_answers.get(question_id) if question_id else None
qa_by_attempt_id = existing_attempt_answers.get(attempt_question_id) if attempt_question_id else None
qa = qa_by_question_id or qa_by_attempt_id

if qa is None:
    field_name = 'question_id' if question_id else 'attempt_question_id'
    errors[error_key] = {
        field_name: ['Question does not belong to this attempt.'],
    }
```

Source:

- `apps/users/views/student_views.py:148`
- `apps/users/views/student_views.py:172`
- `apps/users/views/student_views.py:190`

Tables involved:

- `test_attempts`
- `question_answers`
- `questions`
- `question_groups`

The validating join is effectively attempt-scoped through `question_answers`, not through a direct attempt-to-question many-to-many relation.

Equivalent ORM shape for the failing case:

```python
QuestionAnswer.objects.filter(
    attempt=attempt,
    question_id=submitted_question_id,
).exists()
```

Equivalent SQL shape:

```sql
SELECT *
FROM question_answers
WHERE attempt_id = <attempt_uuid>
  AND question_id = <submitted_question_uuid>;
```

### Q2.2 Manual ORM test for this specific case

I could not run the exact ORM test against:

- attempt `aca5f7b8-d708-4fd9-bc04-808defb77189`
- question `29da5006-6d74-41f9-a3fd-5b831b3d49fe`

Reason:

- neither UUID exists in the local bundled database

What to run against the real database:

```python
from apps.users.models import TestAttempt, Question, QuestionAnswer

attempt = TestAttempt.objects.get(id='aca5f7b8-d708-4fd9-bc04-808defb77189')
question = Question.objects.get(id='29da5006-6d74-41f9-a3fd-5b831b3d49fe')

print(QuestionAnswer.objects.filter(attempt=attempt, question=question).exists())
print(list(
    QuestionAnswer.objects.filter(attempt=attempt).values_list('question_id', flat=True)
))
```

### Q2.3 Does it fail for all questions or only some?

I cannot confirm that for the exact production attempt from this repo alone.

What the code implies:

- if attempt creation worked correctly, every active question in the test should already have a `QuestionAnswer`
- if only some submitted IDs fail, the most likely causes are:
  - the frontend/proxy submitted the wrong identifier for some questions
  - the frontend mixed IDs from another attempt
  - the frontend used a group ID or answer-row ID as `question_id`
  - there is production data corruption for some `QuestionAnswer` rows

## 3. Frontend Payload Analysis

### Q3.1 What exact payload is the frontend sending when it fails?

This repo cannot answer that because the failing `/api/student-proxy/...` request is not implemented here.

There is no client-side proxy code in this repository to inspect or intercept.

### Q3.2 Is there a field-name mismatch?

Backend expectations:

- `answers[].answer` is required
- `answers[].question_id` is accepted
- `answers[].attempt_question_id` is now also accepted
- `answers[].student_answer` is **not** accepted

Source:

- `apps/users/serializers/student_serializers.py:272`
- `apps/users/tests/test_student_attempt_scoring.py`

So yes, there was room for frontend confusion before this patch because:

- the attempt detail response only exposed `id`
- save/submit only accepted `question_id`
- the proxy path in the diagnostic suggests there may be a translation layer outside this repo

That is why the backend was updated to expose and accept both ID forms.

## 4. Data Integrity Check

### Q4.1 Verify the attempt has questions linked to it

In this backend, “attempt has questions linked to it” means:

- `QuestionAnswer.objects.filter(attempt=attempt)` exists for each question in the test

There is no direct `attempt.questions` relation.

The exact production attempt cannot be verified from this repo.

What to run in the real environment:

```python
from apps.users.models import TestAttempt, QuestionAnswer

attempt = TestAttempt.objects.get(id='aca5f7b8-d708-4fd9-bc04-808defb77189')
question_ids = list(
    QuestionAnswer.objects.filter(attempt=attempt).values_list('question_id', flat=True)
)

print(f"Attempt has {len(question_ids)} question links: {question_ids}")
print(
    "Contains failing question:",
    '29da5006-6d74-41f9-a3fd-5b831b3d49fe' in [str(qid) for qid in question_ids]
)
```

### Q4.2 Is the question stored in multiple places with different IDs?

Yes, there are now two useful IDs per rendered question:

- canonical question ID: `Question.id`
- attempt-specific answer row ID: `QuestionAnswer.id`

Which one should validation use?

- canonical match is still the primary backend key for the question itself
- attempt-specific answer row is a safe secondary key for attempt membership

Which one should the frontend send?

- safest option: send both
- minimum option: send `question_id`

Recommended payload:

```json
{
  "answers": [
    {
      "question_id": "<question.id>",
      "attempt_question_id": "<question.attempt_question_id>",
      "answer": { "...": "..." },
      "is_flagged": false,
      "time_spent_seconds": 12
    }
  ]
}
```

## 5. Student Proxy Layer

### Q5.1 What does `/api/student-proxy/attempts/...` do?

Unknown from this repository.

This backend exposes:

- `POST /api/v1/student/attempts/`
- `GET /api/v1/student/attempts/<attempt_id>/`
- `PATCH /api/v1/student/attempts/<attempt_id>/save/`
- `POST /api/v1/student/attempts/<attempt_id>/submit/`

Source:

- `apps/users/urls/student_urls.py`

If `/api/student-proxy/...` exists, it is in another codebase or gateway layer.

### Q5.2 Is there a mismatch between proxy and backend?

Possible, but not provable from this repo alone.

What is provable:

- this Django backend does not define `/api/student-proxy/...`
- this Django backend expects `answer`, not `student_answer`
- this Django backend now accepts either `question_id` or `attempt_question_id`

If the proxy renames fields, drops `attempt_question_id`, or rewrites `question_id`, that could absolutely create the reported error.

## 6. Session And Auth Context

### Q6.1 Is the attempt owned by the student?

Ownership is enforced directly in the query:

For save:

```python
attempt = get_object_or_404(
    TestAttempt,
    pk=attempt_id,
    student=request.user,
    status=TestAttempt.Status.IN_PROGRESS,
)
```

For detail:

```python
attempt = get_object_or_404(
    TestAttempt,
    pk=attempt_id,
    student=request.user,
)
```

Source:

- `apps/users/views/student_views.py:510`
- `apps/users/views/student_views.py:524`

So if the authenticated user does not own the attempt, the backend fails before answer validation.

### Q6.2 Is the question in the test the student is taking?

The backend assumes this by pre-creating `QuestionAnswer` rows from the test at attempt creation time.

So the cleanest truth test is:

```python
QuestionAnswer.objects.filter(
    attempt=attempt,
    question_id=question_id,
).exists()
```

If that returns `False`, then one of these is true:

- the question is not part of that attempt's test
- the attempt data is corrupted
- the frontend/proxy sent the wrong ID

## Missing Piece That Affected Frontend Work

The frontend concern in the diagnostic was valid.

Before this backend patch:

- attempt detail did **not** return `attempt_question_id`
- the frontend had less information for logging or fallback
- `time_spent_seconds` was accepted in the serializer but not persisted

This repo has now been changed so that:

1. attempt detail question payloads expose `question_id`
2. attempt detail question payloads expose `attempt_question_id`
3. attempt detail question payloads expose `candidate_question_ids`
4. save/submit accept either `question_id` or `attempt_question_id`
5. per-question `time_spent_seconds` is persisted

## Frontend Integration Rules

Use these rules on the frontend:

1. Treat `question.id` and `question.question_id` as the canonical question UUID.
2. Treat `question.attempt_question_id` as the attempt-specific fallback UUID.
3. Prefer sending both `question_id` and `attempt_question_id` in save/submit requests.
4. Never use `question_group.id` or passage/part IDs as answer IDs.
5. Send `answer`, not `student_answer`.
6. If a proxy layer exists, verify it preserves both IDs unchanged.

Recommended mapping:

```ts
const payload = {
  time_used_seconds,
  answers: questions.map((q) => ({
    question_id: q.question_id ?? q.id,
    attempt_question_id: q.attempt_question_id ?? null,
    answer: q.answer ?? null,
    is_flagged: !!q.is_flagged,
    time_spent_seconds: q.time_spent_seconds ?? 0,
  })),
};
```

## What Still Needs Production Verification

These items still require access to the real failing environment:

1. Whether attempt `aca5f7b8-d708-4fd9-bc04-808defb77189` actually contains question `29da5006-6d74-41f9-a3fd-5b831b3d49fe`
2. The exact JSON body sent by `/api/student-proxy/attempts/.../save`
3. Whether the proxy rewrites or drops `question_id` / `attempt_question_id`
4. Whether the authenticated student on the failing request matches the attempt owner

If you want to debug the production case fast, the first thing to compare is:

- attempt detail response for the failing attempt
- save payload for the failing request
- `QuestionAnswer` rows for that attempt in the production database
