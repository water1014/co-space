import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  LedgerEntry,
  MealKey,
  SleepLog,
  Todo,
  WordProgress,
} from "../types";
import { dayKeyOf, uid } from "../lib/utils/id";

export const todayKey = () => dayKeyOf(new Date());

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dayKeyOf(d);
};

type LifeState = {
  /** 在一起的第一天。大数字由它算。 */
  anniversary: string;
  /** date -> 已吃的餐 */
  meals: Record<string, MealKey[]>;
  sleep: SleepLog[];
  ledger: LedgerEntry[];
  words: WordProgress[];
  todos: Todo[];
  /** 每天奶茶额度，¥ */
  bobaBudget: number;

  setAnniversary: (iso: string) => void;
  toggleMeal: (key: MealKey) => void;
  logSleep: (log: SleepLog) => void;
  addLedger: (input: { amount: number; category: string; note?: string }) => void;
  removeLedger: (id: string) => void;
  setWords: (learned: number) => void;
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  setBobaBudget: (v: number) => void;
};

const seed = () => {
  const t = todayKey();
  const now = Date.now();
  return {
    anniversary: daysAgo(91),
    meals: { [t]: ["lunch"] as MealKey[] },
    sleep: [{ date: t, hours: 6.4, bedAt: "01:40", wakeAt: "08:05" }],
    ledger: [
      { id: uid("l"), at: now - 3 * 3600_000, amount: 32, category: "午饭", note: "楼下那家" },
      { id: uid("l"), at: now - 5 * 3600_000, amount: 18, category: "奶茶", note: "三分糖" },
    ],
    words: [{ date: t, learned: 12, goal: 20 }],
    todos: [
      { id: uid("t"), text: "把简历最后一版发出去", done: false, at: now },
      { id: uid("t"), text: "给妈妈回电话", done: false, at: now - 3600_000 },
    ],
    bobaBudget: 25,
  };
};

export const useLifeStore = create<LifeState>()(
  persist(
    (set, get) => ({
      ...seed(),

      setAnniversary: (anniversary) => set({ anniversary }),

      toggleMeal: (key) => {
        const t = todayKey();
        const list = get().meals[t] ?? [];
        const next = list.includes(key)
          ? list.filter((k) => k !== key)
          : [...list, key];
        set({ meals: { ...get().meals, [t]: next } });
      },

      logSleep: (log) => {
        const rest = get().sleep.filter((s) => s.date !== log.date);
        set({ sleep: [log, ...rest].slice(0, 60) });
      },

      addLedger: ({ amount, category, note = "" }) => {
        if (!Number.isFinite(amount) || amount <= 0) return;
        const entry: LedgerEntry = {
          id: uid("l"),
          at: Date.now(),
          amount: Math.round(amount * 100) / 100,
          category,
          note,
        };
        set({ ledger: [entry, ...get().ledger].slice(0, 300) });
      },

      removeLedger: (id) =>
        set({ ledger: get().ledger.filter((e) => e.id !== id) }),

      setWords: (learned) => {
        const t = todayKey();
        const current = get().words.find((w) => w.date === t);
        const goal = current?.goal ?? 20;
        const rest = get().words.filter((w) => w.date !== t);
        set({
          words: [
            { date: t, learned: Math.max(0, learned), goal },
            ...rest,
          ].slice(0, 60),
        });
      },

      addTodo: (text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        set({
          todos: [
            { id: uid("t"), text: trimmed, done: false, at: Date.now() },
            ...get().todos,
          ],
        });
      },

      toggleTodo: (id) =>
        set({
          todos: get().todos.map((t) =>
            t.id === id ? { ...t, done: !t.done } : t,
          ),
        }),

      removeTodo: (id) =>
        set({ todos: get().todos.filter((t) => t.id !== id) }),

      setBobaBudget: (v) => set({ bobaBudget: Math.max(0, v) }),
    }),
    {
      name: "co-space::life",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
