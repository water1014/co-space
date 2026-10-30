import { useEffect, useMemo, useState } from "react";
import { imprintStyle } from "../components/chat/parts";
import { Sheet } from "../components/ui/kit";
import { BackButton } from "../components/ui/BackButton";
import { IconCheck, IconClose, IconSearch } from "../components/ui/icons";
import { useMemoryStore } from "../stores/memoryStore";
import { useProjectsStore } from "../stores/projectsStore";
import { useText } from "../lib/content/useText";
import { formatClock, formatDate } from "../lib/utils/id";
import {
  MEMORY_DECAY_LABEL,
  type MemoryDecay,
  type MemoryEntry,
} from "../types";

type Tab = "library" | "echo" | "imprint";

const TABS: { key: Tab; label: string }[] = [
  { key: "library", label: "记忆库" },
  { key: "echo", label: "回声" },
  { key: "imprint", label: "印记" },
];

export function Memory() {
  const [tab, setTab] = useState<Tab>("library");
  const t = useText();

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* 页头：‹ Memory / Things I remember. + 绿点 */}
      <header className="px-5 pt-6">
        <div className="flex items-start gap-2">
          <BackButton className="mt-1.5" />
          <div className="flex-1">
            <h1 className="page-head-title text-[30px] leading-none text-ink">{t.pages.memory.title}</h1>
            <p className="page-head-sub mt-1 text-[12.5px]">{t.pages.memory.sub}</p>
          </div>
          <span className="mt-2 h-[7px] w-[7px] rounded-full bg-[var(--accent)]" />
        </div>

        {/* 三 Tab */}
        <div className="mt-4 flex items-center gap-2">
          {TABS.map((t) => {
            const on = t.key === tab;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`press flex-1 rounded-full border py-1.5 text-[13px] ${
                  on
                    ? "border-[var(--accent-deep)] text-[var(--accent-deep)]"
                    : "border-transparent text-ink-faint"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="mt-3 min-h-0 flex-1">
        {tab === "library" && <LibraryTab />}
        {tab === "echo" && <EchoTab />}
        {tab === "imprint" && <ImprintTab />}
      </div>
    </div>
  );
}

/* ---------------- 记忆库 ---------------- */

type LibFilter = "all" | "pinned" | "feel" | "open" | "done";
type LibType = "memories" | "letters" | "anchors";

function LibraryTab() {
  const memories = useMemoryStore((s) => s.memories);
  const [type, setType] = useState<LibType>("memories");
  const [filter, setFilter] = useState<LibFilter>("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  const solidified = memories.filter((m) => m.weight > 0.7).length;
  const dynamic = memories.length - solidified;

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return memories.filter((m) => {
      if (q && !m.text.toLowerCase().includes(q)) return false;
      if (type === "letters") return m.kind === "feel";
      if (type === "anchors") return m.pinned;
      if (filter === "pinned") return m.pinned;
      if (filter === "feel") return m.kind === "feel";
      if (filter === "open") return m.kind === "todo" && !m.resolved;
      if (filter === "done") return m.resolved;
      return true;
    });
  }, [memories, type, filter, query]);

  const current = memories.find((m) => m.id === editing);

  return (
    <div className="flex h-full flex-col">
      <div className="scroll-area min-h-0 flex-1 px-5 pb-28">
        <p className="text-[12px] text-ink-faint">
          {memories.length} memories · 固化 {solidified} 动态 {dynamic} 归档 0
        </p>

        {/* 类型卡 */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            ["memories", "记忆", "Memories"],
            ["letters", "信", "Letters"],
            ["anchors", "锚点", "Anchors"],
          ].map(([k, zh, en]) => (
            <button
              key={k}
              onClick={() => setType(k as LibType)}
              className={`press rounded-2xl border py-3 text-center ${
                type === k
                  ? "border-[var(--accent-deep)] text-[var(--accent-deep)]"
                  : "border-[var(--line)] text-ink-soft"
              }`}
            >
              <p className="text-[15px]">{zh}</p>
              <p className="page-head-sub mt-0.5 text-[10.5px]">{en}</p>
            </button>
          ))}
        </div>

        {/* 搜索 */}
        <label className="mt-3 flex items-center gap-2 rounded-xl bg-[var(--glass-hi)] px-3 py-2.5">
          <IconSearch width={15} height={15} className="text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search memories..."
            className="ghost-input w-full bg-transparent text-[13px] text-ink"
          />
        </label>

        {/* 筛选 chips */}
        <div className="scroll-area mt-3 flex gap-2 overflow-x-auto">
          {[
            ["all", "全部"],
            ["pinned", "📌 钉选"],
            ["feel", "💧 Feel"],
            ["open", "⚡ 未解决"],
            ["done", "🌿 已消"],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k as LibFilter)}
              className={`press flex-none rounded-full border px-3 py-1 text-[12px] ${
                filter === k
                  ? "border-[var(--accent-deep)] text-[var(--accent-deep)]"
                  : "border-[var(--line)] text-ink-faint"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 排序 */}
        <div className="mt-3 flex items-center justify-between text-[11.5px] text-ink-faint">
          <span>🕐 综合分优先</span>
          <span>按综合衰减分排列</span>
        </div>

        {/* 记忆卡 */}
        <div className="mt-2 space-y-3">
          {list.slice(0, 40).map((m) => (
            <button
              key={m.id}
              onClick={() => setEditing(m.id)}
              className="press block w-full rounded-2xl bg-[var(--glass-hi)] px-3.5 py-3 text-left"
            >
              <div className="flex items-center gap-1.5 text-[10px] text-ink-faint">
                <span className="rounded bg-[var(--glass-solid)] px-1.5 py-0.5 tracking-[0.12em]">
                  {m.pinned ? "PERMANENT" : m.kind === "todo" ? "PENDING" : m.kind === "feel" ? "FEEL" : "FACT"}
                </span>
                {m.pinned && <span>📌</span>}
                {m.kind === "todo" && <span>⚡</span>}
                <span className="num ml-1">{Math.round(m.weight * 999)}</span>
                <span className="num ml-auto">{formatDate(m.createdAt)}</span>
              </div>
              <p className="mt-1.5 line-clamp-2 text-[14px] leading-[1.65] text-ink">
                {m.text}
              </p>
              <p className="num mt-1 text-[10px] tracking-[0.2em] text-ink-faint/60">
                ●●●●●●●●●●
              </p>
              {m.tags.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {m.tags.slice(0, 4).map((t) => (
                    <span
                      key={t}
                      className="rounded border border-[var(--line)] px-1.5 text-[10px] text-ink-faint"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
          {list.length === 0 && (
            <p className="py-8 text-center text-[12.5px] text-ink-faint">没有匹配的记忆。</p>
          )}
        </div>
        <p className="mt-4 text-center text-[10.5px] text-ink-faint/70">
          {list.length} 条
        </p>
      </div>

      <EditSheet current={current} onClose={() => setEditing(null)} />
    </div>
  );
}

/* ---------------- 回声 ---------------- */

type EchoFilter = "all" | "todo" | "pinned" | "done" | "old";

function EchoTab() {
  const memories = useMemoryStore((s) => s.memories);
  const echoes = useMemoryStore((s) => s.echoes);
  const projects = useProjectsStore((s) => s.projects);
  const [filter, setFilter] = useState<EchoFilter>("all");
  const [editing, setEditing] = useState<string | null>(null);

  const normal = memories.filter((m) => m.kind !== "todo" && !m.pinned).length;
  const todo = memories.filter((m) => m.kind === "todo" && !m.resolved).length;
  const done = memories.filter((m) => m.resolved).length;

  const list = useMemo(() => {
    return memories.filter((m) => {
      if (filter === "todo") return m.kind === "todo" && !m.resolved;
      if (filter === "pinned") return m.pinned;
      if (filter === "done") return m.resolved;
      if (filter === "old") return m.weight < 0.3;
      return true;
    });
  }, [memories, filter]);

  const current = memories.find((m) => m.id === editing);

  return (
    <div className="flex h-full flex-col">
      <div className="scroll-area min-h-0 flex-1 px-5 pb-28">
        <p className="text-[12px] text-ink-faint">
          {echoes.length} echoes · 平常 {normal} 待兑现 {todo} 已兑现 {done} 过时 0 归档 0
        </p>
        <p className="mt-0.5 text-right text-[11px] text-ink-faint">
          今日流转:兑现 1 · 覆盖 2 · 归档 0
        </p>

        {/* 项目 pills */}
        <div className="scroll-area mt-3 flex gap-2 overflow-x-auto">
          {projects.slice(0, 3).map((p, i) => (
            <span
              key={p.id}
              className={`flex-none rounded-full border px-3 py-1 text-[12px] ${
                i === 0
                  ? "border-[var(--accent-deep)] text-[var(--accent-deep)]"
                  : "border-[var(--line)] text-ink-faint"
              }`}
            >
              {p.name} · {Math.round(memories.length / (i + 2))}
            </span>
          ))}
        </div>

        {/* 情景 / 档案卡 */}
        <div className="mt-2 flex gap-2">
          <span className="rounded-full border border-[var(--line)] px-3 py-1 text-[12px] text-ink-soft">
            情景记忆
          </span>
          <span className="rounded-full border border-[var(--line)] px-3 py-1 text-[12px] text-ink-soft">
            📁 档案卡 · {memories.length}
          </span>
        </div>

        {/* 状态 chips */}
        <div className="scroll-area mt-2 flex gap-2 overflow-x-auto">
          {[
            ["all", "全部"],
            ["todo", "🏛 待兑现"],
            ["pinned", "📌 钉住"],
            ["done", "✓ 已兑现"],
            ["old", "🗄 过时"],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k as EchoFilter)}
              className={`press flex-none rounded-full border px-3 py-1 text-[12px] ${
                filter === k
                  ? "border-[var(--accent-deep)] text-[var(--accent-deep)]"
                  : "border-[var(--line)] text-ink-faint"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between text-[11.5px] text-ink-faint">
          <span>🕐 最新优先</span>
        </div>

        <div className="mt-2 space-y-2.5">
          {list.slice(0, 40).map((m) => (
            <button
              key={m.id}
              onClick={() => setEditing(m.id)}
              className="press block w-full rounded-2xl bg-[var(--glass-hi)] px-3.5 py-3 text-left"
            >
              <div className="flex items-center gap-2 text-[10.5px] text-ink-faint">
                <span>{m.decay === "slow" ? "慢忘" : "平常"}</span>
                <span className="num ml-auto">{formatDate(m.createdAt)}</span>
                <span>· 第四个家</span>
              </div>
              <p className="mt-1 line-clamp-3 text-[13px] leading-[1.8] text-ink-soft">
                {m.text}
              </p>
            </button>
          ))}
          {list.length === 0 && (
            <p className="py-8 text-center text-[12.5px] text-ink-faint">这一类还没有。</p>
          )}
        </div>
      </div>

      <EditSheet current={current} onClose={() => setEditing(null)} />
    </div>
  );
}

/* ---------------- 印记 ---------------- */

function ImprintTab() {
  const imprints = useMemoryStore((s) => s.imprints);
  const [openId, setOpenId] = useState<string | null>(null);
  const current = imprints.find((i) => i.id === openId);

  return (
    <>
      <div className="scroll-area h-full px-5 pb-28">
        <p className="text-[12px] text-ink-faint">
          {imprints.length} 个印记 · 他在整理记忆时留下的
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {imprints.map((im) => (
            <button
              key={im.id}
              onClick={() => setOpenId(im.id)}
              className="press text-left"
            >
              <div
                className="grain-self relative w-full overflow-hidden rounded-[18px] border border-[var(--line)]"
                style={{ ...imprintStyle(im.seed), height: 150 }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              <p className="mt-1.5 text-[13px] text-ink">{im.title}</p>
              <p className="text-[10.5px] text-ink-faint">
                {formatDate(im.at)} · 第四个家
              </p>
            </button>
          ))}
        </div>
        {imprints.length === 0 && (
          <p className="py-12 text-center text-[12.5px] text-ink-faint">还没有印记。</p>
        )}
      </div>

      <Sheet open={Boolean(current)} onClose={() => setOpenId(null)} title={current?.title}>
        {current && (
          <div>
            <div
              className="grain-self w-full rounded-2xl border border-[var(--line)]"
              style={{ ...imprintStyle(current.seed), height: 280 }}
            />
            <p className="mt-4 text-[14px] leading-[1.95] text-ink">「{current.prompt}」</p>
            <p className="mt-1 text-[11px] text-ink-faint">{formatDate(current.at)} 留下的。</p>
          </div>
        )}
      </Sheet>
    </>
  );
}

/* ---------------- 记忆编辑底板 ---------------- */

function EditSheet({
  current,
  onClose,
}: {
  current?: MemoryEntry;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<"normal" | "todo" | "done" | "old" | "archived">("normal");
  const [decay, setDecay] = useState<MemoryDecay>("natural");

  useEffect(() => {
    if (!current) return;
    setDraft(current.text);
    setStatus(current.resolved ? "done" : current.kind === "todo" ? "todo" : "normal");
    setDecay(current.decay ?? "natural");
  }, [current]);

  return (
    <Sheet open={Boolean(current)} onClose={onClose} title="这一条">
      {current && (
        <div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            className="w-full resize-none rounded-xl bg-[var(--glass-hi)] p-3 text-[13.5px] leading-[1.9] text-ink"
          />
          <div className="mt-3 flex gap-3">
            <button
              onClick={() => {
                void useMemoryStore.getState().patchMemory(current.id, {
                  text: draft.trim(),
                  decay,
                  pinned: status === "normal" ? false : current.pinned,
                  kind: status === "todo" ? "todo" : "fact",
                  resolved: status === "done",
                });
                onClose();
              }}
              className="press rounded-full border border-[var(--line-strong)] px-4 py-1.5 text-[12.5px] text-ink"
            >
              保存文字
            </button>
            <button
              onClick={() => {
                void useMemoryStore.getState().removeMemory(current.id);
                onClose();
              }}
              className="press rounded-full border border-[var(--accent-deep)] px-4 py-1.5 text-[12.5px] text-[var(--accent-deep)]"
            >
              删掉
            </button>
          </div>

          <p className="mt-4 text-[11.5px] text-ink-faint">状态</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {[
              ["normal", "平常"],
              ["todo", "待兑现"],
              ["done", "已兑现"],
              ["old", "已过时"],
              ["archived", "归档"],
            ].map(([k, label]) => (
              <button
                key={k}
                onClick={() => setStatus(k as typeof status)}
                className={`press rounded-full border px-3 py-1 text-[12px] ${
                  status === k
                    ? "border-[var(--accent-deep)] text-[var(--accent-deep)]"
                    : "border-[var(--line)] text-ink-faint"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <p className="mt-3 text-[11.5px] text-ink-faint">留存</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {(["natural", "slow"] as MemoryDecay[]).map((d) => (
              <button
                key={d}
                onClick={() => setDecay(d)}
                className={`press rounded-full border px-3 py-1 text-[12px] ${
                  decay === d
                    ? "border-[var(--accent-deep)] text-[var(--accent-deep)]"
                    : "border-[var(--line)] text-ink-faint"
                }`}
              >
                {MEMORY_DECAY_LABEL[d]}
              </button>
            ))}
            <button
              onClick={() => {
                void useMemoryStore.getState().patchMemory(current.id, { pinned: true });
                onClose();
              }}
              className="press rounded-full border border-[var(--line)] px-3 py-1 text-[12px] text-ink-faint"
            >
              📌 钉住
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2 border-t border-[var(--line)] pt-3 text-[10.5px] text-ink-faint">
            <IconCheck width={11} height={11} className="text-[var(--accent)]" />
            {formatClock(current.updatedAt)} 改过
            <button onClick={onClose} className="press ml-auto flex items-center gap-1">
              <IconClose width={11} height={11} /> 收起
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
