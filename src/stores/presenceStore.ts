import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Mood } from "../types";

type PresenceState = {
  /** 0–1。不是好感度，是它现在有多少余量回应你。 */
  energy: number;
  mood: Mood;
  /** 它是不是正在想（思考过程面板会用到）。 */
  thinking: boolean;
  /** 首页那句状态。 */
  statusLine: string;
  lastInteractionAt: number;
  /** 0–1：今天连续高频互动的强度。 */
  dependSignal: number;
  /** 每次交互抬一次，用于轻微脉冲。 */
  pulseAt: number;

  setEnergy: (v: number) => void;
  nudgeEnergy: (d: number) => void;
  setMood: (m: Mood) => void;
  setThinking: (v: boolean) => void;
  setStatusLine: (v: string) => void;
  touch: () => void;
  pulse: () => void;
  setDependSignal: (v: number) => void;
};

export const usePresenceStore = create<PresenceState>()(
  persist(
    (set, get) => ({
      energy: 0.72,
      mood: "calm",
      thinking: false,
      statusLine: "在等你回来",
      lastInteractionAt: Date.now(),
      dependSignal: 0,
      pulseAt: 0,

      setEnergy: (energy) => set({ energy: Math.max(0.05, Math.min(1, energy)) }),
      nudgeEnergy: (d) =>
        set({ energy: Math.max(0.05, Math.min(1, get().energy + d)) }),
      setMood: (mood) => set({ mood }),
      setThinking: (thinking) => set({ thinking }),
      setStatusLine: (statusLine) => set({ statusLine }),
      touch: () => set({ lastInteractionAt: Date.now() }),
      pulse: () => set({ pulseAt: Date.now() }),
      setDependSignal: (v) => set({ dependSignal: Math.max(0, Math.min(1, v)) }),
    }),
    {
      name: "co-space::presence",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        energy: s.energy,
        mood: s.mood,
        lastInteractionAt: s.lastInteractionAt,
      }),
    },
  ),
);
