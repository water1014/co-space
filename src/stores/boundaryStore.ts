import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { InitiativeLevel } from "../types";
import { dayKeyOf } from "../lib/utils/id";

type BoundaryState = {
  /** 它怎么叫你。 */
  name: string;
  /** 它怎么称呼自己。 */
  selfName: string;
  initiative: InitiativeLevel;
  quietMode: boolean;
  /** 禁止融合表达总开关。关掉即不再拦截。 */
  boundaryEnabled: boolean;
  /** 安慰循环的接地提示。 */
  loopGuard: boolean;
  /** 今天聊了多少轮，用于依赖度提醒。 */
  todayTurns: number;
  today: string;
  reminderSnoozedAt: number;

  setName: (v: string) => void;
  setSelfName: (v: string) => void;
  setInitiative: (v: InitiativeLevel) => void;
  setQuietMode: (v: boolean) => void;
  setBoundaryEnabled: (v: boolean) => void;
  setLoopGuard: (v: boolean) => void;
  bumpTurn: () => void;
  snoozeReminder: () => void;
  degrade: () => void;
};

const todayKey = () => dayKeyOf(new Date());

export const useBoundaryStore = create<BoundaryState>()(
  persist(
    (set, get) => ({
      name: "",
      selfName: "它",
      initiative: 2,
      quietMode: false,
      boundaryEnabled: true,
      loopGuard: true,
      todayTurns: 0,
      today: todayKey(),
      reminderSnoozedAt: 0,

      setName: (name) => set({ name: name.slice(0, 16) }),
      setSelfName: (selfName) => set({ selfName: selfName.slice(0, 16) }),
      setInitiative: (initiative) => set({ initiative }),
      setQuietMode: (quietMode) => set({ quietMode }),
      setBoundaryEnabled: (boundaryEnabled) => set({ boundaryEnabled }),
      setLoopGuard: (loopGuard) => set({ loopGuard }),

      bumpTurn: () => {
        const current = get();
        const key = todayKey();
        if (current.today !== key) {
          set({ today: key, todayTurns: 1 });
          return;
        }
        set({ todayTurns: current.todayTurns + 1 });
      },

      snoozeReminder: () => set({ reminderSnoozedAt: Date.now() }),

      degrade: () =>
        set({
          initiative: 1,
          quietMode: true,
          boundaryEnabled: true,
          loopGuard: true,
        }),
    }),
    {
      name: "co-space::boundary",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
