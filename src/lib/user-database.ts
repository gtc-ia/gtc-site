import { promises as fs } from "node:fs";
import path from "node:path";

export type UserDatabaseRecord = {
  userId: string;
  gtcUserId?: string | null;
  providers: string[];
  chatAccess?: boolean;
};

type RawUserRecord = {
  userId?: string | number | null;
  gtcUserId?: string | number | null;
  providers?: unknown;
  chatAccess?: boolean | number | string | null;
  chat_access?: boolean | number | string | null;
};

type UserDatabaseShape =
  | RawUserRecord[]
  | {
      users?: RawUserRecord[];
    };

type UserDatabaseCache = {
  path: string;
  mtimeMs: number;
  byUserId: Map<string, UserDatabaseRecord>;
  byGtcId: Map<string, UserDatabaseRecord>;
};

const DEFAULT_USER_DB_PATH = path.join(process.cwd(), "data", "users.json");

let cache: UserDatabaseCache | null = null;

const resolveUserDatabasePath = () => process.env.USER_DB_PATH ?? DEFAULT_USER_DB_PATH;

const normalizeBoolean = (value: boolean | number | string | null | undefined): boolean | undefined => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y", "enabled"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "no", "n", "disabled"].includes(normalized)) {
      return false;
    }
  }

  return undefined;
};

const parseUserProviders = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter((entry) => entry.length > 0);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return [];
    }

    return trimmed
      .split(/[,;]+/)
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  return [];
};

const parseDatabaseContents = (contents: string): UserDatabaseRecord[] => {
  const parsed = JSON.parse(contents) as UserDatabaseShape;
  const records = Array.isArray(parsed) ? parsed : parsed.users;

  if (!Array.isArray(records)) {
    return [];
  }

  const normalized: UserDatabaseRecord[] = [];

  for (const record of records) {
    const idCandidate = record.userId ?? record.gtcUserId ?? "";
    const userId = String(idCandidate ?? "").trim();

    if (!userId) {
      continue;
    }

    const gtcRaw = record.gtcUserId;
    const gtcUserId = gtcRaw === undefined || gtcRaw === null ? null : String(gtcRaw).trim() || null;
    const providers = parseUserProviders(record.providers);
    const chatAccess = normalizeBoolean(record.chatAccess ?? record.chat_access ?? null);

    normalized.push({
      userId,
      gtcUserId,
      providers,
      chatAccess: chatAccess ?? undefined,
    });
  }

  return normalized;
};

const readUserRecords = async (filePath: string): Promise<UserDatabaseCache> => {
  try {
    const stats = await fs.stat(filePath);

    if (cache && cache.path === filePath && cache.mtimeMs === stats.mtimeMs) {
      return cache;
    }

    const contents = await fs.readFile(filePath, "utf-8");
    const parsedRecords = parseDatabaseContents(contents);

    const byUserId = new Map<string, UserDatabaseRecord>();
    const byGtcId = new Map<string, UserDatabaseRecord>();

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

export const getUserFromDatabase = async (
  identifier: string
): Promise<UserDatabaseRecord | undefined> => {
  const trimmed = identifier.trim();

  if (!trimmed) {
    return undefined;
  }

  try {
    const dbPath = resolveUserDatabasePath();
    const records = await readUserRecords(dbPath);

    const directMatch = records.byUserId.get(trimmed);
    if (directMatch) {
      return directMatch;
    }

    return records.byGtcId.get(trimmed);
  } catch (error) {
    console.error("Failed to read user database", error);
    return undefined;
  }
};

export const clearUserDatabaseCache = () => {
  cache = null;
};
