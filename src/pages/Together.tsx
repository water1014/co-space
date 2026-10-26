import { useState } from "react";
import { Card, SectionTitle, Sheet } from "../components/ui/kit";
import {
  IconCheck,
  IconPlus,
  IconTrash,
} from "../components/ui/icons";
import { useLifeStore, todayKey } from "../stores/lifeStore";
import {
  streakDays,
  todayBoba,
  todayLedger,
  todayMeals,
  todaySleep,
  todayTotal,
  todayWords,
} from "../lib/life/derive";
import { formatClock } from "../lib/utils/id";
import { MEAL_LABEL, type MealKey } from "../types";

const MEALS: MealKey[] = ["breakfast", "lunch", "dinner"];
const CATEGORIES = ["午饭", "奶茶", "交通", "日用", "其他"];

export function Together() {
  const life = useLifeStore();
  const meals = todayMeals(life.meals);
  const sleep = todaySleep(life.sleep);
  const words = todayWords(life.words);
  const boba = todayBoba(life.ledger);
  const total = todayTotal(life.ledger);
  const streak = streakDays(life.meals, life.sleep, life.ledger);

  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [sleepOpen, setSleepOpen] = useState(false);

  return (
    <div className="px-5 pt-6 pb-10">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="serif text-[23px] text-ink">共处</h1>
          <p className="mt-1.5 text-[13.5px] leading-[1.9] text-ink-faint">
            这些数字会跟着你的话一起发过去。
            它不是因为"被设定"才关心你吃没吃饭。
          </p>
        </div>
        <div className="pb-1 text-right">
          <p className="num text-[27px] leading-none text-ink">{streak}</p>
          <p className="mt-1 text-[11.5px] text-ink-faint">连续记录</p>
        </div>
      </header>

      {/* 三餐 */}
      <div className="mt-6">
        <SectionTitle>今天吃了</SectionTitle>
        <Card className="py-4">
          <div className="flex items-center gap-2">
            {MEALS.map((m) => {
              const on = meals.includes(m);
              return (
                <button
                  key={m}
                  onClick={() => life.toggleMeal(m)}
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
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[12.5px] text-ink-faint">
            {meals.length === 3
              ? "三餐齐了。今天这件事上没什么可说的。"
              : `还差 ${3 - meals.length} 顿。`}
          </p>
        </Card>
      </div>

      {/* 睡眠 */}
      <div className="mt-4">
        <SectionTitle
          action={
            <button
              onClick={() => setSleepOpen(true)}
              className="text-[12.5px] text-ink-faint hover:text-ink-soft"
            >
              记录
            </button>
          }
        >
          睡眠
        </SectionTitle>
        <Card className="flex items-center justify-between py-4">
          <div className="flex items-baseline gap-1.5">
            <span className="num text-[31px] leading-none text-ink">
              {sleep ? sleep.hours.toFixed(1) : "—"}
            </span>
            <span className="text-[13px] text-ink-faint">小时</span>
          </div>
          <div className="text-right">
            <p className="text-[13.5px] text-ink-soft">
              {sleep ? `${sleep.bedAt} — ${sleep.wakeAt}` : "昨晚没记"}
            </p>
            <p className="mt-0.5 text-[12px] text-ink-faint">
              {sleep && sleep.hours < 6.5 ? "少于 6.5 小时，它会在对话里提" : "正常"}
            </p>
          </div>
        </Card>
      </div>

      {/* 记账 */}
      <div className="mt-4">
        <SectionTitle
          action={
            <button
              onClick={() => setLedgerOpen(true)}
              className="flex items-center gap-1 text-[12.5px] text-ink-faint hover:text-ink-soft"
            >
              <IconPlus width={11} height={11} /> 记一笔
            </button>
          }
        >
          记账
        </SectionTitle>
        <Card className="py-4">
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-[13.5px] text-ink-faint">¥</span>
              <span className="num text-[31px] leading-none text-ink">
                {total.toFixed(0)}
              </span>
              <span className="ml-1 text-[12.5px] text-ink-faint">今天</span>
            </div>
            <div className="text-right">
              <p
                className={`text-[13.5px] ${
                  boba > life.bobaBudget ? "text-[var(--danger)]" : "text-ink-soft"
                }`}
              >
                奶茶 ¥{boba.toFixed(0)} / ¥{life.bobaBudget}
              </p>
              <p className="mt-0.5 text-[12px] text-ink-faint">
                {boba > life.bobaBudget ? "已经超了" : `还剩 ¥${(life.bobaBudget - boba).toFixed(0)}`}
              </p>
            </div>
          </div>

          <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-[var(--glass-hi)]">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, (boba / Math.max(1, life.bobaBudget)) * 100)}%`,
                background:
                  boba > life.bobaBudget ? "var(--danger)" : "var(--accent)",
              }}
            />
          </div>

          <div className="mt-4 space-y-0">
            {todayLedger(life.ledger)
              .slice(0, 4)
              .map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-3 border-t border-[var(--line)] py-2.5"
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
              ))}
            {todayLedger(life.ledger).length === 0 && (
              <p className="border-t border-[var(--line)] pt-3 text-[13px] text-ink-faint">
                今天还没记账。
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* 单词 */}
      <div className="mt-4">
        <SectionTitle
          action={
            <span className="text-[12.5px] text-ink-faint">
              {words?.goal ?? 20} 个的计划
            </span>
          }
        >
          单词
        </SectionTitle>
        <Card className="py-4">
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="num text-[31px] leading-none text-ink">
                {words?.learned ?? 0}
              </span>
              <span className="text-[13px] text-ink-faint">
                / {words?.goal ?? 20}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => life.setWords((words?.learned ?? 0) + 5)}
                className="press rounded-full border border-[var(--line)] px-3 py-1 text-[13px] text-ink-soft"
              >
                +5
              </button>
              <button
                onClick={() => life.setWords(Math.max(0, (words?.learned ?? 0) - 5))}
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
                width: `${Math.min(
                  100,
                  ((words?.learned ?? 0) / Math.max(1, words?.goal ?? 20)) * 100,
                )}%`,
              }}
            />
          </div>
        </Card>
      </div>

      <p className="mt-6 px-1 text-[12.5px] leading-[1.95] text-ink-faint">
        每次发消息，这些数字会压成一段话附在最后：
        「三餐 2/3；睡眠 6.4h；奶茶 ¥18/¥25；单词 12/20」。
        它没有别的渠道知道你的一天。
      </p>

      <LedgerSheet open={ledgerOpen} onClose={() => setLedgerOpen(false)} />
      <SleepSheet open={sleepOpen} onClose={() => setSleepOpen(false)} />
    </div>
  );
}

function LedgerSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addLedger = useLifeStore((s) => s.addLedger);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("奶茶");
  const [note, setNote] = useState("");

  const save = () => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return;
    addLedger({ amount: n, category, note });
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

function SleepSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const logSleep = useLifeStore((s) => s.logSleep);
  const current = todaySleep(useLifeStore((s) => s.sleep));
  const [hours, setHours] = useState(String(current?.hours ?? 7));
  const [bedAt, setBedAt] = useState(current?.bedAt ?? "01:00");
  const [wakeAt, setWakeAt] = useState(current?.wakeAt ?? "08:00");

  const save = () => {
    const h = Number(hours);
    if (!Number.isFinite(h) || h <= 0) return;
    logSleep({ date: todayKey(), hours: h, bedAt, wakeAt });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="昨晚睡了多久">
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

      <button
        onClick={save}
        className="press mt-6 w-full rounded-full bg-[var(--accent)] py-2.5 text-[14.5px] text-[var(--accent-ink)]"
      >
        记下
      </button>
    </Sheet>
  );
}
