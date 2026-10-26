import type { DbOp, DbRequest, DbResponse } from "./worker";
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

/**
 * 主线程只拿一个异步门面，真正的 IndexedDB 读写发生在 Worker 里，
 * 避免记忆多起来之后阻塞输入与动画。
 * Worker 不可用（部分隐私模式）时退回主线程直连，功能不丢。
 */
class DbClient {
  private worker: Worker | null = null;
  private seq = 0;
  private pending = new Map<
    number,
    { resolve: (v: unknown) => void; reject: (e: Error) => void }
  >();

  constructor() {
    try {
      this.worker = new Worker(new URL("./worker.ts", import.meta.url), {
        type: "module",
      });
      this.worker.addEventListener("message", (e: MessageEvent<DbResponse>) => {
        const entry = this.pending.get(e.data.id);
        if (!entry) return;
        this.pending.delete(e.data.id);
        if (e.data.ok) entry.resolve(e.data.data);
        else entry.reject(new Error(e.data.error ?? "db error"));
      });
      this.worker.addEventListener("error", (e) => {
        console.warn("[db] worker error, falling back", e.message);
        this.fallback();
      });
    } catch {
      this.fallback();
    }
  }

  private fallback() {
    this.worker?.terminate();
    this.worker = null;
    for (const [, p] of this.pending) p.reject(new Error("db worker unavailable"));
    this.pending.clear();
  }

  private call<T>(op: DbOp, payload?: unknown): Promise<T> {
    if (!this.worker) return this.direct(op, payload) as Promise<T>;
    const id = ++this.seq;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve: resolve as (v: unknown) => void,
        reject,
      });
      this.worker!.postMessage({ id, op, payload } satisfies DbRequest);
    });
  }

  private async direct(op: DbOp, payload?: unknown): Promise<unknown> {
    switch (op) {
      case "memory:list":
        return listMemories();
      case "memory:put":
        return putMemory(payload as MemoryEntry);
      case "memory:patch": {
        const { id, patch } = payload as {
          id: string;
          patch: Partial<MemoryEntry>;
        };
        return patchMemory(id, patch);
      }
      case "memory:delete":
        return deleteMemory(payload as string);
      case "memory:search":
        return searchMemories(payload as string);
      case "memory:decay":
        return decayMemories();
      case "echo:list":
        return listEchoes();
      case "echo:put":
        return putEcho(payload as Echo);
      case "imprint:list":
        return listImprints();
      case "imprint:put":
        return putImprint(payload as Imprint);
      case "imprint:delete":
        return deleteImprint(payload as string);
      case "all:clear":
        return clearAll();
      default:
        throw new Error(`unknown op: ${op}`);
    }
  }

  listMemories() {
    return this.call<MemoryEntry[]>("memory:list");
  }
  putMemory(entry: MemoryEntry) {
    return this.call<MemoryEntry>("memory:put", entry);
  }
  patchMemory(id: string, patch: Partial<MemoryEntry>) {
    return this.call<MemoryEntry | null>("memory:patch", { id, patch });
  }
  deleteMemory(id: string) {
    return this.call<void>("memory:delete", id);
  }
  searchMemories(q: string) {
    return this.call<MemoryEntry[]>("memory:search", q);
  }
  decayMemories() {
    return this.call<MemoryEntry[]>("memory:decay");
  }
  listEchoes() {
    return this.call<Echo[]>("echo:list");
  }
  putEcho(echo: Echo) {
    return this.call<Echo>("echo:put", echo);
  }
  listImprints() {
    return this.call<Imprint[]>("imprint:list");
  }
  putImprint(imprint: Imprint) {
    return this.call<Imprint>("imprint:put", imprint);
  }
  deleteImprint(id: string) {
    return this.call<void>("imprint:delete", id);
  }
  clearAll() {
    return this.call<void>("all:clear");
  }
}

export const dbClient = new DbClient();
