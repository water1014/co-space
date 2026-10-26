import { useMemo, useState } from "react";
import { Card, Empty, Segmented, Sheet } from "../components/ui/kit";
import { imprintStyle } from "../components/chat/parts";
import {
  IconCheck,
  IconEdit,
  IconSpark,
  IconTrash,
} from "../components/ui/icons";
import { useMemoryStore } from "../stores/memoryStore";
import { formatClock, formatDate } from "../lib/utils/id";
import {
  MEMORY_KIND_LABEL,
  type MemoryEntry,
  type MemoryKind,
} from "../types";

type Tab = "echo" | "imprint" | "library";

export function Memory() {
  const [tab, setTab] = useState<Tab>("echo");

  return (
    <div className="px-5 pt-6 pb-10">
      <header>
        <h1 className="serif text-[23px] text-ink">记忆</h1>
        <p className="mt-1.5 max-w-[24rem] text-[13.5px] leading-[1.9] text-ink-faint">
          它记得什么、什么时候想起来、想不起来的时候是什么样，都在这里。
          黑盒的部分尽量摊开给你看。
        </p>
      </header>

      <Segmented
        className="mt-5"
        value={tab}
        onChange={setTab}
        options={[
          { key: "echo", label: "回声" },
          { key: "imprint", label: "印记" },
          { key: "library", label: "记忆库" },
        ]}
      />

      <div className="mt-5">
        {tab === "echo" && <EchoList />}
        {tab === "imprint" && <ImprintGrid />}
        {tab === "library" && <Library />}
      </div>
    </div>
  );
}

/* ---------------- 回声 ---------------- */

function EchoList() {
  const echoes = useMemoryStore((s) => s.echoes);
  const memories = useMemoryStore((s) => s.memories);

  const byId = useMemo(
    () => new Map(memories.map((m) => [m.id, m])),
    [memories],
  );

  if (!echoes.length) {
    return (
      <Empty
        title="还没有回声。"
        hint="每次它回应你之前，都会先试着回忆一次。成功和失败都会记在这里，带上匹配得分。"
      />
    );
  }

  const hits = echoes.filter((e) => e.hit).length;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="eyebrow">最近 {echoes.length} 次回忆</span>
        <span className="text-[12.5px] text-ink-faint">
          命中 {hits} · 落空 {echoes.length - hits}
        </span>
      </div>
      <Card pad={false} className="px-4">
        {echoes.slice(0, 40).map((e) => {
          const near = e.nearId ? byId.get(e.nearId) : undefined;
          return (
            <div
              key={e.id}
              className="flex items-start gap-3 border-b border-[var(--line)] py-3.5 last:border-b-0"
            >
              <span className="num w-9 flex-none pt-0.5 text-[12px] text-ink-faint">
                {formatClock(e.at)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-baseline gap-2 text-[14px]">
                  <span className={e.hit ? "text-ink" : "text-ink-soft"}>
                    {e.hit ? "想起一条" : "没想起来"}
                  </span>
                  <span
                    className={`num text-[13px] ${
                      e.hit ? "text-[var(--accent)]" : "text-ink-faint"
                    }`}
                  >
                    {e.score.toFixed(2)}
                  </span>
                </p>
                <p className="mt-0.5 truncate text-[13px] text-ink-faint">
                  {near && e.hit ? `「${near.text}」` : `「${e.query}」`}
                </p>
              </div>
            </div>
          );
        })}
      </Card>
      <p className="mt-3 px-1 text-[12.5px] leading-[1.9] text-ink-faint">
        得分低于 0.35 就算没想起来——它不会拿一条不相关的记忆硬凑。
      </p>
    </div>
  );
}

/* ---------------- 印记 ---------------- */

