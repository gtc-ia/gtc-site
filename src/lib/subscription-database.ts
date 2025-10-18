import { promises as fs } from "node:fs";
import path from "node:path";

export type SubscriptionDatabaseRecord = {
  userId: string;
  gtcUserId?: string | null;
  status?: string | null;
  active: boolean;
  planName?: string | null;
  expiresAt?: string | null;
};

type RawSubscriptionRecord = {
  userId?: string | number | null;
  gtcUserId?: string | number | null;
  status?: string | null;
  active?: boolean | number | string | null;
  planName?: string | null;
  plan_name?: string | null;
  expiresAt?: string | null;
  expires_at?: string | null;
  endDate?: string | null;
  end_date?: string | null;
};

type SubscriptionDatabaseShape =
  | RawSubscriptionRecord[]
  | {
      subscriptions?: RawSubscriptionRecord[];
    };

type SubscriptionDatabaseCache = {
  path: string;
  mtimeMs: number;
  byUserId: Map<string, SubscriptionDatabaseRecord>;
  byGtcId: Map<string, SubscriptionDatabaseRecord>;
};

const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "subscriptions.json");

let cache: SubscriptionDatabaseCache | null = null;

const resolveDatabasePath = () => process.env.SUBSCRIPTION_DB_PATH ?? DEFAULT_DB_PATH;

const normalizeBoolean = (value: boolean | number | string | null | undefined): boolean | undefined => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "yes", "active"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "no", "inactive", "ended"].includes(normalized)) {
      return false;
    }
  }

  return undefined;
};

const computeExpiresAt = (record: RawSubscriptionRecord): string | null => {
  const candidate =
    record.expiresAt ??
    record.expires_at ??
    record.endDate ??
    record.end_date ??
    null;

  if (typeof candidate !== "string") {
    return null;
  }

  const trimmed = candidate.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const computePlanName = (record: RawSubscriptionRecord): string | null => {
  const candidate = record.planName ?? record.plan_name ?? null;

  if (typeof candidate !== "string") {
    return null;
  }

  const trimmed = candidate.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const computeStatus = (record: RawSubscriptionRecord): string | null => {
  if (typeof record.status !== "string") {
    return null;
  }

  const trimmed = record.status.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const computeActiveFlag = (record: RawSubscriptionRecord): boolean => {
  const explicitActive = normalizeBoolean(record.active ?? null);

  if (explicitActive !== undefined) {
    return explicitActive;
  }

  const status = computeStatus(record);

  if (status) {
    const normalizedStatus = status.toLowerCase();

    const activeStatuses = new Set(["active", "trialing", "grace", "grace_period"]);
    if (activeStatuses.has(normalizedStatus)) {
      const expiresAt = computeExpiresAt(record);

      if (!expiresAt) {
        return true;
      }

      const expiresAtTime = Date.parse(expiresAt);

      if (!Number.isNaN(expiresAtTime)) {
        return expiresAtTime > Date.now();
      }

      return true;
    }

    const inactiveStatuses = new Set(["canceled", "cancelled", "past_due", "inactive"]);
    if (inactiveStatuses.has(normalizedStatus)) {
      return false;
    }
  }

  const expiresAt = computeExpiresAt(record);

  if (expiresAt) {
    const expiresAtTime = Date.parse(expiresAt);

    if (!Number.isNaN(expiresAtTime)) {
      return expiresAtTime > Date.now();
    }
  }

  return false;
};

const parseDatabaseContents = (contents: string): SubscriptionDatabaseRecord[] => {
  const parsed = JSON.parse(contents) as SubscriptionDatabaseShape;

  const records = Array.isArray(parsed) ? parsed : parsed.subscriptions;

  if (!Array.isArray(records)) {
    return [];
  }

  const normalized: SubscriptionDatabaseRecord[] = [];

  for (const record of records) {
    const userIdCandidate = record.userId ?? record.gtcUserId ?? "";
    const userId = String(userIdCandidate ?? "").trim();

    if (!userId) {
      continue;
    }

    const gtcIdRaw = record.gtcUserId;
    const gtcUserId = gtcIdRaw === undefined || gtcIdRaw === null ? null : String(gtcIdRaw).trim() || null;

    const expiresAt = computeExpiresAt(record);
    const planName = computePlanName(record);
    const status = computeStatus(record);

    normalized.push({
      userId,
      gtcUserId,
      status,
      active: computeActiveFlag(record),
      planName,
      expiresAt,
    });
  }

  return normalized;
};

const readDatabaseRecords = async (filePath: string): Promise<SubscriptionDatabaseCache> => {
  try {
    const stats = await fs.stat(filePath);

    if (cache && cache.path === filePath && cache.mtimeMs === stats.mtimeMs) {
      return cache;
    }

    const contents = await fs.readFile(filePath, "utf-8");
    const parsedRecords = parseDatabaseContents(contents);

    const byUserId = new Map<string, SubscriptionDatabaseRecord>();
    const byGtcId = new Map<string, SubscriptionDatabaseRecord>();

    for (const record of parsedRecords) {
      byUserId.set(record.userId, record);

      if (record.gtcUserId) {
        byGtcId.set(record.gtcUserId, record);
      }
    }

    cache = {
      path: filePath,
      mtimeMs: stats.mtimeMs,
      byUserId,
      byGtcId,
    };

    return cache;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      cache = null;
      return {
        path: filePath,
        mtimeMs: 0,
        byUserId: new Map(),
        byGtcId: new Map(),
      };
    }

    throw error;
  }
};

export const getSubscriptionFromDatabase = async (
  userId: string,
  options: { gtcUserId?: string | null } = {}
): Promise<SubscriptionDatabaseRecord | undefined> => {
  const trimmedId = userId.trim();

  if (!trimmedId) {
    return undefined;
  }

  try {
    const dbPath = resolveDatabasePath();
    const records = await readDatabaseRecords(dbPath);

    const directMatch = records.byUserId.get(trimmedId);
    if (directMatch) {
      return directMatch;
    }

    if (options.gtcUserId) {
      const gtcMatch = records.byGtcId.get(options.gtcUserId.trim());
      if (gtcMatch) {
        return gtcMatch;
      }
    }

    return records.byGtcId.get(trimmedId);
  } catch (error) {
    console.error("Failed to read subscription database", error);
    return undefined;
  }
};

export const clearSubscriptionDatabaseCache = () => {
  cache = null;
};
