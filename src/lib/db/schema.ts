import Dexie, { type Table } from "dexie";
import type { MemoryEntry } from "../../types";

/**
 * 本地优先：IndexedDB 是这份记忆唯一的事实来源，没有后端。
 * 必须接受：它按设备存储、不跨设备同步；同用户名下的多个 Pages 项目
 * 共享同一 origin，所以库名与表前缀都带 co-space 命名空间。
 */
export class CoSpaceDB extends Dexie {
  memories!: Table<MemoryEntry, string>;

  constructor() {
    super("co-space::v1");
    this.version(1).stores({
      memories: "id, createdAt, updatedAt, source, weight, pinned, sealed",
    });
  }
}

export const db = new CoSpaceDB();
