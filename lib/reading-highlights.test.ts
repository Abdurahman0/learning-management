import assert from "node:assert/strict";
import test from "node:test";

import { addUserHighlight, normalizeUserRanges, removeUserHighlight } from "./reading-highlights";

test("add small then overlapping bigger merges to one range", () => {
  const first = addUserHighlight([], 10, 15);
  const second = addUserHighlight(first, 8, 20);
  const normalized = normalizeUserRanges(second);

  assert.equal(normalized.length, 1);
  assert.equal(normalized[0].start, 8);
  assert.equal(normalized[0].end, 20);
});

test("add adjacent ranges merges to one range", () => {
  const first = addUserHighlight([], 5, 10);
  const second = addUserHighlight(first, 10, 14);
  const normalized = normalizeUserRanges(second);

  assert.equal(normalized.length, 1);
  assert.equal(normalized[0].start, 5);
  assert.equal(normalized[0].end, 14);
});

test("unmark inside merged removes whole merged range (Option A)", () => {
  const first = addUserHighlight([], 12, 16);
  const merged = addUserHighlight(first, 15, 26);
  const afterRemove = removeUserHighlight(merged, 18, 19);

  assert.equal(afterRemove.length, 0);
});
