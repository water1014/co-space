import { db } from "./schema";

export const BACKUP_FORMAT = "jinghua-shuiyue-backup";
export const BACKUP_VERSION = 1;

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
type EncodedBlob = { __coSpaceBlob: true; mimeType: string; data: string };
type BackupEnvelope = {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  createdAt: number;
  app: string;
  localStorage: Record<string, string>;
  tables: Record<string, unknown[]>;
};

const TABLE_NAMES = [
  "memories", "echoes", "imprints", "owners", "companions",
  "personaRevisions", "relationships", "relationshipMilestones",
  "chatSessions", "chatMessages", "memoryLinks", "journals",
  "mediaAssets", "albums", "albumItems", "migrations", "settings",
] as const;

const SENSITIVE_KEY_PARTS = ["sessionkey", "apikey", "api_key", "authorization", "secret", "token"];

export type BackupInspection = {
  valid: boolean;
  version?: number;
  createdAt?: number;
  localStorageKeys: number;
  tableCounts: Record<string, number>;
  errors: string[];
};

/** Export app-owned browser storage. Credentials are excluded even if a future store accidentally persists one. */
export async function createBackup(): Promise<BackupEnvelope> {
  const localStorage: Record<string, string> = {};
  if (typeof window !== "undefined") {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith("co-space::") || isSensitiveKey(key)) continue;
      const value = window.localStorage.getItem(key);
      if (value !== null) localStorage[key] = value;
    }
  }

  const tables: Record<string, unknown[]> = {};
  for (const name of TABLE_NAMES) {
    const rows = await db.table(name).toArray();
    tables[name] = await Promise.all(rows.map(encodeRecord));
  }

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: Date.now(),
    app: "镜花水月",
    localStorage,
    tables,
  };
}

/** Convert IndexedDB Blob fields into JSON-safe base64 records. */
async function encodeRecord(value: unknown): Promise<unknown> {
  if (typeof Blob !== "undefined" && value instanceof Blob) {
    return { __coSpaceBlob: true, mimeType: value.type, data: await blobToBase64(value) } satisfies EncodedBlob;
  }
  if (Array.isArray(value)) return Promise.all(value.map(encodeRecord));
  if (isObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) out[key] = await encodeRecord(child);
    return out;
  }
  return value;
}

async function decodeRecord(value: unknown): Promise<unknown> {
  if (isObject(value) && value.__coSpaceBlob === true && typeof value.data === "string") {
    return base64ToBlob(value.data, typeof value.mimeType === "string" ? value.mimeType : "application/octet-stream");
  }
  if (Array.isArray(value)) return Promise.all(value.map(decodeRecord));
  if (isObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) out[key] = await decodeRecord(child);
    return out;
  }
  return value;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read media blob"));
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(data: string, mimeType: string): Blob {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

export function inspectBackup(input: unknown): BackupInspection {
  const errors: string[] = [];
  if (!isObject(input)) {
    return { valid: false, localStorageKeys: 0, tableCounts: {}, errors: ["备份文件不是有效对象"] };
  }
  if (input.format !== BACKUP_FORMAT) errors.push("文件格式不匹配");
  if (input.version !== BACKUP_VERSION) errors.push("暂不支持此备份版本");
  if (!isObject(input.localStorage)) errors.push("缺少本地设置数据");
  if (!isObject(input.tables)) errors.push("缺少数据库表数据");

  const tableCounts: Record<string, number> = {};
  if (isObject(input.tables)) {
    for (const [name, rows] of Object.entries(input.tables)) {
      if (!(TABLE_NAMES as readonly string[]).includes(name)) errors.push(`未知数据表：${name}`);
      else if (!Array.isArray(rows)) errors.push(`数据表 ${name} 格式错误`);
      else tableCounts[name] = rows.length;
    }
  }

  if (isObject(input.localStorage)) {
    for (const key of Object.keys(input.localStorage)) {
      if (!key.startsWith("co-space::")) errors.push(`不允许导入的设置项：${key}`);
      if (isSensitiveKey(key)) errors.push(`备份包含疑似凭据字段：${key}`);
      if (typeof input.localStorage[key] !== "string") errors.push(`设置项格式错误：${key}`);
    }
  }

  return {
    valid: errors.length === 0,
    version: typeof input.version === "number" ? input.version : undefined,
    createdAt: typeof input.createdAt === "number" ? input.createdAt : undefined,
    localStorageKeys: isObject(input.localStorage) ? Object.keys(input.localStorage).length : 0,
    tableCounts,
    errors,
  };
}

/**
 * Safe merge restore: never clears existing records or overwrites an existing ID.
 * Validate and decode everything before the first write. This is intentionally
 * additive; a destructive "replace all" restore needs a separate explicit flow.
 */
export async function restoreBackup(input: unknown): Promise<{ inserted: Record<string, number>; settingsAdded: number }> {
  const inspection = inspectBackup(input);
  if (!inspection.valid || !isObject(input) || !isObject(input.tables) || !isObject(input.localStorage)) {
    throw new Error(inspection.errors.join("；") || "备份文件无效");
  }

  const decoded: Record<string, unknown[]> = {};
  for (const name of TABLE_NAMES) {
    const rows = input.tables[name];
    if (Array.isArray(rows)) decoded[name] = await Promise.all(rows.map(decodeRecord));
  }

  // Ensure every row is an object before opening the write transaction.
  for (const [name, rows] of Object.entries(decoded)) {
    if (!rows.every(isObject)) throw new Error(`数据表 ${name} 中存在无效记录`);
  }

  const inserted: Record<string, number> = {};
  await db.transaction("rw", ...TABLE_NAMES.map((name) => db.table(name)), async () => {
    for (const name of TABLE_NAMES) {
      const table = db.table(name);
      const rows = decoded[name] ?? [];
      const existing = new Set(await table.toCollection().primaryKeys());
      const keyPath = table.schema.primKey.keyPath;
      const fresh = rows.filter((row) => {
        const key = isObject(row) && typeof keyPath === "string" ? row[keyPath] : undefined;
        return key !== undefined && !existing.has(key as never);
      });
      if (fresh.length) await table.bulkAdd(fresh);
      inserted[name] = fresh.length;
    }
  });

  let settingsAdded = 0;
  for (const [key, raw] of Object.entries(input.localStorage)) {
    if (window.localStorage.getItem(key) === null) {
      window.localStorage.setItem(key, raw);
      settingsAdded += 1;
    }
  }
  return { inserted, settingsAdded };
}

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_KEY_PARTS.some((part) => lower.includes(part));
}

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
