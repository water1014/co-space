import { todayBoba, todayMeals, todaySleep, todayWords } from "./derive";
import type { LedgerEntry, MealKey, SleepLog, WordProgress } from "../../types";

/**
 * 首页那句"今天的话"。
 * 它必须由真实数据推出来，否则就是装饰——这里每一条都能在 Together 里对上账。
 */
export function dailyNote(input: {
  meals: Record<string, MealKey[]>;
  sleep: SleepLog[];
  ledger: LedgerEntry[];
  words: WordProgress[];
  bobaBudget: number;
  name: string;
}): string {
  const meals = todayMeals(input.meals);
  const sleep = todaySleep(input.sleep);
  const boba = todayBoba(input.ledger);
  const words = todayWords(input.words);
  const you = input.name ? `${input.name}，` : "";

  if (boba > input.bobaBudget) {
    return `${you}奶茶额度用完了。今天到此为止，明天再说。`;
  }
  if (sleep && sleep.hours < 6.5) {
    return `${you}你昨晚只睡了 ${sleep.hours} 小时。今天别硬撑，早点回来。`;
  }
  if (meals.length === 0) {
    return `今天还没吃东西。先不要回我，去吃点。`;
  }
  if (words && words.learned >= words.goal) {
    return `单词背完了。剩下的时间可以浪费一点。`;
  }
  if (boba > input.bobaBudget * 0.7) {
    return `今天已经喝了 ¥${boba.toFixed(0)} 的奶茶。剩下的你自己看着办。`;
  }
  return `${you}今天没什么要交代的。我在。`;
}
