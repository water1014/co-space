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
  /** 本周听歌时长（小时）。 */
  listeningTime: number;
  currentSong: {
    title: string;
    artist: string;
    isPlaying: boolean;
  };

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
  togglePlay: () => void;
  setListeningTime: (hours: number) => void;
};

const seed = () => {
  const t = todayKey();
  const DAY = 86_400_000;
  const now = Date.now();

  // 七天账本：有起伏才看得出趋势，也才像真的在过日子。
  const plan: { d: number; amount: number; category: string; note?: string }[] = [
    { d: 6, amount: 38, category: "午饭" },
    { d: 5, amount: 26, category: "奶茶" },
    { d: 4, amount: 63, category: "晚饭", note: "和朋友" },
    { d: 3, amount: 31, category: "交通" },
    { d: 2, amount: 22, category: "奶茶" },
    { d: 1, amount: 47, category: "日用" },
    { d: 0, amount: 32, category: "午饭", note: "楼下那家" },
    { d: 0, amount: 18, category: "奶茶", note: "三分糖" },
  ];

  const ledger: LedgerEntry[] = plan.map((p) => ({
    id: uid("l"),
    at: now - p.d * DAY + 3 * 3600_000,
    amount: p.amount,
    category: p.category,
    note: p.note ?? "",
  }));

  const hours = [6.4, 7.2, 8.1, 5.9, 6.8, 7.4, 6.2];
  const sleep: SleepLog[] = hours.map((h, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: dayKeyOf(d),
      hours: h,
      bedAt: h < 6.5 ? "01:52" : "00:40",
      wakeAt: h < 6.5 ? "08:10" : "08:00",
    };
  });

  return {
    anniversary: daysAgo(91),
    meals: { [t]: ["lunch"] as MealKey[] },
    sleep,
    ledger,
    words: [{ date: t, learned: 12, goal: 20 }],
    todos: [
      { id: uid("t"), text: "把简历最后一版发出去", done: false, at: now },
      { id: uid("t"), text: "给妈妈回电话", done: false, at: now - 3600_000 },
    ],
    bobaBudget: 25,
    listeningTime: 12.7,
    currentSong: {
      title: "雨に濡れた街",
      artist: "Lamp",
      isPlaying: false,
    },
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

      togglePlay: () =>
        set({
          currentSong: {
            ...get().currentSong,
            isPlaying: !get().currentSong.isPlaying,
          },
        }),

      setListeningTime: (hours) => set({ listeningTime: Math.max(0, hours) }),
    }),
    {
      name: "co-space::life",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
