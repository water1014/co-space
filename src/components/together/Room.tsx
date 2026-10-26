import { useMemo } from "react";
import { Sheet } from "../ui/kit";
import { IconClose } from "../ui/icons";
import { WHO_DOT, WHO_LABEL, type Who } from "../../types";

/* ---------------- 像素猫 ---------------- */

/** 一只 9×10 的像素猫。它守在每个房间门口，替阿晏说话。 */
const CAT_GRID = [
  ".X.....X.",
  ".XX...XX.",
  "..XXXXX..",
  ".XXXXXXX.",
  ".XOXXXOX.",
  ".XXXXXXX.",
  "..XXXXX..",
  "..XXXXX..",
  ".XX.X.XX.",
  ".X.....X.",
];

export function PixelCat({ size = 5, mood = false }: { size?: number; mood?: boolean }) {
  const rects = useMemo(() => {
    const out: { x: number; y: number; eye: boolean }[] = [];
    CAT_GRID.forEach((row, y) => {
      [...row].forEach((c, x) => {
        if (c === "X" || c === "O") out.push({ x, y, eye: c === "O" });
      });
    });
    return out;
  }, []);

  return (
    <svg
      width={CAT_GRID[0].length * size}
      height={CAT_GRID.length * size}
      viewBox={`0 0 ${CAT_GRID[0].length * size} ${CAT_GRID.length * size}`}
      className="flex-none"
      aria-hidden
    >
      {rects.map((r, i) => (
        <rect
          key={i}
          x={r.x * size}
          y={r.y * size}
          width={size}
          height={size}
          fill={r.eye ? "var(--accent)" : "currentColor"}
          opacity={r.eye ? (mood ? 1 : 0.85) : 0.9}
        />
      ))}
    </svg>
  );
}

/* ---------------- 谁记的：小圆点 ---------------- */

export function ByDot({ by, showLabel = false }: { by?: Who; showLabel?: boolean }) {
  const who: Who = by ?? "wan";
  return (
    <span
      className="inline-flex items-center gap-1 align-middle"
      title={`${WHO_LABEL[who]}记的`}
    >
      <span
        className="h-[7px] w-[7px] flex-none rounded-full"
        style={{ background: WHO_DOT[who] }}
      />
      {showLabel && (
        <span className="text-[11px] text-ink-faint">{WHO_LABEL[who]}</span>
      )}
    </span>
  );
}

/* ---------------- 周切换条 ---------------- */

const WEEKDAY = ["日", "一", "二", "三", "四", "五", "六"];

