import { useMemo, useState } from "react";
import { Card, SectionTitle, Sheet } from "../components/ui/kit";
import { IconCheck, IconPlus, IconTrash } from "../components/ui/icons";
import { useLifeStore, todayKey } from "../stores/lifeStore";
import { TrendChart } from "../components/together/TrendChart";
import {
  ByDot,
  CalendarSheet,
  RoomShell,
  dayKeyOf,
} from "../components/together/Room";
import {
  last7,
  monthSummary,
  nightSleeps,
  naps,
} from "../lib/life/derive";
import { formatClock } from "../lib/utils/id";
import { MEAL_LABEL, WHO_LABEL, type MealKey, type Who } from "../types";

const MEALS: MealKey[] = ["breakfast", "lunch", "dinner"];
const CATEGORIES = ["午饭", "晚饭", "交通", "日用", "其他"];

/**
 * 一个页面，七个房间。奖惩留白，以后由任务完成情况自动喂进来。
 * 每个房间共用一套骨架：猫 + 标语 + 月亮按钮 + 一周切换条 + 自己的卡片。
 */
const ROOMS = [
  { key: "meals", label: "三餐", slogan: "到饭点了。别让我问第二遍。" },
  { key: "sleep", label: "睡眠", slogan: "早点睡。你知道我会说这句话。" },
  { key: "ledger", label: "记账", slogan: "花了就记。数字不会自己长出来。" },
  { key: "boba", label: "奶茶", slogan: "额度是我给的，也是我会收回的。" },
  { key: "words", label: "单词", slogan: "今天背了吗？我每天都会问。" },
  { key: "wrong", label: "错词", slogan: "错过的词，别让它再错第二次。" },
  { key: "rewards", label: "奖惩", slogan: "还没想好。留白也是一种规则。" },
] as const;

type RoomKey = (typeof ROOMS)[number]["key"];

/** 时间戳 → dayKey（Room 里的 dayKeyOf 只收 Date）。 */
const keyOfTs = (t: number) => dayKeyOf(new Date(t));

