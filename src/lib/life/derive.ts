import type {
  BobaEntry,
  LedgerEntry,
  MealKey,
  SleepLog,
  WordProgress,
  WrongWord,
} from "../../types";

import { dayKeyOf } from "../utils/id";

const DAY = 86_400_000;
export const todayKey = () => dayKeyOf(new Date());

/**
 * 夜睡的「入睡日期」：凌晨（6 点前）躺下算前一天。
 * 例：10/27 凌晨 2 点睡，记成 10/26 那一晚。
 */
export function bedDateKey(bedAt: string): string {
  const [h] = bedAt.split(":").map(Number);
  const now = new Date();
  if (Number.isFinite(h) && h < 6) now.setDate(now.getDate() - 1);
  return dayKeyOf(now);
}

export function daysTogether(anniversary: string): number {
  const start = new Date(`${anniversary}T00:00:00`);
  if (Number.isNaN(start.getTime())) return 0;
  const diff = Date.now() - start.getTime();
  return Math.max(0, Math.floor(diff / DAY) + 1);
}

export const todayMeals = (meals: Record<string, MealKey[]>) =>
  meals[todayKey()] ?? [];

export const todayLedger = (ledger: LedgerEntry[]) =>
  ledger.filter((e) => dayKeyOf(e.at) === todayKey());

export const todayTotal = (ledger: LedgerEntry[]) =>
  todayLedger(ledger).reduce((sum, e) => sum + e.amount, 0);

/** 奶茶走独立数组，不并进记账。 */
export const todayBoba = (bobas: BobaEntry[]) =>
  bobas.filter((b) => dayKeyOf(b.at) === todayKey()).reduce((s, b) => s + b.price, 0);

export const todayBobaCount = (bobas: BobaEntry[]) =>
  bobas.filter((b) => dayKeyOf(b.at) === todayKey()).length;

/** 夜睡（kind 缺省视为夜睡，兼容旧数据）。 */
export const nightSleeps = (sleep: SleepLog[]) =>
  sleep.filter((s) => (s.kind ?? "night") === "night");

export const naps = (sleep: SleepLog[]) =>
  sleep.filter((s) => s.kind === "nap");

export const todaySleep = (sleep: SleepLog[]) => {
  const t = todayKey();
  return nightSleeps(sleep).find((s) => s.date === t);
};

export const todayNaps = (sleep: SleepLog[]) =>
  naps(sleep).filter((s) => s.date === todayKey());

export const todayWords = (words: WordProgress[]) =>
  words.find((w) => w.date === todayKey());

/** 最近七天：每天的花费与睡眠，用来画柱子。 */
export function last7(
  ledger: LedgerEntry[],
  sleep: SleepLog[],
): { label: string; amount: number; hours: number }[] {
  const out: { label: string; amount: number; hours: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dayKeyOf(d);
    const amount = ledger
      .filter((e) => dayKeyOf(e.at) === key)
      .reduce((sum, e) => sum + e.amount, 0);
    const hours = nightSleeps(sleep).find((s) => s.date === key)?.hours ?? 0;
    out.push({
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      amount: Math.round(amount * 100) / 100,
      hours,
    });
  }
  return out;
}

/** 连续有记录的天数：三餐、睡眠、记账任意一项有动静就算一天。 */
export function streakDays(
  meals: Record<string, MealKey[]>,
  sleep: SleepLog[],
  ledger: LedgerEntry[],
): number {
  let streak = 0;
  for (let i = 0; i < 120; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dayKeyOf(d);
    const active =
      (meals[key]?.length ?? 0) > 0 ||
      nightSleeps(sleep).some((s) => s.date === key) ||
      ledger.some((e) => dayKeyOf(e.at) === key);
    if (active) streak += 1;
    else if (i > 0) break;
  }
  return streak;
}

