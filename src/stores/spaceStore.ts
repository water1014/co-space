import { create } from "zustand";

export type RoomId = "threshold" | "space" | "memory" | "boundary";

type SpaceState = {
  room: RoomId;
  /** 是否已经走进过共同空间：决定门廊的措辞。 */
  hasEntered: boolean;
  /** 0–1，粒子层的总强度。由关系引擎写入，不由页面自己算。 */
  particleScale: number;
  /** 正在写字/读记忆时，让背景退后一点。 */
  focus: boolean;
  setRoom: (room: RoomId) => void;
  enter: () => void;
  setParticleScale: (v: number) => void;
  setFocus: (v: boolean) => void;
};

export const useSpaceStore = create<SpaceState>((set) => ({
  room: "threshold",
  hasEntered: false,
  particleScale: 1,
  focus: false,
  setRoom: (room) => set({ room }),
  enter: () => set({ hasEntered: true, room: "space" }),
  setParticleScale: (particleScale) =>
    set({ particleScale: Math.max(0, Math.min(1, particleScale)) }),
  setFocus: (focus) => set({ focus }),
}));
