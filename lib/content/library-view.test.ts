import test from "node:test";
import assert from "node:assert/strict";
import { filterLibraryEntries } from "./library-view";

const items = [
  { id: "a", storageId: "program:one", kind: "PROGRAM", title: "Өөрийгөө таних", summary: "Дадал хэвшил", used: true },
  { id: "b", storageId: "program:two", kind: "TRAINING", title: "Дадлаа хөгжүүлэх", summary: "Өөрийгөө ойлгох", used: false },
  { id: "c", kind: "TEST", title: "Сэтгэл хөдлөл", used: false },
];
const base = { query: "", kind: "", view: "all" as const, saved: ["program:two"] };
test("the existing catalog stays complete until a user chooses a filter", () => {
  assert.deepEqual(filterLibraryEntries(items, base).map(item => item.id), ["a","b","c"]);
  assert.deepEqual(filterLibraryEntries(items, { ...base, view: "saved" }).map(item => item.id), ["b"]);
  assert.deepEqual(filterLibraryEntries(items, { ...base, view: "used" }).map(item => item.id), ["a"]);
  assert.deepEqual(filterLibraryEntries(items, { ...base, view: "unused" }).map(item => item.id), ["b","c"]);
});
test("search combines content kind, device bookmarks and all search words", () => {
  assert.deepEqual(filterLibraryEntries(items, { ...base, kind: "TRAINING", view: "saved", query: " ӨӨРИЙГӨӨ  дадлаа " }).map(item => item.id), ["b"]);
  assert.equal(filterLibraryEntries(items, { ...base, view: "saved", saved: [] }).length, 0);
});
