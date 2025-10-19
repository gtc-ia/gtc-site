import { resolveAccessTicket } from "./access-gateway";

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

const getStaticSubscription = (userId: string): SubscriptionStatus | undefined => {
  const status = STATIC_SUBSCRIPTIONS[userId];

  if (!status) {
    return undefined;
  }

  return { ...status };
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

  if (!endpoint) {
    return null;
  }

  const url = new URL(endpoint);

  if (!url.searchParams.has("user_id")) {
    url.searchParams.set("user_id", userId);
  }

  return url;
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

  const accessTicket = await resolveAccessTicket(trimmedUserId);

  if (accessTicket.reason !== "user_not_found") {
    return {
      active: accessTicket.hasChatAccess,
      planName: accessTicket.subscription?.planName ?? null,
      expiresAt: accessTicket.subscription?.expiresAt ?? null,
      raw: accessTicket,
    } satisfies SubscriptionStatus;
  }

  const staticStatus = getStaticSubscription(trimmedUserId);
  if (staticStatus) {
    return staticStatus;
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
