import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, dayKey } from "../components/home/Calendar";
import { IconMoon, IconPlus } from "../components/ui/icons";
import { useLifeStore, todayKey } from "../stores/lifeStore";
import { useMemoryStore } from "../stores/memoryStore";
import { useDiaryStore } from "../stores/diaryStore";
import {
  daysTogether,
  todayBoba,
  todayMeals,
  todayTotal,
  todayWords,
} from "../lib/life/derive";

/**
 * 首页：参考图逐像素对齐。
 * DAYS TOGETHER 眉题 + 绯红大数字 + 楷体引言 + Today/Upcoming/Together 卡 + 月历 + 页脚。
 */
export function Home() {
  const life = useLifeStore();
  const memories = useMemoryStore((s) => s.memories);
  const diaryEntries = useDiaryStore((s) => s.entries);

  const [selected, setSelected] = useState<string>(todayKey());

  const days = daysTogether(life.anniversary);
  const meals = todayMeals(life.meals);
  const total = todayTotal(life.ledger);
  const boba = todayBoba(life.bobas);
  const words = todayWords(life.words);
  const openTodos = life.todos.filter((t) => !t.done);

  // 选中日的日记摘句
  const dayDiary = diaryEntries.filter((e) => e.date === selected);
  const dayMemories = memories.filter(
    (m) => dayKey(new Date(m.createdAt)) === selected,
  );

  // 月历小标记：有任何记录的日子
  const calMarks = useMemo(() => {
    const s = new Set<string>();
    Object.keys(life.meals).forEach((k) => life.meals[k]?.length && s.add(k));
    life.ledger.forEach((e) => s.add(dayKey(new Date(e.at))));
    life.bobas.forEach((b) => s.add(dayKey(new Date(b.at))));
    life.sleep.forEach((sl) => s.add(sl.date));
    memories.forEach((m) => s.add(dayKey(new Date(m.createdAt))));
    return s;
  }, [life.meals, life.ledger, life.bobas, life.sleep, memories]);

  const quoteAuthor = "阿晏";

  return (
    <div className="flex flex-col px-5 pb-12 pt-10">
      {/* 眉题 + 菜单 */}
      <div className="flex items-center justify-between">
        <p className="eyebrow !tracking-[0.42em]">DAYS&nbsp;&nbsp;TOGETHER</p>
        <Link
          to="/mit"
          aria-label="菜单"
          className="press rounded-full p-1.5 text-ink-faint hover:text-ink-soft"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </Link>
      </div>

      {/* 大数字 + 引言：参考图是左对齐 */}
      <div className="mt-4">
        <h1 className="display text-[84px] italic leading-[0.9] tracking-tight text-[var(--accent)]">
          {days}
        </h1>
        <p className="kai mt-2 text-[19px] leading-[1.85] text-ink">
          永远纠缠在一起吧，红线、命运、我和你。
        </p>
        <p className="quote-by mt-1.5">— {quoteAuthor}</p>
      </div>

      <div className="mt-6 h-px w-full bg-[var(--line)]" />

      {/* Today */}
      <section className="glass mt-5 rounded-3xl px-5 py-4">
        <div className="flex items-center justify-between">
          <h2 className="card-title text-ink">Today</h2>
          <RoundPlus />
        </div>
        <p className="card-title mt-5 mb-3 text-center text-[15px] text-ink-faint">
          nothing today
        </p>
      </section>

      {/* Upcoming */}
      <section className="glass mt-4 rounded-3xl px-5 py-4">
        <div className="flex items-center justify-between">
          <h2 className="card-title text-ink">Upcoming</h2>
          <RoundPlus />
        </div>
        <div className="mt-2">
          {openTodos.length === 0 && (
            <p className="card-title py-4 text-center text-[15px] text-ink-faint">
              nothing upcoming
            </p>
          )}
          {openTodos.map((t, i) => (
            <div
              key={t.id}
              className={`flex items-center gap-3 py-3.5 ${
                i > 0 ? "border-t border-[var(--line)]" : ""
              }`}
            >
              <button
                onClick={() => life.toggleTodo(t.id)}
                aria-label="完成"
                className="press h-[19px] w-[19px] flex-none rounded-full border-[1.5px] border-[var(--line-strong)]"
              />
              {t.moon && (
                <IconMoon width={13} height={13} className="flex-none text-ink-faint" />
              )}
              <span className="min-w-0 flex-1 truncate text-[15px] text-ink">
                {t.text}
              </span>
              {t.due && (
                <span className="num flex-none text-[12.5px] text-ink-faint">
                  {t.due}
                </span>
              )}
              <button
                onClick={() => life.removeTodo(t.id)}
                aria-label="删除"
                className="press flex-none text-[13px] text-ink-faint/70 hover:text-ink-soft"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Together 摘要：life, kept › */}
      <Link to="/together" className="mt-4 block">
        <section className="glass rounded-3xl px-5 py-4">
          <div className="flex items-center justify-between">
            <h2 className="card-title text-ink">Together</h2>
            <span className="page-head-sub text-[12.5px]">life, kept ›</span>
          </div>
          <div className="mt-3 flex items-center gap-5 overflow-hidden text-[14px] text-ink">
            <span className="flex items-center gap-1.5">
              <span className="text-[13px]">🥚</span>
              <MealDots n={meals.length} />
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[13px]">😅</span>
              <span className="text-ink-soft">未记</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[13px]">🧋</span>
              <span className="num">
                {boba > 0 ? 1 : 0}/{life.bobaBudget > 0 ? 1 : 1}
              </span>
            </span>
            <span className="num flex items-center">¥{total.toFixed(0)}</span>
            <span className="flex items-center gap-1.5">
              <span className="text-[13px]">📚</span>
              <span className="num">{words?.learned ?? 0}</span>
            </span>
          </div>
        </section>
      </Link>

      {/* 月历 + 选中日的摘句 */}
      <section className="glass mt-4 rounded-3xl px-4 py-4">
        <Calendar marks={calMarks} selected={selected} onSelect={(k) => setSelected(k)} />
        {dayDiary.length > 0 && (
          <div className="mt-3 border-t border-[var(--line)] pt-3">
            <p className="num text-[12px] text-ink-faint">
              {selected.slice(5).replace("-", ".")}
            </p>
            {dayDiary.slice(0, 2).map((e) => (
              <p
                key={e.id}
                className="mt-1.5 line-clamp-2 text-[13.5px] leading-[1.85] text-ink-soft"
              >
                {e.text}
              </p>
            ))}
          </div>
        )}
        {dayMemories.length > 0 && dayDiary.length === 0 && (
          <p className="mt-3 border-t border-[var(--line)] pt-3 text-[12.5px] text-ink-faint">
            {dayMemories.length} 条记忆落在了这一天。
          </p>
        )}
      </section>

      {/* 页脚 */}
      <footer className="mt-9">
        <p className="page-head-sub text-center text-[13px]">
          婉莹 &amp; 阿晏 ♡
        </p>
      </footer>
    </div>
  );
}

/** ⊕ 圆形加号按钮（Today/Upcoming 右上） */
function RoundPlus({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="添加"
      className="press flex h-7 w-7 items-center justify-center rounded-full border border-[var(--line-strong)] text-ink-faint hover:text-ink-soft"
    >
      <IconPlus width={13} height={13} />
    </button>
  );
}

/** 三餐 ●●○ 小圆点 */
function MealDots({ n }: { n: number }) {
  return (
    <span className="num flex items-center gap-[3px] text-[13px] tracking-[0.12em]">
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < n ? "text-ink" : "text-ink-faint/60"}>
          {i < n ? "●" : "○"}
        </span>
      ))}
    </span>
  );
}
