import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  IconCheck,
  IconChevron,
  IconClose,
  IconMoon,
  IconPlus,
} from "../components/ui/icons";
import { Calendar } from "../components/home/Calendar";
import { useLifeStore, todayKey } from "../stores/lifeStore";
import { monthSummary, naps, nightSleeps } from "../lib/life/derive";
import { dayKeyOf } from "../lib/utils/id";
import { MEAL_LABEL, WHO_LABEL, type MealKey, type Who } from "../types";

/* ---------------- 配置 ---------------- */

const ROOMS = [
  { key: "meal", emoji: "🥚", label: "三餐", slogan: "吃了什么不重要,吃了就好。" },
  { key: "sleep", emoji: "😅", label: "睡眠", slogan: "早点睡。你知道我会说这句话。" },
  { key: "ledger", emoji: "¥", label: "记账", slogan: "花了就花了,记一下就行。" },
  { key: "boba", emoji: "🧋", label: "奶茶", slogan: "这个月的额度我说了算。但你撒娇的话另说。" },
  { key: "words", emoji: "📚", label: "单词", slogan: "一天三十个,我陪你考。" },
  { key: "wrong", emoji: "×", label: "错词", slogan: "错过的，才记得牢。" },
  { key: "reward", emoji: "✨", label: "奖惩", slogan: "做得好有赏，做不好……也有账。" },
] as const;

type RoomKey = (typeof ROOMS)[number]["key"];
const MEALS: MealKey[] = ["breakfast", "lunch", "dinner"];

const keyOfTs = (ts: number) => dayKeyOf(ts);
const md = (key: string) => `${Number(key.slice(5, 7))}/${Number(key.slice(8, 10))}`;

/* ---------------- 页面 ---------------- */

export function Together() {
  const life = useLifeStore();
  const [room, setRoom] = useState<RoomKey>("meal");
  const [who, setWho] = useState<Who>("wan");
  const [selected, setSelected] = useState<string>(todayKey());
  const [calOpen, setCalOpen] = useState(true);

  const marks = useMemo(() => {
    const s = new Set<string>();
    Object.keys(life.meals).forEach((k) => life.meals[k]?.length && s.add(k));
    life.sleep.forEach((x) => s.add(x.date));
    life.ledger.forEach((e) => s.add(keyOfTs(e.at)));
    life.bobas.forEach((b) => s.add(keyOfTs(b.at)));
    return s;
  }, [life.meals, life.sleep, life.ledger, life.bobas]);

  const cfg = ROOMS.find((r) => r.key === room)!;

  return (
    <div className="flex flex-col px-4 pb-12 pt-6">
      {/* 头部：‹ Together / life, kept */}
      <div className="flex items-start gap-2 px-1">
        <Link to="/" className="press mt-2 text-ink-faint hover:text-ink-soft" aria-label="返回">
          <IconChevron width={16} height={16} className="rotate-180" />
        </Link>
        <div>
          <h1 className="page-head-title text-[30px] leading-none text-ink">Together</h1>
          <p className="page-head-sub mt-1 text-[12.5px]">life, kept</p>
        </div>
      </div>

      {/* 房间 pills */}
      <div className="scroll-area -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {ROOMS.map((r) => {
          const on = r.key === room;
          return (
            <button
              key={r.key}
              onClick={() => setRoom(r.key)}
              className={`press flex flex-none items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] ${
                on
                  ? "border-[var(--accent-deep)] bg-[var(--glass-solid)] text-[var(--accent-deep)]"
                  : "border-[var(--line)] text-ink-soft"
              }`}
            >
              <span className="text-[13px]">{r.emoji}</span>
              {r.label}
            </button>
          );
        })}
      </div>

      {/* 猫 + 标语 + 月亮 */}
      <div className="mt-4 flex items-center gap-3 px-1">
        <PixelCat />
        <p className="kai flex-1 text-[15px] leading-[1.7] text-ink">{cfg.slogan}</p>
        <button
          onClick={() => setCalOpen((v) => !v)}
          aria-label="日历"
          className={`press flex h-9 w-9 flex-none items-center justify-center rounded-full border ${
            calOpen
              ? "border-[var(--accent-deep)] text-[var(--accent-deep)]"
              : "border-[var(--line-strong)] text-ink-faint"
          }`}
        >
          <IconMoon width={15} height={15} />
        </button>
      </div>

      {/* 月历 */}
      {calOpen && (
        <div className="glass mt-3 rounded-3xl px-4 py-4">
          <Calendar marks={marks} selected={selected} onSelect={(k) => setSelected(k)} />
        </div>
      )}

      {/* 房间内容 */}
      <div className="mt-4">
        {room === "meal" && <MealRoom selected={selected} who={who} />}
        {room === "sleep" && <SleepRoom selected={selected} who={who} />}
        {room === "ledger" && <LedgerRoom />}
        {room === "boba" && <BobaRoom selected={selected} who={who} />}
        {room === "words" && <WordsRoom />}
        {room === "wrong" && <WrongRoom who={who} />}
        {room === "reward" && (
          <div className="glass rounded-3xl px-5 py-8 text-center">
            <p className="kai text-[14px] text-ink-faint">
              奖惩还空着。等任务卡跑起来，它会自己长出来。
            </p>
          </div>
        )}
      </div>

      {/* 谁在记 */}
      <div className="mt-5 flex items-center justify-center gap-2">
        {(["wan", "yan"] as Who[]).map((w) => (
          <button
            key={w}
            onClick={() => setWho(w)}
            className={`press flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] ${
              who === w ? "border-[var(--accent-deep)] text-ink" : "border-transparent text-ink-faint"
            }`}
          >
            <span
              className="h-[7px] w-[7px] rounded-full"
              style={{ background: w === "wan" ? "var(--accent-deep)" : "var(--ink-faint)" }}
            />
            {WHO_LABEL[w]}
          </button>
        ))}
        <span className="text-[11px] text-ink-faint">在记</span>
      </div>
    </div>
  );
}

