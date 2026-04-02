# Question Type Entering Guide

This guide shows exactly what to put in `group_content_json`, `options_json`, and `correct_answer_json` for every question type. Follow these schemas precisely — the API validates them and will reject malformed input.

---

## Overview

There are three JSON fields to fill per question:

| Field | Where it lives | Purpose |
|---|---|---|
| `group_content_json` | QuestionGroup | Shared content for the entire group (headings list, summary text, table structure, etc.) |
| `options_json` | Question | Per-question options or statement (for types that need it) |
| `correct_answer_json` | Question | The correct answer for this question |

---

## Listening Question Types

---

### FORM_COMPLETION
Students fill in a form template. Blanks are marked `{question_number}`.

**group_content_json:**
```json
{ "template_text": "Name: {1}\nPhone: {2}\nAddress: {3}" }
```

**options_json:** `null`

**correct_answer_json:**
```json
{ "answer": "Sharma", "alternative_answers": ["sharma", "SHARMA"] }
```

**word_limit:** Set to the number of words allowed (e.g., `1`, `2`, `3`).
**number_allowed:** `true` if "and/or a number" is in the instructions.

---

### NOTE_COMPLETION
Students fill blanks in notes. Blanks are marked `{question_number}`.

**group_content_json:**
```json
{ "template_text": "Topic: {1}\nDuration: {2} weeks\nVenue: {3}" }
```

**options_json:** `null`

**correct_answer_json:**
```json
{ "answer": "climate change", "alternative_answers": [] }
```

---

### TABLE_COMPLETION
Students fill blanks in a table.

**group_content_json:**
```json
{
  "columns": ["Category", "Type", "Price"],
  "rows": [
    ["Electronics", "{1}", "$200"],
    ["{2}", "Books", "$15"]
  ]
}
```
Use `{question_number}` as a placeholder for each blank cell.

**options_json:** `null`

**correct_answer_json:**
```json
{ "answer": "Laptop", "alternative_answers": ["laptop"] }
```

---

### FLOW_CHART_COMPLETION
Students fill blanks in a flow chart.

**group_content_json:**
```json
{
  "steps": [
    { "order": 1, "text": "Application received" },
    { "order": 2, "text": "Documents reviewed — missing: {1}" },
    { "order": 3, "text": "Interview scheduled" }
  ]
}
```

**options_json:** `null`

**correct_answer_json:**
```json
{ "answer": "passport", "alternative_answers": [] }
```

---

### PLAN_MAP_DIAGRAM (Plan / Map / Diagram Labelling)
Students label positions on an image.

**group_content_json:**
```json
{
  "image": "/media/diagrams/map_001.png",
  "labels": [
    { "key": "A", "text": "Entrance" },
    { "key": "B", "text": "Cafeteria" },
    { "key": "C", "text": "Library" }
  ]
}
```

**options_json:** `null`

**correct_answer_json:**
```json
{ "answer": "B" }
```
The answer is the key from the labels list.

---

### MATCHING (Listening — match speakers to options)
Students match each question to one of a shared set of options.

**group_content_json:**
```json
{
  "options": [
    { "key": "A", "text": "It is cheap." },
    { "key": "B", "text": "It is convenient." },
    { "key": "C", "text": "It is environmentally friendly." }
  ]
}
```

**options_json:** `null`

**question_text:** The statement or speaker to match. E.g., `"Speaker 1 thinks the train is good because..."`

**correct_answer_json:**
```json
{ "answer": "B" }
```

---

### MCQ_SINGLE (Multiple Choice — Single Answer)
Students pick one answer.

**group_content_json:** `null`

**options_json:**
```json
{
  "options": [
    { "key": "A", "text": "The station was built in 1920." },
    { "key": "B", "text": "The station was built in 1945." },
    { "key": "C", "text": "The station was built in 1960." }
  ]
}
```

**correct_answer_json:**
```json
{ "answer": "B" }
```

---

### MCQ_MULTIPLE (Multiple Choice — Multiple Answers)
Students pick several answers.

**group_content_json:** `null`

**options_json:**
```json
{
  "options": [
    { "key": "A", "text": "It is affordable." },
    { "key": "B", "text": "It is available 24/7." },
    { "key": "C", "text": "It includes free parking." },
    { "key": "D", "text": "It offers online booking." },
    { "key": "E", "text": "It accepts credit cards." }
  ]
}
```

**correct_answer_json:**
```json
{ "answers": ["A", "D"] }
```
Order doesn't matter — grading uses set equality.

---

### SHORT_ANSWER
Students write a short answer to a direct question.

**group_content_json:** `null`

**options_json:** `null`

**question_text:** `"What is the maximum number of passengers?"`

**correct_answer_json:**
```json
{ "answer": "120", "alternative_answers": ["one hundred and twenty"] }
```

---

## Reading Question Types

---

### TFNG (True / False / Not Given)
Students decide if a statement is TRUE, FALSE, or NOT GIVEN based on the passage.

**group_content_json:** `null`

**options_json:**
```json
{ "statement": "The researcher believes automation will eliminate most jobs." }
```

