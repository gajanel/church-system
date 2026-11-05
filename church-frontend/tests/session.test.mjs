import test from "node:test";
import assert from "node:assert/strict";

import { isSessionIdle } from "../src/api/session.js";

test("session remains active before the inactivity limit", () => {
  const now = Date.UTC(2026, 9, 20, 12, 0, 0);
  assert.equal(isSessionIdle(now - 59 * 60_000, now, 60), false);
});

test("session expires at the inactivity limit", () => {
  const now = Date.UTC(2026, 9, 20, 12, 0, 0);
  assert.equal(isSessionIdle(now - 60 * 60_000, now, 60), true);
});

test("missing activity timestamp does not expire a new login", () => {
  assert.equal(isSessionIdle(null, Date.now(), 60), false);
});
