import { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { GlassCard, InsetCard } from "../components/ui/GlassCard";
import { Empty, Sheet } from "../components/ui/kit";
import { imprintStyle } from "../components/chat/parts";
import { IconCheck, IconSearch, IconSpark, IconTrash } from "../components/ui/icons";
import { useMemoryStore } from "../stores/memoryStore";
import { formatClock, formatDate } from "../lib/utils/id";
import { MEMORY_KIND_LABEL, type MemoryEntry, type MemoryKind } from "../types";

type Tab = "echo" | "imprint" | "library";

const TABS: { key: Tab; label: string }[] = [
  { key: "echo", label: "回声" },
  { key: "imprint", label: "印记" },
  { key: "library", label: "记忆库" },
];

export function Memory() {
  const [tab, setTab] = useState<Tab>("echo");
  const [query, setQuery] = useState("");

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <header className="px-5 pt-6 pb-4">
        <h1 className="serif text-[22px] text-ink">记忆</h1>
        <p className="mt-1.5 max-w-[24rem] text-[12px] leading-[1.9] text-ink-faint">
          它记得什么、什么时候想起来、想不起来是什么样，都在这里。
        </p>
      </header>

      {/* 搜索：单独一层，列表滚动时不动 */}
      <div className="px-5 pb-4">
        <label className="glass flex items-center gap-2.5 rounded-full px-4 py-2.5">
          <IconSearch width={15} height={15} className="flex-none text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="找一条记忆，或一句你说过的话"
            className="ghost-input w-full bg-transparent text-[13px] text-ink"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="flex-none text-[10.5px] text-ink-faint"
            >
              清空
            </button>
          )}
        </label>
      </div>

      <div className="min-h-0 flex-1">
        {tab === "echo" && <EchoList query={query} />}
        {tab === "imprint" && <ImprintGrid query={query} />}
        {tab === "library" && <Library query={query} />}
      </div>

      <FloatingTabs value={tab} onChange={setTab} />
    </div>
  );
}

