import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { resolveAccessTicket } from "../src/lib/access-gateway";
import { clearSubscriptionDatabaseCache } from "../src/lib/subscription-database";
import { clearUserDatabaseCache } from "../src/lib/user-database";

const fixtureDir = path.join(process.cwd(), "tests", "fixtures");

process.env.USER_DB_PATH = path.join(fixtureDir, "users.json");
process.env.SUBSCRIPTION_DB_PATH = path.join(fixtureDir, "subscriptions.json");

test("resolveAccessTicket matches subscription via linked gtcUserId", async () => {
  clearSubscriptionDatabaseCache();
  clearUserDatabaseCache();

  const ticket = await resolveAccessTicket("user3001@example.com");

  assert.equal(ticket.lookupId, "user3001@example.com");
  assert.equal(ticket.hasDirectAccess, false);
  assert.equal(ticket.hasSubscription, true);
  assert.equal(ticket.hasChatAccess, true);
  assert.equal(ticket.reason, "subscription");
  assert.equal(ticket.subscription?.userId, "3001");
});
