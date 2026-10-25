import { test } from "node:test";
import assert from "node:assert/strict";
import { paginateRoutine, routinePageSizes, visibleRoutinePages } from "../src/routine-pagination.ts";

const habits = Array.from({ length: 107 }, (_, index) => ({ id: index + 1 }));

test("routine supports the five requested page sizes without overlap or missing items", () => {
  assert.deepEqual(routinePageSizes, [5, 10, 20, 50, 100]);
  for (const size of routinePageSizes) {
    const pages = Math.ceil(habits.length / size);
    const listed = Array.from({ length: pages }, (_, index) => paginateRoutine(habits, index + 1, size).items).flat();
    assert.deepEqual(listed, habits);
    assert.equal(paginateRoutine(habits, pages, size).last, 107);
  }
});

test("the current page stays valid when results shrink or a page is requested out of range", () => {
  assert.deepEqual(paginateRoutine(habits.slice(0, 11), 3, 5).items.map((h) => h.id), [11]);
  const reduced = paginateRoutine(habits.slice(0, 7), 3, 5);
  assert.equal(reduced.page, 2);
  assert.deepEqual(reduced.items.map((h) => h.id), [6, 7]);
  assert.equal(paginateRoutine(habits, 0, 10).page, 1);
  assert.equal(paginateRoutine(habits, 999, 10).page, 11);
  assert.equal(paginateRoutine(habits, 1, 17).pageSize, 10);
});

test("empty and filtered lists have useful bounds", () => {
  const empty = paginateRoutine([], 4, 20);
  assert.equal(empty.totalPages, 1);
  assert.equal(empty.page, 1);
  assert.equal(empty.first, 0);
  assert.equal(empty.last, 0);
  assert.deepEqual(empty.items, []);
  const matching = habits.filter((h) => h.id % 10 === 0);
  assert.deepEqual(paginateRoutine(matching, 2, 5).items.map((h) => h.id), [60, 70, 80, 90, 100]);
});

test("numbered page controls stay within the available range", () => {
  assert.deepEqual(visibleRoutinePages(1, 12), [1, 2, 3, 4, 5]);
  assert.deepEqual(visibleRoutinePages(6, 12), [4, 5, 6, 7, 8]);
  assert.deepEqual(visibleRoutinePages(12, 12), [8, 9, 10, 11, 12]);
  assert.deepEqual(visibleRoutinePages(1, 1), [1]);
});
