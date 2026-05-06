# IELTS Master — Frontend Integration Guide

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Test-Taking Flow](#test-taking-flow)
4. [Question Types Reference](#question-types-reference)
   - [MCQ\_SINGLE](#1-mcq_single--multiple-choice-single-answer)
   - [MCQ\_MULTIPLE](#2-mcq_multiple--multiple-choice-multiple-answers)
   - [TFNG](#3-tfng--true--false--not-given)
   - [YNNG](#4-ynng--yes--no--not-given)
   - [SENTENCE\_COMPLETION](#5-sentence_completion--sentence-completion)
   - [SHORT\_ANSWER](#6-short_answer--short-answer)
   - [SUMMARY\_COMPLETION](#7-summary_completion--summary-completion)
   - [TABLE\_COMPLETION](#8-table_completion--table-completion)
   - [FLOW\_CHART\_COMPLETION](#9-flow_chart_completion--flow-chart-completion)
   - [MATCHING\_HEADINGS](#10-matching_headings--matching-headings)
   - [MATCH\_SENT\_ENDINGS](#11-match_sent_endings--matching-sentence-endings)
   - [MATCH\_PARA\_INFO](#12-match_para_info--matching-paragraph-information)
   - [MATCHING](#13-matching--matching)
   - [LIST\_SELECTION](#14-list_selection--list-selection)
   - [CHOOSING\_TITLE](#15-choosing_title--choosing-a-title)
   - [CLASSIFICATION](#16-classification--classificationmatching-features)
   - [DIAGRAM\_COMPLETION](#17-diagram_completion--diagram-completion)
   - [PLAN\_MAP\_DIAGRAM](#18-plan_map_diagram--plan--map--diagram-labelling)
   - [FORM\_COMPLETION](#19-form_completion--form-completion)
   - [NOTE\_COMPLETION](#20-note_completion--note-completion)
5. [Saving & Submitting Answers](#saving--submitting-answers)
6. [Mistake Reasons](#mistake-reasons)
7. [Recent Changes](#recent-changes)

---

## Overview

The API base is `/api/v1/`. All authenticated endpoints require the `Authorization: Bearer <access_token>` header.

**Modules:** `READING` | `LISTENING`

A test is structured as:

```
PracticeTest
 └── ListeningPart (×4)  OR  ReadingPassage (×3)
      └── QuestionGroup(s)   ← has question_type + group_content_json
           └── Question(s)   ← has question_text + options_json + correct_answer_json
```

The `question_type` lives on `QuestionGroup` and drives how you render both the shared group content and each individual question inside it.

---

## Authentication

```
POST /api/auth/login/
Body: { "email": "...", "password": "..." }
Response: { "access": "...", "refresh": "..." }

POST /api/auth/token/refresh/
Body: { "refresh": "..." }
Response: { "access": "..." }
```

---

## Test-Taking Flow

```
1. GET  /api/v1/student/tests/                 → list all tests
2. GET  /api/v1/student/tests/reading/         → reading tests only
3. GET  /api/v1/student/tests/listening/       → listening tests only

4. POST /api/v1/student/attempts/              → create attempt
   Body: { "practice_test": "<test_uuid>" }
   Response: { "id": "<attempt_uuid>", ... }

5. GET  /api/v1/student/attempts/<attempt_id>/ → full test with all questions

6. POST /api/v1/student/attempts/<attempt_id>/save/   → save interim answers
   Body: { "answers": [ { "question": "<uuid>", "student_answer_json": {...} }, ... ] }

7. POST /api/v1/student/attempts/<attempt_id>/submit/ → submit & auto-score
   Body: { "answers": [ ... ] }

8. GET  /api/v1/student/attempts/<attempt_id>/review/ → review scored answers
```

---

## Question Types Reference

Every `QuestionGroup` object in the API response looks like:

```json
{
  "id": "<uuid>",
  "question_type": "MCQ_SINGLE",
  "group_order": 1,
  "instructions": "Choose the correct letter, A, B, C or D.",
  "question_number_start": 1,
  "question_number_end": 5,
  "word_limit": null,
  "number_allowed": false,
  "group_content_json": { ... },
  "questions": [ ... ]
}
```

And every `Question` object looks like:

```json
{
  "id": "<uuid>",
  "question_number": 1,
  "question_text": "...",
  "options_json": { ... }
}
```

The sections below describe what `group_content_json` and `options_json` contain for each type, and what `student_answer_json` to send when saving/submitting.

---

### 1. MCQ_SINGLE — Multiple Choice Single Answer

**Used in:** Reading, Listening

The student picks **one** option from a list.

**`group_content_json`:** `null` or `{}`

**`options_json` (per question):**
```json
{
  "options": [
    { "key": "A", "text": "Option text A" },
    { "key": "B", "text": "Option text B" },
    { "key": "C", "text": "Option text C" },
    { "key": "D", "text": "Option text D" }
  ]
}
```

**`question_text`:** The question stem (e.g. "What is the main purpose of the passage?")

**Student answer to submit:**
```json
{ "answer": "B" }
```
`answer` must be the `key` of the chosen option.

---

### 2. MCQ_MULTIPLE — Multiple Choice Multiple Answers

**Used in:** Reading, Listening

The student picks **multiple** options. The instructions will specify how many (e.g. "Choose TWO letters").

**`group_content_json`:** `null` or `{}`

**`options_json` (per question):**
```json
{
  "options": [
    { "key": "A", "text": "Option text A" },
    { "key": "B", "text": "Option text B" },
    { "key": "C", "text": "Option text C" },
    { "key": "D", "text": "Option text D" },
    { "key": "E", "text": "Option text E" }
  ]
}
```

**`question_text`:** The question stem.

**Student answer to submit:**
```json
{ "answers": ["A", "C"] }
```
`answers` is an array of selected option keys. Order does not matter for scoring.

---

### 3. TFNG — True / False / Not Given

**Used in:** Reading

The student reads a statement and decides if it agrees with the passage, contradicts it, or the passage doesn't say.

**`group_content_json`:** `null` or `{}`

**`options_json` (per question):**
```json
{
  "statement": "The author believes that technology always improves productivity."
}
```

**`question_text`:** Usually `null` — the statement is in `options_json.statement`.

**Student answer to submit:**
```json
{ "answer": "TRUE" }
```
Allowed values: `"TRUE"`, `"FALSE"`, `"NOT_GIVEN"` (case-insensitive).

---

### 4. YNNG — Yes / No / Not Given

**Used in:** Reading

Similar to TFNG but tests the writer's **views/claims** rather than factual content.

**`group_content_json`:** `null` or `{}`

**`options_json` (per question):**
```json
{
  "statement": "The writer is optimistic about the future of renewable energy."
}
```

**`question_text`:** Usually `null`.

**Student answer to submit:**
```json
{ "answer": "NO" }
```
Allowed values: `"YES"`, `"NO"`, `"NOT_GIVEN"` (case-insensitive).

---

### 5. SENTENCE_COMPLETION — Sentence Completion

**Used in:** Reading, Listening

The student fills a blank within a single sentence. A word limit applies (`word_limit` on the group).

**`group_content_json`:** `null` or `{}`

**`options_json` (per question):**
```json
{
  "sentence_stem": "The experiment was conducted over a period of _____."
}
```
Render the sentence with a text input replacing the blank.

**`question_text`:** `null` — the stem is in `options_json.sentence_stem`.

**Student answer to submit:**
```json
{ "answer": "six months" }
```

---

### 6. SHORT_ANSWER — Short Answer

**Used in:** Reading, Listening

An open-ended question answered with a short phrase. `word_limit` on the group specifies the maximum words.

**`group_content_json`:** `null` or `{}`

**`options_json`:** `null` or `{}`

**`question_text`:** The full question (e.g. "What material is used for the outer casing?")

**Student answer to submit:**
```json
{ "answer": "aluminium" }
```

---

### 7. SUMMARY_COMPLETION — Summary Completion

**Used in:** Reading, Listening

A block of text (summary) has numbered blanks. The student fills each blank from the passage or optionally from a word bank. Each blank = one `Question`.

**`group_content_json`:**
```json
{
  "summary_text": "The city was founded in 1842 (1)_____ by settlers who arrived from (2)_____.",
  "word_bank": ["Europe", "merchants", "early", "initially"]
}
```
`word_bank` is optional — when absent, students type freely. Blanks in `summary_text` are typically represented as numbered placeholders; render them as inputs.

**`options_json`:** `null` or `{}`

**`question_text`:** `null` — the blank is identified by `question_number`.

**Student answer to submit:**
```json
{ "answer": "initially" }
```

---

### 8. TABLE_COMPLETION — Table Completion

**Used in:** Reading, Listening

A table is shown with some cells blank. Each blank cell = one `Question`. `word_limit` specifies word limit.

**`group_content_json`:**
```json
{
  "columns": ["Feature", "Advantage", "Disadvantage"],
  "rows": [
    ["Solar panels", "{{BLANK}}", "High initial cost"],
    ["Wind turbines", "Low running cost", "{{BLANK}}"]
  ]
}
```
`{{BLANK}}` marks cells that are questions. Map each blank to a `question_number` in the group range.

**`options_json`:** `null` or `{}`

**`question_text`:** `null`

**Student answer to submit:**
```json
{ "answer": "no fuel needed" }
```

---

### 9. FLOW_CHART_COMPLETION — Flow Chart Completion

**Used in:** Listening

A sequence of steps with blanks. Each blank = one `Question`. Students fill in missing steps from what they hear.

**`group_content_json`:**
```json
{
  "steps": [
    { "order": 1, "text": "Raw materials are collected" },
    { "order": 2, "text": "{{BLANK}}" },
    { "order": 3, "text": "Finished goods are packaged" }
  ]
}
```
`{{BLANK}}` marks the blank steps. Map sequentially to the group's question numbers.

**`options_json`:** `null` or `{}`

**`question_text`:** `null`

**Student answer to submit:**
```json
{ "answer": "materials are processed" }
```

---

### 10. MATCHING_HEADINGS — Matching Headings

**Used in:** Reading

A list of headings is shown. The student matches each heading to a paragraph (or section). Each question = one paragraph.

**`group_content_json`:**
```json
{
  "headings": [
    { "key": "i",   "text": "A brief history of the internet" },
    { "key": "ii",  "text": "The impact on global trade" },
    { "key": "iii", "text": "Challenges for developing nations" },
    { "key": "iv",  "text": "Future developments" }
  ]
}
```

**`options_json`:** `null` or `{}`

**`question_text`:** The paragraph label (e.g. "Paragraph A").

**Student answer to submit:**
```json
{ "answer": "ii" }
```
`answer` is the `key` of the chosen heading.

---

### 11. MATCH_SENT_ENDINGS — Matching Sentence Endings

**Used in:** Reading

A list of sentence endings is shown. The student completes each sentence beginning by choosing the correct ending.

**`group_content_json`:**
```json
{
  "endings": [
    { "key": "A", "text": "...reducing energy consumption significantly." },
    { "key": "B", "text": "...requiring government intervention." },
    { "key": "C", "text": "...benefiting local communities." }
  ]
}
```

**`options_json`:** `null` or `{}`

**`question_text`:** The sentence beginning (e.g. "The new policy was introduced because...")

**Student answer to submit:**
```json
{ "answer": "B" }
```

---

### 12. MATCH_PARA_INFO — Matching Paragraph Information

**Used in:** Reading

A list of information items is shown. The student identifies which paragraph contains each piece of information.

**`group_content_json`:** `null` or `{}`

**`options_json` (per question):**
```json
{
  "statement": "A reference to the negative effects of urbanisation on wildlife."
}
```

**`question_text`:** `null`

**Student answer to submit:**
```json
{ "answer": "C" }
```
`answer` is the paragraph letter (the available paragraph labels should be shown to the student from the passage structure, e.g. A–F).

---

### 13. MATCHING — Matching

**Used in:** Listening

A list of options (e.g. people, places) is shown. The student matches each question item to one of the options.

**`group_content_json`:**
```json
{
  "options": [
    { "key": "A", "text": "Library" },
    { "key": "B", "text": "Sports centre" },
    { "key": "C", "text": "Cafeteria" }
  ]
}
```

**`options_json`:** `null` or `{}`

**`question_text`:** The item to be matched (e.g. "Room 14").

**Student answer to submit:**
```json
{ "answer": "B" }
```

---

### 14. LIST_SELECTION — List Selection

**Used in:** Reading, Listening

A pool of options is given. The student selects the correct items. Each question picks one.

**`group_content_json`:**
```json
{
  "options": [
    { "key": "A", "text": "Increased rainfall" },
    { "key": "B", "text": "Soil erosion" },
    { "key": "C", "text": "Deforestation" },
    { "key": "D", "text": "Air pollution" },
    { "key": "E", "text": "Urban expansion" }
  ]
}
```

**`options_json`:** `null` or `{}`

**`question_text`:** The question stem.

**Student answer to submit:**
```json
{ "answer": "C" }
```

---

### 15. CHOOSING_TITLE — Choosing a Title

**Used in:** Reading

A list of possible titles for the passage is provided. The student picks the best one.

**`group_content_json`:**
```json
{
  "options": [
    { "key": "A", "text": "The Rise of Renewable Energy" },
    { "key": "B", "text": "Global Warming: A Crisis Ignored" },
    { "key": "C", "text": "How Governments Are Responding to Climate Change" }
  ]
}
```

**`options_json`:** `null` or `{}`

**`question_text`:** Usually `null` — instructions describe the task.

**Student answer to submit:**
```json
{ "answer": "A" }
```

---

### 16. CLASSIFICATION — Classification / Matching Features

**Used in:** Reading

A set of categories (e.g. researchers, time periods, places) is shown. The student classifies each statement/feature into one category.

**`group_content_json`:**
```json
{
  "categories": [
    { "key": "A", "label": "Professor Smith" },
    { "key": "B", "label": "Professor Jones" },
    { "key": "C", "label": "Both researchers" }
  ]
}
```

**`options_json`:** `null` or `{}`

**`question_text`:** The statement or feature to classify (e.g. "Argues that funding has been misallocated").

**Student answer to submit:**
```json
{ "answer": "B" }
```
`answer` is the `key` of the matched category.

---

### 17. DIAGRAM_COMPLETION — Diagram Completion

**Used in:** Reading, Listening

An image of a diagram is shown with labelled parts that have blanks. Each blank = one `Question`. Students fill in the label from the text.

**`group_content_json`:**
```json
{
  "image": "https://backend.example.com/media/diagrams/heart.png",
  "labels": [
    { "key": "1", "text": "Left ventricle" },
    { "key": "2", "text": "Aorta" }
  ]
}
```
`labels` are the pre-filled labels for reference/positioning. Blanks are the questions (no label entry for them). `image` is the diagram URL.

**`options_json`:** `null` or `{}`

**`question_text`:** `null` or identifies the blank position (e.g. "Label 3").

**Student answer to submit:**
```json
{ "answer": "pulmonary vein" }
```

---

### 18. PLAN_MAP_DIAGRAM — Plan / Map / Diagram Labelling

**Used in:** Listening

Very similar to `DIAGRAM_COMPLETION` but specifically for maps, floor plans, or process diagrams. Students fill labels on the image while listening.

**`group_content_json`:**
```json
{
  "image": "https://backend.example.com/media/diagrams/campus_map.png",
  "labels": [
    { "key": "A", "text": "Main entrance" }
  ]
}
```

**`options_json`:** `null` or `{}`

**`question_text`:** `null` or position identifier (e.g. "Building B").

**Student answer to submit:**
```json
{ "answer": "car park" }
```

---

### 19. FORM_COMPLETION — Form Completion

**Used in:** Listening

A form (registration, booking, etc.) is shown with blank fields. Each blank field = one `Question`. Students fill in details from what they hear.

**`group_content_json`:**
```json
{
  "template_text": "Name: _____(1)\nDate of birth: _____(2)\nCourse: _____(3)\nFee: £_____(4)"
}
```
Render the template with numbered blanks as input fields. Map each number to a `question_number` in the group range.

**`options_json`:** `null` or `{}`

**`question_text`:** `null`

**Student answer to submit:**
```json
{ "answer": "Johnson" }
```

---

### 20. NOTE_COMPLETION — Note Completion

**Used in:** Listening

A set of notes with blanks is displayed. Each blank = one `Question`. Students fill in missing information while listening.

**`group_content_json`:**
```json
{
  "template_text": "Main findings:\n- Population grew by _____(1)% annually\n- Primary cause: _____(2)\n- Recommended action: _____(3)"
}
```

**`options_json`:** `null` or `{}`

**`question_text`:** `null`

**Student answer to submit:**
```json
{ "answer": "3.5" }
```

---

## Saving & Submitting Answers

Both save (interim) and submit (final) use the same answer array format:

```
POST /api/v1/student/attempts/<attempt_id>/save/
POST /api/v1/student/attempts/<attempt_id>/submit/
```

**Request body:**
```json
{
  "answers": [
    {
      "question": "<question_uuid>",
      "student_answer_json": { "answer": "B" }
    },
    {
      "question": "<question_uuid>",
      "student_answer_json": { "answers": ["A", "C"] }
    },
    {
      "question": "<question_uuid>",
      "student_answer_json": null
    }
  ]
}
```

Send `student_answer_json: null` for skipped/unanswered questions. After submit, the API returns the scored attempt with `band_score` and per-question `is_correct` results.

### Answer Format Quick Reference

| Question Type        | `student_answer_json` shape                     |
|----------------------|-------------------------------------------------|
| MCQ_SINGLE           | `{ "answer": "A" }`                             |
| MCQ_MULTIPLE         | `{ "answers": ["A", "C"] }`                     |
| TFNG                 | `{ "answer": "TRUE" \| "FALSE" \| "NOT_GIVEN" }` |
| YNNG                 | `{ "answer": "YES" \| "NO" \| "NOT_GIVEN" }`    |
| SENTENCE_COMPLETION  | `{ "answer": "text" }`                          |
| SHORT_ANSWER         | `{ "answer": "text" }`                          |
| SUMMARY_COMPLETION   | `{ "answer": "text" }`                          |
| TABLE_COMPLETION     | `{ "answer": "text" }`                          |
| FLOW_CHART_COMPLETION| `{ "answer": "text" }`                          |
| FORM_COMPLETION      | `{ "answer": "text" }`                          |
| NOTE_COMPLETION      | `{ "answer": "text" }`                          |
| DIAGRAM_COMPLETION   | `{ "answer": "text" }`                          |
| PLAN_MAP_DIAGRAM     | `{ "answer": "key_value" }`                     |
| MATCHING_HEADINGS    | `{ "answer": "key_value" }`                     |
| MATCH_SENT_ENDINGS   | `{ "answer": "key_value" }`                     |
| MATCH_PARA_INFO      | `{ "answer": "key_value" }`                     |
| MATCHING             | `{ "answer": "key_value" }`                     |
| LIST_SELECTION       | `{ "answer": "key_value" }`                     |
| CHOOSING_TITLE       | `{ "answer": "key_value" }`                     |
| CLASSIFICATION       | `{ "answer": "key_value" }`                     |

---

## Mistake Reasons

After a test is submitted, students can view matched mistake reasons for wrong answers.

```
GET  /api/v1/student/attempts/<attempt_id>/mistake-reasons/
POST /api/v1/student/attempts/<attempt_id>/mistake-reasons/select/
     Body: { "reason_ids": ["<uuid>", "<uuid>"] }

GET  /api/v1/student/mistake-analysis/advice/
```

Mistake reasons are limited per week (separate limits for reading and listening). The API enforces the limit automatically and returns an error if the student exceeds it.

---

## Recent Changes

### Mistake Reason — File/Link No Longer Required

Previously, creating or updating a `MistakeReason` via the admin API required providing either a `file` upload or a `link_url`. **This restriction has been removed.** A mistake reason can now be saved with neither a file nor a link — the `resource_type` field in the response will return `null` in that case.

**Admin endpoints:**
```
POST /api/v1/admin/mistake-reasons/
PATCH /api/v1/admin/mistake-reasons/<reason_id>/
```

You may still provide one resource (file or link), but providing both in the same request is still rejected. The `resource_type` response field will be `"file"`, `"link"`, or `null`.
