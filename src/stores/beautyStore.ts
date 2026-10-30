import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Preset = {
  id: string;
  name: string;
  accent: string;
  accentDeep: string;
  accentSoft: string;
  swatch: string;
};

/** 几套配色预设：一键换肤，呼应你之前说的「自己装修美化」。 */
export const PRESETS: Preset[] = [
  { id: "rose", name: "经典绯红", accent: "#e2605f", accentDeep: "#c24a48", accentSoft: "rgba(226,96,95,0.12)", swatch: "#e2605f" },
  { id: "berry", name: "莓果粉", accent: "#d65a8a", accentDeep: "#b8446f", accentSoft: "rgba(214,90,138,0.12)", swatch: "#d65a8a" },
  { id: "mist", name: "雾蓝", accent: "#5b8fb0", accentDeep: "#45728f", accentSoft: "rgba(91,143,176,0.12)", swatch: "#5b8fb0" },
  { id: "matcha", name: "抹茶绿", accent: "#7a9a5b", accentDeep: "#5f7c43", accentSoft: "rgba(122,154,91,0.14)", swatch: "#7a9a5b" },
  { id: "amber", name: "暮金", accent: "#cf9a4e", accentDeep: "#b07e34", accentSoft: "rgba(207,154,78,0.14)", swatch: "#cf9a4e" },
];

function apply(p: Preset) {
  const root = document.documentElement;
  root.style.setProperty("--accent", p.accent);
  root.style.setProperty("--accent-deep", p.accentDeep);
  root.style.setProperty("--accent-soft", p.accentSoft);
}

type Beauty = {
  presetId: string;
  setPreset: (id: string) => void;
};

export const useBeautyStore = create<Beauty>()(
  persist(
    (set) => ({
      presetId: "rose",
      setPreset: (id) => {
        set({ presetId: id });
        const p = PRESETS.find((x) => x.id === id);
        if (p) apply(p);
      },
    }),
    {
      name: "co-space::beauty",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        const p = PRESETS.find((x) => x.id === state?.presetId) ?? PRESETS[0];
        apply(p);
      },
    },
  ),
);
