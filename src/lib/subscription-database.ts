import { promises as fs } from "node:fs";
import path from "node:path";

export type SubscriptionDatabaseRecord = {
  userId: string;
  active: boolean;
  planName?: string | null;
  expiresAt?: string | null;
};

type SubscriptionDatabaseShape =
  | SubscriptionDatabaseRecord[]
  | {
      subscriptions?: SubscriptionDatabaseRecord[];
    };

type SubscriptionDatabaseCache = {
  path: string;
  mtimeMs: number;
  records: Map<string, SubscriptionDatabaseRecord>;
};

const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "subscriptions.json");

let cache: SubscriptionDatabaseCache | null = null;

const resolveDatabasePath = () => process.env.SUBSCRIPTION_DB_PATH ?? DEFAULT_DB_PATH;

const parseDatabaseContents = (contents: string): SubscriptionDatabaseRecord[] => {
  const parsed = JSON.parse(contents) as SubscriptionDatabaseShape;

  const records = Array.isArray(parsed) ? parsed : parsed.subscriptions;

  if (!Array.isArray(records)) {
    return [];
  }

  return records
    .map((record) => ({
      userId: String(record.userId ?? "").trim(),
      active: Boolean(record.active),
      planName: record.planName ?? null,
      expiresAt: record.expiresAt ?? null,
    }))
    .filter((record) => record.userId.length > 0);
};

const readDatabaseRecords = async (filePath: string): Promise<Map<string, SubscriptionDatabaseRecord>> => {
  try {
    const stats = await fs.stat(filePath);

    if (cache && cache.path === filePath && cache.mtimeMs === stats.mtimeMs) {
      return cache.records;
    }

    const contents = await fs.readFile(filePath, "utf-8");
    const parsedRecords = parseDatabaseContents(contents);

    const map = new Map<string, SubscriptionDatabaseRecord>();
    for (const record of parsedRecords) {
      map.set(record.userId, record);
    }

    cache = {
      path: filePath,
      mtimeMs: stats.mtimeMs,
      records: map,
    };

    return map;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      cache = null;
      return new Map();
    }

    throw error;
  }
};

export const getSubscriptionFromDatabase = async (
  userId: string
): Promise<SubscriptionDatabaseRecord | undefined> => {
  const trimmedId = userId.trim();

  if (!trimmedId) {
    return undefined;
  }

  try {
    const dbPath = resolveDatabasePath();
    const records = await readDatabaseRecords(dbPath);

    return records.get(trimmedId);
  } catch (error) {
    console.error("Failed to read subscription database", error);
    return undefined;
  }
};

export const clearSubscriptionDatabaseCache = () => {
  cache = null;
};
