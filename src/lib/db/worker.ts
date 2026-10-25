/// <reference lib="webworker" />
import {
  clearMemories,
  decayMemories,
  deleteMemory,
  listMemories,
  patchMemory,
  putMemory,
  searchMemories,
} from "./repo";
import type { MemoryEntry } from "../../types";

export type DbOp =
  | "list"
  | "put"
  | "patch"
  | "delete"
  | "clear"
  | "search"
  | "decay";

export type DbRequest = { id: number; op: DbOp; payload?: unknown };
export type DbResponse = {
  id: number;
  ok: boolean;
  data?: unknown;
  error?: string;
};

const handlers: Record<DbOp, (payload: unknown) => Promise<unknown>> = {
  list: () => listMemories(),
  put: (p) => putMemory(p as MemoryEntry),
  patch: (p) => {
    const { id, patch } = p as { id: string; patch: Partial<MemoryEntry> };
    return patchMemory(id, patch);
  },
  delete: (p) => deleteMemory(p as string),
  clear: () => clearMemories(),
  search: (p) => searchMemories(p as string),
  decay: () => decayMemories(),
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
