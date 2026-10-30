import { useEffect, useMemo, useState } from "react";
import { Sheet } from "../components/ui/kit";
import { BackButton } from "../components/ui/BackButton";
import { Portal } from "../components/ui/Portal";
import {
  IconBook,
  IconCheck,
  IconChevron,
  IconClose,
  IconMenu,
  IconPlus,
  IconSearch,
} from "../components/ui/icons";
import { Calendar, dayKey } from "../components/home/Calendar";
import { Reader } from "../components/diary/Reader";
import { useDiaryStore, replyToQuote } from "../stores/diaryStore";
import { useText } from "../lib/content/useText";
import type { DiaryEntry } from "../types";

const MOODS = ["平静", "温和", "低电量", "专注"];
const WEEK_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEK_SHORT = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const MON_EN = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const MON_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const pad = (n: number) => String(n).padStart(2, "0");
const keyOf = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseKey = (k: string) => new Date(`${k}T00:00:00`);
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
/** 周一为一周之始 */
const startOfWeek = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};

/**
 * 日记：参考 reverie 的排版。
 *
 * 上方是 Diary 衬线大字 + 月份眉题 + 篇数；一条可翻周的日期条（选中是柔粉块，
 * 有记录的日子带小点）；下面是白卡列表——大数字日期、植物线稿、三行摘要、
 * 底部发丝线上的心情与 Read。点卡片整页展开阅读，＋ 直接写今天。
 */
