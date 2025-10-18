import assert from "node:assert/strict";
import test from "node:test";

import { fetchSubscriptionStatus, hasActiveSubscription } from "../src/lib/subscription";

test("fetchSubscriptionStatus returns active status for known subscriber", async () => {
  const status = await fetchSubscriptionStatus("3001");
  assert.equal(status.active, true);
});

test("hasActiveSubscription returns false for unknown user", async () => {
  const status = await hasActiveSubscription("unknown-user");
  assert.equal(status, false);
});