/** 悬浮二级 Tab：不占布局，浮在内容上方，避开底部导航。 */
function FloatingTabs({
  value,
  onChange,
}: {
  value: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center">
      <div
        className="pointer-events-auto flex items-center gap-0.5 rounded-full p-1"
        style={{
          background: "color-mix(in srgb, var(--bg) 62%, transparent)",
          backdropFilter: "blur(22px) saturate(1.8)",
          WebkitBackdropFilter: "blur(22px) saturate(1.8)",
          border: "1px solid var(--line)",
          boxShadow: "0 10px 30px -18px rgba(0,0,0,.8)",
        }}
      >
        {TABS.map((t) => {
          const active = t.key === value;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className={`tap rounded-full px-4 py-1.5 text-[12px] transition-colors ${
                active
                  ? "bg-[var(--glass-hi)] text-ink"
                  : "text-ink-faint hover:text-ink-soft"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- 回声 ---------------- */

function EchoList({ query }: { query: string }) {
  const echoes = useMemoryStore((s) => s.echoes);
  const memories = useMemoryStore((s) => s.memories);

  const byId = useMemo(() => new Map(memories.map((m) => [m.id, m])), [memories]);
  const list = query
    ? echoes.filter((e) => e.query.toLowerCase().includes(query.toLowerCase()))
    : echoes;

  if (!list.length) {
    return (
      <div className="scroll-area h-full px-5 pb-28">
        <Empty
          title={query ? `没有匹配「${query}」的回声。` : "还没有回声。"}
          hint="每次它回应你之前，都会先试着回忆一次。成功和失败都会记在这里，带上匹配得分。"
        />
      </div>
    );
  }

  const hits = list.filter((e) => e.hit).length;

  return (
    <div className="scroll-area h-full px-5 pb-28">
      <div className="mb-3 flex items-center justify-between">
        <span className="eyebrow">最近 {list.length} 次回忆</span>
        <span className="text-[11px] text-ink-faint">
          命中 {hits} · 落空 {list.length - hits}
        </span>
      </div>

      <InsetCard className="px-4">
        {list.slice(0, 60).map((e) => {
          const near = e.nearId ? byId.get(e.nearId) : undefined;
          return (
            <div
              key={e.id}
              className="flex items-start gap-3 border-b border-[var(--line)] py-3.5 last:border-b-0"
            >
              <span className="num w-9 flex-none pt-0.5 text-[10px] text-ink-faint">
                {formatClock(e.at)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-baseline gap-2 text-[13px]">
                  <span className={e.hit ? "text-ink" : "text-ink-soft"}>
                    {e.hit ? "想起一条" : "没想起来"}
                  </span>
                  <span
                    className={`num text-[11px] ${
                      e.hit ? "text-[var(--accent)]" : "text-ink-faint"
                    }`}
                  >
                    {e.score.toFixed(2)}
                  </span>
                </p>
                <p className="mt-0.5 truncate text-[11.5px] text-ink-faint">
                  {near && e.hit ? `「${near.text}」` : `「${e.query}」`}
                </p>
              </div>
            </div>
          );
        })}
      </InsetCard>

      <p className="mt-3 px-1 text-[11px] leading-[1.9] text-ink-faint">
        得分低于 0.35 就算没想起来——它不会拿一条不相关的记忆硬凑。
      </p>
    </div>
  );
}

/* ---------------- 印记 ---------------- */

function ImprintGrid({ query }: { query: string }) {
  const imprints = useMemoryStore((s) => s.imprints);
  const removeImprint = useMemoryStore((s) => s.removeImprint);
  const [openId, setOpenId] = useState<string | null>(null);

  const list = query
    ? imprints.filter(
        (i) =>
          i.title.includes(query) || i.prompt.toLowerCase().includes(query.toLowerCase()),
      )
    : imprints;
  const current = imprints.find((i) => i.id === openId);

  if (!list.length) {
    return (
      <div className="scroll-area h-full px-5 pb-28">
        <Empty
          title={query ? `没有匹配「${query}」的印记。` : "还没有印记。"}
          hint="对话里让它“把这段画下来”，它会把那一次生成存到这里，带着当时的原话。"
        />
      </div>
    );
  }

  return (
    <>
      <div className="scroll-area h-full px-5 pb-28">
        <div className="grid grid-cols-2 gap-3">
          {list.map((im) => (
            <button
              key={im.id}
              onClick={() => setOpenId(im.id)}
              className="press group relative overflow-hidden rounded-[18px] border border-[var(--line)]"
            >
              <div
                className="grain-self relative w-full"
                style={{ ...imprintStyle(im.seed), height: 200 }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent" />
                <div className="absolute inset-x-3 bottom-2.5 text-left">
                  <p className="serif text-[12.5px] text-white/90">{im.title}</p>
                  <p className="mt-0.5 text-[10px] text-white/55">
                    {formatDate(im.at)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Sheet open={Boolean(current)} onClose={() => setOpenId(null)} title={current?.title}>
        {current && (
          <div>
            <div
              className="grain-self w-full rounded-2xl border border-[var(--line)]"
              style={{ ...imprintStyle(current.seed), height: 300 }}
            />
            <p className="serif mt-4 text-[14.5px] leading-[1.95] text-ink">
              「{current.prompt}」
            </p>
            <p className="mt-1 text-[11px] text-ink-faint">
              {formatDate(current.at)} 留下的。
            </p>
            <button
              onClick={() => {
                void removeImprint(current.id);
                setOpenId(null);
              }}
              className="mt-5 flex items-center gap-2 text-[12px] text-[var(--danger)]"
            >
              <IconTrash width={14} height={14} />
              删掉这张
            </button>
          </div>
        )}
      </Sheet>
    </>
  );
}

/* ---------------- 记忆库（虚拟列表） ---------------- */

const FILTERS: { key: "all" | "pinned" | "todo"; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "pinned", label: "钉选" },
  { key: "todo", label: "待兑现" },
];

function Library({ query }: { query: string }) {
  const memories = useMemoryStore((s) => s.memories);
  const filter = useMemoryStore((s) => s.filter);
  const setFilter = useMemoryStore((s) => s.setFilter);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [kind, setKind] = useState<MemoryKind>("fact");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return memories.filter((m) => {
      if (q && !m.text.toLowerCase().includes(q)) return false;
      if (filter === "pinned") return m.pinned;
      if (filter === "todo") return m.kind === "todo" && !m.resolved;
      return true;
    });
  }, [memories, filter, query]);

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: list.length,
    getScrollElement: () => parentRef.current,
    // 长文本展开会变高，交给 measureElement 实测。
    estimateSize: () => 136,
    overscan: 6,
  });

  const current = memories.find((m) => m.id === editing);

  const openEditor = (m: MemoryEntry) => {
    setEditing(m.id);
    setDraft(m.text);
    setKind(m.kind);
  };

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 px-5 pb-3">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`press rounded-full border px-3 py-1 text-[11.5px] transition-colors ${
                filter === f.key
                  ? "border-[var(--accent)] text-ink"
                  : "border-[var(--line)] text-ink-faint"
              }`}
            >
              {f.label}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-ink-faint">
            {list.length} 条
          </span>
        </div>

        {list.length === 0 ? (
          <div className="scroll-area flex-1 px-5">
            <Empty
              title={query ? `没有匹配「${query}」的记忆。` : "记忆库是空的。"}
              hint="对话里说过的、你自己写下的，会慢慢落在这里。"
            />
          </div>
        ) : (
          <div ref={parentRef} className="scroll-area min-h-0 flex-1 px-5 pb-28">
            <div
              style={{
                height: virtualizer.getTotalSize(),
                position: "relative",
                width: "100%",
              }}
            >
              {virtualizer.getVirtualItems().map((vi) => {
                const m = list[vi.index];
                return (
                  <div
                    key={vi.key}
                    data-index={vi.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${vi.start}px)`,
                      paddingBottom: 12,
                    }}
                  >
                    <MemoryRow entry={m} onClick={() => openEditor(m)} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Sheet open={Boolean(current)} onClose={() => setEditing(null)} title="改一条记忆">
        {current && (
          <div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={5}
              className="serif w-full resize-none bg-transparent text-[15px] leading-[1.95] text-ink"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {(["fact", "feel", "todo"] as MemoryKind[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  className={`press rounded-full border px-3 py-1 text-[11.5px] ${
                    kind === k
                      ? "border-[var(--accent)] text-ink"
                      : "border-[var(--line)] text-ink-faint"
                  }`}
                >
                  {MEMORY_KIND_LABEL[k]}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-[var(--line)] pt-4">
              <button
                onClick={() => {
                  void useMemoryStore
                    .getState()
                    .patchMemory(current.id, { text: draft.trim(), kind });
                  setEditing(null);
                }}
                disabled={!draft.trim()}
                className="press flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-1.5 text-[12px] text-[var(--accent-ink)] disabled:opacity-40"
              >
                <IconCheck width={13} height={13} />
                保存
              </button>
              <button
                onClick={() => {
                  void useMemoryStore.getState().togglePin(current.id);
                  setEditing(null);
                }}
                className="text-[12px] text-ink-soft"
              >
                {current.pinned ? "取消钉选" : "钉在顶层"}
              </button>
              <button
                onClick={() => {
                  void useMemoryStore.getState().toggleResolved(current.id);
                  setEditing(null);
                }}
                className="text-[12px] text-ink-soft"
              >
                {current.resolved ? "标为未解决" : "标为已解决"}
              </button>
              <button
                onClick={() => {
                  void useMemoryStore.getState().removeMemory(current.id);
                  setEditing(null);
                }}
                className="ml-auto flex items-center gap-1 text-[12px] text-[var(--danger)]"
              >
                <IconTrash width={13} height={13} />
                删除
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}

function MemoryRow({
  entry,
  onClick,
}: {
  entry: MemoryEntry;
  onClick: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const long = entry.text.length > 200;
  const shown = long && !expanded ? `${entry.text.slice(0, 200)}…` : entry.text;

  return (
    <GlassCard className="px-4 py-3.5" onClick={onClick}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="serif text-[14.5px] leading-[1.9] text-ink">{shown}</p>

          {long && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
              className="mt-1 text-[11px] text-[var(--accent)]"
            >
              {expanded ? "收起" : "原文"}
            </button>
          )}

          <div className="mt-2 flex items-center gap-2.5">
            <span className="rounded-full border border-[var(--line)] px-2 py-[1px] text-[10px] text-ink-faint">
              {MEMORY_KIND_LABEL[entry.kind]}
            </span>
            {/* 沉 / 浮：用清晰度换一个更好懂的词 */}
            <span className="text-[10px] text-ink-faint">
              {entry.weight > 0.7 ? "浮" : "沉"}
            </span>
            <span className="text-[10px] text-ink-faint">
              {formatDate(entry.createdAt)}
            </span>
            <span className="ml-auto flex items-center gap-1.5">
              <span className="h-px w-10 bg-[var(--line-strong)]" />
              <span className="num text-[10px] text-ink-faint">
                {Math.round(entry.weight * 100)}
              </span>
            </span>
          </div>
        </div>
        {entry.pinned && (
          <IconSpark width={13} height={13} className="mt-1 text-[var(--accent)]" />
        )}
      </div>
    </GlassCard>
  );
}
