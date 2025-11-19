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

  const subscriptionRecord = await getSubscriptionFromDatabase(trimmedLookupId, {
    gtcUserId: userRecord?.gtcUserId ?? null,
  });

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

export const buildPaymentUrl = (baseUrl: string, userId: string) => {
  const hasQuery = baseUrl.includes("?");
  const separator = hasQuery ? "&" : "?";
  return `${baseUrl}${separator}user_id=${encodeURIComponent(userId)}`;
};

export const resolveRedirectDecision = async (
  lookupId: string,
  options: ResolveRedirectOptions
): Promise<RedirectDecision> => {
  const ticket = await resolveAccessTicket(lookupId);

  return {
    type: "redirect",
    destination: options.chatUrl,
    ticket,
  };
};
