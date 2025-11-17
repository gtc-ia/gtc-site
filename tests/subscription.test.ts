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

test("fetchSubscriptionStatus treats trialing status as active", async (t) => {
  const previousEndpoint = process.env.SUBSCRIPTION_STATUS_ENDPOINT;
  const originalFetch = global.fetch;

  process.env.SUBSCRIPTION_STATUS_ENDPOINT = "https://example.test/subscriptions";

  global.fetch = async () =>
    new Response(
      JSON.stringify({
        status: "trialing",
        planName: "trial",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

  try {
    await t.test("trialing payload is recognized as active", async () => {
      const status = await fetchSubscriptionStatus("trial-user");

      assert.equal(status.active, true);
      assert.equal(status.planName, "trial");
    });
  } finally {
    process.env.SUBSCRIPTION_STATUS_ENDPOINT = previousEndpoint;
    global.fetch = originalFetch;
  }
});
