import { getSubscriptionFromDatabase } from "./subscription-database";
import { getUserFromDatabase } from "./user-database";

export interface SubscriptionStatus {
  active: boolean;
  expiresAt?: string | null;
  planName?: string | null;
  raw?: unknown;
}

const STATIC_SUBSCRIPTIONS: Record<string, SubscriptionStatus> = {
  "3001": {
    active: true,
    expiresAt: "2099-12-31T23:59:59Z",
    planName: "default",
  },
};

const normalizeStatusString = (value: string): boolean | undefined => {
  switch (value) {
    case "trial":
    case "trialing":
    case "active":
      return true;
    case "canceled":
    case "cancelled":
    case "unpaid":
    case "incomplete":
    case "incomplete_expired":
      return false;
    default:
      return undefined;
  }
};

const normalizeBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    const normalizedStatus = normalizeStatusString(normalized);

    if (normalizedStatus !== undefined) {
      return normalizedStatus;
    }

    if (["1", "true", "yes", "active"].includes(normalized)) {
      return true;
    }

    if (["0", "false", "no", "inactive"].includes(normalized)) {
      return false;
    }
  }

  return undefined;
};

const extractActiveFromPayload = (payload: Record<string, unknown>): boolean | undefined => {
  const candidateKeys = [
    "active",
    "isActive",
    "subscription_active",
    "hasSubscription",
    "subscription",
    "status",
  ];

  for (const key of candidateKeys) {
    if (key in payload) {
      const value = normalizeBoolean(payload[key]);
      if (value !== undefined) {
        return value;
      }
    }
  }

  return undefined;
};

const parseEndpoint = (userId: string): URL | null => {
  const endpoint = process.env.SUBSCRIPTION_STATUS_ENDPOINT;

  if (!endpoint || endpoint === "undefined") {
    return null;
  }

  try {
    const url = new URL(endpoint);

    if (!url.searchParams.has("user_id")) {
      url.searchParams.set("user_id", userId);
    }

    return url;
  } catch (error) {
    console.warn("Ignoring invalid SUBSCRIPTION_STATUS_ENDPOINT", error);
    return null;
  }
};

const lookupSubscriptionFromDatabase = async (
  userId: string
): Promise<SubscriptionStatus | undefined> => {
  const userRecord = await getUserFromDatabase(userId);

  const subscriptionRecord = await getSubscriptionFromDatabase(userId, {
    gtcUserId: userRecord?.gtcUserId ?? null,
    aliases: userRecord
      ? [userRecord.userId, userRecord.gtcUserId].filter(Boolean)
      : undefined,
  });

  if (!subscriptionRecord) {
    return undefined;
  }

  return {
    active: Boolean(subscriptionRecord.active),
    planName: subscriptionRecord.planName ?? null,
    expiresAt: subscriptionRecord.expiresAt ?? null,
  };
};

const getEnvironmentOverride = (userId: string): SubscriptionStatus | undefined => {
  const envList = process.env.SUBSCRIBED_USER_IDS;

  if (!envList) {
    return undefined;
  }

  const ids = envList
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (ids.includes(userId)) {
    return {
      active: true,
      planName: process.env.SUBSCRIBED_PLAN_NAME ?? null,
      expiresAt: process.env.SUBSCRIBED_EXPIRES_AT ?? null,
    };
  }

  return undefined;
};

export const fetchSubscriptionStatus = async (userId: string): Promise<SubscriptionStatus> => {
  const trimmedUserId = userId.trim();

  if (!trimmedUserId) {
    throw new Error("User id is required to check subscription status");
  }

  const override = getEnvironmentOverride(trimmedUserId);
  if (override) {
    return { ...override };
  }

  const endpointUrl = parseEndpoint(trimmedUserId);

  if (endpointUrl) {
    const response = await fetch(endpointUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to query subscription API: ${response.status}`);
    }

    const payload = (await response.json()) as Record<string, unknown>;
    const activeFlag = extractActiveFromPayload(payload);

    if (typeof activeFlag === "boolean") {
      return {
        active: activeFlag,
        raw: payload,
        expiresAt: typeof payload.expiresAt === "string" ? payload.expiresAt : null,
        planName: typeof payload.planName === "string" ? payload.planName : null,
      };
    }

    throw new Error("Subscription API response did not contain a recognizable active flag");
  }

  const databaseStatus = await lookupSubscriptionFromDatabase(trimmedUserId);
  if (databaseStatus) {
    return databaseStatus;
  }

  if (STATIC_SUBSCRIPTIONS[trimmedUserId]) {
    return { ...STATIC_SUBSCRIPTIONS[trimmedUserId] };
  }

  return {
    active: false,
    planName: null,
    expiresAt: null,
  };
};

export const hasActiveSubscription = async (userId: string): Promise<boolean> => {
  const status = await fetchSubscriptionStatus(userId);
  return Boolean(status.active);
};
