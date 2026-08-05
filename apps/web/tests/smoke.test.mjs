import test from "node:test";
import assert from "node:assert/strict";

test("carvia web smoke test", () => {
  assert.equal("carvia".toUpperCase(), "CARVIA");
});

