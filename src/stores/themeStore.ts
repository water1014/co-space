import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Theme } from "../types";

type ThemeState = {
  theme: Theme;
  /** 背景强度 0–100：压三团微光与森林底图的浓度。 */
  bgStrength: number;
  /** 玻璃透明度 0–100：0 是近乎全透，100 是磨砂最实。 */
  glassAlpha: number;
  setTheme: (t: Theme) => void;
  setBgStrength: (v: number) => void;
  setGlassAlpha: (v: number) => void;
  toggle: () => void;
};

/** 把两档偏好写到根节点的 CSS 变量上，App 启动与变更时都会调用。 */
export function applyAppearanceVars(s: {
  theme: Theme;
  bgStrength: number;
  glassAlpha: number;
}) {
  const root = document.documentElement;
  root.dataset.theme = s.theme;
  const base = s.theme === "night" ? 0.5 : 0.46;
  root.style.setProperty(
    "--glow-op",
    (base * (s.bgStrength / 100)).toFixed(3),
  );
  root.style.setProperty("--glass-k", (s.glassAlpha / 100).toFixed(3));
  const bg = document.querySelector<HTMLElement>(".app-bg > img");
  if (bg) bg.style.opacity = String((s.theme === "night" ? 0.3 : 0.16) * (s.bgStrength / 100));
}

/**
 * 主题是内容的一部分，不是偏好设置：
 * 夜里是暖黑叠绯光，白天是玫瑰雾叠深绯，两套都是设计好的，不是反色。
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "day",
      bgStrength: 100,
      glassAlpha: 100,
      setTheme: (theme) => {
        set({ theme });
        applyAppearanceVars(get());
      },
      setBgStrength: (bgStrength) => {
        set({ bgStrength });
        applyAppearanceVars(get());
      },
      setGlassAlpha: (glassAlpha) => {
        set({ glassAlpha });
        applyAppearanceVars(get());
      },
      toggle: () => get().setTheme(get().theme === "night" ? "day" : "night"),
    }),
    {
      name: "co-space::theme",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) applyAppearanceVars(state);
      },
    },
  ),
);