/** 本月统计：几顿饭、平均睡多久、花了多少、奶茶几杯。 */
export function monthSummary(input: {
  month: Date;
  meals: Record<string, MealKey[]>;
  sleep: SleepLog[];
  ledger: LedgerEntry[];
  bobas: BobaEntry[];
  wrongWords: WrongWord[];
  words: WordProgress[];
}): {
  meals: number;
  avgSleep: number;
  spend: number;
  bobas: number;
  wrong: number;
  learned: number;
} {
  const y = input.month.getFullYear();
  const m = input.month.getMonth();
  const inMonth = (key: string) => {
    const d = new Date(`${key}T00:00:00`);
    return d.getFullYear() === y && d.getMonth() === m;
  };
  const mealCount = Object.entries(input.meals)
    .filter(([k]) => inMonth(k))
    .reduce((s, [, v]) => s + v.length, 0);
  const monthNights = nightSleeps(input.sleep).filter((s) => inMonth(s.date));
  const avgSleep = monthNights.length
    ? monthNights.reduce((s, x) => s + x.hours, 0) / monthNights.length
    : 0;
  const spend = input.ledger
    .filter((e) => {
      const d = new Date(e.at);
      return d.getFullYear() === y && d.getMonth() === m;
    })
    .reduce((s, e) => s + e.amount, 0);
  const bobaCount = input.bobas.filter((b) => {
    const d = new Date(b.at);
    return d.getFullYear() === y && d.getMonth() === m;
  }).length;
  const learned = input.words
    .filter((w) => inMonth(w.date))
    .reduce((s, w) => s + w.learned, 0);
  return {
    meals: mealCount,
    avgSleep: Math.round(avgSleep * 10) / 10,
    spend: Math.round(spend),
    bobas: bobaCount,
    wrong: input.wrongWords.length,
    learned,
  };
}

/**
 * 把生活数据压成一段给模型看的上下文。
 * 它必须短、可读、可核对——用户能在 Together 里看到同样的数字。
 * 约定：他每次聊天前能读到今天的概况和本月总结，
 * 所以他会知道「你今天还没吃午饭」或「这个月奶茶超了」。
 */
export function lifeContext(input: {
  meals: Record<string, MealKey[]>;
  sleep: SleepLog[];
  ledger: LedgerEntry[];
  bobas: BobaEntry[];
  words: WordProgress[];
  wrongWords: WrongWord[];
  todos: { text: string; done: boolean }[];
  bobaBudget: number;
  anniversary: string;
}): string {
  const meals = todayMeals(input.meals);
  const sleep = todaySleep(input.sleep);
  const napsToday = todayNaps(input.sleep);
  const total = todayTotal(input.ledger);
  const boba = todayBoba(input.bobas);
  const bobaN = todayBobaCount(input.bobas);
  const words = todayWords(input.words);
  const openTodos = input.todos.filter((t) => !t.done);
  const month = monthSummary({
    month: new Date(),
    meals: input.meals,
    sleep: input.sleep,
    ledger: input.ledger,
    bobas: input.bobas,
    wrongWords: input.wrongWords,
    words: input.words,
  });

  const lines = [
    `在一起第 ${daysTogether(input.anniversary)} 天`,
    `三餐：${meals.length}/3（${meals.join("、") || "还没记"}）`,
    sleep
      ? `睡眠：${sleep.hours}h（${sleep.bedAt}–${sleep.wakeAt}）${
          napsToday.length ? `，午睡 ${napsToday.reduce((s, x) => s + (x.minutes ?? 0), 0)} 分钟` : ""
        }`
      : "睡眠：昨晚没记",
    `记账：今天 ¥${total.toFixed(0)}`,
    `奶茶：今天 ${bobaN} 杯共 ¥${boba.toFixed(0)}（额度 ¥${input.bobaBudget}${boba > input.bobaBudget ? "，已超" : ""}）`,
    words ? `单词：${words.learned}/${words.goal}` : "单词：今天还没开始",
    `本月：${month.meals} 顿饭，平均睡 ${month.avgSleep}h，花了 ¥${month.spend}，奶茶 ${month.bobas} 杯`,
    openTodos.length
      ? `未完成：${openTodos.map((t) => t.text).join("；")}`
      : "待办：都清了",
  ];
  return lines.join("；");
}
