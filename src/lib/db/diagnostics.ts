import { db } from "./schema";

export type LocalStorageKeyReport = {
  key: string;
  bytes: number;
  /** Number of entries in a known top-level array; never includes record content. */
  itemCount?: number;
  parseable: boolean;
};

export type IndexedDbReport = {
  database: string;
  tables: Array<{ name: string; count: number | null }>;
  available: boolean;
  error?: string;
};

export type StorageDiagnostics = {
  generatedAt: number;
  localStorage: {
    available: boolean;
    keys: LocalStorageKeyReport[];
    totalBytes: number;
    error?: string;
  };
  indexedDb: IndexedDbReport;
  browserStorage?: {
    usageBytes?: number;
    quotaBytes?: number;
  };
};

/**
 * Read-only inventory of this app's local data.
 *
 * Privacy: reports key names, approximate byte sizes and collection counts only.
 * It deliberately does not return values, message text, diary content, photo data,
 * API credentials, or any other record payload.
 *
 * This function never writes, migrates, deletes, or clears user data.
 */
export async function inspectLocalData(): Promise<StorageDiagnostics> {
  const local = inspectLocalStorage();
  const indexedDb = await inspectIndexedDb();

  let browserStorage: StorageDiagnostics["browserStorage"];
  try {
    if (typeof navigator !== "undefined" && navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate();
      browserStorage = {
        usageBytes: estimate.usage,
        quotaBytes: estimate.quota,
      };
    }
  } catch {
    // Storage estimates are optional and may be unavailable in private contexts.
  }

  return {
    generatedAt: Date.now(),
    localStorage: local,
    indexedDb,
    ...(browserStorage ? { browserStorage } : {}),
  };
}

function inspectLocalStorage(): StorageDiagnostics["localStorage"] {
  if (typeof window === "undefined" || !window.localStorage) {
    return {
      available: false,
      keys: [],
      totalBytes: 0,
      error: "localStorage unavailable in this environment",
    };
  }

  try {
    const keys: LocalStorageKeyReport[] = [];
    let totalBytes = 0;

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key || !key.startsWith("co-space::")) continue;

      const raw = window.localStorage.getItem(key) ?? "";
      // UTF-8 estimate includes key and serialized value. The value itself is
      // never copied into the returned report.
      const bytes = new TextEncoder().encode(key + raw).byteLength;
      totalBytes += bytes;

      let itemCount: number | undefined;
      let parseable = false;
      try {
        const parsed: unknown = JSON.parse(raw);
        parseable = true;
        if (isRecord(parsed)) {
          const state = isRecord(parsed.state) ? parsed.state : parsed;
          const arrays = Object.values(state).filter(Array.isArray);
          if (arrays.length === 1) itemCount = arrays[0].length;
        }
      } catch {
        // Keep an inventory row even if an old value is malformed.
      }

      keys.push({
        key,
        bytes,
        ...(itemCount !== undefined ? { itemCount } : {}),
        parseable,
      });
    }

    return {
      available: true,
      keys: keys.sort((a, b) => a.key.localeCompare(b.key)),
      totalBytes,
    };
  } catch (error) {
    return {
      available: false,
      keys: [],
      totalBytes: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function inspectIndexedDb(): Promise<IndexedDbReport> {
  try {
    const tables = await Promise.all(
      db.tables.map(async (table) => {
        try {
          return { name: table.name, count: await table.count() };
        } catch {
          return { name: table.name, count: null };
        }
      }),
    );
    return {
      database: db.name,
      tables,
      available: true,
    };
  } catch (error) {
    return {
      database: db.name,
      tables: [],
      available: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