export function dayKeyOf(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/** 最近 7 天的快速切换条。选哪天，这个房间就展示/记录哪天。 */
export function WeekStrip({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (key: string) => void;
}) {
  const days = useMemo(() => {
    const out: { key: string; label: string; sub: string; isToday: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      out.push({
        key: dayKeyOf(d),
        label: WEEKDAY[d.getDay()],
        sub: String(d.getDate()),
        isToday: i === 0,
      });
    }
    return out;
  }, []);

  return (
    <div className="flex items-center gap-1.5">
      {days.map((d) => {
        const on = d.key === selected;
        return (
          <button
            key={d.key}
            onClick={() => onSelect(d.key)}
            className={`press flex flex-1 flex-col items-center rounded-2xl border py-2 transition-colors ${
              on
                ? "border-[var(--accent)] bg-[var(--accent)]/12 text-ink"
                : "border-[var(--line)] text-ink-faint"
            }`}
          >
            <span className="text-[10.5px]">{d.label}</span>
            <span className="num text-[14px] leading-tight">{d.sub}</span>
            {d.isToday && (
              <span className="mt-0.5 h-[3px] w-[3px] rounded-full bg-[var(--accent)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- 月亮按钮 + 月历抽屉 ---------------- */

export function MoonButton({ onClick, label = "打开月历" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="press flex h-9 w-9 flex-none items-center justify-center rounded-full border border-[var(--line)] text-ink-soft hover:text-ink"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M20 13.2A8.2 8.2 0 0 1 10.8 4a8.2 8.2 0 1 0 9.2 9.2z" />
      </svg>
    </button>
  );
}

/** 月历：可切年月，每天有小标记显示记没记。 */
export function CalendarSheet({
  open,
  onClose,
  month,
  setMonth,
  selected,
  onSelect,
  marks,
}: {
  open: boolean;
  onClose: () => void;
  month: Date;
  setMonth: (d: Date) => void;
  selected: string;
  onSelect: (key: string) => void;
  marks: Set<string>;
}) {
  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const startPad = first.getDay();
    const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const out: ({ key: string; day: number } | null)[] = [];
    for (let i = 0; i < startPad; i++) out.push(null);
    for (let d = 1; d <= daysIn; d++) {
      out.push({
        key: dayKeyOf(new Date(month.getFullYear(), month.getMonth(), d)),
        day: d,
      });
    }
    return out;
  }, [month]);

  return (
    <Sheet open={open} onClose={onClose} title="哪一天">
      <div className="flex items-center justify-between">
        <button
          onClick={() =>
            setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
          }
          className="press rounded-full border border-[var(--line)] px-3 py-1 text-[13px] text-ink-soft"
        >
          ← 上个月
        </button>
        <span className="num text-[15px] text-ink">
          {month.getFullYear()} 年 {month.getMonth() + 1} 月
        </span>
        <button
          onClick={() =>
            setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
          }
          className="press rounded-full border border-[var(--line)] px-3 py-1 text-[13px] text-ink-soft"
        >
          下个月 →
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAY.map((w) => (
          <span key={w} className="text-[10.5px] text-ink-faint">
            {w}
          </span>
        ))}
        {cells.map((c, i) =>
          c ? (
            <button
              key={c.key}
              onClick={() => {
                onSelect(c.key);
                onClose();
              }}
              className={`press flex h-9 flex-col items-center justify-center rounded-xl text-[13px] ${
                c.key === selected
                  ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                  : "text-ink-soft"
              }`}
            >
              <span className="num leading-none">{c.day}</span>
              <span
                className={`mt-1 h-[3px] w-[3px] rounded-full ${
                  marks.has(c.key)
                    ? c.key === selected
                      ? "bg-[var(--accent-ink)]"
                      : "bg-[var(--accent)]"
                    : "bg-transparent"
                }`}
              />
            </button>
          ) : (
            <span key={`pad-${i}`} />
          ),
        )}
      </div>
      <p className="mt-3 text-center text-[11px] text-ink-faint">
        点一点 · 有标记的日子记过东西
      </p>
    </Sheet>
  );
}

/* ---------------- 房间骨架 ---------------- */

/**
 * 每个房间共用一套骨架：
 * 猫 + 标语 + 月亮按钮 → 一周快速切换条 → 房间自己的卡片。
 * 目的是让阿晏像在旁边说话，而不是一个记账 app。
 */
export function RoomShell({
  slogan,
  selected,
  onSelectDay,
  onOpenCalendar,
  children,
}: {
  slogan: string;
  selected: string;
  onSelectDay: (key: string) => void;
  onOpenCalendar: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rise">
      <div className="flex items-center gap-3">
        <span className="text-ink-soft">
          <PixelCat size={5} mood />
        </span>
        <p className="serif flex-1 text-[14.5px] leading-[1.8] text-ink-soft">
          {slogan}
        </p>
        <MoonButton onClick={onOpenCalendar} />
      </div>
      <div className="mt-3.5">
        <WeekStrip selected={selected} onSelect={onSelectDay} />
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function CalCloseRow({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      aria-label="关闭"
      className="press ml-auto text-ink-faint hover:text-ink"
    >
      <IconClose width={16} height={16} />
    </button>
  );
}
