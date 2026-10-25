import type { DbOp, DbRequest, DbResponse } from "./worker";
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

/**
 * 主线程只拿一个异步门面，真正的 IndexedDB 读写发生在 Worker 里，
 * 避免记忆多起来之后阻塞输入与粒子动画。
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
      case "list":
        return listMemories();
      case "put":
        return putMemory(payload as MemoryEntry);
      case "patch": {
        const { id, patch } = payload as {
          id: string;
          patch: Partial<MemoryEntry>;
        };
        return patchMemory(id, patch);
      }
      case "delete":
        return deleteMemory(payload as string);
      case "clear":
        return clearMemories();
      case "search":
        return searchMemories(payload as string);
      case "decay":
        return decayMemories();
      default:
        throw new Error(`unknown op: ${op}`);
    }
  }

  list() {
    return this.call<MemoryEntry[]>("list");
  }
  put(entry: MemoryEntry) {
    return this.call<MemoryEntry>("put", entry);
  }
  patch(id: string, patch: Partial<MemoryEntry>) {
    return this.call<MemoryEntry | null>("patch", { id, patch });
  }
  remove(id: string) {
    return this.call<void>("delete", id);
  }
  clear() {
    return this.call<void>("clear");
  }
  search(q: string) {
    return this.call<MemoryEntry[]>("search", q);
  }
  decay() {
    return this.call<MemoryEntry[]>("decay");
  }
}

export const dbClient = new DbClient();
