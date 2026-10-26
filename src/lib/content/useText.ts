import { useContentStore, pick } from "../../stores/contentStore";
import { useConnectorStore } from "../../stores/connectorStore";
import {
  DAILY_WORD_PROMPT,
  HOME_EYEBROW,
  HOME_FOOTER,
  HOME_QUOTE,
  INITIATIVE_LINES,
  MORE_LABELS,
  NAV_LABELS,
  PAGE_TITLES,
  PEOPLE,
  PERSONA_DEFAULT,
  QUOTE_AUTHOR,
  ROOMS,
  type RoomKey,
} from "../../content";

/**
 * 内容读取钩子。
 *
 * 页面里不要直接 import 常量来渲染文字，一律走这里：
 *   const t = useText();
 *   <h1>{t.home.quote}</h1>
 *
 * 这样设置页改了文案，页面立刻就变——不需要重新构建。
 */

/** 合并后的文案集合。所有页面共用同一份。 */
export function useText() {
  const o = useContentStore((s) => s.overrides);

  const rooms = ROOMS.map((r) => ({
    ...r,
    label: pick(o.roomLabels[r.key], r.label),
    slogan: pick(o.roomSlogans[r.key], r.slogan),
  }));

  const pageTitles = Object.fromEntries(
    Object.entries(PAGE_TITLES).map(([k, v]) => [
      k,
      { ...v, title: pick(o.pageTitles[k], v.title) },
    ]),
  ) as { [K in keyof typeof PAGE_TITLES]: { title: string; sub: string } };

  return {
    people: PEOPLE,

    home: {
      eyebrow: HOME_EYEBROW,
      quote: pick(o.homeQuote, HOME_QUOTE),
      quoteAuthor: pick(o.quoteAuthor, QUOTE_AUTHOR),
      footer: HOME_FOOTER,
    },

    nav: {
      ...NAV_LABELS,
      ...MORE_LABELS,
    },

    pages: pageTitles,

    rooms,
    roomLabel: (k: RoomKey) =>
      rooms.find((r) => r.key === k)?.label ?? k,
    roomSlogan: (k: RoomKey) =>
      rooms.find((r) => r.key === k)?.slogan ?? "",

    persona: useConnectorStore((s) => s.persona) || PERSONA_DEFAULT,

    initiative: {
      late: pick(o.initiativeLate, INITIATIVE_LINES.late),
      quiet: pick(o.initiativeQuiet, INITIATIVE_LINES.quiet),
    },

    dailyWordPrompt: DAILY_WORD_PROMPT,
  };
}
