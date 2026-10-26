import { useMemo, useState } from "react";
import { IconChevron } from "../ui/icons";

const WEEK = ["日", "一", "二", "三", "四", "五", "六"];

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
  marks: Set<string>;
  onSelect?: (key: string, date: Date) => void;
  selected?: string;
}) {
  const [cursor, setCursor] = useState(() => new Date());
  const today = keyOf(new Date());

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startPad = first.getDay();
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
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-baseline gap-2">
          <span className="num text-[16px] text-ink">
            {cursor.getMonth() + 1}
          </span>
          <span className="text-[13px] text-ink-faint">
            {cursor.getFullYear()} 年
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => shift(-1)}
            aria-label="上个月"
            className="press rounded-full p-1.5 text-ink-faint hover:text-ink-soft"
          >
            <IconChevron width={15} height={15} className="rotate-180" />
          </button>
          <button
            onClick={() => shift(1)}
            aria-label="下个月"
            className="press rounded-full p-1.5 text-ink-faint hover:text-ink-soft"
          >
            <IconChevron width={15} height={15} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {WEEK.map((w) => (
          <div
            key={w}
            className="pb-1 text-center text-[12px] tracking-[0.1em] text-ink-faint"
          >
            {w}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={`p${i}`} />;
          const key = keyOf(date);
          const isToday = key === today;
          const isSelected = key === selected;
          const marked = marks.has(key);
          return (
            <button
              key={key}
              onClick={() => onSelect?.(key, date)}
              className="press relative flex h-9 items-center justify-center"
            >
              <span
                className={`num flex h-8 w-8 items-center justify-center rounded-full text-[14px] transition-colors ${
                  isSelected
                    ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                    : isToday
                      ? "text-ink ring-1 ring-[var(--accent)] ring-opacity-60"
                      : "text-ink-soft"
                }`}
              >
                {date.getDate()}
              </span>
              {marked && !isSelected && (
                <span className="absolute bottom-0.5 h-[3px] w-[3px] rounded-full bg-[var(--accent)] opacity-80" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const dayKey = keyOf;
