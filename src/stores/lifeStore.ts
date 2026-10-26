import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  BobaEntry,
  LedgerEntry,
  MealKey,
  SleepLog,
  Todo,
  Who,
  WordProgress,
  WrongWord,
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
  /** 每餐是谁记的（婉莹在页面上点 / 阿晏通过工具记）。 */
  mealBy: Record<string, Partial<Record<MealKey, Who>>>;
  /** 夜睡与午睡都在这里，用 kind 区分。 */
  sleep: SleepLog[];
  ledger: LedgerEntry[];
  /** 奶茶单独一间房：它有「额度」这个约定，不并进记账。 */
  bobas: BobaEntry[];
  words: WordProgress[];
  wrongWords: WrongWord[];
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
  /** dateKey 缺省为今天；周切换条与月历选中哪天就记哪天。 */
  toggleMeal: (key: MealKey, by?: Who, dateKey?: string) => void;
  logSleep: (log: SleepLog) => void;
  logNap: (input: { minutes: number; by?: Who; dateKey?: string }) => void;
  addLedger: (input: {
    amount: number;
    category: string;
    note?: string;
    by?: Who;
  }) => void;
  removeLedger: (id: string) => void;
  addBoba: (input: {
    price: number;
    note?: string;
    by?: Who;
    dateKey?: string;
  }) => void;
  removeBoba: (id: string) => void;
  setWords: (learned: number, dateKey?: string) => void;
  addWrongWord: (input: { word: string; reason: string; by?: Who }) => void;
  bumpWrongWord: (id: string) => void;
  removeWrongWord: (id: string) => void;
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
      kind: "night" as const,
      by: (i % 3 === 2 ? "yan" : "wan") as Who,
    };
  });

  const bobas: BobaEntry[] = [
    { d: 2, price: 22, note: "生椰" },
    { d: 0, price: 18, note: "三分糖" },
  ].map((p) => ({
    id: uid("b"),
    at: now - p.d * DAY,
    price: p.price,
    note: p.note,
    by: "wan" as Who,
  }));

  const wrongWords: WrongWord[] = [
    {
      id: uid("w"),
      word: "conscience",
      reason: "和 conscious 混了",
      times: 3,
      at: now - 2 * DAY,
      by: "yan" as Who,
    },
    {
      id: uid("w"),
      word: "restaurant",
      reason: "中间少写了一个 a",
      times: 2,
      at: now - 1 * DAY,
      by: "wan" as Who,
    },
  ];

  return {
    anniversary: daysAgo(91),
    meals: { [t]: ["lunch"] as MealKey[] },
    mealBy: { [t]: { lunch: "wan" as Who } },
    sleep,
    ledger,
    bobas,
    words: [{ date: t, learned: 12, goal: 20 }],
    wrongWords,
    todos: [
      {
        id: uid("t"),
        text: "一百天",
        done: false,
        at: now,
        due: "09.13",
        moon: true,
      },
      { id: uid("t"), text: "打印计算机准考证", done: false, at: now - 3600_000, due: "09.14" },
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

      toggleMeal: (key, by = "wan", dateKey) => {
        const t = dateKey ?? todayKey();
        const list = get().meals[t] ?? [];
        const next = list.includes(key)
          ? list.filter((k) => k !== key)
          : [...list, key];
        const byMap = { ...(get().mealBy[t] ?? {}) };
        if (next.includes(key)) byMap[key] = by;
        else delete byMap[key];
        set({
          meals: { ...get().meals, [t]: next },
          mealBy: { ...get().mealBy, [t]: byMap },
        });
      },

      logSleep: (log) => {
        const rest = get().sleep.filter(
          (s) => !(s.date === log.date && s.kind === log.kind),
        );
        set({ sleep: [log, ...rest].slice(0, 120) });
      },

      logNap: ({ minutes, by = "wan", dateKey }) => {
        const t = dateKey ?? todayKey();
        const nap: SleepLog = {
          date: t,
          hours: Math.round((minutes / 60) * 10) / 10,
          bedAt: "",
          wakeAt: "",
          kind: "nap",
          minutes,
          by,
        };
        set({ sleep: [nap, ...get().sleep].slice(0, 120) });
      },

      addLedger: ({ amount, category, note = "", by = "wan" }) => {
        if (!Number.isFinite(amount) || amount <= 0) return;
        const entry: LedgerEntry = {
          id: uid("l"),
          at: Date.now(),
          amount: Math.round(amount * 100) / 100,
          category,
          note,
          by,
        };
        set({ ledger: [entry, ...get().ledger].slice(0, 300) });
      },

      removeLedger: (id) =>
        set({ ledger: get().ledger.filter((e) => e.id !== id) }),

      addBoba: ({ price, note = "", by = "wan", dateKey }) => {
        if (!Number.isFinite(price) || price <= 0) return;
        const at = dateKey
          ? new Date(`${dateKey}T12:00:00`).getTime()
          : Date.now();
        const entry: BobaEntry = {
          id: uid("b"),
          at,
          price: Math.round(price * 100) / 100,
          note,
          by,
        };
        set({ bobas: [entry, ...get().bobas].slice(0, 120) });
      },

      removeBoba: (id) =>
        set({ bobas: get().bobas.filter((b) => b.id !== id) }),

      setWords: (learned, dateKey) => {
        const t = dateKey ?? todayKey();
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

      addWrongWord: ({ word, reason, by = "wan" }) => {
        const w = word.trim();
        if (!w) return;
        const exist = get().wrongWords.find(
          (x) => x.word.toLowerCase() === w.toLowerCase(),
        );
        if (exist) {
          set({
            wrongWords: get().wrongWords.map((x) =>
              x.id === exist.id ? { ...x, times: x.times + 1 } : x,
            ),
          });
          return;
        }
        set({
          wrongWords: [
            { id: uid("w"), word: w, reason, times: 1, at: Date.now(), by },
            ...get().wrongWords,
          ].slice(0, 120),
        });
      },

      bumpWrongWord: (id) =>
        set({
          wrongWords: get().wrongWords.map((x) =>
            x.id === id ? { ...x, times: x.times + 1 } : x,
          ),
        }),

      removeWrongWord: (id) =>
        set({ wrongWords: get().wrongWords.filter((x) => x.id !== id) }),

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
