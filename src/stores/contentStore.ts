import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * 运行时文案覆盖层。
 *
 * `src/content/index.ts` 是文案的**默认值**（编译进包里）；
 * 这个 store 是它的**覆盖值**（存在浏览器里，随时能改）。
 *
 * 优先规则：override 里有值就用 override 的，否则用默认值。
 * 在设置页改完立刻生效，不用重新构建、不用刷新。
 *
 * 只覆盖"最常改"的几类：房间口号、页面标题、首页引言、AI 人设、主动开口。
 * 更细的文案仍然去 src/content/index.ts 改。
 */

export type Overrides = {
  /** 房间 key → 口号 */
  roomSlogans: Record<string, string>;
  /** 房间 key → 显示名 */
  roomLabels: Record<string, string>;
  /** 页面 key → 标题 */
  pageTitles: Record<string, string>;
  /** 首页引言 */
  homeQuote: string;
  /** 首页引言署名 */
  quoteAuthor: string;
  /** 主动开口 · 深夜 */
  initiativeLate: string;
  /** 主动开口 · 平常 */
  initiativeQuiet: string;
};

type ContentState = {
  overrides: Overrides;
  set: <K extends keyof Overrides>(key: K, value: Overrides[K]) => void;
  /** 改某个房间的名字或口号。value 为空表示回到默认值。 */
  setRoom: (
    roomKey: string,
    field: "roomLabels" | "roomSlogans",
    value: string,
  ) => void;
  /** 改某个页面的标题。value 为空表示回到默认值。 */
  setPageTitle: (pageKey: string, value: string) => void;
  reset: () => void;
};

export const EMPTY_OVERRIDES: Overrides = {
  roomSlogans: {},
  roomLabels: {},
  pageTitles: {},
  homeQuote: "",
  quoteAuthor: "",
  initiativeLate: "",
  initiativeQuiet: "",
};

export const useContentStore = create<ContentState>()(
  persist(
    (set) => ({
      overrides: EMPTY_OVERRIDES,

      set: (key, value) =>
        set((s) => ({
          overrides: { ...s.overrides, [key]: value },
        })),

      setRoom: (roomKey, field, value) =>
        set((s) => ({
          overrides: {
            ...s.overrides,
            [field]: { ...s.overrides[field], [roomKey]: value },
          },
        })),

      setPageTitle: (pageKey, value) =>
        set((s) => ({
          overrides: {
            ...s.overrides,
            pageTitles: { ...s.overrides.pageTitles, [pageKey]: value },
          },
        })),

      reset: () => set({ overrides: EMPTY_OVERRIDES }),
    }),
    {
      name: "co-space::content",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/** 读一个字符串覆盖：有值用覆盖，空则回退默认值。 */
export function pick(
  override: string | undefined,
  fallback: string,
): string {
  return override && override.trim() ? override : fallback;
}
