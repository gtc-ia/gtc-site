import { getSubscriptionFromDatabase, type SubscriptionDatabaseRecord } from "./subscription-database";
import { getUserFromDatabase, type UserDatabaseRecord } from "./user-database";

export type AccessDecisionReason =
  | "direct_access"
  | "subscription"
  | "inactive_subscription"
  | "user_not_found";

export type AccessTicket = {
  lookupId: string;
  user?: UserDatabaseRecord;
  subscription?: SubscriptionDatabaseRecord;
  hasDirectAccess: boolean;
  hasSubscription: boolean;
  hasChatAccess: boolean;
  reason: AccessDecisionReason;
};

const isSubscriptionActive = (record: SubscriptionDatabaseRecord | undefined): record is SubscriptionDatabaseRecord => {
  return Boolean(record?.active);
};

const determineReason = (
  hasDirectAccess: boolean,
  subscriptionRecord: SubscriptionDatabaseRecord | undefined,
  userRecord: UserDatabaseRecord | undefined
): AccessDecisionReason => {
  if (hasDirectAccess) {
    return "direct_access";
  }

  if (isSubscriptionActive(subscriptionRecord)) {
    return "subscription";
  }

  if (userRecord || subscriptionRecord) {
    return "inactive_subscription";
  }

  return "user_not_found";
};

export const resolveAccessTicket = async (lookupId: string): Promise<AccessTicket> => {
  const trimmedLookupId = lookupId.trim();

  if (!trimmedLookupId) {
    return {
      lookupId,
      hasDirectAccess: false,
      hasSubscription: false,
      hasChatAccess: false,
      reason: "user_not_found",
    } satisfies AccessTicket;
  }

  const userRecord = await getUserFromDatabase(trimmedLookupId);

  let subscriptionRecord = await getSubscriptionFromDatabase(trimmedLookupId);

  if (!subscriptionRecord) {
    const gtcUserId = userRecord?.gtcUserId?.trim();

    if (gtcUserId && gtcUserId !== trimmedLookupId) {
      subscriptionRecord = await getSubscriptionFromDatabase(gtcUserId);
    }
  }

  const hasDirectAccess = Boolean(userRecord?.chatAccess);
  const hasSubscription = isSubscriptionActive(subscriptionRecord);
  const hasChatAccess = hasDirectAccess || hasSubscription;
  const reason = determineReason(hasDirectAccess, subscriptionRecord, userRecord);

  return {
    lookupId,
    user: userRecord,
    subscription: subscriptionRecord,
    hasDirectAccess,
    hasSubscription,
    hasChatAccess,
    reason,
  } satisfies AccessTicket;
};

export type ResolveRedirectOptions = {
  chatUrl: string;
  paymentBaseUrl: string;
};

export type RedirectDecision =
  | {
      type: "redirect";
      destination: string;
      ticket: AccessTicket;
    }
  | {
      type: "error";
      message: string;
      ticket: AccessTicket;
    };

const buildPaymentUrl = (baseUrl: string, userId: string) => {
  const trimmedBase = baseUrl.trim();
  const fallback = `https://pay.gtstor.com/payment.php?user_id=${encodeURIComponent(userId)}`;

  if (!trimmedBase) {
    return fallback;
  }

  const applyUserId = (url: URL) => {
    url.searchParams.set("user_id", userId);
    return url;
  };

  const isAbsolute = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmedBase);

  try {
    if (isAbsolute) {
      return applyUserId(new URL(trimmedBase)).toString();
    }

    const url = applyUserId(new URL(trimmedBase, "https://placeholder.local"));
    const pathname = url.pathname || "/";
    const search = url.search ?? "";
    const hash = url.hash ?? "";
    return `${pathname}${search}${hash}`;
  } catch {
    const [withoutHash, hashFragment = ""] = trimmedBase.split("#", 2);
    const [path, queryString = ""] = withoutHash.split("?", 2);
    const params = new URLSearchParams(queryString);
    params.set("user_id", userId);
    const query = params.toString();
    const hash = hashFragment ? `#${hashFragment}` : "";
    return `${path}${query ? `?${query}` : ""}${hash}` || fallback;
  }
};

export const resolveRedirectDecision = async (
  lookupId: string,
  options: ResolveRedirectOptions
): Promise<RedirectDecision> => {
  const ticket = await resolveAccessTicket(lookupId);

  if (ticket.hasChatAccess) {
    return {
      type: "redirect",
      destination: options.chatUrl,
      ticket,
    };
  }

  const fallbackUserId = ticket.user?.userId ?? ticket.subscription?.userId ?? lookupId;
  const target = buildPaymentUrl(options.paymentBaseUrl, fallbackUserId);

  return {
    type: "redirect",
    destination: target,
    ticket,
  };
};
