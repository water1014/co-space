import { useMemo } from "react";
import { MemoryCard } from "./MemoryCard";
import { useMemoryStore } from "../../stores/memoryStore";
import type { MemoryEntry } from "../../types";
import { formatDate } from "../../lib/utils/id";

const dayKey = (ts: number) => new Date(ts).toDateString();

export function MemoryTimeline() {
  const entries = useMemoryStore((s) => s.entries);
  const query = useMemoryStore((s) => s.query);
  const filter = useMemoryStore((s) => s.filter);
  const loading = useMemoryStore((s) => s.loading);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = entries.filter((m) => {
      if (filter === "pinned" && !m.pinned) return false;
      if (filter === "sealed" && !m.sealed) return false;
      if (filter === "all" && m.sealed) return true;
      if (q && !m.text.toLowerCase().includes(q)) return false;
      return true;
    });

    const map = new Map<string, MemoryEntry[]>();
    for (const m of filtered) {
      const key = dayKey(m.createdAt);
      const list = map.get(key) ?? [];
      list.push(m);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [entries, query, filter]);

  if (loading) {
    return (
      <p className="mt-16 text-[12px] tracking-[0.2em] text-faint/60 uppercase">
        正在读取
      </p>
    );
  }

  if (!groups.length) {
    const filteredOut = entries.length > 0;
    return (
      <div className="mt-20 max-w-md">
        <p className="font-serif text-[16px] leading-[2] text-paper/60">
          {filteredOut
            ? query
              ? `没有找到包含「${query}」的记忆。`
              : "这一栏现在是空的。"
            : "这里还没有留下任何东西。"}
        </p>
        <p className="mt-3 font-serif text-[14px] leading-[2] text-muted/60">
          {filteredOut
            ? "换个词，或者回到全部。"
            : "对话里你说过的、它自己记下的，会慢慢出现在这里。你也可以直接写一条。"}
        </p>
      </div>
    );
  }

  return (
    <div className="relative mt-10 pb-24">
      {/* 时间线本身：一条细竖线，节点是日期。 */}
      <div className="absolute top-2 bottom-0 left-[3px] w-px bg-white/8" />

      {groups.map(([key, list]) => (
        <section key={key} className="relative mb-14 pl-8 last:mb-0">
          <span className="absolute top-[7px] left-0 h-[7px] w-[7px] -translate-x-[3px] rounded-full bg-[rgb(var(--ambient)/0.7)]" />
          <h3 className="mb-6 text-[11px] tracking-[0.24em] text-faint/70 uppercase">
            {formatDate(list[0].createdAt)}
          </h3>
          <div className="space-y-10">
            {list.map((entry) => (
              <MemoryCard key={entry.id} entry={entry} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
