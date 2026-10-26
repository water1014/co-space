import { useMemo, useState } from "react";
import { IconChevron } from "../ui/icons";

/** 参考图式月历：周一起始，「Sep 2026」衬线斜体居中，选中是红描边圆角方块，有记录的日子带小点。 */
const WEEK = ["一", "二", "三", "四", "五", "六", "日"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const keyOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

export function Calendar({
  marks,
  onSelect,
  selected,
}: {
  /** 有记录的日子：日期键集合。 */
  marks?: Set<string>;
  onSelect?: (key: string, date: Date) => void;
  selected?: string;
}) {
  const [cursor, setCursor] = useState(() => new Date());
  const today = keyOf(new Date());

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    // 周一起始
    const startPad = (first.getDay() + 6) % 7;
    const total = new Date(year, month + 1, 0).getDate();
    const list: (Date | null)[] = Array.from({ length: startPad }, () => null);
    for (let d = 1; d <= total; d++) list.push(new Date(year, month, d));
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [cursor]);

  const shift = (delta: number) => {
    const next = new Date(cursor);
    next.setMonth(next.getMonth() + delta, 1);
    setCursor(next);
  };

  return (
    <div>
      {/* 头部：‹  Sep 2026  › */}
      <div className="mb-2 flex items-center justify-between px-1">
        <button
          onClick={() => shift(-1)}
          aria-label="上个月"
          className="press rounded-full p-1.5 text-ink-faint hover:text-ink-soft"
        >
          <IconChevron width={15} height={15} className="rotate-180" />
        </button>
        <span className="num text-[19px] italic text-ink">
          {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
        </span>
        <button
          onClick={() => shift(1)}
          aria-label="下个月"
          className="press rounded-full p-1.5 text-ink-faint hover:text-ink-soft"
        >
          <IconChevron width={15} height={15} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {WEEK.map((w) => (
          <div
            key={w}
            className="pb-1.5 text-center text-[12px] text-ink-faint"
          >
            {w}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={`p${i}`} />;
          const key = keyOf(date);
          const isToday = key === today;
          const isSelected = key === selected;
          const marked = marks?.has(key) ?? false;
          return (
            <button
              key={key}
              onClick={() => onSelect?.(key, date)}
              className="press relative flex h-10 items-center justify-center"
            >
              <span
                className={`num text-[14.5px] transition-colors ${
                  isSelected
                    ? "flex h-8 w-8 items-center justify-center rounded-xl border-[1.5px] border-[var(--accent-deep)] text-[var(--accent-deep)]"
                    : isToday
                      ? "text-ink"
                      : "text-ink-soft"
                }`}
              >
                {date.getDate()}
              </span>
              {marked && !isSelected && (
                <span className="absolute bottom-[3px] h-[3px] w-[3px] rounded-full bg-[var(--accent-deep)] opacity-80" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const dayKey = keyOf;
