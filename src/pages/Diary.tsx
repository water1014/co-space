import { useMemo, useState } from "react";
import { Segmented, Empty } from "../components/ui/kit";
import { IconCheck } from "../components/ui/icons";
import { Reader } from "../components/diary/Reader";
import { useDiaryStore, replyToQuote } from "../stores/diaryStore";
import { dayKeyOf, formatDate } from "../lib/utils/id";
import type { DiaryEntry } from "../types";

const MOODS = ["平静", "温和", "低电量", "专注"];
const WEEK = ["日", "一", "二", "三", "四", "五", "六"];

type Mode = "timeline" | "reading";

export function Diary() {
  const [mode, setMode] = useState<Mode>("timeline");

  return (
    <div className="px-5 pb-10 pt-6">
      <header className="mb-4">
        <h1 className="serif text-[22px] text-ink">日记</h1>
        <p className="mt-1.5 max-w-[24rem] text-[12px] leading-[1.9] text-ink-faint">
          一天一篇，记你今天过成了什么样。读到的句子可以划线，让它回你一句。
        </p>
      </header>

      <Segmented
        className="mb-5"
        options={[
          { key: "timeline", label: "时间线" },
          { key: "reading", label: "在读" },
        ]}
        value={mode}
        onChange={(v) => setMode(v as Mode)}
      />

      {mode === "timeline" ? <Timeline /> : <Reading />}
    </div>
  );
}

/* ---------------- 时间线：月历 + 当日编辑 ---------------- */

function Timeline() {
  const entries = useDiaryStore((s) => s.entries);
  const upsert = useDiaryStore((s) => s.upsertEntry);

  const today = dayKeyOf(new Date());
  const initial = new Date();
  const [view, setView] = useState({ y: initial.getFullYear(), m: initial.getMonth() });
  const [selected, setSelected] = useState(today);
  const [mood, setMood] = useState("平静");
  const [draft, setDraft] = useState("");

  const byDate = useMemo(() => {
    const map = new Map<string, DiaryEntry>();
    for (const e of entries) map.set(e.date, e);
    return map;
  }, [entries]);

  // 切到某一天时，把那天的文字填进编辑器
  const openDay = (key: string) => {
    setSelected(key);
    const e = byDate.get(key);
    setDraft(e?.text ?? "");
    setMood(e?.mood ?? "平静");
  };

  const current = byDate.get(selected);

  const cells = useMemo(() => {
    const first = new Date(view.y, view.m, 1);
    const lead = first.getDay();
    const days = new Date(view.y, view.m + 1, 0).getDate();
    const out: ({ key: string; d: number } | null)[] = [];
    for (let i = 0; i < lead; i++) out.push(null);
    for (let d = 1; d <= days; d++) {
      out.push({ key: dayKeyOf(new Date(view.y, view.m, d)), d });
    }
    return out;
  }, [view]);

  const shiftMonth = (dir: number) => {
    setView((v) => {
      const m = v.m + dir;
      if (m < 0) return { y: v.y - 1, m: 11 };
      if (m > 11) return { y: v.y + 1, m: 0 };
      return { ...v, m };
    });
  };

  return (
    <div>
      {/* 月历 */}
      <div className="glass rounded-[24px] p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => shiftMonth(-1)}
            className="press px-2 text-[13px] text-ink-faint"
          >
            ‹
          </button>
          <span className="num text-[14px] text-ink">
            {view.y}.{String(view.m + 1).padStart(2, "0")}
          </span>
          <button
            onClick={() => shiftMonth(1)}
            className="press px-2 text-[13px] text-ink-faint"
          >
            ›
          </button>
        </div>

        <div className="mb-1.5 grid grid-cols-7 text-center text-[10.5px] text-ink-faint">
          {WEEK.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((c, i) => {
            if (!c) return <span key={i} />;
            const has = byDate.has(c.key);
            const isSel = c.key === selected;
            const isToday = c.key === today;
            return (
              <button
                key={c.key}
                onClick={() => openDay(c.key)}
                className={`relative flex h-9 items-center justify-center rounded-xl text-[13px] ${
                  isSel
                    ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                    : isToday
                      ? "text-ink"
                      : "text-ink-soft hover:bg-white/5"
                }`}
              >
                {c.d}
                {has && !isSel && (
                  <span className="absolute bottom-1 h-[3px] w-[3px] rounded-full bg-[var(--accent)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 当日编辑 */}
      <div className="mt-4 glass rounded-[24px] p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="num text-[12px] text-ink-faint">{selected}</span>
          <span className="text-[11px] text-ink-faint">
            {current ? "已记一篇" : "还没记"}
          </span>
        </div>

        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          placeholder="今天过成了什么样？"
          className="serif w-full resize-none bg-transparent text-[15px] leading-[1.95] text-ink"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m}
              onClick={() => setMood(m)}
              className={`press rounded-full border px-3 py-1 text-[11.5px] ${
                mood === m
                  ? "border-[var(--accent)] text-ink"
                  : "border-[var(--line)] text-ink-faint"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <button
          onClick={() => upsert(selected, draft.trim(), mood)}
          disabled={!draft.trim()}
          className="press mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] py-2.5 text-[13px] text-[var(--accent-ink)] disabled:opacity-40"
        >
          <IconCheck width={14} height={14} />
          存到这一天
        </button>
      </div>

      {/* 最近的几篇 */}
      {entries.length > 0 && (
        <div className="mt-5">
          <span className="eyebrow">最近的日记</span>
          <div className="mt-2 space-y-2.5">
            {entries.slice(0, 5).map((e) => (
              <button
                key={e.id}
                onClick={() => openDay(e.date)}
                className="block w-full text-left"
              >
                <div className="glass rounded-2xl px-4 py-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="num text-[10.5px] text-ink-faint">
                      {formatDate(e.createdAt)}
                    </span>
                    <span className="text-[10.5px] text-ink-faint">{e.mood}</span>
                  </div>
                  <p className="serif line-clamp-2 text-[13.5px] leading-[1.85] text-ink-soft">
                    {e.text}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- 阅读 ---------------- */

function Reading() {
  const books = useDiaryStore((s) => s.books);
  const annotations = useDiaryStore((s) => s.annotations);
  const activeBookId = useDiaryStore((s) => s.activeBookId);
  const addAnnotation = useDiaryStore((s) => s.addAnnotation);

  const book = books.find((b) => b.id === activeBookId) ?? books[0];

  if (!book) {
    return (
      <Empty
        title="还没有在读的书。"
        hint="之后可以挂一本你正在读的，划线的批注会存在这里。"
      />
    );
  }

  return (
    <Reader
      book={book}
      annotations={annotations}
      onAdd={(paraIndex, quote, note) =>
        addAnnotation({
          bookId: book.id,
          paraIndex,
          quote,
          note,
          reply: replyToQuote(quote, note),
        })
      }
    />
  );
}