export function Diary() {
  const entries = useDiaryStore((s) => s.entries);
  const upsert = useDiaryStore((s) => s.upsertEntry);
  const removeEntry = useDiaryStore((s) => s.removeEntry);
  const books = useDiaryStore((s) => s.books);
  const annotations = useDiaryStore((s) => s.annotations);
  const activeBookId = useDiaryStore((s) => s.activeBookId);
  const addAnnotation = useDiaryStore((s) => s.addAnnotation);
  const t = useText();

  const [writing, setWriting] = useState(false);
  const [writeDate, setWriteDate] = useState<string | undefined>();
  const [writeInitial, setWriteInitial] = useState("");
  const [timeline, setTimeline] = useState(false);
  const [reading, setReading] = useState(false);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [picked, setPicked] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...entries].sort((a, b) => b.date.localeCompare(a.date)),
    [entries],
  );

  const marked = useMemo(() => new Set(entries.map((e) => e.date)), [entries]);

  const todayKey = keyOf(new Date());
  const titleDate = picked ? parseKey(picked) : addDays(weekStart, 3);
  const monthKey = `${titleDate.getFullYear()}-${pad(titleDate.getMonth() + 1)}`;
  const monthCount = entries.filter((e) => e.date.startsWith(monthKey)).length;

  const visible = useMemo(() => {
    const q = query.trim();
    let list = sorted;
    if (picked) list = list.filter((e) => e.date === picked);
    if (q) {
      list = list.filter(
        (e) => e.text.includes(q) || e.mood.includes(q) || e.date.includes(q),
      );
    }
    return list;
  }, [sorted, picked, query]);

  const week = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const book = books.find((b) => b.id === activeBookId) ?? books[0];
  const openEntry = entries.find((e) => e.id === openId) ?? null;

  // 桌面按 Esc 关抽屉
  useEffect(() => {
    if (!timeline) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTimeline(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [timeline]);

  const openWrite = (date?: string) => {
    const d = date ?? todayKey;
    setWriteDate(d);
    setWriteInitial(entries.find((e) => e.date === d)?.text ?? "");
    setWriting(true);
  };

  /* ---------------- 读书 ---------------- */
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
    <div className="diary-page editorial-page relative flex h-full flex-col overflow-hidden">
      {/* 品牌行：返回 · Miao & Song · 时间线 */}
      <header className="flex items-center gap-3 px-5 pt-5">
        <BackButton />
        <span className="serif-display flex-1 text-center text-[15.5px] italic tracking-[0.02em] text-ink-soft">
          Miao &amp; Song
        </span>
        <button
          onClick={() => setTimeline(true)}
          aria-label="时间线"
          className="round-btn press flex h-9 w-9 flex-none items-center justify-center rounded-full"
        >
          <IconMenu width={16} height={16} />
        </button>
      </header>

      {/* 标题：Diary + 月份 + 篇数 */}
      <div className="diary-heading relative px-5 pt-7">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="diary-title serif-display text-[42px] leading-[0.9] text-ink">
              {t.pages.diary.title}
            </h1>
            <p className="mt-3 text-[9.5px] uppercase tracking-[0.26em] text-ink-ghost">
              {MON_FULL[titleDate.getMonth()]} {titleDate.getFullYear()}
            </p>
          </div>
          <div className="flex flex-none items-center gap-3 pb-1.5">
            <button
              onClick={() => {
                setSearching((v) => !v);
                if (searching) setQuery("");
              }}
              aria-label="搜索日记"
              className="press text-ink-soft"
            >
              <IconSearch width={17} height={17} />
            </button>
            <span className="num text-[11px] text-ink-faint">
              {monthCount} / {entries.length} 篇
            </span>
          </div>
        </div>

        {searching && (
          <div className="mt-3 flex items-center gap-2 rounded-full bg-[var(--surface-2)] px-3.5 py-2">
            <IconSearch width={14} height={14} className="text-ink-faint" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="找一句话、一个心情"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-ghost"
            />
            <button
              onClick={() => {
                setQuery("");
                setSearching(false);
              }}
              aria-label="收起搜索"
              className="press text-ink-faint"
            >
              <IconClose width={13} height={13} />
            </button>
          </div>
        )}
      </div>

      {/* 周条 */}
      <div className="px-4 pt-5">
        <div className="week-strip flex items-center px-1.5 py-1.5">
          <button
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            aria-label="上一周"
            className="press flex h-8 w-6 flex-none items-center justify-center text-ink-ghost"
          >
            <IconChevron width={14} height={14} className="rotate-180" />
          </button>
          <div className="flex flex-1 items-center justify-between">
            {week.map((d, i) => {
              const k = keyOf(d);
              const on = picked ? picked === k : k === todayKey;
              return (
                <button
                  key={k}
                  onClick={() => setPicked((p) => (p === k ? null : k))}
                  aria-pressed={on}
                  className="day-chip"
                  data-on={on}
                >
                  <span className="dow">{WEEK_SHORT[i]}</span>
                  <span className="dd">{d.getDate()}</span>
                  <span className={`dot${marked.has(k) ? "" : " off"}`} />
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            aria-label="下一周"
            className="press flex h-8 w-6 flex-none items-center justify-center text-ink-ghost"
          >
            <IconChevron width={14} height={14} />
          </button>
        </div>
      </div>

      {/* 列表 */}
      <div className="scroll-area mt-4 min-h-0 flex-1 px-4 pb-28">
        {picked && (
          <div className="mb-3 flex items-center justify-between px-1">
            <span className="num text-[11px] text-ink-faint">
              {picked.replace(/-/g, ".")}
            </span>
            <button
              onClick={() => setPicked(null)}
              className="press text-[11.5px] text-[var(--accent)]"
            >
              全部
            </button>
          </div>
        )}

        <div className="flex flex-col gap-3.5">
          {visible.map((e, i) => (
            <DiaryCard key={e.id} entry={e} index={i} onOpen={() => setOpenId(e.id)} />
          ))}
        </div>

        {visible.length === 0 && (
          <div className="px-2 py-16 text-center">
            <p className="serif-display text-[17px] text-ink-soft">
              {query.trim() ? "没有找到。" : "这天还没写。"}
            </p>
            {query.trim() ? (
              <button
                onClick={() => setQuery("")}
                className="press mt-3 text-[12.5px] text-[var(--accent)]"
              >
                清掉搜索
              </button>
            ) : (
              <button
                onClick={() => openWrite(picked ?? undefined)}
                className="press mt-3 text-[12.5px] text-[var(--accent)]"
              >
                写给这一天 ›
              </button>
            )}
          </div>
        )}

        {visible.length > 0 && !query.trim() && (
          <div className="mt-9 text-center">
            <p className="text-[11px] tracking-[0.14em] text-ink-ghost">
              到这里就翻完了
            </p>
          </div>
        )}
      </div>

      {/* 写一篇 */}
      <button
        onClick={() => openWrite()}
        aria-label="写一篇"
        className="press absolute bottom-6 right-5 z-20 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-[0_14px_30px_-12px_rgba(226,96,95,0.7)]"
      >
        <IconPlus width={22} height={22} />
      </button>

      {/* 整页阅读 */}
      {openEntry && (
        <EntryReader
          entry={openEntry}
          index={sorted.findIndex((x) => x.id === openEntry.id)}
          onClose={() => setOpenId(null)}
          onEdit={() => {
            const d = openEntry.date;
            setOpenId(null);
            openWrite(d);
          }}
          onDelete={() => {
            removeEntry(openEntry.id);
            setOpenId(null);
          }}
        />
      )}

      {/* 写 / 改 */}
      <WriteSheet
        open={writing}
        date={writeDate}
        initialText={writeInitial}
        onClose={() => setWriting(false)}
        onSave={(date, text, mood) => {
          upsert(date, text, mood);
          setWriting(false);
          // 不筛到那一天：列表保持完整，新写的排在最上面。
          setWeekStart(startOfWeek(parseKey(date)));
        }}
      />

      {/* 时间线抽屉 */}
      {timeline && (
        <Portal>
          <div className="fixed inset-0 z-50 flex justify-center">
            <div className="relative h-full w-full max-w-[600px]">
              <div
                className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"
                onClick={() => setTimeline(false)}
              />
              <div className="reader-sheet absolute inset-y-0 left-0 flex w-[86%] max-w-[420px] flex-col border-r border-[var(--line)] bg-[var(--surface)] px-4 pb-6 pt-6">
                <div className="flex items-center gap-2">
                  <span className="serif-display text-[17px] italic text-ink-soft">
                    Timeline
                  </span>
                  <h2 className="flex-1 text-[13px] text-ink-faint">时间线</h2>
                  <button
                    onClick={() => setTimeline(false)}
                    aria-label="关闭"
                    className="press text-ink-faint"
                  >
                    <IconClose width={14} height={14} />
                  </button>
                </div>

                <div className="mt-4">
                  <TimelineCalendar entries={sorted} />
                </div>

                <div className="scroll-area mt-3 min-h-0 flex-1">
                  {sorted.slice(0, 12).map((e) => (
                    <button
                      key={e.id}
                      onClick={() => {
                        setTimeline(false);
                        setOpenId(e.id);
                      }}
                      className="flex w-full items-center gap-2 border-b border-[var(--line)] py-3 text-left last:border-0"
                    >
                      <span className="num text-[11px] text-ink-faint">
                        {e.date.slice(5).replace("-", ".")}
                      </span>
                      <span className="flex-1 truncate text-[13px] text-ink">
                        {e.text.split("\n")[0]}
                      </span>
                      <span className="text-[10.5px] text-ink-ghost">{e.mood}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setTimeline(false);
                      setReading(true);
                    }}
                    className="press mt-3 flex w-full items-center gap-2 text-left text-[12.5px] text-ink-faint"
                  >
                    <IconBook width={14} height={14} />
                    在读 · {book?.title ?? "没有书"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

/* ---------------- 卡片 ---------------- */

function DiaryCard({
  entry,
  index,
  onOpen,
}: {
  entry: DiaryEntry;
  index: number;
  onOpen: () => void;
}) {
  const raw = entry.text.trim();
  const d = parseKey(entry.date);
  const created = new Date(entry.createdAt);
  const time = `${pad(created.getHours())}:${pad(created.getMinutes())}`;

  return (
    <button onClick={onOpen} className="diary-card editorial-card block w-full text-left">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="serif-display text-[33px] leading-[0.85] text-ink">
            {d.getDate()}
          </span>
          <span className="text-[10px] tracking-[0.18em] text-ink-soft">
            {MON_EN[d.getMonth()]}
          </span>
        </div>
        <PlantMark i={index} />
      </div>

      <p className="mt-1 text-[10.5px] text-ink-ghost">
        {WEEK_EN[d.getDay()]} · {time}
      </p>

      <p className="mt-3 line-clamp-3 text-[13.5px] leading-[1.95] text-ink-soft">
        {raw}
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-2.5">
        <span className="flex items-center gap-1.5 text-[10.5px] text-ink-faint">
          <NoteGlyph />
          {entry.mood || "平静"}
        </span>
        <span className="text-[10.5px] tracking-[0.04em] text-ink-faint">
          Read ›
        </span>
      </div>
    </button>
  );
}

/* ---------------- 整页阅读 ---------------- */

function EntryReader({
  entry,
  index,
  onClose,
  onEdit,
  onDelete,
}: {
  entry: DiaryEntry;
  index: number;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const d = parseKey(entry.date);
  const created = new Date(entry.createdAt);
  const time = `${pad(created.getHours())}:${pad(created.getMinutes())}`;

  return (
    <Portal>
      <div className="fixed inset-0 z-[60] flex justify-center bg-[var(--bg)]">
        <div className="reader-sheet flex h-full w-full max-w-[600px] flex-col">
          <div className="flex items-center justify-between px-5 pt-5">
            <span className="text-[9.5px] uppercase tracking-[0.26em] text-ink-ghost">
              Diary
            </span>
            <button
              onClick={onClose}
              aria-label="关闭"
              className="round-btn press flex h-9 w-9 items-center justify-center rounded-full"
            >
              <IconClose width={15} height={15} />
            </button>
          </div>

          <div className="scroll-area min-h-0 flex-1 px-6 pb-16 pt-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-baseline gap-2.5">
                <span className="serif-display text-[54px] leading-[0.8] text-ink">
                  {d.getDate()}
                </span>
                <span className="text-[11px] tracking-[0.2em] text-ink-soft">
                  {MON_EN[d.getMonth()]}
                </span>
              </div>
              <PlantMark i={Math.max(index, 0)} size={56} />
            </div>

            <p className="mt-3 text-[11px] text-ink-ghost">
              {WEEK_EN[d.getDay()]} · {time} · {entry.mood}
            </p>

            <div className="mt-6 h-px w-14 bg-[var(--accent)] opacity-60" />

            <p className="serif-display mt-6 whitespace-pre-wrap text-[16px] leading-[2.1] text-ink">
              {entry.text}
            </p>
          </div>

          <div
            className="flex items-center gap-2 border-t border-[var(--line)] px-5 pt-3"
            style={{ paddingBottom: "max(14px, env(safe-area-inset-bottom))" }}
          >
            <button
              onClick={onEdit}
              className="press rounded-full border border-[var(--line-strong)] px-4 py-2 text-[12.5px] text-ink-soft"
            >
              改写
            </button>
            <button
              onClick={() => {
                if (window.confirm("删掉这一篇？")) onDelete();
              }}
              className="press rounded-full px-3 py-2 text-[12.5px] text-ink-faint"
            >
              删除
            </button>
            <span className="flex-1" />
            <span className="num text-[10.5px] text-ink-ghost">
              {entry.date.replace(/-/g, ".")}
            </span>
          </div>
        </div>
      </div>
    </Portal>
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
  date,
  initialText,
  onClose,
  onSave,
}: {
  open: boolean;
  date?: string;
  initialText?: string;
  onClose: () => void;
  onSave: (date: string, text: string, mood: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [mood, setMood] = useState("平静");
  const target = date ?? keyOf(new Date());

  // 每次打开都从上一次的内容/心情开始，避免残留上一篇的草稿。
  useEffect(() => {
    if (!open) return;
    setDraft(initialText ?? "");
    setMood("平静");
  }, [open, initialText, date]);

  return (
    <Sheet open={open} onClose={onClose} title={initialText ? "改写这一篇" : "写一篇"}>
      <p className="num text-[11.5px] text-ink-faint">
        {target.replace(/-/g, ".")}
      </p>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={7}
        placeholder={"今天想留下什么？\n换行、断句都随你。"}
        className="serif-display mt-2 w-full resize-none bg-transparent text-[15.5px] leading-[2] text-ink outline-none placeholder:text-ink-ghost"
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
          onSave(target, draft.trim(), mood);
          setDraft("");
        }}
        disabled={!draft.trim()}
        className="press mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent-deep)] py-2.5 text-[13px] text-white disabled:opacity-40"
      >
        <IconCheck width={14} height={14} /> 存到这一天
      </button>
    </Sheet>
  );
}

/* ---------------- 小图 ---------------- */

/** 卡片右下角那朵花：1 线宽的手绘感，只做呼吸感。 */
function PlantMark({ i, size = 38 }: { i: number; size?: number }) {
  const kind = i % 3;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.9"
      strokeLinecap="round"
      className="plant-mark flex-none"
      aria-hidden
    >
      {kind === 0 && (
        <g transform="translate(24 21)">
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <ellipse key={a} rx="3.6" ry="8.4" transform={`rotate(${a}) translate(0 -8.2)`} />
          ))}
          <circle r="2.3" />
          <path d="M0 10v11" />
          <path d="M0 21c3.4 0 5.6-2 6-4.4" />
        </g>
      )}
      {kind === 1 && (
        <g>
          <path d="M14 11c0 10 4 14.5 10 14.5S34 21 34 11" />
          <path d="M19 9.5c1.4 3.2 2.9 4.6 5 4.6s3.6-1.4 5-4.6" />
          <path d="M24 25.5V40" />
          <path d="M24 32c-3.6 0-6-2.2-6.6-5.4" />
          <path d="M24 36c3.2 0 5.4-1.8 6-4.4" />
        </g>
      )}
      {kind === 2 && (
        <g>
          <path d="M24 42V11" />
          <path d="M24 23c-7 0-10.5-4.4-10.5-10.5C20.5 12.5 24 17 24 23Z" />
          <path d="M24 31c7 0 10.5-4.4 10.5-10.5C27.5 20.5 24 25 24 31Z" />
          <circle cx="24" cy="9.5" r="1.6" />
        </g>
      )}
    </svg>
  );
}

/** 小小的括号形笔记图标（参考卡底部的 note 位） */
function NoteGlyph() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
      <path d="M3 3.5h10v7H8l-3 2.5v-2.5H3z" strokeLinejoin="round" />
    </svg>
  );
}
