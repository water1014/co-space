/// <reference lib="webworker" />
import {
  clearAll,
  decayMemories,
  deleteImprint,
  deleteMemory,
  listEchoes,
  listImprints,
  listMemories,
  patchMemory,
  putEcho,
  putImprint,
  putMemory,
  searchMemories,
} from "./repo";
import type { Echo, Imprint, MemoryEntry } from "../../types";

export type DbOp =
  | "memory:list"
  | "memory:put"
  | "memory:patch"
  | "memory:delete"
  | "memory:search"
  | "memory:decay"
  | "echo:list"
  | "echo:put"
  | "imprint:list"
  | "imprint:put"
  | "imprint:delete"
  | "all:clear";

export type DbRequest = { id: number; op: DbOp; payload?: unknown };
export type DbResponse = {
  id: number;
  ok: boolean;
  data?: unknown;
  error?: string;
};

const handlers: Record<DbOp, (payload: unknown) => Promise<unknown>> = {
  "memory:list": () => listMemories(),
  "memory:put": (p) => putMemory(p as MemoryEntry),
  "memory:patch": (p) => {
    const { id, patch } = p as { id: string; patch: Partial<MemoryEntry> };
    return patchMemory(id, patch);
  },
  "memory:delete": (p) => deleteMemory(p as string),
  "memory:search": (p) => searchMemories(p as string),
  "memory:decay": () => decayMemories(),
  "echo:list": () => listEchoes(),
  "echo:put": (p) => putEcho(p as Echo),
  "imprint:list": () => listImprints(),
  "imprint:put": (p) => putImprint(p as Imprint),
  "imprint:delete": (p) => deleteImprint(p as string),
  "all:clear": () => clearAll(),
};

self.addEventListener("message", async (event: MessageEvent<DbRequest>) => {
  const { id, op, payload } = event.data;
  const handler = handlers[op];
  if (!handler) {
    self.postMessage({ id, ok: false, error: `unknown op: ${op}` } satisfies DbResponse);
    return;
  }
  try {
    const data = await handler(payload);
    self.postMessage({ id, ok: true, data } satisfies DbResponse);
  } catch (err) {
    self.postMessage({
      id,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    } satisfies DbResponse);
  }
});
