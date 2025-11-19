import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import { useMemo } from "react";

import type { AccessDecisionReason, AccessTicket } from "@/lib/access-gateway";


type AuthRedirectProps = {
  error?: string;
  supportEmail?: string;
  chatUrl: string;
  paymentUrl: string;
  ticket?: AccessTicket;
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

const ACCESS_REASON_COPY: Record<AccessDecisionReason, { title: string; description: string }> = {
  direct_access: {
    title: "Включен прямой доступ",
    description: "Ваш аккаунт отмечен как бета-пользователь, поэтому чат открыт без активной подписки.",
  },
  subscription: {
    title: "Активная подписка",
    description: "Мы подтвердили действующую подписку и предоставляем доступ ко всем сервисам текущего плана.",
  },
  inactive_subscription: {
    title: "Подписка требует продления",
    description: "Основные сервисы будут доступны после оплаты следующего периода обслуживания.",
  },
  user_not_found: {
    title: "Не удалось найти аккаунт",
    description: "Мы не обнаружили запись в базе. Проверьте ссылку из письма или свяжитесь с поддержкой.",
  },
};

const AuthRedirectPage: NextPage<AuthRedirectProps> = ({ error, supportEmail, chatUrl, paymentUrl, ticket }) => {
  const supportHref = useMemo(() => `mailto:${supportEmail}`, [supportEmail]);
  const reasonCopy = ticket ? ACCESS_REASON_COPY[ticket.reason] : undefined;
  const lookupLabel = ticket?.user?.userId ?? ticket?.lookupId;

  return (
    <main className="min-h-screen bg-slate-950 py-12 px-4 text-slate-100">
      <Head>
        <title>Ваши сервисы GTC | GTStor</title>
      </Head>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/60 p-8 shadow-xl shadow-slate-950/40">
          <p className="text-sm uppercase tracking-widest text-slate-400">Центр сервисов GTC</p>
          <h1 className="mt-4 text-3xl font-semibold text-white">Добро пожаловать{lookupLabel ? `, ${lookupLabel}` : ""}!</h1>
          <p className="mt-3 text-base text-slate-300">
            Здесь отображаются сервисы, доступные вашему аккаунту сразу после регистрации. Вы можете возвращаться к этой странице,
            чтобы отслеживать подключение новых возможностей.
          </p>

          <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-300">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-slate-500">Текущий статус</p>
              <p className="mt-1 text-base font-semibold text-white">
                {reasonCopy ? reasonCopy.title : "Ожидаем подтверждение"}
              </p>
            </div>
            {ticket?.subscription?.planName ? (
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 px-4 py-3">
                <p className="text-xs uppercase tracking-wider text-slate-500">План</p>
                <p className="mt-1 text-base font-semibold text-white">{ticket.subscription.planName}</p>
              </div>
            ) : null}
            {ticket?.subscription?.expiresAt ? (
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 px-4 py-3">
                <p className="text-xs uppercase tracking-wider text-slate-500">Доступ до</p>
                <p className="mt-1 text-base font-semibold text-white">
                  {new Date(ticket.subscription.expiresAt).toLocaleDateString()}
                </p>
              </div>
            ) : null}
          </div>

          {reasonCopy ? (
            <p className="mt-4 text-sm text-slate-400">{reasonCopy.description}</p>
          ) : null}
        </header>

        {error ? (
          <div className="mt-6 rounded-lg border border-red-400 bg-red-500/10 p-4 text-left">
            <h2 className="text-lg font-medium text-red-200">We hit a snag.</h2>
            <p className="mt-2 text-sm text-red-100">
              {error}
            </p>
            {reasonCopy ? (
              <dl className="mt-4 space-y-1 text-sm text-slate-100">
                <div>
                  <dt className="font-semibold text-white">Причина</dt>
                  <dd>{reasonCopy.title}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-white">Подробности</dt>
                  <dd>{reasonCopy.description}</dd>
                </div>
                {lookupLabel ? (
                  <div>
                    <dt className="font-semibold text-white">Учетная запись</dt>
                    <dd>{lookupLabel}</dd>
                  </div>
                ) : null}
              </dl>
            ) : null}
            <p className="mt-4 text-sm text-slate-200">
              Try refreshing the page or contact us at {" "}
              <a href={supportHref} className="underline">
                {supportEmail}
              </a>
              , и мы поможем вручную активировать доступ.
            </p>
          </div>
        ) : null}

        <section className="space-y-5">
          <h2 className="text-2xl font-semibold text-white">Сервисы и доступ</h2>
          <p className="text-sm text-slate-400">
            Перечень обновляется автоматически в зависимости от статуса вашей подписки. Как только появляется новый продукт, мы добавляем его сюда.
          </p>

          <div className="mt-4 space-y-4">
            {services.map((service) => (
              <ServiceCard key={service.key} service={service} />
            ))}
          </div>
        </section>

        <footer className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-300">
          <p>
            Если у вас есть вопросы по доступу или вы ожидаете дополнительные сервисы, напишите команде поддержки: {" "}
            <a href={supportHref} className="font-semibold text-white underline">
              {supportEmail}
            </a>
            .
          </p>
        </footer>
      </div>
    </main>
  );
};

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

export default AuthRedirectPage;
