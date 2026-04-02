# Question Types (Reading and Listening)

## Reading

### Admin Builder module options
- `tfng`
- `yes_no_not_given`
- `multiple_choice`
- `matching_headings`
- `matching_information`
- `matching_features`
- `sentence_completion`
- `summary_completion`
- `table_completion`
- `note_completion`
- `short_answer`

Source: `data/admin/test-builder.ts` (`QUESTION_TYPE_OPTIONS_BY_MODULE.reading`)

### Runtime reading test types
- `tfng`
- `mcq`
- `matchingHeadings`
- `sentenceCompletion`
- `matchingInfo`

Source: `data/reading-tests.ts` (`ReadingQuestion`)

### Legacy/demo reading types
- `tfng`
- `matching_headings`
- `multiple_choice`
- `sentence_completion`

Source: `data/reading-test-demo.ts` (`ReadingQuestionType`)

## Listening

### Admin Builder module options
- `multiple_choice`
- `selecting_from_a_list`
- `form_completion`
- `note_completion`
- `table_completion`
- `summary_completion`
- `flow_chart`
- `map`
- `sentence_completion`
- `short_answer`
- `matching_information`

Source: `data/admin/test-builder.ts` (`QUESTION_TYPE_OPTIONS_BY_MODULE.listening`)

### Runtime listening block types
- `noteForm`
- `tableCompletion`
- `mcqGroup`
- `matching`
- `diagramLabeling`
- `summaryCompletion`

Source: `data/listening-tests-full.ts` (`ListeningBlock`)

### Flattened listening question types (used in logic)
- `mcq`
- `text`
- `matching`

Source: `lib/listening-questions.ts` (`FlattenedListeningQuestion`)

