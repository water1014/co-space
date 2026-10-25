import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { InitiativeLevel } from "../types";

type RelationState = {
  /** 它怎么叫你。空字符串 = 不称呼。 */
  name: string;
  /** 它怎么称呼自己。 */
  selfName: string;
  /** 主动性档位：决定什么时候允许开口。 */
  initiative: InitiativeLevel;
  /** 安静模式：不主动、粒子更沉。 */
  quietMode: boolean;
  /** 禁止融合表达（"我们会一起…"这类）总开关。关掉即不再拦截。 */
  boundaryEnabled: boolean;
  /** 安慰循环的接地提示。 */
  loopGuard: boolean;
  /** 今天已经聊了多少轮，用于依赖度提醒。 */
  todayTurns: number;
  today: string;
  /** 提醒被温柔拒绝的时间戳，避免反复打扰。 */
  reminderSnoozedAt: number;

  setName: (v: string) => void;
  setSelfName: (v: string) => void;
  setInitiative: (v: InitiativeLevel) => void;
  setQuietMode: (v: boolean) => void;
  setBoundaryEnabled: (v: boolean) => void;
  setLoopGuard: (v: boolean) => void;
  bumpTurn: () => void;
  snoozeReminder: () => void;
  /** 降级：把关系参数回到初始，不删除任何记忆。 */
  degrade: () => void;
};

const todayKey = () => new Date().toISOString().slice(0, 10);

export const useRelationStore = create<RelationState>()(
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
      name: "co-space::relation",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        name: s.name,
        selfName: s.selfName,
        initiative: s.initiative,
        quietMode: s.quietMode,
        boundaryEnabled: s.boundaryEnabled,
        loopGuard: s.loopGuard,
        todayTurns: s.todayTurns,
        today: s.today,
        reminderSnoozedAt: s.reminderSnoozedAt,
      }),
    },
  ),
);
