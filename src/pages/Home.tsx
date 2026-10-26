import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, SectionTitle, Stat } from "../components/ui/kit";
import { Calendar, dayKey } from "../components/home/Calendar";
import { Weather } from "../components/home/Weather";
import { IconCheck, IconMoon, IconPlus, IconSun } from "../components/ui/icons";
import { useLifeStore, todayKey } from "../stores/lifeStore";
import { useBoundaryStore } from "../stores/boundaryStore";
import { useThemeStore } from "../stores/themeStore";
import { useMemoryStore } from "../stores/memoryStore";
import {
  daysTogether,
  todayBoba,
  todayMeals,
  todayTotal,
  todayWords,
} from "../lib/life/derive";
import { dailyNote } from "../lib/life/note";
import { formatClock } from "../lib/utils/id";
import { MEAL_LABEL } from "../types";

const WEEKDAY = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export function Home() {
  const life = useLifeStore();
  const name = useBoundaryStore((s) => s.name);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const memories = useMemoryStore((s) => s.memories);

  const [selected, setSelected] = useState<string>(todayKey());

  const days = daysTogether(life.anniversary);
  const meals = todayMeals(life.meals);
  const total = todayTotal(life.ledger);
  const boba = todayBoba(life.ledger);
  const words = todayWords(life.words);

  const note = dailyNote({
    meals: life.meals,
    sleep: life.sleep,
    ledger: life.ledger,
    words: life.words,
    bobaBudget: life.bobaBudget,
    name,
  });

  const marks = useMemo(() => {
    const s = new Set<string>();
    for (const e of life.ledger) s.add(dayKey(new Date(e.at)));
    for (const sl of life.sleep) s.add(sl.date);
    for (const [k, v] of Object.entries(life.meals)) if (v.length) s.add(k);
    for (const m of memories) s.add(dayKey(new Date(m.createdAt)));
    return s;
  }, [life.ledger, life.sleep, life.meals, memories]);

  const dayLedger = life.ledger.filter(
    (e) => dayKey(new Date(e.at)) === selected,
  );
  const daySum = dayLedger.reduce((a, b) => a + b.amount, 0);
  const dayMemories = memories.filter(
    (m) => dayKey(new Date(m.createdAt)) === selected,
  );

  const now = new Date();

  return (
    <div className="px-5 pt-6 pb-10">
      <header className="flex items-start justify-between">
        <div>
          <p className="eyebrow">
            {now.getFullYear()}.{String(now.getMonth() + 1).padStart(2, "0")}.
            {String(now.getDate()).padStart(2, "0")} · {WEEKDAY[now.getDay()]}
          </p>
          <div className="mt-1.5 flex items-center gap-3">
            <Weather />
            <span className="h-3 w-px bg-[var(--line)]" />
            <span className="text-[13px] text-ink-faint">
              {meals.length}/3 餐
            </span>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          aria-label={theme === "night" ? "切到日间" : "切到夜间"}
          className="press glass-flat flex h-9 w-9 items-center justify-center rounded-full text-ink-soft"
        >
          {theme === "night" ? (
            <IconSun width={17} height={17} />
          ) : (
            <IconMoon width={17} height={17} />
          )}
        </button>
      </header>

      {/* 情感锚点：两个头像 + 一个很大的数字 */}
      <section className="mt-7 flex items-end justify-between">
        <div className="flex -space-x-3">
          <Avatar tone="warm" label="我" />
          <Avatar tone="cool" label="它" />
        </div>
        <p className="pb-1 text-[12.5px] leading-relaxed text-ink-faint">
          {new Date(`${life.anniversary}T00:00:00`).getFullYear()} 年
          <br />
          开始算起
        </p>
      </section>

      <section className="mt-5">
        <div className="flex items-start gap-3">
          <span className="num text-[97px] leading-[0.8] tracking-[-0.04em] text-ink">
            {days}
          </span>
          <div className="pt-2">
            <p className="serif text-[14.5px] text-ink-soft">天</p>
            <p className="mt-1 text-[12px] leading-relaxed text-ink-faint">
              互相
              <br />
              纠缠
            </p>
          </div>
        </div>
        <p className="serif mt-4 text-[17px] italic leading-[1.7] text-ink-soft">
          永远纠缠在一起吧
        </p>
      </section>

      {/* 今天的话：由生活数据推出来，不是装饰文案 */}
      <Card className="mt-7">
        <p className="eyebrow">TODAY</p>
        <p className="serif mt-2.5 text-[16.5px] leading-[1.95] text-ink">
          {note}
        </p>
        <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-3">
          <span className="text-[12.5px] text-ink-faint">
            它今天留下的 · {formatClock(now.getTime() - 3 * 3600_000)}
          </span>
          <Link
            to="/chat"
            className="tap text-[13px] text-ink-soft hover:text-ink"
          >
            回它 →
          </Link>
        </div>
      </Card>

      {/* 共处摘要 */}
      <div className="mt-4">
        <SectionTitle
          action={
            <Link
              to="/together"
              className="text-[12.5px] text-ink-faint hover:text-ink-soft"
            >
              全部
            </Link>
          }
        >
          共处
        </SectionTitle>
        <Card className="flex items-stretch gap-2 py-4">
          <Stat label="三餐" value={meals.length} unit="/3" />
          <span className="my-1 w-px bg-[var(--line)]" />
          <Stat label="今天花" value={total.toFixed(0)} unit="元" hint={`奶茶 ¥${boba.toFixed(0)}`} />
          <span className="my-1 w-px bg-[var(--line)]" />
          <Stat
            label="单词"
            value={words?.learned ?? 0}
            unit={`/${words?.goal ?? 20}`}
          />
        </Card>
      </div>

      {/* 日历 */}
      <div className="mt-5">
        <Card className="pb-4">
          <Calendar
            marks={marks}
            selected={selected}
            onSelect={(k) => setSelected(k)}
          />
          <div className="mt-3 flex items-center justify-between border-t border-[var(--line)] pt-3 text-[13px]">
            <span className="text-ink-faint">
              {selected === todayKey()
                ? "今天"
                : selected.replace(/-/g, ".")}
            </span>
            <span className="text-ink-soft">
              {daySum > 0 ? `花了 ¥${daySum.toFixed(0)}` : "没有记账"}
              {dayMemories.length > 0 && ` · ${dayMemories.length} 条记忆`}
              {dayLedger.length > 0 &&
                ` · ${dayLedger.map((d) => d.category).join("、")}`}
            </span>
          </div>
        </Card>
      </div>

      {/* 待办 */}
      <div className="mt-5">
        <SectionTitle
          action={
            <span className="text-[12.5px] text-ink-faint">
              {life.todos.filter((t) => !t.done).length} 项未完成
            </span>
          }
        >
          待办
        </SectionTitle>
        <Card pad={false} className="px-5 py-1">
          {life.todos.slice(0, 5).map((t) => (
            <button
              key={t.id}
              onClick={() => life.toggleTodo(t.id)}
              className="tap flex w-full items-center gap-3 border-b border-[var(--line)] py-3 text-left last:border-b-0"
            >
              <span
                className={`flex h-[17px] w-[17px] flex-none items-center justify-center rounded-full border transition-colors ${
                  t.done
                    ? "border-transparent bg-[var(--accent)] text-[var(--accent-ink)]"
                    : "border-[var(--line-strong)] text-transparent"
                }`}
              >
                <IconCheck width={11} height={11} strokeWidth={2.2} />
              </span>
              <span
                className={`flex-1 text-[14.5px] ${
                  t.done ? "text-ink-faint line-through" : "text-ink"
                }`}
              >
                {t.text}
              </span>
            </button>
          ))}
          <AddTodo />
        </Card>
      </div>

      <p className="mt-8 px-1 text-[12.5px] leading-[1.9] text-ink-faint">
        今天的三餐里记了 {meals.map((m) => MEAL_LABEL[m]).join("、") || "没有"}。
        这些数字不发给任何人，只在这个浏览器里。
      </p>
    </div>
  );
}

function Avatar({ tone, label }: { tone: "warm" | "cool"; label: string }) {
  const bg =
    tone === "warm"
      ? "linear-gradient(140deg,#f6ddd0,#dcb49b 62%,#c79c86)"
      : "linear-gradient(140deg,#d7e6f4,#a9c0d6 62%,#8fa8c0)";
  return (
    <div
      className="flex h-[46px] w-[46px] items-center justify-center rounded-full ring-[3px] ring-[var(--bg)]"
      style={{ background: bg, boxShadow: "inset 0 1px 2px rgba(255,255,255,.6)" }}
    >
      <span className="serif text-[13.5px] text-black/40">{label}</span>
    </div>
  );
}

function AddTodo() {
  const [text, setText] = useState("");
  const addTodo = useLifeStore((s) => s.addTodo);
  const submit = () => {
    addTodo(text);
    setText("");
  };
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="flex h-[17px] w-[17px] flex-none items-center justify-center rounded-full border border-dashed border-[var(--line-strong)] text-ink-faint">
        <IconPlus width={11} height={11} />
      </span>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="加一件小事"
        className="ghost-input w-full bg-transparent text-[14.5px] text-ink"
      />
    </div>
  );
}