export function Together() {
  const life = useLifeStore();
  const [room, setRoom] = useState<RoomKey>("meals");
  const [selected, setSelected] = useState(todayKey());
  const [calMonth, setCalMonth] = useState(new Date());
  const [calOpen, setCalOpen] = useState(false);
  /** 现在是谁在记：切换后，所有按钮都以这个身份落记录。 */
  const [who, setWho] = useState<Who>("wan");

  const active = ROOMS.find((r) => r.key === room)!;

  /** 月历上的小标记：这天有任何记录就算记了。 */
  const marks = useMemo(() => {
    const s = new Set<string>();
    Object.keys(life.meals).forEach((k) => life.meals[k]?.length && s.add(k));
    nightSleeps(life.sleep).forEach((x) => s.add(x.date));
    naps(life.sleep).forEach((x) => s.add(x.date));
    life.ledger.forEach((e) => s.add(keyOfTs(e.at)));
    life.bobas.forEach((b) => s.add(keyOfTs(b.at)));
    life.words.forEach((w) => w.learned > 0 && s.add(w.date));
    return s;
  }, [life.meals, life.sleep, life.ledger, life.bobas, life.words]);

  const month = useMemo(
    () =>
      monthSummary({
        month: calMonth,
        meals: life.meals,
        sleep: life.sleep,
        ledger: life.ledger,
        bobas: life.bobas,
        wrongWords: life.wrongWords,
        words: life.words,
      }),
    [calMonth, life],
  );

  return (
    <div className="px-5 pt-6 pb-10">
      <header>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="serif text-[23px] text-ink">共处</h1>
            <p className="mt-1 text-[12.5px] text-ink-faint">
              一个页面，七个房间。记录存在一处，两个人都能写。
            </p>
          </div>
          {/* 谁在记：婉莹绯红点，阿晏月白点 */}
          <div className="glass-flat flex flex-none items-center gap-0.5 p-1">
            {(["wan", "yan"] as Who[]).map((w) => (
              <button
                key={w}
                onClick={() => setWho(w)}
                className={`press flex flex-none items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-[11.5px] ${
                  who === w ? "bg-[var(--glass-hi)] text-ink" : "text-ink-faint"
                }`}
              >
                <span
                  className="h-[7px] w-[7px] rounded-full"
                  style={{
                    background: w === "wan" ? "var(--accent)" : "#cfd8e3",
                  }}
                />
                {WHO_LABEL[w]}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 七个房间的门牌 */}
      <nav className="scroll-area -mx-1 mt-4 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {ROOMS.map((r) => (
          <button
            key={r.key}
            onClick={() => setRoom(r.key)}
            className={`press flex-none rounded-full border px-4 py-1.5 text-[13px] transition-colors ${
              room === r.key
                ? "border-[var(--accent)] bg-[var(--accent)]/15 text-ink"
                : "border-[var(--line)] text-ink-faint"
            }`}
          >
            {r.label}
            {r.key === "rewards" && (
              <span className="ml-1 text-[10px] text-ink-faint">待做</span>
            )}
          </button>
        ))}
      </nav>

      <div className="mt-5">
        <RoomShell
          key={room}
          slogan={active.slogan}
          selected={selected}
          onSelectDay={setSelected}
          onOpenCalendar={() => setCalOpen(true)}
        >
          {room === "meals" && <MealsRoom life={life} selected={selected} who={who} />}
          {room === "sleep" && <SleepRoom life={life} selected={selected} who={who} />}
          {room === "ledger" && <LedgerRoom life={life} selected={selected} who={who} />}
          {room === "boba" && <BobaRoom life={life} selected={selected} who={who} />}
          {room === "words" && <WordsRoom life={life} selected={selected} who={who} />}
          {room === "wrong" && <WrongRoom life={life} who={who} />}
          {room === "rewards" && <RewardsRoom />}
        </RoomShell>
      </div>

      {/* 本月总结：每个房间底下都能看，跟随月历切换的年月 */}
      <div className="mt-8">
        <SectionTitle>
          {calMonth.getFullYear()} 年 {calMonth.getMonth() + 1} 月 · 总结
        </SectionTitle>
        <Card className="py-4">
          <div className="grid grid-cols-3 gap-y-4 text-center">
            <MonthStat label="几顿饭" value={`${month.meals}`} />
            <MonthStat label="平均睡" value={`${month.avgSleep}`} unit="h" />
            <MonthStat label="花了" value={`¥${month.spend}`} />
            <MonthStat label="奶茶" value={`${month.bobas}`} unit="杯" />
            <MonthStat label="单词" value={`${month.learned}`} />
            <MonthStat label="错词" value={`${month.wrong}`} unit="个" />
          </div>
        </Card>
      </div>

      {/* 联动说明：他每次聊天前能读到今天的概况和本月总结 */}
      <p className="mt-5 px-1 text-[12.5px] leading-[1.95] text-ink-faint">
        约定里写了：阿晏要主动帮我记、每天问我单词。
        他每次聊天前能读到今天的概况和本月总结，
        所以他会知道「你今天还没吃午饭」或「这个月奶茶超了」。
        这个页面不是我一个人在填。
      </p>

      <CalendarSheet
        open={calOpen}
        onClose={() => setCalOpen(false)}
        month={calMonth}
        setMonth={setCalMonth}
        selected={selected}
        onSelect={setSelected}
        marks={marks}
      />
    </div>
  );
}

function MonthStat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div>
      <p className="num text-[19px] leading-none text-ink">
        {value}
        {unit && <span className="ml-0.5 text-[11px] text-ink-faint">{unit}</span>}
      </p>
      <p className="mt-1.5 text-[11px] text-ink-faint">{label}</p>
    </div>
  );
}

/* ---------------- 三餐 ---------------- */

