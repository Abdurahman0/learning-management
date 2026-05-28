import assert from "node:assert/strict";
import test from "node:test";

import {buildRanges} from "./build-ranges";

test("answer ranges with the same evidence keep all question numbers", () => {
  const ranges = buildRanges("same source text", [
    {id: "q16", start: 0, end: 11, kind: "answer", questionNumber: 16},
    {id: "q19", start: 0, end: 11, kind: "answer", questionNumber: 19}
  ]);

  const answer = ranges.find((range) => range.kind === "answer");
  assert.deepEqual(answer?.answerQuestionNumbers, [16, 19]);
});

test("overlapping answer ranges carry all active question numbers", () => {
  const ranges = buildRanges("same source text", [
    {id: "q16", start: 0, end: 11, kind: "answer", questionNumber: 16},
    {id: "q19", start: 5, end: 11, kind: "answer", questionNumber: 19}
  ]);

  assert.deepEqual(
    ranges
      .filter((range) => range.kind === "answer")
      .map((range) => range.answerQuestionNumbers),
    [[16], [16, 19]]
  );
});
