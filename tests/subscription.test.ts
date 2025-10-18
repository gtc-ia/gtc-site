import assert from "node:assert/strict";
import test from "node:test";

import type { GetServerSidePropsContext } from "next";

import { fetchSubscriptionStatus, hasActiveSubscription } from "../src/lib/subscription";
import { getServerSideProps } from "../src/pages/auth";

test("fetchSubscriptionStatus returns active status for known subscriber", async () => {
  const status = await fetchSubscriptionStatus("3001");
  assert.equal(status.active, true);
});

test("hasActiveSubscription returns false for unknown user", async () => {
  const status = await hasActiveSubscription("unknown-user");
  assert.equal(status, false);
});

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
        query: { id: "3001" },
      })
    );

    assert.equal(resultFromQuery.redirect?.destination, "https://app.gtstor.com/chat/");

    const resultFromCookie = await getServerSideProps(
      createGsspContext({
        req: ({ cookies: { uid: "3001" } } as unknown as GetServerSidePropsContext["req"]),
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
