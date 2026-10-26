import { useMemo, useState } from "react";
import { Sheet } from "../components/ui/kit";
import { IconCheck, IconClose, IconPlus } from "../components/ui/icons";
import { Calendar, dayKey } from "../components/home/Calendar";
import { Reader } from "../components/diary/Reader";
import { useDiaryStore, replyToQuote } from "../stores/diaryStore";
import { useText } from "../lib/content/useText";
import { formatDate } from "../lib/utils/id";
import type { DiaryEntry } from "../types";

const MOODS = ["平静", "温和", "低电量", "专注"];

/**
 * 日记：参考图式卡片 —— 作者 + 日期 + 图标，标题上压一根红线，正文两三行。
 * ☰ 打开时间线（月历 + 条目），＋ 写一篇。
 */
export function Diary() {
  const entries = useDiaryStore((s) => s.entries);
  const upsert = useDiaryStore((s) => s.upsertEntry);
  const books = useDiaryStore((s) => s.books);
  const annotations = useDiaryStore((s) => s.annotations);
  const activeBookId = useDiaryStore((s) => s.activeBookId);
  const addAnnotation = useDiaryStore((s) => s.addAnnotation);
  const t = useText();

  const [writing, setWriting] = useState(false);
  const [timeline, setTimeline] = useState(false);
  const [reading, setReading] = useState(false);

  const sorted = useMemo(
    () => [...entries].sort((a, b) => b.date.localeCompare(a.date)),
    [entries],
  );

  const book = books.find((b) => b.id === activeBookId) ?? books[0];

  if (reading && book) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 px-4 pt-5">
          <button
            onClick={() => setReading(false)}
            className="press text-[12.5px] text-ink-faint"
          >
            ‹ 日记
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
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
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* 页头 */}
      <header className="flex items-center gap-2 px-5 pt-6">
        <PenIcon />
        <h1 className="page-head-title flex-1 text-[30px] leading-none text-ink">{t.pages.diary.title}</h1>
        <button
          onClick={() => setTimeline(true)}
          aria-label="时间线"
          className="press flex h-8 w-8 items-center justify-center text-ink-faint"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <button
          onClick={() => setWriting(true)}
          aria-label="写一篇"
          className="press flex h-8 w-8 items-center justify-center text-ink-faint"
        >
          <IconPlus width={18} height={18} />
        </button>
      </header>

      {/* 日记卡 */}
      <div className="scroll-area mt-4 min-h-0 flex-1 px-5 pb-24">
        {sorted.map((e, i) => (
          <DiaryCard key={e.id} entry={e} index={i} />
        ))}

        {sorted.length === 0 && (
          <p className="py-16 text-center text-[13px] text-ink-faint">
            还没有写过。第一句就好。
          </p>
        )}

        {/* 页脚 */}
        <div className="mt-10 pb-6 text-center">
          <p className="page-head-sub text-[14px] leading-[2]">安静了一阵。</p>
          <p className="page-head-sub text-[14px] leading-[2]">没关系。想写的时候再来。</p>
        </div>
      </div>

      {/* 写一篇 */}
      <WriteSheet
        open={writing}
        onClose={() => setWriting(false)}
        onSave={(date, text, mood) => {
          upsert(date, text, mood);
          setWriting(false);
        }}
        initial={sorted[0]}
      />

      {/* 时间线抽屉 */}
      {timeline && (
        <>
          <div className="fixed inset-0 z-40 bg-black/10" onClick={() => setTimeline(false)} />
          <div className="glass-solid fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-sm flex-col border-r border-[var(--line)] bg-[var(--glass-solid)] px-4 pb-6 pt-6 backdrop-blur-2xl">
            <div className="flex items-center gap-2">
              <PenIcon />
              <h2 className="flex-1 text-[16px] text-ink">时间线</h2>
              <button onClick={() => setTimeline(false)} className="press text-ink-faint">
                <IconClose width={14} height={14} />
              </button>
            </div>

            <div className="mt-4">
              <TimelineCalendar entries={sorted} />
            </div>

            <div className="scroll-area mt-3 min-h-0 flex-1">
              {sorted.slice(0, 10).map((e, i) => (
                <div
                  key={e.id}
                  className="flex items-center gap-2 border-b border-[var(--line)] py-3 last:border-0"
                >
                  <span className="text-[12.5px] text-ink-soft">{i % 2 === 0 ? "阿晏" : "婉莹"}</span>
                  <span className="text-[12px] text-ink-faint">🌙</span>
                  <span className="flex-1 truncate text-[13px] text-ink">
                    {e.text.split("\n")[0]}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-2 py-3">
                <span className="text-[12.5px] text-ink-soft">阿晏</span>
                <span className="text-[12px] text-ink-faint">🌙</span>
                <span className="text-[13px] text-ink-faint">锁着的一篇</span>
              </div>
              <button
                onClick={() => {
                  setTimeline(false);
                  setReading(true);
                }}
                className="press mt-2 w-full text-left text-[12.5px] text-ink-faint"
              >
                📖 在读 · {book?.title ?? "没有书"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- 卡片 ---------------- */

function DiaryCard({ entry, index }: { entry: DiaryEntry; index: number }) {
  const raw = entry.text.trim();
  const firstBreak = raw.indexOf("\n");
  // 第一行（或第一句）当标题，其余当正文；没有换行就按第一个句号切。
  let title: string;
  let body: string;
  if (firstBreak > 0) {
    title = raw.slice(0, firstBreak);
    body = raw.slice(firstBreak + 1).trim();
  } else {
    const m = raw.match(/^[^。！？]*[。！？]/);
    title = m ? m[0] : raw.slice(0, 16);
    body = m ? raw.slice(m[0].length).trim() : "";
  }
  const fromYan = index % 2 === 0;

  return (
    <article className="border-b border-[var(--line)] py-4 first:pt-0">
      <div className="flex items-center gap-2 text-[11.5px] text-ink-faint">
        {fromYan ? (
          <span className="text-[11px]">🧵</span>
        ) : (
          <span className="h-[7px] w-[7px] rounded-full bg-[var(--accent-deep)]" />
        )}
        <span>{fromYan ? "阿晏" : "婉莹"}</span>
        <span className="num">{entry.date.replace(/-/g, ".")}</span>
        <span className="ml-auto text-[12px]">{fromYan ? "🌙" : "🧵"}</span>
      </div>

      {/* 标题：一根红线压过去 */}
      <div className="relative mt-1.5 inline-block w-full">
        <h2 className="text-[17px] leading-[1.6] text-ink">{title}</h2>
        <span
          className="pointer-events-none absolute left-0 top-1/2 h-px w-full"
          style={{ background: "var(--accent-deep)", opacity: 0.72 }}
        />
      </div>

      {body && (
        <p className="mt-1.5 line-clamp-3 text-[13px] leading-[1.85] text-ink-soft">{body}</p>
      )}
    </article>
  );
}

/* ---------------- 时间线月历 ---------------- */

function TimelineCalendar({ entries }: { entries: DiaryEntry[] }) {
  const marks = useMemo(() => new Set(entries.map((e) => e.date)), [entries]);
  return <Calendar marks={marks} selected={entries[0]?.date ?? dayKey(new Date())} />;
}

/* ---------------- 写一篇 ---------------- */

function WriteSheet({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (date: string, text: string, mood: string) => void;
  initial?: DiaryEntry;
}) {
  const [draft, setDraft] = useState("");
  const [mood, setMood] = useState("平静");
  const today = dayKey(new Date());

  return (
    <Sheet open={open} onClose={onClose} title="写一篇">
      <p className="num text-[11.5px] text-ink-faint">{today.replace(/-/g, ".")}</p>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={7}
        placeholder={"第一行当标题。\n下面写今天。"}
        className="mt-2 w-full resize-none bg-transparent text-[15px] leading-[1.95] text-ink"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        {MOODS.map((m) => (
          <button
            key={m}
            onClick={() => setMood(m)}
            className={`press rounded-full border px-3 py-1 text-[11.5px] ${
              mood === m
                ? "border-[var(--accent-deep)] text-[var(--accent-deep)]"
                : "border-[var(--line)] text-ink-faint"
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      <button
        onClick={() => {
          if (!draft.trim()) return;
          onSave(today, draft.trim(), mood);
          setDraft("");
        }}
        disabled={!draft.trim()}
        className="press mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent-deep)] py-2.5 text-[13px] text-white disabled:opacity-40"
      >
        <IconCheck width={14} height={14} /> 存到这一天
      </button>
      {initial && (
        <p className="mt-3 text-[11px] text-ink-faint">
          上一篇是 {formatDate(initial.createdAt)} 写的。
        </p>
      )}
    </Sheet>
  );
}

/** 钢笔尖图标 */
function PenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-soft">
      <path d="M12 3l4 7-4 11-4-11 4-7z" />
      <circle cx="12" cy="10" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}