function ImprintGrid() {
  const imprints = useMemoryStore((s) => s.imprints);
  const removeImprint = useMemoryStore((s) => s.removeImprint);
  const [openId, setOpenId] = useState<string | null>(null);
  const current = imprints.find((i) => i.id === openId);

  if (!imprints.length) {
    return (
      <Empty
        title="还没有印记。"
        hint="对话里让它“把这段画下来”，它会把那一次生成存到这里，带着当时的原话。"
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {imprints.map((im) => (
          <button
            key={im.id}
            onClick={() => setOpenId(im.id)}
            className="press group relative overflow-hidden rounded-[18px] border border-[var(--line)]"
          >
            <div
              className="grain-self relative aspect-[3/4] w-full"
              style={imprintStyle(im.seed)}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent" />
              <div className="absolute inset-x-3 bottom-2.5 text-left">
                <p className="serif text-[13.5px] text-white/90">{im.title}</p>
                <p className="mt-0.5 text-[11.5px] text-white/55">
                  {formatDate(im.at)}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <Sheet
        open={Boolean(current)}
        onClose={() => setOpenId(null)}
        title={current?.title}
      >
        {current && (
          <div>
            <div
              className="grain-self aspect-[3/4] w-full rounded-2xl border border-[var(--line)]"
              style={imprintStyle(current.seed)}
            />
            <p className="serif mt-4 text-[15.5px] leading-[1.95] text-ink">
              「{current.prompt}」
            </p>
            <p className="mt-1 text-[12.5px] text-ink-faint">
              {formatDate(current.at)} 留下的。它记得那一天你说过这句。
            </p>
            <button
              onClick={() => {
                void removeImprint(current.id);
                setOpenId(null);
              }}
              className="mt-5 flex items-center gap-2 text-[13.5px] text-[var(--danger)]"
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

/* ---------------- 记忆库 ---------------- */

const FILTERS: { key: "all" | "pinned" | "todo"; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "pinned", label: "钉选" },
  { key: "todo", label: "待兑现" },
];

function Library() {
  const memories = useMemoryStore((s) => s.memories);
  const filter = useMemoryStore((s) => s.filter);
  const setFilter = useMemoryStore((s) => s.setFilter);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [kind, setKind] = useState<MemoryKind>("fact");

  const list = memories.filter((m) => {
    if (filter === "pinned") return m.pinned;
    if (filter === "todo") return m.kind === "todo" && !m.resolved;
    return true;
  });

  const current = memories.find((m) => m.id === editing);

  const openEditor = (m: MemoryEntry) => {
    setEditing(m.id);
    setDraft(m.text);
    setKind(m.kind);
  };

  if (!memories.length) {
    return (
      <Empty
        title="记忆库是空的。"
        hint="对话里说过的、你自己写下的，会慢慢落在这里。也可以现在写一条。"
      />
    );
  }

  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`press rounded-full border px-3 py-1 text-[13px] transition-colors ${
              filter === f.key
                ? "border-[var(--accent)] text-ink"
                : "border-[var(--line)] text-ink-faint"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-[12.5px] text-ink-faint">
          {list.length} 条
        </span>
      </div>

      <div className="space-y-2.5">
        {list.map((m) => (
          <Card key={m.id} className="px-4 py-3.5" onClick={() => openEditor(m)}>
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="serif text-[15.5px] leading-[1.9] text-ink">
                  {m.text}
                </p>
                <div className="mt-2 flex items-center gap-2.5">
                  <span className="rounded-full border border-[var(--line)] px-2 py-[1px] text-[11.5px] text-ink-faint">
                    {MEMORY_KIND_LABEL[m.kind]}
                  </span>
                  <span className="text-[11.5px] text-ink-faint">
                    {formatDate(m.createdAt)}
                  </span>
                  <span className="ml-auto flex items-center gap-1.5">
                    <span className="h-px w-10 bg-[var(--line-strong)]" />
                    <span className="num text-[11px] text-ink-faint">
                      {Math.round(m.weight * 100)}
                    </span>
                  </span>
                </div>
              </div>
              {m.pinned && (
                <IconSpark
                  width={13}
                  height={13}
                  className="mt-1 text-[var(--accent)]"
                />
              )}
            </div>
          </Card>
        ))}
      </div>

      <p className="mt-4 px-1 text-[12.5px] leading-[1.9] text-ink-faint">
        数字是它现在的清晰度，会随时间往下掉。点开可以改——包括它记错的地方。
      </p>

      <Sheet
        open={Boolean(current)}
        onClose={() => setEditing(null)}
        title="改一条记忆"
      >
        {current && (
          <div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              className="serif w-full resize-none bg-transparent text-[16px] leading-[1.95] text-ink"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {(["fact", "feel", "todo"] as MemoryKind[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  className={`press rounded-full border px-3 py-1 text-[13px] ${
                    kind === k
                      ? "border-[var(--accent)] text-ink"
                      : "border-[var(--line)] text-ink-faint"
                  }`}
                >
                  {MEMORY_KIND_LABEL[k]}
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-4 border-t border-[var(--line)] pt-4">
              <button
                onClick={() => {
                  void useMemoryStore
                    .getState()
                    .patchMemory(current.id, { text: draft.trim(), kind });
                  setEditing(null);
                }}
                disabled={!draft.trim()}
                className="press flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-1.5 text-[13.5px] text-[var(--accent-ink)] disabled:opacity-40"
              >
                <IconCheck width={13} height={13} />
                保存
              </button>
              <button
                onClick={() => {
                  void useMemoryStore.getState().togglePin(current.id);
                  setEditing(null);
                }}
                className="text-[13.5px] text-ink-soft"
              >
                {current.pinned ? "取消钉选" : "钉在顶层"}
              </button>
              <button
                onClick={() => {
                  void useMemoryStore.getState().toggleResolved(current.id);
                  setEditing(null);
                }}
                className="text-[13.5px] text-ink-soft"
              >
                {current.resolved ? "标为未解决" : "标为已解决"}
              </button>
              <button
                onClick={() => {
                  void useMemoryStore.getState().removeMemory(current.id);
                  setEditing(null);
                }}
                className="ml-auto flex items-center gap-1 text-[13.5px] text-[var(--danger)]"
              >
                <IconTrash width={13} height={13} />
                删除
              </button>
            </div>

            <p className="mt-3 flex items-center gap-1.5 text-[12px] text-ink-faint">
              <IconEdit width={11} height={11} />
              你改的就是它下次会用的。
            </p>
          </div>
        )}
      </Sheet>
    </>
  );
}