**correct_answer_json:**
```json
{ "answer": "FALSE" }
```
Allowed values: `TRUE`, `FALSE`, `NOT_GIVEN`

---

### YNNG (Yes / No / Not Given)
Students decide if a statement agrees with the writer's views (not factual claims).

**group_content_json:** `null`

**options_json:**
```json
{ "statement": "The writer suggests governments should fund more research." }
```

**correct_answer_json:**
```json
{ "answer": "YES" }
```
Allowed values: `YES`, `NO`, `NOT_GIVEN`

---

### MATCHING_HEADINGS
Students match each paragraph to a heading from a shared list.

**group_content_json:**
```json
{
  "headings": [
    { "key": "i", "text": "A surprising discovery" },
    { "key": "ii", "text": "The origins of the problem" },
    { "key": "iii", "text": "An unexpected solution" },
    { "key": "iv", "text": "Early attempts at reform" },
    { "key": "v", "text": "The role of technology" }
  ]
}
```
Include more headings than paragraphs (typical IELTS format — extra distractors).

**options_json:** `null`

**question_text:** `"Paragraph A"` or `"Section 1"` etc.

**correct_answer_json:**
```json
{ "answer": "iii" }
```

---

### MATCH_PARA_INFO (Matching Paragraph Information)
Students match a statement to the paragraph that contains the information.

**group_content_json:** `null`

**options_json:**
```json
{ "statement": "A reference to the financial cost of early experiments" }
```

**question_text:** Can be left null (statement is in options_json).

**correct_answer_json:**
```json
{ "answer": "C" }
```
The answer is a paragraph letter (A, B, C, D...).

---

### MATCH_SENT_ENDINGS (Matching Sentence Endings)
Students complete sentence halves by choosing the correct ending from a list.

**group_content_json:**
```json
{
  "endings": [
    { "key": "A", "text": "…had been in use for centuries." },
    { "key": "B", "text": "…was discovered by accident." },
    { "key": "C", "text": "…required government approval." },
    { "key": "D", "text": "…became widely available in the 1990s." }
  ]
}
```

**options_json:** `null`

**question_text:** The sentence beginning. E.g., `"The first solar panels…"`

**correct_answer_json:**
```json
{ "answer": "B" }
```

---

### CLASSIFICATION
Students classify each item into one of the given categories.

**group_content_json:**
```json
{
  "categories": [
    { "key": "A", "label": "Advantage" },
    { "key": "B", "label": "Disadvantage" },
    { "key": "C", "label": "Neither" }
  ]
}
```

**options_json:** `null`

**question_text:** The item to classify. E.g., `"Low operating costs"`

**correct_answer_json:**
```json
{ "answer": "A" }
```

---

### LIST_SELECTION (List / Multiple Answer Selection)
Students choose a fixed number of items from a list.

**group_content_json:**
```json
{
  "options": [
    { "key": "A", "text": "Reduced travel time" },
    { "key": "B", "text": "Lower ticket prices" },
    { "key": "C", "text": "Improved safety record" },
    { "key": "D", "text": "Greater reliability" },
    { "key": "E", "text": "Increased capacity" }
  ]
}
```

**options_json:** `null`

**question_text:** E.g., `"Which TWO benefits are mentioned in the passage?"`

**correct_answer_json:**
```json
{ "answer": "C" }
```
If this question type is used with single-answer per question (one question per option), use `{"answer": "C"}`. If multiple answers are expected for a single question, this would typically be split into multiple questions.

---

### CHOOSING_TITLE
Students pick the best title for the passage from a list.

**group_content_json:**
```json
{
  "options": [
    { "key": "A", "text": "The Decline of Traditional Agriculture" },
    { "key": "B", "text": "How Technology is Changing Farming" },
    { "key": "C", "text": "The Future of Food Production" }
  ]
}
```

**options_json:** `null`

**question_text:** `null` (the question is implied by the type)

**correct_answer_json:**
```json
{ "answer": "B" }
```

---

### SENTENCE_COMPLETION (Reading)
Students complete a sentence using words from the passage.

**group_content_json:** `null`

**options_json:**
```json
{ "sentence_stem": "The city was founded in _____ by Dutch settlers." }
```

**question_text:** `null` (stem is in options_json)

**correct_answer_json:**
```json
{ "answer": "1626", "alternative_answers": ["sixteen twenty-six"] }
```

---

### SUMMARY_COMPLETION
Students complete a summary using words from the passage or a word bank.

**group_content_json:**
```json
{
  "summary_text": "Solar panels convert {27} into electricity. The process was first discovered {28} and has since been improved through {29}.",
  "word_bank": ["sunlight", "heat", "1839", "1920", "research", "experimentation"]
}
```
Use `{question_number}` for each blank. Include `word_bank` if students must choose from provided words; omit or set to `null` if they write from the passage.

**options_json:** `null`

**correct_answer_json:**
```json
{ "answer": "sunlight", "alternative_answers": ["light"] }
```

---

### DIAGRAM_COMPLETION (Reading)
Students label parts of a diagram.

**group_content_json:**
```json
{
  "image": "/media/diagrams/cell_diagram.png",
  "labels": [
    { "key": "A", "text": "Nucleus" },
    { "key": "B", "text": "Mitochondria" }
  ]
}
```