/* ---------------- 三餐 ---------------- */

function MealRoom({ selected, who }: { selected: string; who: Who }) {
  const life = useLifeStore();
  const list = life.meals[selected] ?? [];
  const by = life.mealBy[selected] ?? {};

  const month = monthSummary({
    month: new Date(`${selected}T00:00:00`),
    meals: life.meals,
    sleep: life.sleep,
    ledger: life.ledger,
    bobas: life.bobas,
    wrongWords: life.wrongWords,
    words: life.words,
  });

  const days = useMemo(() => {
    const prefix = selected.slice(0, 7);
    const keys = Object.keys(life.meals).filter((k) => k.startsWith(prefix));
    const per = (m: MealKey) => keys.filter((k) => life.meals[k]?.includes(m)).length;
    const full = keys.filter((k) => MEALS.every((m) => life.meals[k]?.includes(m))).length;
    const missing = keys
      .filter((k) => MEALS.some((m) => !life.meals[k]?.includes(m)))
      .sort()
      .map(
        (k) =>
          `${md(k)}${MEALS.filter((m) => !life.meals[k]?.includes(m))
            .map((m) => MEAL_LABEL[m][1])
            .join("")}`,
      );
    return { b: per("breakfast"), l: per("lunch"), d: per("dinner"), full, missing };
  }, [life.meals, selected]);

  return (
    <>
      <SummaryBlock
        title="本月总结"
        rows={[
          ["早餐", `${days.b}/5 天`],
          ["午餐", `${days.l}/5 天`],
          ["晚餐", `${days.d}/5 天`],
          ["三餐齐全", `${days.full} 天`],
        ]}
        foot={days.missing.length ? `没吃齐:${days.missing.join(" · ")}` : "这个月都吃齐了。"}
        extra={`共 ${month.meals} 顿`}
      />

      <WeekStrip
        selected={selected}
        render={(k) => {
          const l = life.meals[k] ?? [];
          return (
            <span className="num flex gap-[2px] text-[8px]">
              {MEALS.map((m) => (
                <span
                  key={m}
                  className={l.includes(m) ? "text-[var(--accent-deep)]" : "text-ink-faint/50"}
                >
                  {l.includes(m) ? "●" : "○"}
                </span>
              ))}
            </span>
          );
        }}
      />

      <div className="glass mt-3 rounded-3xl px-5 py-4">
        <h3 className="num text-[20px] italic text-ink">{md(selected)}</h3>
        <div className="mt-2">
          {MEALS.map((m) => {
            const eaten = list.includes(m);
            return (
              <div
                key={m}
                className="flex items-start gap-3 border-b border-[var(--line)] py-3.5 last:border-0"
              >
                <button
                  onClick={() => life.toggleMeal(m, who, selected)}
                  aria-label={MEAL_LABEL[m]}
                  className={`press mt-0.5 flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full border ${
                    eaten
                      ? "border-[var(--accent-deep)] bg-[var(--accent-deep)] text-white"
                      : "border-[var(--line-strong)] text-transparent"
                  }`}
                >
                  <IconCheck width={12} height={12} strokeWidth={2.6} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-[15px] ${eaten ? "text-ink" : "text-ink-faint"}`}>
                    {MEAL_LABEL[m]}
                  </p>
                  <p
                    className={`mt-0.5 truncate text-[12.5px] ${
                      eaten ? "text-ink-soft" : "text-ink-faint/70"
                    }`}
                  >
                    {eaten ? "吃了。" : "备注..."}
                  </p>
                  {eaten && (
                    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-faint">
                      <span
                        className="h-[6px] w-[6px] rounded-full"
                        style={{
                          background:
                            (by[m] ?? "wan") === "wan"
                              ? "var(--accent-deep)"
                              : "var(--ink-faint)",
                        }}
                      />
                      {WHO_LABEL[by[m] ?? "wan"]} · {md(selected)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ---------------- 睡眠 ---------------- */

function SleepRoom({ selected, who }: { selected: string; who: Who }) {
  const life = useLifeStore();
  const nights = nightSleeps(life.sleep);
  const night = nights.find((s) => s.date === selected);
  const nap = naps(life.sleep).find((s) => s.date === selected);

  const [bed, setBed] = useState(night?.bedAt || "01:30");
  const [wake, setWake] = useState(night?.wakeAt || "07:50");
  const [napDown, setNapDown] = useState("13:09");
  const [napUp, setNapUp] = useState("14:07");

  const minutesBetween = (a: string, b: string) => {
    const [ah, am] = a.split(":").map(Number);
    const [bh, bm] = b.split(":").map(Number);
    let mins = bh * 60 + bm - (ah * 60 + am);
    if (mins < 0) mins += 24 * 60;
    return mins;
  };
  const nightMin = minutesBetween(bed, wake);
  const napMin = minutesBetween(napDown, napUp);

  const monthNights = nights.filter((s) => s.date.startsWith(selected.slice(0, 7)));
  const avg = monthNights.length
    ? monthNights.reduce((s, x) => s + x.hours, 0) / monthNights.length
    : 0;
  const monthNaps = naps(life.sleep).filter((s) => s.date.startsWith(selected.slice(0, 7)));
  const avgNap = monthNaps.length
    ? Math.round(monthNaps.reduce((s, x) => s + (x.minutes ?? 0), 0) / monthNaps.length)
    : 0;

  return (
    <>
      <SummaryBlock
        title="本月总结"
        rows={[
          ["记录", `${monthNights.length}/5 晚`],
          ["平均睡眠", avg ? `${Math.floor(avg)}h${Math.round((avg % 1) * 60)}m` : "—"],
          ["不足6小时", `${monthNights.filter((s) => s.hours < 6).length} 晚`],
          [
            "最晚入睡",
            [...monthNights].sort((a, b) => b.bedAt.localeCompare(a.bedAt))[0]?.bedAt ?? "—",
          ],
          ["午睡", `${monthNaps.length} 次 · 平均${avgNap}分钟`],
        ]}
      />

      <WeekStrip
        selected={selected}
        render={(k) => {
          const s = nights.find((x) => x.date === k);
          return s ? (
            <span className="num text-[8.5px] text-ink-soft">
              {Math.floor(s.hours)}h{Math.round((s.hours % 1) * 60)}m
            </span>
          ) : (
            <span className="text-[8px] text-ink-faint/50">·</span>
          );
        }}
      />

      <div className="glass mt-3 rounded-3xl px-5 py-4">
        <div className="flex items-baseline justify-between">
          <h3 className="text-[17px] italic text-ink">
            <span className="num">{md(selected)}</span> 晚上
          </h3>
          <span className="text-[11.5px] text-ink-faint">入睡 · 起床</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[12.5px] text-ink-faint">入睡日期</span>
          <span className="rounded-lg bg-[var(--glass-hi)] px-2.5 py-1 text-[12.5px] text-ink">
            {selected.replace(/-/g, "/")}
          </span>
          <span className="text-[12px] text-ink-faint">→ {md(selected)} 起床</span>
        </div>
        <div className="mt-3 flex items-end gap-3">
          <TimeField label="入睡" value={bed} onChange={setBed} />
          <TimeField label="起床" value={wake} onChange={setWake} />
          <span className="num mb-1 ml-auto text-[19px] italic text-ink">
            {Math.floor(nightMin / 60)}h{String(nightMin % 60).padStart(2, "0")}m
          </span>
        </div>
        <input
          placeholder="备注:昨天有点困..."
          className="ghost-input mt-3 w-full rounded-xl bg-[var(--glass-hi)] px-3 py-2.5 text-[13px] text-ink placeholder:text-ink-faint"
        />
        <div className="mt-3 flex items-center justify-between">
          <AuthorStamp who={who} date={selected} />
          <button
            onClick={() =>
              life.logSleep({
                date: selected,
                hours: Math.round((nightMin / 60) * 10) / 10,
                bedAt: bed,
                wakeAt: wake,
                kind: "night",
                by: who,
              })
            }
            className="press rounded-full bg-[var(--accent-deep)] px-5 py-1.5 text-[13px] text-white"
          >
            保存
          </button>
        </div>
      </div>

      <div className="glass mt-3 rounded-3xl px-5 py-4">
        <div className="flex items-baseline justify-between">
          <h3 className="text-[17px] italic text-ink">
            午睡 · <span className="num">{md(selected)}</span>
          </h3>
          <span className="text-[11.5px] text-ink-faint">躺下 · 醒来</span>
        </div>
        <div className="mt-3 flex items-end gap-3">
          <TimeField label="躺下" value={napDown} onChange={setNapDown} />
          <TimeField label="醒来" value={napUp} onChange={setNapUp} />
          <span className="num mb-1 ml-auto text-[19px] italic text-ink">
            {Math.floor(napMin / 60)}h{String(napMin % 60).padStart(2, "0")}m
          </span>
        </div>
        <p className="mt-2 text-[12px] text-ink-faint">
          {nap ? `已记：${nap.minutes} 分钟` : "午睡!"}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <AuthorStamp who={who} date={selected} />
          <button
            onClick={() => life.logNap({ minutes: napMin, by: who, dateKey: selected })}
            className="press rounded-full bg-[var(--accent-deep)] px-5 py-1.5 text-[13px] text-white"
          >
            保存
          </button>
        </div>
      </div>
    </>
  );
}

/* ---------------- 记账 ---------------- */

function LedgerRoom() {
  const life = useLifeStore();
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState("餐饮");
  const [note, setNote] = useState("");

  const month = new Date();
  const inMonth = life.ledger.filter((e) => {
    const d = new Date(e.at);
    return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth();
  });
  const total = inMonth.reduce((s, e) => s + e.amount, 0);
  const byCat = Object.entries(
    inMonth.reduce<Record<string, number>>((m, e) => {
      m[e.category] = (m[e.category] ?? 0) + e.amount;
      return m;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const perDay = inMonth.reduce<Record<string, number>>((m, e) => {
    const k = dayKeyOf(e.at);
    m[k] = (m[k] ?? 0) + e.amount;
    return m;
  }, {});
  const top = Object.entries(perDay).sort((a, b) => b[1] - a[1])[0];

  return (
    <>
      <SummaryBlock
        title="本月总结"
        rows={[
          ["总支出", `¥${total.toFixed(2)}`],
          ["笔数", `${inMonth.length} 笔 · 日均 ¥${(total / 30).toFixed(1)}`],
          ["最高一天", top ? `${md(top[0])} ¥${top[1].toFixed(0)}` : "—"],
          ["最大类别", byCat[0] ? `${byCat[0][0]} ¥${byCat[0][1].toFixed(0)}` : "—"],
        ]}
      />

      <div className="glass mt-3 rounded-3xl px-5 py-4">
        <div className="flex items-center justify-between">
          <IconChevron width={14} height={14} className="rotate-180 text-ink-faint" />
          <span className="num text-[16px] italic text-ink">
            {month.getFullYear()} · {String(month.getMonth() + 1).padStart(2, "0")}
          </span>
          <IconChevron width={14} height={14} className="text-ink-faint" />
        </div>
        <p className="num mt-2 text-[34px] italic text-ink">¥{total.toFixed(2)}</p>
        <div className="mt-2">
          {byCat.map(([c, v]) => (
            <div
              key={c}
              className="flex items-center gap-3 border-b border-[var(--line)] py-2.5 last:border-0"
            >
              <span className="w-12 flex-none text-[13px] text-ink-soft">{c}</span>
              <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-[var(--glass-hi)]">
                <div
                  className="h-full rounded-full bg-[var(--accent-deep)]"
                  style={{ width: `${total ? (v / total) * 100 : 0}%` }}
                />
              </div>
              <span className="num w-14 flex-none text-right text-[12.5px] text-ink">
                ¥{v.toFixed(0)}
              </span>
            </div>
          ))}
          {byCat.length === 0 && (
            <p className="py-4 text-center text-[12.5px] text-ink-faint">这个月还没记账。</p>
          )}
        </div>
      </div>

      <div className="glass mt-3 rounded-3xl px-5 py-4">
        <div className="flex gap-2">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="金额"
            className="ghost-input w-20 flex-none rounded-xl bg-[var(--glass-hi)] px-3 py-2.5 text-[13px] text-ink"
          />
          <input
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            placeholder="类别"
            className="ghost-input w-20 flex-none rounded-xl bg-[var(--glass-hi)] px-3 py-2.5 text-[13px] text-ink"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="备注"
            className="ghost-input min-w-0 flex-1 rounded-xl bg-[var(--glass-hi)] px-3 py-2.5 text-[13px] text-ink"
          />
          <button
            onClick={() => {
              life.addLedger({ amount: Number(amount), category: cat || "其他", note });
              setAmount("");
              setNote("");
            }}
            className="press flex-none rounded-full bg-[var(--accent-deep)] px-4 text-[13px] text-white"
          >
            记
          </button>
        </div>
      </div>
    </>
  );
}

/* ---------------- 奶茶 ---------------- */

function BobaRoom({ selected, who }: { selected: string; who: Who }) {
  const life = useLifeStore();
  const prefix = selected.slice(0, 7);
  const monthBobas = life.bobas.filter((b) => keyOfTs(b.at).startsWith(prefix));
  const quota = 1;
  const used = monthBobas.length;
  const [shop, setShop] = useState("");
  const [note, setNote] = useState("");
  const [over, setOver] = useState(false);

  return (
    <>
      <div className="glass mt-3 rounded-3xl px-5 py-5">
        <div className="flex items-baseline justify-between">
          <span className="num text-[16px] italic text-ink">{prefix.replace("-", " · ")}</span>
          <span className="text-[12.5px] text-ink-faint">额度 {quota}</span>
        </div>
        <p className="num mt-4 text-center text-[40px] italic text-ink">
          {used}
          <span className="text-[26px] text-ink-faint">/{quota}</span>
        </p>
        <p className="mt-1 text-center text-[12px] text-ink-faint">
          {used >= quota ? "额度用完啦" : `还能喝 ${quota - used} 杯`}
        </p>
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setOver(used >= quota)}
            className="press flex items-center gap-1 rounded-full bg-[var(--accent-deep)] px-4 py-1.5 text-[13px] text-white"
          >
            <IconPlus width={13} height={13} /> 喝了一杯
          </button>
        </div>

        <div className="mt-4 space-y-2 border-t border-[var(--line)] pt-4">
          <div className="flex gap-2">
            <input
              value={shop}
              onChange={(e) => setShop(e.target.value)}
              placeholder="哪家(喜茶/霸王茶姬...)"
              className="ghost-input min-w-0 flex-1 rounded-xl bg-[var(--glass-hi)] px-3 py-2.5 text-[13px] text-ink"
            />
            <span className="flex-none rounded-xl bg-[var(--glass-hi)] px-3 py-2.5 text-[12.5px] text-ink-soft">
              {md(selected)}
            </span>
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="备注:朋友请喝"
            className="ghost-input w-full rounded-xl bg-[var(--glass-hi)] px-3 py-2.5 text-[13px] text-ink"
          />
          <label className="flex items-center gap-2 text-[12.5px] text-ink-soft">
            <input
              type="checkbox"
              checked={over}
              onChange={(e) => setOver(e.target.checked)}
              className="h-4 w-4 accent-[var(--accent-deep)]"
            />
            这杯算超额
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => {
                setShop("");
                setNote("");
                setOver(false);
              }}
              className="press rounded-full border border-[var(--line-strong)] px-4 py-1.5 text-[13px] text-ink-soft"
            >
              取消
            </button>
            <button
              onClick={() => {
                life.addBoba({
                  price: 22,
                  note: [shop, note].filter(Boolean).join(" · "),
                  by: who,
                  dateKey: selected,
                });
                setShop("");
                setNote("");
              }}
              className="press rounded-full bg-[var(--accent-deep)] px-4 py-1.5 text-[13px] text-white"
            >
              记上
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {monthBobas.map((b) => (
          <div key={b.id} className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
            <span className="text-[12px] text-ink-faint">{md(keyOfTs(b.at))}</span>
            <IconCheck width={13} height={13} className="text-[var(--accent-deep)]" />
            <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">
              {b.note || "奶茶"} · ¥{b.price}
            </span>
            <AuthorDot who={b.by} />
            <button onClick={() => life.removeBoba(b.id)} className="press text-ink-faint/70">
              <IconClose width={12} height={12} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------------- 单词 ---------------- */

const WORD_GROUPS = [1, 2, 3, 4, 5, 6, 7, 8];
const SAMPLE_WORDS: [string, string, string][] = [
  ["forehead", "/ˈfɔːhed/", "n.前额"],
  ["finger", "/ˈfɪŋɡə(r)/", "n.手指 v.告发，拨弄"],
  ["nerve", "/nɜːv/", "n.神经，勇气"],
  ["applaud", "/əˈplɔːd/", "v.鼓掌，称赞"],
  ["bless", "/bles/", "v.祝福"],
  ["admire", "/ədˈmaɪə(r)/", "v.仰慕，赞赏"],
  ["astonish", "/əˈstɒnɪʃ/", "v.使吃惊"],
];

function WordsRoom() {
  const life = useLifeStore();
  const today = life.words.find((w) => w.date === todayKey());
  const [open, setOpen] = useState<number | null>(1);

  return (
    <>
      <div className="glass mt-3 rounded-3xl px-5 py-4">
        <div className="flex items-baseline justify-between">
          <h3 className="text-[17px] italic text-ink">六级核心1500词</h3>
          <span className="text-[12px] text-ink-faint">当前 第1组</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            ["0", "已掌握 / 1499"],
            [String(today?.learned ?? 0), "今日待考"],
            [String(today?.goal ?? 30), "重点复习"],
          ].map(([v, l]) => (
            <div key={l} className="rounded-xl bg-[var(--glass-hi)] py-2.5">
              <p className="num text-[20px] text-ink">{v}</p>
              <p className="mt-0.5 text-[10.5px] text-ink-faint">{l}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[12px] leading-[1.8] text-ink-faint">
          聊天里说"考我单词",他会按今日词单考你;结果自动记进这里。
        </p>
      </div>

      <div className="glass mt-3 rounded-3xl px-5 py-4">
        {open === null ? (
          <div>
            {WORD_GROUPS.map((g) => (
              <button
                key={g}
                onClick={() => setOpen(g)}
                className="press flex w-full items-center justify-between border-b border-[var(--line)] py-3.5 text-left last:border-0"
              >
                <span className="text-[15px] text-ink">第{g}天</span>
                <span className="text-[12px] text-ink-faint">0 / 30 已掌握</span>
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <button onClick={() => setOpen(null)} className="press text-[12.5px] text-ink-faint">
                ‹ 目录
              </button>
              <span className="text-[16px] italic text-ink">第{open}天 · 第1组</span>
              <span className="rounded-full border border-[var(--accent-deep)] px-2.5 py-0.5 text-[11px] text-[var(--accent-deep)]">
                今天考这组
              </span>
            </div>
            <div className="mt-2">
              {SAMPLE_WORDS.map(([w, ph, mean]) => (
                <div
                  key={w}
                  className="flex items-center gap-3 border-b border-[var(--line)] py-3 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] text-ink">{w}</p>
                    <p className="text-[11px] text-ink-faint">{ph}</p>
                  </div>
                  <span className="text-[12.5px] text-ink-soft">{mean}</span>
                  <span className="text-[11px] text-ink-faint">未考</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

/* ---------------- 错词 ---------------- */

function WrongRoom({ who }: { who: Who }) {
  const life = useLifeStore();
  const [word, setWord] = useState("");
  const [reason, setReason] = useState("");

  return (
    <div className="glass mt-3 rounded-3xl px-5 py-4">
      <h3 className="text-[16px] italic text-ink">错词本 · {life.wrongWords.length}</h3>
      <div className="mt-2">
        {life.wrongWords.map((w) => (
          <div
            key={w.id}
            className="flex items-center gap-2 border-b border-[var(--line)] py-3 last:border-0"
          >
            <span className="text-[15px] text-ink">{w.word}</span>
            <span className="min-w-0 flex-1 truncate text-[12px] text-ink-faint">{w.reason}</span>
            <span className="num text-[11px] text-[var(--accent-deep)]">×{w.times}</span>
            <AuthorDot who={w.by} />
            <button onClick={() => life.bumpWrongWord(w.id)} className="press text-[11px] text-ink-faint">
              +1
            </button>
            <button onClick={() => life.removeWrongWord(w.id)} className="press text-ink-faint/70">
              <IconClose width={12} height={12} />
            </button>
          </div>
        ))}
        {life.wrongWords.length === 0 && (
          <p className="py-4 text-center text-[12.5px] text-ink-faint">还没有错词。</p>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="单词"
          className="ghost-input w-24 flex-none rounded-xl bg-[var(--glass-hi)] px-3 py-2.5 text-[13px] text-ink"
        />
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="错在哪"
          className="ghost-input min-w-0 flex-1 rounded-xl bg-[var(--glass-hi)] px-3 py-2.5 text-[13px] text-ink"
        />
        <button
          onClick={() => {
            life.addWrongWord({ word, reason, by: who });
            setWord("");
            setReason("");
          }}
          className="press flex-none rounded-full bg-[var(--accent-deep)] px-4 text-[13px] text-white"
        >
          收
        </button>
      </div>
    </div>
  );
}

/* ---------------- 通用件 ---------------- */

function SummaryBlock({
  title,
  rows,
  foot,
  extra,
}: {
  title: string;
  rows: [string, string][];
  foot?: string;
  extra?: string;
}) {
  return (
    <div className="px-1">
      <div className="flex items-baseline justify-between">
        <span className="text-[12.5px] italic text-ink-faint">{title}</span>
        {extra && <span className="text-[11px] text-ink-faint">{extra}</span>}
      </div>
      <div className="mt-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between py-[5px]">
            <span className="text-[13.5px] text-ink-soft">{k}</span>
            <span className="num text-[13.5px] text-ink">{v}</span>
          </div>
        ))}
      </div>
      {foot && <p className="mt-2 text-[11px] leading-[1.7] text-ink-faint">{foot}</p>}
    </div>
  );
}

/** 一周快速切换条：以选中日为最后一天，往前 6 天。 */
function WeekStrip({
  selected,
  render,
}: {
  selected: string;
  render: (key: string) => React.ReactNode;
}) {
  const days = useMemo(() => {
    const base = new Date(`${selected}T00:00:00`);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(d.getDate() - (6 - i));
      return dayKeyOf(d);
    });
  }, [selected]);

  return (
    <div className="mt-3 flex gap-1.5">
      {days.map((k) => {
        const on = k === selected;
        return (
          <div
            key={k}
            className={`flex flex-1 flex-col items-center gap-1 rounded-xl border py-2 ${
              on ? "border-[var(--accent-deep)]" : "border-transparent"
            }`}
          >
            <span
              className={`num text-[11px] ${on ? "text-[var(--accent-deep)]" : "text-ink-faint"}`}
            >
              {md(k)}
            </span>
            {render(k)}
          </div>
        );
      })}
    </div>
  );
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] text-ink-faint">{label}</span>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-[86px] rounded-lg bg-[var(--glass-hi)] px-2 py-1.5 text-center text-[15px] text-ink"
      />
    </label>
  );
}

function AuthorStamp({ who, date }: { who: Who; date: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-ink-faint">
      <span
        className="h-[6px] w-[6px] rounded-full"
        style={{ background: who === "wan" ? "var(--accent-deep)" : "var(--ink-faint)" }}
      />
      {WHO_LABEL[who]} · {md(date)}
    </span>
  );
}

function AuthorDot({ who }: { who?: Who }) {
  return (
    <span
      className="h-[6px] w-[6px] flex-none rounded-full"
      style={{ background: (who ?? "wan") === "wan" ? "var(--accent-deep)" : "var(--ink-faint)" }}
    />
  );
}

/** 像素猫：每间房门口那只。SVG 方块拼，不依赖 emoji 字体。 */
function PixelCat() {
  const px = 2.2;
  const cells: [number, number][] = [
    [3, 0], [8, 0],
    [2, 1], [3, 1], [4, 1], [7, 1], [8, 1], [9, 1],
    [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2],
    [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3],
    [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4],
    [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5],
    [3, 6], [4, 6], [5, 6], [6, 6], [7, 6], [8, 6],
    [3, 7], [4, 7], [5, 7], [6, 7], [7, 7], [8, 7],
    [9, 6], [10, 6], [10, 5], [11, 5],
  ];
  return (
    <svg
      width={12 * px}
      height={8 * px}
      viewBox={`0 0 ${12 * px} ${8 * px}`}
      aria-hidden
      className="flex-none"
    >
      {cells.map(([x, y], i) => (
        <rect key={i} x={x * px} y={y * px} width={px} height={px} fill="var(--ink)" opacity="0.86" />
      ))}
      <rect x={4 * px} y={3 * px} width={px} height={px} fill="var(--bg)" />
      <rect x={7 * px} y={3 * px} width={px} height={px} fill="var(--bg)" />
    </svg>
  );
}
