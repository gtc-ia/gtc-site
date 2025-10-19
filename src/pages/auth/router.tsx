import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import { useMemo } from "react";

import { resolveRedirectDecision } from "../../lib/access-gateway";

type AuthRedirectProps = {
  error?: string;
  supportEmail?: string;
  chatUrl: string;
  paymentUrl: string;
};

const DEFAULT_CHAT_URL = "https://app.gtstor.com/chat/";
const DEFAULT_PAYMENT_URL = "https://pay.gtstor.com/payment.php";
const DEFAULT_SUPPORT_EMAIL = "help@gtstor.com";

const getChatUrl = () => process.env.CHAT_URL ?? process.env.NEXT_PUBLIC_CHAT_URL ?? DEFAULT_CHAT_URL;
const getPaymentBaseUrl = () => process.env.PAYMENT_URL ?? process.env.NEXT_PUBLIC_PAYMENT_URL ?? DEFAULT_PAYMENT_URL;
const getSupportEmail = () => process.env.SUPPORT_EMAIL ?? process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? DEFAULT_SUPPORT_EMAIL;

const USER_ID_KEYS = [
  "user_id",
  "userId",
  "gtc_user_id",
  "gtcUserId",
  "gtcId",
  "id",
  "user",
  "uid",
  "account_id",
  "accountId",
];

const coerceIdentifier = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : undefined;
  }

  if (typeof value === "bigint") {
    return value.toString(10);
  }

  return undefined;
};

const pickFirstIdentifier = (source: Record<string, unknown> | undefined): string | undefined => {
  if (!source) {
    return undefined;
  }

  for (const key of USER_ID_KEYS) {
    if (!(key in source)) {
      continue;
    }

    const value = source[key];

    const coerced = coerceIdentifier(value);
    if (coerced) {
      return coerced;
    }

    if (Array.isArray(value) && value.length > 0) {
      for (const entry of value) {
        const candidate = coerceIdentifier(entry);
        if (candidate) {
          return candidate;
        }
      }
    }
  }

  return undefined;
};

const AuthRedirectPage: NextPage<AuthRedirectProps> = ({ error, supportEmail, chatUrl, paymentUrl }) => {
  const supportHref = useMemo(() => `mailto:${supportEmail}`, [supportEmail]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-6 text-center text-slate-100">
      <Head>
        <title>Checking your subscription… | GTStor</title>
      </Head>

      <div className="max-w-xl rounded-2xl bg-slate-800/80 p-8 shadow-xl">
        <h1 className="text-3xl font-semibold">Checking your subscription…</h1>
        <p className="mt-4 text-base text-slate-300">
          You will be redirected shortly based on your subscription status.
        </p>

        {error ? (
          <div className="mt-6 rounded-lg border border-red-400 bg-red-500/10 p-4 text-left">
            <h2 className="text-lg font-medium text-red-200">We hit a snag.</h2>
            <p className="mt-2 text-sm text-red-100">
              {error}
            </p>
            <p className="mt-4 text-sm text-slate-200">
              Try refreshing the page or contact us at {" "}
              <a href={supportHref} className="underline">
                {supportEmail}
              </a>
              .
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3 text-left text-sm text-slate-300">
            <p>
              <strong>Chat:</strong> {chatUrl}
            </p>
            <p>
              <strong>Payment:</strong> {paymentUrl}
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

export const getServerSideProps: GetServerSideProps<AuthRedirectProps> = async ({ query, req }) => {
  const rawUserIdFromQuery = pickFirstIdentifier(query as Record<string, unknown> | undefined);
  const rawUserIdFromCookies = pickFirstIdentifier(req.cookies as Record<string, unknown> | undefined);
  const userId = rawUserIdFromQuery ?? rawUserIdFromCookies;

  const chatUrl = getChatUrl();
  const paymentBaseUrl = getPaymentBaseUrl();
  const supportEmail = getSupportEmail();

  if (!userId) {
    return {
      props: {
        error: "We could not determine your account. Please return to the login page and try again.",
        chatUrl,
        paymentUrl: paymentBaseUrl,
        supportEmail,
      },
    };
  }

  try {
    const decision = await resolveRedirectDecision(userId, {
      chatUrl,
      paymentBaseUrl,
    });

    if (decision.type === "redirect") {
      if (!decision.ticket.hasChatAccess) {
        console.info(
          "Routing user to payment portal due to inactive subscription",
          JSON.stringify(decision.ticket)
        );
      }

      return {
        redirect: {
          destination: decision.destination,
          permanent: false,
        },
      };
    }

    console.warn("Unable to resolve access for user", JSON.stringify(decision.ticket));

    return {
      props: {
        error: decision.message,
        chatUrl,
        paymentUrl: paymentBaseUrl,
        supportEmail,
      },
    };
  } catch (error) {
    console.error("Failed to determine subscription status", error);

    return {
      props: {
        error: "We couldn't verify your subscription right now. Our team has been notified.",
        chatUrl,
        paymentUrl: paymentBaseUrl,
        supportEmail,
      },
    };
  }
};

export default AuthRedirectPage;