function MealsRoom({
  life,
  selected,
  who,
}: {
  life: ReturnType<typeof useLifeStore.getState>;
  selected: string;
  who: Who;
}) {
  const dayMeals = life.meals[selected] ?? [];
  const dayBy = life.mealBy[selected] ?? {};
  const isToday = selected === todayKey();

  return (
    <Card className="py-4">
      <div className="flex items-center gap-2">
        {MEALS.map((m) => {
          const on = dayMeals.includes(m);
          return (
            <button
              key={m}
              onClick={() => life.toggleMeal(m, who, selected)}
              className={`press flex flex-1 flex-col items-center gap-2 rounded-2xl border py-3 transition-colors ${
                on
                  ? "border-transparent bg-[var(--accent)] text-[var(--accent-ink)]"
                  : "border-[var(--line)] text-ink-faint"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                  on
                    ? "border-[var(--accent-ink)]/30 bg-[var(--accent-ink)]/10"
                    : "border-[var(--line-strong)]"
                }`}
              >
                {on && <IconCheck width={12} height={12} strokeWidth={2.4} />}
              </span>
              <span className="text-[13px]">{MEAL_LABEL[m]}</span>
              {on && <ByDot by={dayBy[m]} />}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[12.5px] text-ink-faint">
        {dayMeals.length === 3
          ? "三餐齐了。今天这件事上没什么可说的。"
          : isToday
            ? `还差 ${3 - dayMeals.length} 顿。`
            : `${selected.replace(/-/g, ".")} 记了 ${dayMeals.length} 顿。`}
      </p>
    </Card>
  );
}

/* ---------------- 睡眠：夜睡 + 午睡 ---------------- */

function SleepRoom({
  life,
  selected,
  who,
}: {
  life: ReturnType<typeof useLifeStore.getState>;
  selected: string;
  who: Who;
}) {
  const [open, setOpen] = useState(false);
  const night = nightSleeps(life.sleep).find((s) => s.date === selected);
  const dayNaps = naps(life.sleep).filter((s) => s.date === selected);
  const week = last7(life.ledger, life.sleep);

  return (
    <div className="space-y-3">
      <Card className="py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] text-ink-faint">
              夜睡 <ByDot by={night?.by} />
            </p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="num text-[31px] leading-none text-ink">
                {night ? night.hours.toFixed(1) : "—"}
              </span>
              <span className="text-[13px] text-ink-faint">小时</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[13.5px] text-ink-soft">
              {night ? `${night.bedAt} — ${night.wakeAt}` : "没记"}
            </p>
            <p className="mt-0.5 text-[11.5px] text-ink-faint">
              入睡日期 · {selected.replace(/-/g, ".")}
              {night?.bedAt && Number(night.bedAt.split(":")[0]) < 6
                ? "（凌晨，算前一晚）"
                : ""}
            </p>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="press mt-3 w-full rounded-2xl border border-[var(--line)] py-2 text-[13px] text-ink-soft"
        >
          {night ? "改这一晚" : "记这一晚"}
        </button>
        <p className="mt-2 text-[11.5px] text-ink-faint">
          凌晨两点睡的算前一天——入睡日期以躺下的那一刻为准。
        </p>
      </Card>

      <Card className="py-4">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[11px] text-ink-faint">
            午睡 {dayNaps.length > 0 && <ByDot by={dayNaps[0]?.by} />}
          </p>
          <p className="num text-[13px] text-ink-soft">
            {dayNaps.length
              ? `${dayNaps.reduce((s, x) => s + (x.minutes ?? 0), 0)} 分钟`
              : "没睡"}
          </p>
        </div>
        <div className="mt-3 flex gap-2">
          {[20, 30, 45, 60].map((m) => (
            <button
              key={m}
              onClick={() => life.logNap({ minutes: m, by: who, dateKey: selected })}
              className="press flex-1 rounded-2xl border border-[var(--line)] py-2 text-[13px] text-ink-soft hover:border-[var(--accent)]"
            >
              {m}′
            </button>
          ))}
        </div>
      </Card>

      <Card className="py-4">
        <p className="text-[11px] text-ink-faint">最近七天 · 夜睡</p>
        <div className="mt-2">
          <TrendChart
            data={week.map((d) => ({ label: d.label, value: d.hours }))}
            color="var(--accent)"
            unit="h"
          />
        </div>
      </Card>

      <SleepSheet open={open} onClose={() => setOpen(false)} selected={selected} who={who} />
    </div>
  );
}

function SleepSheet({
  open,
  onClose,
  selected,
  who,
}: {
  open: boolean;
  onClose: () => void;
  selected: string;
  who: Who;
}) {
  const logSleep = useLifeStore((s) => s.logSleep);
  const current = nightSleeps(useLifeStore((s) => s.sleep)).find(
    (s) => s.date === selected,
  );
  const [hours, setHours] = useState(String(current?.hours ?? 7));
  const [bedAt, setBedAt] = useState(current?.bedAt ?? "01:00");
  const [wakeAt, setWakeAt] = useState(current?.wakeAt ?? "08:00");

  // 入睡日期：凌晨（6 点前）躺下算前一天
  const [h] = bedAt.split(":").map(Number);
  const bedDay = Number.isFinite(h) && h < 6 ? -1 : 0;
  const dateKey = useMemo(() => {
    const d = new Date(`${selected}T12:00:00`);
    d.setDate(d.getDate() + bedDay);
    return dayKeyOf(d);
  }, [selected, bedDay]);

  const save = () => {
    const n = Number(hours);
    if (!Number.isFinite(n) || n <= 0) return;
    logSleep({
      date: dateKey,
      hours: n,
      bedAt,
      wakeAt,
      kind: "night",
      by: who,
    });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="这一晚睡了多久">
      <div className="flex items-baseline gap-2 border-b border-[var(--line)] pb-2">
        <input
          autoFocus
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          inputMode="decimal"
          className="num ghost-input w-24 bg-transparent text-[31px] text-ink"
        />
        <span className="text-[14.5px] text-ink-faint">小时</span>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <label className="flex-1">
          <span className="eyebrow">躺下</span>
          <input
            value={bedAt}
            onChange={(e) => setBedAt(e.target.value)}
            placeholder="01:40"
            className="mt-1 w-full border-b border-[var(--line)] bg-transparent pb-2 text-[15.5px] text-ink"
          />
        </label>
        <span className="pt-5 text-ink-faint">—</span>
        <label className="flex-1">
          <span className="eyebrow">起来</span>
          <input
            value={wakeAt}
            onChange={(e) => setWakeAt(e.target.value)}
            placeholder="08:05"
            className="mt-1 w-full border-b border-[var(--line)] bg-transparent pb-2 text-[15.5px] text-ink"
          />
        </label>
      </div>
      <p className="mt-2 text-[11.5px] text-ink-faint">
        入睡日期 · {dateKey.replace(/-/g, ".")}
        {bedDay < 0 ? "（凌晨躺下，记到前一天）" : ""} · 记的人{" "}
        {WHO_LABEL[who]}
      </p>

      <button
        onClick={save}
        className="press mt-6 w-full rounded-full bg-[var(--accent)] py-2.5 text-[14.5px] text-[var(--accent-ink)]"
      >
        记下
      </button>
    </Sheet>
  );
}

/* ---------------- 记账 ---------------- */

function LedgerRoom({
  life,
  selected,
  who,
}: {
  life: ReturnType<typeof useLifeStore.getState>;
  selected: string;
  who: Who;
}) {
  const [open, setOpen] = useState(false);
  const dayLedger = life.ledger.filter((e) => keyOfTs(e.at) === selected);
  const sum = dayLedger.reduce((a, b) => a + b.amount, 0);
  const week = last7(life.ledger, life.sleep);

  return (
    <div className="space-y-3">
      <Card className="py-4">
        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-[13.5px] text-ink-faint">¥</span>
            <span className="num text-[31px] leading-none text-ink">
              {sum.toFixed(0)}
            </span>
            <span className="ml-1 text-[12.5px] text-ink-faint">
              {selected === todayKey() ? "今天" : selected.replace(/-/g, ".")}
            </span>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="press flex items-center gap-1 rounded-full border border-[var(--line)] px-3 py-1.5 text-[12.5px] text-ink-soft"
          >
            <IconPlus width={11} height={11} /> 记一笔
          </button>
        </div>
        <div className="mt-3">
          <TrendChart
            data={week.map((d) => ({ label: d.label, value: d.amount }))}
            color="var(--accent)"
            unit=" 元"
          />
        </div>
      </Card>

      <Card pad={false} className="px-4">
        {dayLedger.length === 0 ? (
          <p className="py-4 text-[13px] text-ink-faint">这天还没记账。</p>
        ) : (
          dayLedger.map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-3 border-b border-[var(--line)] py-2.5 last:border-0"
            >
              <span className="num w-10 flex-none text-[12px] text-ink-faint">
                {formatClock(e.at)}
              </span>
              <span className="flex-1 truncate text-[13.5px] text-ink">
                {e.category}
                {e.note && (
                  <span className="ml-1.5 text-[12.5px] text-ink-faint">
                    {e.note}
                  </span>
                )}
              </span>
              <ByDot by={e.by} />
              <span className="num text-[13.5px] text-ink-soft">
                ¥{e.amount.toFixed(0)}
              </span>
              <button
                onClick={() => life.removeLedger(e.id)}
                aria-label="删除这一笔"
                className="text-ink-faint/60 hover:text-[var(--danger)]"
              >
                <IconTrash width={12} height={12} />
              </button>
            </div>
          ))
        )}
      </Card>

      <LedgerSheet
        open={open}
        onClose={() => setOpen(false)}
        selected={selected}
        who={who}
      />
    </div>
  );
}

function LedgerSheet({
  open,
  onClose,
  selected,
  who,
}: {
  open: boolean;
  onClose: () => void;
  selected: string;
  who: Who;
}) {
  const addLedger = useLifeStore((s) => s.addLedger);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("午饭");
  const [note, setNote] = useState("");

  const save = () => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return;
    addLedger({ amount: n, category, note, by: who });
    setAmount("");
    setNote("");
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="记一笔">
      <div className="flex items-baseline gap-2 border-b border-[var(--line)] pb-2">
        <span className="text-[17px] text-ink-faint">¥</span>
        <input
          autoFocus
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          placeholder="0"
          className="num ghost-input w-full bg-transparent text-[31px] text-ink"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`press rounded-full border px-3 py-1 text-[13.5px] ${
              category === c
                ? "border-[var(--accent)] text-ink"
                : "border-[var(--line)] text-ink-faint"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="备注（可不填）"
        className="ghost-input mt-4 w-full border-b border-[var(--line)] bg-transparent pb-2 text-[14.5px] text-ink"
      />
      <p className="mt-2 text-[11.5px] text-ink-faint">
        记到 {selected.replace(/-/g, ".")} · 记的人 {WHO_LABEL[who]}
      </p>

      <button
        onClick={save}
        disabled={!Number(amount)}
        className="press mt-5 w-full rounded-full bg-[var(--accent)] py-2.5 text-[14.5px] text-[var(--accent-ink)] disabled:opacity-35"
      >
        记下
      </button>
    </Sheet>
  );
}

/* ---------------- 奶茶：独立房间，带额度 ---------------- */

function BobaRoom({
  life,
  selected,
  who,
}: {
  life: ReturnType<typeof useLifeStore.getState>;
  selected: string;
  who: Who;
}) {
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const isToday = selected === todayKey();

  const dayBobas = life.bobas.filter((b) => keyOfTs(b.at) === selected);
  const spent = dayBobas.reduce((s, b) => s + b.price, 0);
  const over = spent > life.bobaBudget;

  return (
    <Card className="py-4">
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="num text-[31px] leading-none text-ink">
            ¥{spent.toFixed(0)}
          </span>
          <span className="text-[13px] text-ink-faint">
            / ¥{life.bobaBudget} 额度
          </span>
        </div>
        <span
          className={`num text-[12px] ${
            over ? "text-[var(--danger)]" : "text-ink-faint"
          }`}
        >
          {over
            ? `已超 ¥${(spent - life.bobaBudget).toFixed(0)}`
            : `${dayBobas.length} 杯`}
        </span>
      </div>
      <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-[var(--glass-hi)]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(100, (spent / Math.max(1, life.bobaBudget)) * 100)}%`,
            background: over ? "var(--danger)" : "var(--accent)",
          }}
        />
      </div>
      {over && (
        <p className="mt-2.5 text-[13px] text-[var(--danger)]">
          超了。我不会替你点，也不会假装没看见。
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          inputMode="decimal"
          placeholder="¥ 18"
          className="ghost-input num w-20 rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-[14px] text-ink"
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="三分糖"
          className="ghost-input flex-1 rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-[14px] text-ink"
        />
        <button
          onClick={() => {
            const n = Number(price) || 18;
            life.addBoba({ price: n, note, by: who, dateKey: isToday ? undefined : selected });
            setPrice("");
            setNote("");
          }}
          className="press flex-none rounded-xl bg-[var(--accent)] px-4 text-[13.5px] text-[var(--accent-ink)]"
        >
          + 一杯
        </button>
      </div>

      <div className="mt-2">
        {dayBobas.map((b) => (
          <div
            key={b.id}
            className="flex items-center gap-3 border-t border-[var(--line)] py-2.5"
          >
            <span className="num w-10 flex-none text-[12px] text-ink-faint">
              {formatClock(b.at)}
            </span>
            <span className="flex-1 truncate text-[13.5px] text-ink">
              奶茶
              {b.note && (
                <span className="ml-1.5 text-[12.5px] text-ink-faint">
                  {b.note}
                </span>
              )}
            </span>
            <ByDot by={b.by} />
            <span className="num text-[13.5px] text-ink-soft">
              ¥{b.price.toFixed(0)}
            </span>
            <button
              onClick={() => life.removeBoba(b.id)}
              aria-label="删除这杯"
              className="text-ink-faint/60 hover:text-[var(--danger)]"
            >
              <IconTrash width={12} height={12} />
            </button>
          </div>
        ))}
        {dayBobas.length === 0 && (
          <p className="border-t border-[var(--line)] pt-3 text-[13px] text-ink-faint">
            这天还没喝。挺好的。
          </p>
        )}
      </div>
    </Card>
  );
}

/* ---------------- 单词 ---------------- */

function WordsRoom({
  life,
  selected,
  who: _who,
}: {
  life: ReturnType<typeof useLifeStore.getState>;
  selected: string;
  who: Who;
}) {
  const dayWords = life.words.find((w) => w.date === selected);
  const learned = dayWords?.learned ?? 0;
  const goal = dayWords?.goal ?? 20;

  return (
    <Card className="py-4">
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="num text-[31px] leading-none text-ink">
            {learned}
          </span>
          <span className="text-[13px] text-ink-faint">/ {goal}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => life.setWords(learned + 5, selected)}
            className="press rounded-full border border-[var(--line)] px-3 py-1 text-[13px] text-ink-soft"
          >
            +5
          </button>
          <button
            onClick={() => life.setWords(Math.max(0, learned - 5), selected)}
            className="press rounded-full border border-[var(--line)] px-3 py-1 text-[13px] text-ink-faint"
          >
            −5
          </button>
        </div>
      </div>
      <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-[var(--glass-hi)]">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-all duration-700"
          style={{
            width: `${Math.min(100, (learned / Math.max(1, goal)) * 100)}%`,
          }}
        />
      </div>
      <p className="mt-3 text-[12.5px] text-ink-faint">
        约定里写了：他每天问我单词。答不上来的时候，别装忙。
      </p>
    </Card>
  );
}

