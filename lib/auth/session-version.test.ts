import test from "node:test";
import assert from "node:assert/strict";
import { isCurrentSessionVersion } from "./session-version";
test("reset revokes both versioned and never-upgraded legacy sessions", () => {
  assert.equal(isCurrentSessionVersion(undefined,0),true);
  for (const version of [undefined,0,1,"2",null,-1]) assert.equal(isCurrentSessionVersion(version,2),false);
  assert.equal(isCurrentSessionVersion(2,2),true);
  assert.equal(isCurrentSessionVersion(undefined,2,true),true);
  assert.equal(isCurrentSessionVersion(1,null,true),false);
  assert.equal(isCurrentSessionVersion(1,-1,true),false);
});
