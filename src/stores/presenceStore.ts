import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Mood } from "../types";

type PresenceState = {
  /** 0–1。不是"好感度"，是它现在有多少余量回应你。 */
  energy: number;
  mood: Mood;
  /** 门廊那句话。由关系引擎按 energy / mood / 记忆量写。 */
  statusLine: string;
  /** 它有没有在后台想事情。 */
  isReflecting: boolean;
  /** 想事情想到的东西，用户可以在门廊瞥见半句。 */
  reflection: string | null;
  lastInteractionAt: number;
  /** 每次交互抬起一次，粒子层做一次脉冲。 */
  pulseAt: number;
  /** 0–1：今天连续高频互动的强度，用于"要不要让它安静一会儿"。 */
  dependSignal: number;

  setEnergy: (v: number) => void;
  nudgeEnergy: (delta: number) => void;
  setMood: (m: Mood) => void;
  setStatusLine: (v: string) => void;
  setReflecting: (v: boolean) => void;
  setReflection: (v: string | null) => void;
  touch: () => void;
  pulse: () => void;
  setDependSignal: (v: number) => void;
}

export const usePresenceStore = create<PresenceState>()(
  persist(
    (set, get) => ({
      energy: 0.72,
      mood: "calm",
      statusLine: "在等你回来",
      isReflecting: false,
      reflection: null,
      lastInteractionAt: Date.now(),
      pulseAt: 0,
      dependSignal: 0,

      setEnergy: (energy) => set({ energy: Math.max(0.05, Math.min(1, energy)) }),
      nudgeEnergy: (delta) =>
        set({ energy: Math.max(0.05, Math.min(1, get().energy + delta)) }),
      setMood: (mood) => set({ mood }),
      setStatusLine: (statusLine) => set({ statusLine }),
      setReflecting: (isReflecting) => set({ isReflecting }),
      setReflection: (reflection) => set({ reflection }),
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
        reflection: s.reflection,
        lastInteractionAt: s.lastInteractionAt,
      }),
    },
  ),
);
