import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, SectionTitle, Stat } from "../components/ui/kit";
import { Weather } from "../components/home/Weather";
import { Calendar, dayKey } from "../components/home/Calendar";
import {
  IconCheck,
  IconMoon,
  IconPlus,
  IconSun,
} from "../components/ui/icons";
import { useLifeStore, todayKey } from "../stores/lifeStore";
import { useBoundaryStore } from "../stores/boundaryStore";
import { useThemeStore } from "../stores/themeStore";
import { useMemoryStore } from "../stores/memoryStore";
import {
  daysTogether,
  todayBoba,
  todayMeals,
  todaySleep,
  todayTotal,
  todayWords,
} from "../lib/life/derive";
import { dailyNote } from "../lib/life/note";
import { formatClock } from "../lib/utils/id";
import { MEAL_LABEL } from "../types";

/** 下一个生日（月/日），用于首页胶囊。 */
const BIRTHDAY = { m: 9, d: 29 };

function daysToBirthday(): number {
  const now = new Date();
  const y = now.getFullYear();
  let next = new Date(y, BIRTHDAY.m - 1, BIRTHDAY.d);
  if (next.getTime() < now.getTime()) next = new Date(y + 1, BIRTHDAY.m - 1, BIRTHDAY.d);
  return Math.ceil((next.getTime() - now.getTime()) / 86_400_000);
}

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
  const boba = todayBoba(life.bobas);
  const words = todayWords(life.words);
  const sleep = todaySleep(life.sleep);

  const note = dailyNote({
    meals: life.meals,
    sleep: life.sleep,
    ledger: life.ledger,
    bobas: life.bobas,
    words: life.words,
    bobaBudget: life.bobaBudget,
    name,
  });

  const dayLedger = life.ledger.filter((e) => dayKey(new Date(e.at)) === selected);
  const daySum = dayLedger.reduce((a, b) => a + b.amount, 0);
  const dayMemories = memories.filter((m) => dayKey(new Date(m.createdAt)) === selected);

  // 月历小标记：有任何记录的日子
  const calMarks = useMemo(() => {
    const s = new Set<string>();
    Object.keys(life.meals).forEach((k) => life.meals[k]?.length && s.add(k));
    life.ledger.forEach((e) => s.add(dayKey(new Date(e.at))));
    life.bobas.forEach((b) => s.add(dayKey(new Date(b.at))));
    memories.forEach((m) => s.add(dayKey(new Date(m.createdAt))));
    return s;
  }, [life.meals, life.ledger, life.bobas, memories]);

  const now = new Date();

  return (
    <div className="flex flex-col items-center px-5 pb-10 pt-12">
      {/* 情感锚点：两个头像 + 一颗心 */}
      <div className="flex items-center gap-3">
        <Avatar tone="me" label="我" />
        <span className="text-ink/20">
          <IconHeartMini />
        </span>
        <Avatar tone="ai" label="它" />
      </div>

      {/* 超级大数字 + 日期 */}
      <div className="mt-6 text-center">
        <p className="eyebrow">DAYS TOGETHER</p>
        <h1 className="display mt-2 text-[76px] leading-[0.82] tracking-tighter text-[var(--accent)]">
          {days}
          <span className="ml-2 text-xl text-ink/50">天</span>
        </h1>
        <p className="mt-2 text-[11px] tracking-[0.3em] text-ink-faint">
          {life.anniversary.replace(/-/g, ".")} 起
        </p>
      </div>

      {/* 胶囊标签 */}
      <div className="mt-5 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-[12px] text-ink-soft">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
        下一个 · 糖糖的生日 · 还有 {daysToBirthday()} 天
      </div>

      {/* 今天的话：由生活数据推出来，不是装饰文案 */}
      <Card className="mt-7 w-full">
        <div className="flex items-center justify-between">
          <p className="eyebrow">TODAY</p>
          <button
            onClick={toggleTheme}
            aria-label={theme === "night" ? "切到日间" : "切到夜间"}
            className="press flex h-7 w-7 items-center justify-center rounded-full text-ink-faint hover:text-ink"
          >
            {theme === "night" ? (
              <IconSun width={15} height={15} />
            ) : (
              <IconMoon width={15} height={15} />
            )}
          </button>
        </div>
        <p className="serif mt-2.5 text-[16.5px] leading-[1.95] text-ink">{note}</p>
        <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-3">
          <span className="text-[12px] text-ink-faint">
            它今天留下的 · {formatClock(now.getTime() - 3 * 3600_000)}
          </span>
          <Link to="/chat" className="tap text-[13px] text-ink-soft hover:text-ink">
            回它 →
          </Link>
        </div>
      </Card>

      {/* 模块网格：2 列 */}
      <div className="mt-4 grid w-full grid-cols-2 gap-4">
        <Module title="今日打卡">
          <p className="text-[14px] text-ink-soft">
            {meals.length >= 3 && sleep
              ? "今天都齐了。"
              : meals.length >= 3
                ? "还差睡眠。"
                : `吃了 ${meals.length}/3 餐`}
          </p>
          <p className="mt-1 text-[11px] text-ink-faint">
            <Weather /> · {meals.map((m) => MEAL_LABEL[m]).join("、") || "没记"}
          </p>
        </Module>

        <Module title="待办清单" action={<IconPlus width={13} height={13} />}>
          {life.todos.filter((t) => !t.done).length === 0 ? (
            <p className="text-[14px] text-ink-faint">都做完了。</p>
          ) : (
            <div className="flex items-center gap-2 text-[14px] text-ink">
              <span className="flex h-4 w-4 flex-none items-center justify-center rounded border border-[var(--line-strong)] text-transparent">
                <IconCheck width={10} height={10} strokeWidth={2.4} />
              </span>
              {life.todos.find((t) => !t.done)?.text ?? "喝水"}
            </div>
          )}
        </Module>

        <Module title="今天花" action={<>¥{total.toFixed(0)}</>}>
          <p className="text-[13px] text-ink-soft">
            奶茶 <span className="text-ink-faint">¥{boba.toFixed(0)}</span>
            {boba > life.bobaBudget && (
              <span className="ml-1 text-[var(--danger)]">超了</span>
            )}
          </p>
          <p className="mt-1 text-[11px] text-ink-faint">
            {dayLedger.length ? dayLedger.map((d) => d.category).join("、") : "还没记账"}
          </p>
        </Module>

        <Module title="睡眠" action={sleep ? `${sleep.hours.toFixed(1)}h` : "—"}>
          <p className="text-[13px] text-ink-soft">
            {sleep ? `${sleep.bedAt} — ${sleep.wakeAt}` : "昨晚没记"}
          </p>
          <p className="mt-1 text-[11px] text-ink-faint">
            {sleep && sleep.hours < 6.5 ? "偏少，它会在对话里提" : "正常"}
          </p>
        </Module>
      </div>

      {/* 共处摘要 */}
      <div className="mt-5 w-full">
        <SectionTitle
          action={
            <Link to="/together" className="text-[12.5px] text-ink-faint hover:text-ink-soft">
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
          <Stat label="单词" value={words?.learned ?? 0} unit={`/${words?.goal ?? 20}`} />
        </Card>
      </div>

      {/* 月历：今天落了什么，一眼对账 */}
      <div className="mt-6 w-full">
        <SectionTitle>这个月</SectionTitle>
        <Card className="py-4">
          <Calendar marks={calMarks} selected={selected} onSelect={(k) => setSelected(k)} />
        </Card>
      </div>

      {dayMemories.length > 0 && (
        <p className="mt-5 w-full px-1 text-[12px] leading-[1.9] text-ink-faint">
          {selected === todayKey() ? "今天" : selected.replace(/-/g, ".")} 落了{" "}
          {dayMemories.length} 条记忆{daySum > 0 && `，花了 ¥${daySum.toFixed(0)}`}。
        </p>
      )}

      {/* 页脚：一根红线 */}
      <footer className="mt-8 w-full">
        <div className="red-thread mx-auto w-24 opacity-70" />
        <p className="mt-3 text-center text-[11px] tracking-[0.2em] text-ink-faint">
          {name || "婉莹"} · 阿晏
        </p>
        <p className="mt-1 text-center text-[10.5px] text-ink-faint/70">
          共同空间 · 本地优先 · 数据只在这台设备上
        </p>
      </footer>
    </div>
  );
}

function Module({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="glass rounded-3xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-ink-faint">{title}</span>
        {action != null && (
          <span className="flex items-center gap-1 text-[13px] text-ink-soft">{action}</span>
        )}
      </div>
      <div className="mt-2.5">{children}</div>
    </div>
  );
}

function Avatar({ tone, label }: { tone: "me" | "ai"; label: string }) {
  const bg =
    tone === "me"
      ? "linear-gradient(140deg,#cdd9f0,#9cb2e8 62%,#7d96c8)"
      : "linear-gradient(140deg,#aeb9d6,#7e8cb4 62%,#5d6c95)";
  return (
    <div
      className="flex h-14 w-14 items-center justify-center rounded-full"
      style={{ background: bg, boxShadow: "inset 0 1px 2px rgba(255,255,255,.55)" }}
    >
      <span className="serif text-[15px] text-black/35">{label}</span>
    </div>
  );
}

function IconHeartMini() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 19.5s-6.8-4.2-6.8-9A3.7 3.7 0 0 1 12 8a3.7 3.7 0 0 1 6.8 2.5c0 4.8-6.8 9-6.8 9z" />
    </svg>
  );
}
