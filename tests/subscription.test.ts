import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { fetchSubscriptionStatus, hasActiveSubscription } from "../src/lib/subscription";
import { clearSubscriptionDatabaseCache } from "../src/lib/subscription-database";
import { clearUserDatabaseCache } from "../src/lib/user-database";

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

test("fetchSubscriptionStatus resolves subscription via linked user id", async () => {
  const previousUserDb = process.env.USER_DB_PATH;
  const previousSubDb = process.env.SUBSCRIPTION_DB_PATH;

  process.env.USER_DB_PATH = path.join(process.cwd(), "tests", "fixtures", "users.json");
  process.env.SUBSCRIPTION_DB_PATH = path.join(process.cwd(), "tests", "fixtures", "subscriptions.json");

  clearUserDatabaseCache();
  clearSubscriptionDatabaseCache();

  try {
    const status = await fetchSubscriptionStatus("user3001@example.com");

    assert.equal(status.active, true);
    assert.equal(status.planName, "default");
  } finally {
    process.env.USER_DB_PATH = previousUserDb;
    process.env.SUBSCRIPTION_DB_PATH = previousSubDb;
    clearUserDatabaseCache();
    clearSubscriptionDatabaseCache();
  }
});
