import type { GetServerSideProps, NextPage } from "next";

import { ServiceHubPage, type ServiceHubProps } from "@/features/service-hub";


type AuthRedirectProps = ServiceHubProps;

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

const AuthRedirectScreen: NextPage<AuthRedirectProps> = (props) => <ServiceHubPage {...props} />;

const AuthRedirectPage: NextPage<ServiceHubProps> = (props) => <ServiceHubPage {...props} />;

export const getServerSideProps: GetServerSideProps<ServiceHubProps> = async ({ query, req }) => {
  const rawUserIdFromQuery = pickFirstIdentifier(query as Record<string, unknown> | undefined);
  const rawUserIdFromCookies = pickFirstIdentifier(req.cookies as Record<string, unknown> | undefined);
  const userId = rawUserIdFromQuery ?? rawUserIdFromCookies;

  const chatUrl = getChatUrl();
  const paymentBaseUrl = getPaymentBaseUrl();
  const supportEmail = getSupportEmail();

  if (!userId) {
    return {
      props: {
        error: "Мы не смогли определить ваш аккаунт. Вернитесь к форме входа и попробуйте ещё раз.",
        chatUrl,
        paymentUrl: paymentBaseUrl,
        supportEmail,
      },
    };
  }

  try {
    const { resolveRedirectDecision } = await import("@/lib/access-gateway");
    const decision = await resolveRedirectDecision(userId, {
      chatUrl,
      paymentBaseUrl,
    });

    if (decision.type === "redirect") {
      if (!decision.ticket.hasChatAccess) {
        console.info("Routing user to services hub due to inactive subscription", JSON.stringify(decision.ticket));
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
        chatUrl,
        paymentUrl,
        supportEmail,
        ticket: decision.ticket,
      },
    };
  } catch (error) {
    console.error("Failed to determine subscription status", error);

    return {
      props: {
        error: "Не удалось проверить подписку. Попробуйте позже или напишите нам.",
        chatUrl,
        paymentUrl: paymentBaseUrl,
        supportEmail,
      },
    };
  }
};

export default AuthRedirectScreen;