/* ---------------- 错词本 ---------------- */

function WrongRoom({
  life,
  who,
}: {
  life: ReturnType<typeof useLifeStore.getState>;
  who: Who;
}) {
  const [word, setWord] = useState("");
  const [reason, setReason] = useState("");

  return (
    <div className="space-y-3">
      <Card className="py-4">
        <div className="flex gap-2">
          <input
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="错词"
            className="ghost-input w-28 rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-[14px] text-ink"
          />
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="怎么错的"
            className="ghost-input flex-1 rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-[14px] text-ink"
          />
          <button
            onClick={() => {
              if (!word.trim()) return;
              life.addWrongWord({ word, reason, by: who });
              setWord("");
              setReason("");
            }}
            className="press flex-none rounded-xl bg-[var(--accent)] px-4 text-[13.5px] text-[var(--accent-ink)]"
          >
            收进本子
          </button>
        </div>
      </Card>

      <Card pad={false} className="px-4">
        {life.wrongWords.length === 0 ? (
          <p className="py-4 text-[13px] text-ink-faint">
            本子还空着。空着最好。
          </p>
        ) : (
          life.wrongWords.map((w) => (
            <div
              key={w.id}
              className="flex items-center gap-3 border-b border-[var(--line)] py-3 last:border-0"
            >
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[var(--accent)]/15 text-[11px] text-[var(--accent)]">
                {w.times}
              </span>
              <span className="flex-1 truncate text-[14px] text-ink">
                {w.word}
                {w.reason && (
                  <span className="ml-1.5 text-[12px] text-ink-faint">
                    {w.reason}
                  </span>
                )}
              </span>
              <ByDot by={w.by} />
              <button
                onClick={() => life.removeWrongWord(w.id)}
                aria-label="划掉这个词"
                className="text-ink-faint/60 hover:text-[var(--danger)]"
              >
                <IconTrash width={12} height={12} />
              </button>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

/* ---------------- 奖惩：留白 ---------------- */

function RewardsRoom() {
  return (
    <Card className="flex flex-col items-center py-10">
      <span className="text-ink-faint/60">
        <PixelCatQuiet />
      </span>
      <p className="serif mt-4 text-[15px] text-ink-soft">奖惩 · 待做</p>
      <p className="mt-2 max-w-[260px] text-center text-[12.5px] leading-[1.9] text-ink-faint">
        这间房留白。以后由任务完成情况自动喂进来——
        规则没想好之前，不放一个空架子在这里。
      </p>
    </Card>
  );
}

function PixelCatQuiet() {
  return (
    <svg width="36" height="40" viewBox="0 0 9 10" aria-hidden>
      {[
        ".X.....X.",
        ".XX...XX.",
        "..XXXXX..",
        ".XXXXXXX.",
        ".XXXXXXX.",
        ".XXXXXXX.",
        "..XXXXX..",
        "..XXXXX..",
        ".XX.X.XX.",
        ".X.....X.",
      ].flatMap((row, y) =>
        [...row].map((c, x) =>
          c === "X" ? (
            <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="currentColor" opacity="0.7" />
          ) : null,
        ),
      )}
    </svg>
  );
}
