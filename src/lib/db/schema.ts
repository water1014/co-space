import Dexie, { type Table } from "dexie";
import type { Echo, Imprint, MemoryEntry } from "../../types";

/**
 * 本地优先：IndexedDB 是这份记忆唯一的事实来源，没有后端。
 * 它按设备存储、不跨设备同步；同用户名下的多个 Pages 项目共享同一 origin，
 * 所以库名与表名都带 co-space 命名空间。
 */
export class CoSpaceDB extends Dexie {
  memories!: Table<MemoryEntry, string>;
  echoes!: Table<Echo, string>;
  imprints!: Table<Imprint, string>;

  constructor() {
    super("co-space::v1");

    this.version(1).stores({
      memories: "id, createdAt, updatedAt, source, weight, pinned, sealed",
    });

    // v2：记忆多了 kind / tags / resolved，并新增回声与印记两张表。
    this.version(2)
      .stores({
        memories:
          "id, createdAt, updatedAt, source, kind, weight, pinned, resolved",
        echoes: "id, at, hit",
        imprints: "id, at",
      })
      .upgrade((tx) =>
        tx
          .table("memories")
          .toCollection()
          .modify((m: Record<string, unknown>) => {
            m.kind ??= "fact";
            m.tags ??= [];
            m.resolved ??= false;
            delete m.sealed;
          }),
      );
  }
}

export const db = new CoSpaceDB();
