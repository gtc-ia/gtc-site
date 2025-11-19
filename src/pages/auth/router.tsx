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

type ServiceCardDescriptor = {
  key: string;
  title: string;
  description: string;
  badge: string;
  accent: "active" | "pending" | "soon";
  action?: {
    label: string;
    href: string;
    variant: "primary" | "secondary";
  };
};

const accentClassMap: Record<ServiceCardDescriptor["accent"], string> = {
  active: "bg-emerald-400/15 text-emerald-200 ring-emerald-400/40",
  pending: "bg-yellow-400/10 text-yellow-200 ring-yellow-400/30",
  soon: "bg-slate-500/20 text-slate-200 ring-slate-500/40",
};

const actionClassMap: Record<NonNullable<ServiceCardDescriptor["action"]>["variant"], string> = {
  primary:
    "inline-flex items-center justify-center rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300",
  secondary:
    "inline-flex items-center justify-center rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-400",
};

const ServiceCard = ({ service }: { service: ServiceCardDescriptor }) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-left shadow-lg shadow-slate-950/30">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${accentClassMap[service.accent]}`}>
            {service.badge}
          </p>
          <h3 className="mt-4 text-xl font-semibold text-white">{service.title}</h3>
          <p className="mt-2 text-sm text-slate-300">{service.description}</p>
        </div>
        {service.action ? (
          <a href={service.action.href} className={actionClassMap[service.action.variant]}>
            {service.action.label}
          </a>
        ) : null}
      </div>
    </div>
  );
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

const AuthRedirectScreen: NextPage<AuthRedirectProps> = ({
  error,
  supportEmail,
  chatUrl,
  paymentUrl,
  ticket,
}) => {
  const supportHref = useMemo(() => `mailto:${supportEmail}`, [supportEmail]);
  const reasonCopy = ticket ? ACCESS_REASON_COPY[ticket.reason] : undefined;
  const lookupLabel = ticket?.user?.userId ?? ticket?.lookupId;
  const services = useMemo<ServiceCardDescriptor[]>(() => {
    const hasTicket = Boolean(ticket);
    const hasChatAccess = Boolean(ticket?.hasChatAccess);
    const hasSubscription = Boolean(ticket?.hasSubscription);

    return [
      {
        key: "chat",
        title: "GTC Chat Assistant",
        description:
          "Диалоговый интерфейс, который обрабатывает запросы по закупкам, сравнивает поставщиков и готовит ответы на ваши запросы.",
        badge: hasChatAccess
          ? "Доступ открыт"
          : hasTicket
            ? "Ожидает подписку"
            : "Требуется подтверждение",
        accent: hasChatAccess ? "active" : hasTicket ? "pending" : "soon",
        action: hasTicket
          ? {
              label: hasChatAccess ? "Перейти в чат" : "Оформить подписку",
              href: hasChatAccess ? chatUrl : paymentUrl,
              variant: hasChatAccess ? "primary" : "secondary",
            }
          : undefined,
      },
      {
        key: "insights",
        title: "Procurement Insights",
        description:
          "Персонализированные аналитические отчёты и уведомления о статусе поставщиков, которые появятся в подписке в ближайшее время.",
        badge: hasSubscription ? "Подготовка к запуску" : "Требуется подписка",
        accent: hasSubscription ? "soon" : "pending",
        action: hasSubscription
          ? {
              label: "Сообщить мне о запуске",
              href: supportHref,
              variant: "secondary",
            }
          : undefined,
      },
      {
        key: "api",
        title: "Integration API",
        description:
          "REST и webhook-интерфейсы для синхронизации данных закупок с ERP/CRM. Доступ появится после запуска интеграций.",
        badge: "Скоро",
        accent: "soon",
      },
    ];
  }, [ticket, chatUrl, paymentUrl, supportHref]);

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
        ) : (
          <div className="mt-6 space-y-6 text-left text-sm text-slate-300">
            <div className="space-y-3">
              <p>
                <strong>Chat:</strong> {chatUrl}
              </p>
              <p>
                <strong>Payment:</strong> {paymentUrl}
              </p>
            </div>
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-white">Сервисы, доступные вашему аккаунту</h2>
              <p className="text-xs text-slate-400">
                После авторизации мы открываем этот центр, чтобы вы могли увидеть продукты, включенные в подписку.
              </p>
              <div className="mt-4 space-y-4">
                {services.map((service) => (
                  <ServiceCard key={service.key} service={service} />
                ))}
              </div>
            </section>
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

export default AuthRedirectScreen;
