import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Theme } from "../types";

type ThemeState = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
};

/**
 * 主题是内容的一部分，不是偏好设置：
 * 夜里是深灰叠噪点，白天是奶白叠微光，两套都是设计好的，不是反色。
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "night",
      setTheme: (theme) => {
        set({ theme });
        document.documentElement.dataset.theme = theme;
      },
      toggle: () => get().setTheme(get().theme === "night" ? "day" : "night"),
    }),
    {
      name: "co-space::theme",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) document.documentElement.dataset.theme = state.theme;
      },
    },
  ),
);