**options_json:** `null`

**correct_answer_json:**
```json
{ "answer": "membrane", "alternative_answers": ["cell membrane"] }
```
For diagram completion, the answer is typically a word or phrase from the passage, not a key from the labels.

---

## Quick Reference Table

| Question Type | group_content_json | options_json | correct_answer_json |
|---|---|---|---|
| MCQ_SINGLE | `null` | `{"options": [...]}` | `{"answer": "B"}` |
| MCQ_MULTIPLE | `null` | `{"options": [...]}` | `{"answers": ["A","C"]}` |
| TFNG | `null` | `{"statement": "..."}` | `{"answer": "TRUE"}` |
| YNNG | `null` | `{"statement": "..."}` | `{"answer": "YES"}` |
| SENTENCE_COMPLETION | `null` | `{"sentence_stem": "..."}` | `{"answer": "...", "alternative_answers": [...]}` |
| SHORT_ANSWER | `null` | `null` | `{"answer": "...", "alternative_answers": [...]}` |
| MATCHING_HEADINGS | `{"headings": [...]}` | `null` | `{"answer": "iii"}` |
| MATCH_PARA_INFO | `null` | `{"statement": "..."}` | `{"answer": "C"}` |
| MATCH_SENT_ENDINGS | `{"endings": [...]}` | `null` | `{"answer": "B"}` |
| CLASSIFICATION | `{"categories": [...]}` | `null` | `{"answer": "A"}` |
| LIST_SELECTION | `{"options": [...]}` | `null` | `{"answer": "C"}` |
| CHOOSING_TITLE | `{"options": [...]}` | `null` | `{"answer": "B"}` |
| SUMMARY_COMPLETION | `{"summary_text": "...", "word_bank": [...]}` | `null` | `{"answer": "...", "alternative_answers": [...]}` |
| TABLE_COMPLETION | `{"columns": [...], "rows": [...]}` | `null` | `{"answer": "...", "alternative_answers": [...]}` |
| FLOW_CHART_COMPLETION | `{"steps": [...]}` | `null` | `{"answer": "...", "alternative_answers": [...]}` |
| DIAGRAM_COMPLETION | `{"image": "...", "labels": [...]}` | `null` | `{"answer": "...", "alternative_answers": [...]}` |
| MATCHING (Listening) | `{"options": [...]}` | `null` | `{"answer": "B"}` |
| PLAN_MAP_DIAGRAM | `{"image": "...", "labels": [...]}` | `null` | `{"answer": "B"}` |
| FORM_COMPLETION | `{"template_text": "..."}` | `null` | `{"answer": "...", "alternative_answers": [...]}` |
| NOTE_COMPLETION | `{"template_text": "..."}` | `null` | `{"answer": "...", "alternative_answers": [...]}` |

---

## Grading Rules

| Question Type(s) | How it's graded |
|---|---|
| MCQ_SINGLE | Exact string match of `answer` key (case-sensitive) |
| MCQ_MULTIPLE | Set equality of `answers` list (order-insensitive, case-insensitive) |
| TFNG | Exact match: `TRUE` / `FALSE` / `NOT_GIVEN` |
| YNNG | Exact match: `YES` / `NO` / `NOT_GIVEN` |
| MATCHING_HEADINGS, MATCHING, CLASSIFICATION, LIST_SELECTION, CHOOSING_TITLE, MATCH_PARA_INFO, MATCH_SENT_ENDINGS, PLAN_MAP_DIAGRAM | Exact match of answer key (case-insensitive) |
| SENTENCE_COMPLETION, SHORT_ANSWER, SUMMARY_COMPLETION, TABLE_COMPLETION, FLOW_CHART_COMPLETION, DIAGRAM_COMPLETION, FORM_COMPLETION, NOTE_COMPLETION | Case-insensitive match against `answer` and all `alternative_answers`. Whitespace is stripped. |

Always include useful `alternative_answers` for completion types to account for spelling variants, capitalisation differences, and abbreviations.

---

## Common Mistakes to Avoid

1. **Missing group_content_json** — Types like `MATCHING_HEADINGS` and `FORM_COMPLETION` require it. Submitting `null` will return a validation error.

2. **Wrong answer format** — MCQ_MULTIPLE requires `{"answers": [...]}` (plural). MCQ_SINGLE requires `{"answer": "..."}` (singular).

3. **question_number out of range** — Each question's `question_number` must be within the group's `question_number_start`–`question_number_end`. E.g., if the group is Q1–Q5, don't submit a question with `question_number: 6`.

4. **Both parents set on QuestionGroup** — A group must have exactly one of `listening_part` or `reading_passage` set, not both and not neither.

5. **Listening parts on reading tests** — A `ListeningPart` can only belong to a test with `test_type=LISTENING`. Same rule applies for `ReadingPassage` and `READING`.

6. **Empty TFNG/YNNG options_json** — These types require `options_json` with a `statement` field. Do not pass `null`.

7. **Missing alternative_answers for completion types** — Always add obvious spelling variants. Students may type "colour" or "color", "organised" or "organized".
