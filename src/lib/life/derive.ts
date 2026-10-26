import type {
  LedgerEntry,
  MealKey,
  SleepLog,
  WordProgress,
} from "../../types";

import { dayKeyOf } from "../utils/id";

const DAY = 86_400_000;
export const todayKey = () => dayKeyOf(new Date());

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

export const todayBoba = (ledger: LedgerEntry[]) =>
  todayLedger(ledger)
    .filter((e) => e.category === "奶茶")
    .reduce((sum, e) => sum + e.amount, 0);

export const todaySleep = (sleep: SleepLog[]) =>
  sleep.find((s) => s.date === todayKey());

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
    const hours = sleep.find((s) => s.date === key)?.hours ?? 0;
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
      sleep.some((s) => s.date === key) ||
      ledger.some((e) => dayKeyOf(e.at) === key);
    if (active) streak += 1;
    else if (i > 0) break;
  }
  return streak;
}

/**
 * 把生活数据压成一段给模型看的上下文。
 * 它必须短、可读、可核对——用户能在 Together 里看到同样的数字。
 */
export function lifeContext(input: {
  meals: Record<string, MealKey[]>;
  sleep: SleepLog[];
  ledger: LedgerEntry[];
  words: WordProgress[];
  todos: { text: string; done: boolean }[];
  bobaBudget: number;
  anniversary: string;
}): string {
  const meals = todayMeals(input.meals);
  const sleep = todaySleep(input.sleep);
  const total = todayTotal(input.ledger);
  const boba = todayBoba(input.ledger);
  const words = todayWords(input.words);
  const openTodos = input.todos.filter((t) => !t.done);

  const lines = [
    `在一起第 ${daysTogether(input.anniversary)} 天`,
    `三餐：${meals.length}/3（${meals.join("、") || "还没记"}）`,
    sleep ? `睡眠：${sleep.hours}h（${sleep.bedAt}–${sleep.wakeAt}）` : "睡眠：昨天没记",
    `记账：今天 ¥${total.toFixed(0)}，其中奶茶 ¥${boba.toFixed(0)}（额度 ¥${input.bobaBudget}${boba > input.bobaBudget ? "，已超" : ""}）`,
    words ? `单词：${words.learned}/${words.goal}` : "单词：今天还没开始",
    openTodos.length
      ? `未完成：${openTodos.map((t) => t.text).join("；")}`
      : "待办：都清了",
  ];
  return lines.join("；");
}
