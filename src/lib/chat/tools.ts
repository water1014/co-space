import { useLifeStore } from "../../stores/lifeStore";
import { todayKey } from "../life/derive";
import type { MealKey, Who } from "../../types";

/**
 * 阿晏的"手"：聊天里说的话会变成记录。
 *
 * 约定：婉莹在页面上点，阿晏在对话里说——两边写的是同一套数据，
 * 记录带 `by` 标识，页面上用小圆点区分谁记的。
 *
 * 只识别明确句式，不做模糊猜测：宁可漏记，也不要记错。
 */

export type ToolAction = {
  /** 做了什么，写进思考过程里让人能核对。 */
  summary: string;
  /** 落到 store 的操作。 */
  apply: () => void;
};

const MEAL_WORDS: { re: RegExp; meal: MealKey; label: string }[] = [
  { re: /(早饭|早餐|吃了早饭)/, meal: "breakfast", label: "早饭" },
  { re: /(午饭|午餐|吃午饭|中午吃了)/, meal: "lunch", label: "午饭" },
  { re: /(晚饭|晚餐|吃晚饭)/, meal: "dinner", label: "晚饭" },
];

const whoOf = (text: string): Who => (/(阿晏|我来记|我记)/.test(text) ? "yan" : "wan");

/** 从文本里抓金额："花了25"、"奶茶22块"。 */
const moneyOf = (text: string): number | null => {
  const m = text.match(/(?:花了|花了钱|付了|用了|买)?\s*(\d+(?:\.\d+)?)\s*(?:块|元|¥|￥)/);
  if (m) return Number(m[1]);
  const m2 = text.match(/[¥￥]\s*(\d+(?:\.\d+)?)/);
  if (m2) return Number(m2[1]);
  return null;
};

/**
 * 解析一句话，返回它触发的记录操作（可能为空）。
 */
export function parseLifeActions(text: string): ToolAction[] {
  const out: ToolAction[] = [];
  const life = useLifeStore.getState();
  const who = whoOf(text);
  const t = todayKey();

  /* ---- 三餐 ---- */
  for (const m of MEAL_WORDS) {
    if (!m.re.test(text)) continue;
    if (!/(吃了|吃了点|刚吃|吃过了|吃了饭|记录|记一下|打卡)/.test(text)) continue;
    if (life.meals[t]?.includes(m.meal)) continue;
    out.push({
      summary: `记下今天的${m.label}`,
      apply: () => life.toggleMeal(m.meal, who, t),
    });
    break;
  }

  /* ---- 记账 ---- */
  const money = moneyOf(text);
  const isBoba = /(奶茶|果茶|喜茶|霸王茶姬|奈雪)/.test(text);
  const isSpend = /(花了|付了|买了|充了|交了|消费)/.test(text);

  if (money !== null && isSpend && !isBoba) {
    const category = /(吃饭|午饭|晚饭|早饭|外卖)/.test(text)
      ? "餐饮"
      : /(打车|地铁|公交|车费)/.test(text)
        ? "交通"
        : /(日用|纸巾|洗发|牙膏)/.test(text)
          ? "日用"
          : "其他";
    const note = text.slice(0, 24);
    out.push({
      summary: `记了一笔 ¥${money}`,
      apply: () => life.addLedger({ amount: money, category, note, by: who }),
    });
  }

  /* ---- 奶茶（独立一间房，不并进记账） ---- */
  if (isBoba && (money !== null || /(喝了|喝了一杯|买了奶茶)/.test(text))) {
    const price = money ?? 20;
    out.push({
      summary: `记了一杯奶茶 ¥${price}`,
      apply: () => life.addBoba({ price, note: "奶茶", by: who, dateKey: t }),
    });
  }

  /* ---- 睡眠 ---- */
  const sleepM = text.match(/(睡了|睡了)\s*(\d+(?:\.\d+)?)\s*(?:个)?\s*(小时|h)/);
  if (sleepM) {
    const hours = Number(sleepM[2]);
    out.push({
      summary: `记了睡眠 ${hours} 小时`,
      apply: () =>
        life.logSleep({
          date: t,
          hours,
          bedAt: "01:30",
          wakeAt: "07:50",
          kind: "night",
          by: who,
        }),
    });
  }

  /* ---- 待办 ---- */
  const todoM = text.match(/(?:记得|待办|要去|明天要|提醒我)\s*(.+)$/);
  if (todoM && todoM[1].trim().length > 1) {
    const text2 = todoM[1].trim().slice(0, 40);
    out.push({
      summary: `加了一条待办：${text2}`,
      apply: () => life.addTodo(text2),
    });
  }

  return out;
}
