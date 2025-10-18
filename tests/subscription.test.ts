import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import type { GetServerSidePropsContext } from "next";

import { resolveAccessTicket, resolveRedirectDecision } from "../src/lib/access-gateway";
import { clearSubscriptionDatabaseCache } from "../src/lib/subscription-database";
import { fetchSubscriptionStatus, hasActiveSubscription } from "../src/lib/subscription";
import { clearUserDatabaseCache } from "../src/lib/user-database";
import { getServerSideProps } from "../src/pages/auth";

const withMockedFetch = async (fn: () => Promise<void>) => {
  const originalFetch = globalThis.fetch;

  (globalThis as typeof globalThis & { fetch: typeof fetch }).fetch = (async () => {
    throw new Error("fetch should not be called during this test");
  }) as typeof fetch;

  try {
    await fn();
  } finally {
    if (originalFetch) {
      globalThis.fetch = originalFetch;
    } else {
      // @ts-expect-error -- node typings allow deleting fetch when it was undefined
      delete globalThis.fetch;
    }
  }
};

const withDatabaseFixtures = async (
  options: {
    subscriptionPath?: string;
    userPath?: string;
  },
  fn: () => Promise<void>
) => {
  const previousSubscriptionPath = process.env.SUBSCRIPTION_DB_PATH;
  const previousUserPath = process.env.USER_DB_PATH;

  if (options.subscriptionPath) {
    process.env.SUBSCRIPTION_DB_PATH = options.subscriptionPath;
  } else {
    delete process.env.SUBSCRIPTION_DB_PATH;
  }

  if (options.userPath) {
    process.env.USER_DB_PATH = options.userPath;
  } else {
    delete process.env.USER_DB_PATH;
  }

  clearSubscriptionDatabaseCache();
  clearUserDatabaseCache();

  try {
    await fn();
  } finally {
    if (previousSubscriptionPath === undefined) {
      delete process.env.SUBSCRIPTION_DB_PATH;
    } else {
      process.env.SUBSCRIPTION_DB_PATH = previousSubscriptionPath;
    }

    if (previousUserPath === undefined) {
      delete process.env.USER_DB_PATH;
    } else {
      process.env.USER_DB_PATH = previousUserPath;
    }

    clearSubscriptionDatabaseCache();
    clearUserDatabaseCache();
  }
};

const createGsspContext = (overrides: Partial<GetServerSidePropsContext> = {}): GetServerSidePropsContext => {
  return {
    params: {},
    query: {},
    resolvedUrl: "/auth",
    req: { cookies: {} },
    res: {} as never,
    locales: undefined,
    locale: undefined,
    defaultLocale: undefined,
    ...overrides,
  } as GetServerSidePropsContext;
};

test("fetchSubscriptionStatus returns active status for known subscriber", async () => {
  const status = await fetchSubscriptionStatus("3001");
  assert.equal(status.active, true);
});

test("hasActiveSubscription returns false for unknown user", async () => {
  const status = await hasActiveSubscription("unknown-user");
  assert.equal(status, false);
});

test("getServerSideProps redirects known subscribers straight to chat", async () => {
  await withMockedFetch(async () => {
    const result = await getServerSideProps(
      createGsspContext({
        query: { user_id: "3001" },
      })
    );

    assert.deepEqual(result, {
      redirect: {
        destination: "https://app.gtstor.com/chat/",
        permanent: false,
      },
    });
  });
});

test("getServerSideProps accepts alternate identifier keys", async () => {
  await withMockedFetch(async () => {
    const resultFromQuery = await getServerSideProps(
      createGsspContext({
        query: { gtc_user_id: "3001" },
      })
    );

    assert.equal(resultFromQuery.redirect?.destination, "https://app.gtstor.com/chat/");

    const resultFromCookie = await getServerSideProps(
      createGsspContext({
        req: ({ cookies: { uid: 3001 } } as unknown as GetServerSidePropsContext["req"]),
      })
    );

    assert.equal(resultFromCookie.redirect?.destination, "https://app.gtstor.com/chat/");
  });
});

test("getServerSideProps redirects unknown users to payment", async () => {
  const result = await getServerSideProps(
    createGsspContext({
      query: { user_id: "unknown" },
    })
  );

  assert.deepEqual(result, {
    redirect: {
      destination: "https://pay.gtstor.com/payment.php?user_id=unknown",
      permanent: false,
    },
  });
});

test("fetchSubscriptionStatus prefers database records when available", async () => {
  const subscriptionPath = path.join(process.cwd(), "tests/fixtures/subscriptions.json");
  const userPath = path.join(process.cwd(), "tests/fixtures/users.json");

  await withDatabaseFixtures({ subscriptionPath, userPath }, async () => {
    const status = await fetchSubscriptionStatus("fixture-user");

    assert.equal(status.active, true);
    assert.equal(status.planName, "pro");
    assert.equal(status.expiresAt, "2099-01-01T00:00:00Z");
  });
});

test("getServerSideProps redirects inactive database users to payment", async () => {
  const subscriptionPath = path.join(process.cwd(), "tests/fixtures/subscriptions.json");
  const userPath = path.join(process.cwd(), "tests/fixtures/users.json");

  await withDatabaseFixtures({ subscriptionPath, userPath }, async () => {
    await withMockedFetch(async () => {
      const result = await getServerSideProps(
        createGsspContext({
          query: { user_id: "inactive-user" },
        })
      );

      assert.deepEqual(result, {
        redirect: {
          destination: "https://pay.gtstor.com/payment.php?user_id=inactive-user",
          permanent: false,
        },
      });
    });
  });
});

test("resolveAccessTicket maps gtc ids to subscriptions", async () => {
  const subscriptionPath = path.join(process.cwd(), "tests/fixtures/subscriptions.json");
  const userPath = path.join(process.cwd(), "tests/fixtures/users.json");

  await withDatabaseFixtures({ subscriptionPath, userPath }, async () => {
    const ticket = await resolveAccessTicket("9002");

    assert.equal(ticket.hasChatAccess, true);
    assert.equal(ticket.reason, "subscription");
    assert.equal(ticket.subscription?.planName, "partner");
  });
});

test("resolveRedirectDecision preserves payment query parameters", async () => {
  const decision = await resolveRedirectDecision("unknown-user", {
    chatUrl: "https://app.gtstor.com/chat/",
    paymentBaseUrl: "https://pay.gtstor.com/payment.php?lang=en&user_id=legacy&currency=usd",
  });

  assert.equal(decision.type, "redirect");

  const url = new URL(decision.destination);
  assert.equal(url.searchParams.get("lang"), "en");
  assert.equal(url.searchParams.get("currency"), "usd");
  assert.equal(url.searchParams.get("user_id"), "unknown-user");
});

test("resolveRedirectDecision supports relative payment urls", async () => {
  const decision = await resolveRedirectDecision("unknown-user", {
    chatUrl: "https://app.gtstor.com/chat/",
    paymentBaseUrl: "/billing/pay?lang=en",
  });

  assert.equal(decision.type, "redirect");
  assert.equal(decision.destination, "/billing/pay?lang=en&user_id=unknown-user");
});
