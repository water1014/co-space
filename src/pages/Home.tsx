import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, dayKey } from "../components/home/Calendar";
import { IconCheck, IconGear, IconMoon, IconPlus, ROOM_ICONS } from "../components/ui/icons";
import { IconButton, GroupTitle, Avatar } from "../components/ui/kit";
import { useLifeStore, todayKey } from "../stores/lifeStore";
import { useMemoryStore } from "../stores/memoryStore";
import { useDiaryStore } from "../stores/diaryStore";
import { useProjectsStore } from "../stores/projectsStore";
import {
  daysTogether,
  nightSleeps,
  todayMeals,
  todayWords,
  wakeDateOf,
} from "../lib/life/derive";
import { MEAL_LABEL, type MealKey } from "../types";
import { EMPTY_STATES } from "../content";
import { useText } from "../lib/content/useText";

const MEALS: MealKey[] = ["breakfast", "lunch", "dinner"];

/**
 * 首页：角色 + 房间主导。
 * 顶部是「你 ↔ 角色」的头像与一根红线，下面「在一起 N 天」；
 * 七间房作为入口网格；再往下是今日概览 / 待办 / 记忆 / 月历。
 */
export function Home() {
  const life = useLifeStore();
  const memories = useMemoryStore((s) => s.memories);
  const diaryEntries = useDiaryStore((s) => s.entries);
  const projects = useProjectsStore((s) => s.projects);
  const activeId = useProjectsStore((s) => s.activeId);
  const activeProject = projects.find((p) => p.id === activeId);

  const t = useText();
  const [selected, setSelected] = useState<string>(todayKey());
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const days = daysTogether(life.anniversary);
  const meals = todayMeals(life.meals);
  const words = todayWords(life.words);
  const openTodos = life.todos.filter((t) => !t.done);
  const night = useMemo(
    () =>
      nightSleeps(life.sleep).find(
        (s) => wakeDateOf(s.date, s.bedAt) === todayKey(),
      ),
    [life.sleep],
  );

  // 今日条目：三餐 / 睡眠 / 记账 / 奶茶 / 单词
  const todayItems = useMemo(() => {
    const t = todayKey();
    const items: { key: string; iconKey: string; label: string; value: string; by?: "wan" | "yan" }[] = [];
    MEALS.forEach((m) => {
      if (life.meals[t]?.includes(m)) {
        items.push({
          key: `meal-${m}`,
          iconKey: "meal",
          label: MEAL_LABEL[m],
          value: life.mealNotes[t]?.[m] || "吃了",
          by: life.mealBy[t]?.[m],
        });
      }
    });
    if (night) {
      items.push({
        key: "sleep",
        iconKey: "sleep",
        label: "夜睡",
        value: `${Math.floor(night.hours)}h${Math.round((night.hours % 1) * 60)}m`,
        by: night.by,
      });
    }
    life.ledger
      .filter((e) => dayKey(new Date(e.at)) === t)
      .forEach((e) => {
        items.push({
          key: `l-${e.id}`,
          iconKey: "ledger",
          label: e.note || e.category,
          value: `¥${e.amount.toFixed(2)}`,
          by: e.by,
        });
      });
    life.bobas
      .filter((b) => dayKey(new Date(b.at)) === t)
      .forEach((b) => {
        items.push({
          key: `b-${b.id}`,
          iconKey: "boba",
          label: b.note || "奶茶",
          value: `¥${b.price}`,
          by: b.by,
        });
      });
    if (words) {
      items.push({
        key: "words",
        iconKey: "words",
        label: "单词",
        value: `${words.learned}/${words.goal}`,
      });
    }
    return items;
  }, [life.meals, life.mealNotes, life.mealBy, life.sleep, life.ledger, life.bobas, life.words]);

  const dayDiary = diaryEntries.filter((e) => e.date === selected);
  const dayMemories = memories.filter(
    (m) => dayKey(new Date(m.createdAt)) === selected,
  );

  const calMarks = useMemo(() => {
    const s = new Set<string>();
    Object.keys(life.meals).forEach((k) => life.meals[k]?.length && s.add(k));
    life.ledger.forEach((e) => s.add(dayKey(new Date(e.at))));
    life.bobas.forEach((b) => s.add(dayKey(new Date(b.at))));
    life.sleep.forEach((sl) => s.add(sl.date));
    memories.forEach((m) => s.add(dayKey(new Date(m.createdAt))));
    return s;
  }, [life.meals, life.ledger, life.bobas, life.sleep, memories]);

  return (
    <div className="flex flex-col px-5 pb-14 pt-9">
      {/* 顶栏 */}
      <div className="flex items-center justify-between">
        <p className="eyebrow">CO-SPACE</p>
        <Link to="/mit" aria-label="设置">
          <IconButton label="设置">
            <IconGear width={18} height={18} />
          </IconButton>
        </Link>
      </div>

      {/* Hero：你 ↔ 角色 + 红线 + 在一起 N 天 */}
      <section className="mt-5">
        <div className="flex items-center justify-center gap-5">
          <Avatar size={56} className="ring-2 ring-[var(--surface)]">
            <span className="text-[15px] font-medium text-ink-soft">我</span>
          </Avatar>

          <RedThread />

          <Avatar
            size={56}
            className="bg-[var(--accent-soft)]"
          >
            <span className="text-[15px] font-semibold text-[var(--accent)]">
              {activeProject?.name?.[0] ?? "伴"}
            </span>
          </Avatar>
        </div>

        <div className="mt-5 text-center">
          <p className="eyebrow">我们在一起</p>
          <h1 className="display num mt-1 text-[62px] leading-none text-[var(--accent)]">
            {days}
          </h1>
          <p className="mt-2 text-[14px] text-ink-soft">
            {activeProject?.name ?? "我们的空间"}
          </p>
          <p className="kai mt-3 text-[15px] leading-[1.8] text-ink">
            {t.home.quote}
          </p>
          <p className="quote-by mt-1.5">— {t.home.quoteAuthor}</p>
        </div>
      </section>

      {/* 七间房：首页主导入口 */}
      <p className="eyebrow mb-3 mt-8 px-1">房间 · ROOMS</p>
      <div className="grid grid-cols-2 gap-3">
        {t.rooms.map((r) => {
          const RoomIcon = ROOM_ICONS[r.key];
          return (
            <Link
              key={r.key}
              to="/together"
              className="glass press rounded-2xl px-4 py-3.5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--ink)]">
                  <RoomIcon width={18} height={18} />
                </span>
                <span className="text-[15px] font-medium text-ink">{r.label}</span>
              </div>
              <p className="mt-2.5 line-clamp-2 text-[12px] leading-[1.6] text-ink-faint">
                {r.slogan}
              </p>
            </Link>
          );
        })}
      </div>

      {/* 01 · 今日 */}
      <GroupTitle index="01" title="今日" en="TODAY" />
      <section className="glass rounded-2xl px-5 py-4">
        <div className="flex items-center justify-between">
          <h2 className="card-title text-ink">今日</h2>
          <RoundPlus onClick={() => setAdding((v) => !v)} />
        </div>

        {adding && (
          <div className="mt-3 flex gap-2">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  life.addTodo(draft);
                  setDraft("");
                  setAdding(false);
                }
              }}
              placeholder="要记住的一件事..."
              className="ghost-input min-w-0 flex-1 rounded-xl bg-[var(--surface-2)] px-3 py-2 text-[13px] text-ink placeholder:text-ink-faint"
            />
            <button
              onClick={() => {
                life.addTodo(draft);
                setDraft("");
                setAdding(false);
              }}
              className="btn-solid flex-none px-4 py-2 text-[13px]"
            >
              记
            </button>
          </div>
        )}

        {todayItems.length === 0 ? (
          <p className="card-title mt-5 mb-3 text-center text-[15px] text-ink-faint">
            {EMPTY_STATES.emptyToday}
          </p>
        ) : (
          <div className="mt-3">
          {todayItems.map((it, i) => {
            const Icon = ROOM_ICONS[it.iconKey];
            return (
              <div
                key={it.key}
                className={`flex items-center gap-3 py-2.5 ${
                  i > 0 ? "border-t border-[var(--line)]" : ""
                }`}
              >
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[var(--surface-2)] text-ink-soft">
                  <Icon width={14} height={14} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[14px] text-ink">
                  {it.label}
                </span>
                <span className="num flex-none text-[12.5px] text-ink-soft">
                  {it.value}
                </span>
                {it.by && (
                  <span
                    className="h-[6px] w-[6px] flex-none rounded-full"
                    style={{
                      background:
                        it.by === "wan" ? "var(--accent-deep)" : "var(--ink-faint)",
                    }}
                  />
                )}
              </div>
            );
          })}
          </div>
        )}

        {/* 快速打卡：三餐一按就记上 */}
        <div className="mt-3 flex items-center gap-2 border-t border-[var(--line)] pt-3">
          {MEALS.map((m) => {
            const on = meals.includes(m);
            return (
              <button
                key={m}
                onClick={() => life.toggleMeal(m, "wan", todayKey())}
                className={`press flex flex-1 items-center justify-center gap-1.5 rounded-full border py-1.5 text-[12.5px] ${
                  on
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "border-[var(--line)] text-ink-faint"
                }`}
              >
                <IconCheck width={11} height={11} strokeWidth={2.4} />
                {MEAL_LABEL[m]}
              </button>
            );
          })}
        </div>
      </section>

      {/* 02 · 待办 */}
      <GroupTitle index="02" title="待办" en="UPCOMING" />
      <section className="glass rounded-2xl px-5 py-4">
        <div className="mt-2">
          {openTodos.length === 0 && (
            <p className="card-title py-4 text-center text-[15px] text-ink-faint">
              {EMPTY_STATES.emptyTodos}
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
                <span className="num flex-none text-[12.5px] text-ink-faint">{t.due}</span>
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

      {/* 03 · 记忆 */}
      <GroupTitle index="03" title="记忆" en="MEMORY" />
      <section className="glass rounded-2xl px-5 py-4">
        {memories.length === 0 ? (
          <p className="card-title py-4 text-center text-[15px] text-ink-faint">
            还没有记下什么值得收藏的。
          </p>
        ) : (
          <div className="mt-1 space-y-3">
            {memories.slice(0, 3).map((m) => (
              <div key={m.id} className="flex gap-3">
                <span className="mt-1.5 h-[6px] w-[6px] flex-none rounded-full bg-[var(--accent)]" />
                <div className="min-w-0">
                  <p className="text-[14px] leading-[1.7] text-ink">{m.text}</p>
                  <p className="num mt-0.5 text-[11px] text-ink-faint">
                    {dayKey(new Date(m.createdAt)).slice(5).replace("-", ".")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        <Link
          to="/memory"
          className="mt-3 block border-t border-[var(--line)] pt-3 text-center text-[13px] text-[var(--accent)]"
        >
          查看全部记忆 ›
        </Link>
      </section>

      {/* 04 · 月历 */}
      <GroupTitle index="04" title="月历" en="CALENDAR" />
      <section className="glass rounded-2xl px-4 py-4">
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

      <footer className="mt-9">
        <p className="page-head-sub text-center text-[13px]">{t.home.footer}</p>
      </footer>
    </div>
  );
}

/** 你 ↔ 角色 之间的一根红线（命运感） */
function RedThread() {
  return (
    <svg width="44" height="22" viewBox="0 0 44 22" fill="none" aria-hidden>
      <path
        d="M3 11 C 13 3, 17 19, 22 11 S 35 3, 41 11"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="1 4"
      />
      <circle cx="22" cy="11" r="2.4" fill="var(--accent)" />
    </svg>
  );
}

/** ⊕ 圆形加号按钮 */
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
