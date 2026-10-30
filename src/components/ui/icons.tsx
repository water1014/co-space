import type { SVGProps } from "react";

const base = (p: SVGProps<SVGSVGElement>) => ({
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...p,
});

export const IconHome = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />
  </svg>
);

export const IconChat = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M20 12.5c0 3.6-3.6 6.5-8 6.5-1 0-2-.15-2.9-.42L4.5 20l1.2-3.2C4.4 15.6 4 14.1 4 12.5 4 8.9 7.6 6 12 6s8 2.9 8 6.5z" />
  </svg>
);

export const IconSpark = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9z" />
  </svg>
);

export const IconHeart = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 19.5s-6.8-4.2-6.8-9A3.7 3.7 0 0 1 12 8a3.7 3.7 0 0 1 6.8 2.5c0 4.8-6.8 9-6.8 9z" />
  </svg>
);

export const IconGear = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3.1" />
    <path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a1.9 1.9 0 1 1-2.7 2.7l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2a1.9 1.9 0 0 1-3.8 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a1.9 1.9 0 1 1-2.7-2.7l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a1.9 1.9 0 1 1 0-3.8h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1A1.9 1.9 0 1 1 7 4.5l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a1.9 1.9 0 1 1 3.8 0v.2a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a1.9 1.9 0 1 1 2.7 2.7l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1h.2a1.9 1.9 0 1 1 0 3.8h-.2a1.6 1.6 0 0 0-1.5 1z" />
  </svg>
);

export const IconMore = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.8" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.8" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.8" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8" />
  </svg>
);

export const IconPlus = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconMic = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
  </svg>
);

export const IconSend = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M5 12h13M13 6l6 6-6 6" />
  </svg>
);

export const IconPlay = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M8 5.5v13l10-6.5z" />
  </svg>
);

export const IconPause = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M9 5.5v13M15 5.5v13" />
  </svg>
);

export const IconChevron = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const IconCheck = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M5 12.5 9.5 17 19 7" />
  </svg>
);

export const IconSearch = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="6.2" />
    <path d="M15.6 15.6 20 20" />
  </svg>
);

export const IconClose = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const IconFile = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7z" />
    <path d="M14 3v4h4" />
  </svg>
);

export const IconSun = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
  </svg>
);

export const IconMoon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
  </svg>
);

export const IconTrash = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 7h16M9 7V5h6v2M6 7l1 12.5h10L18 7" />
  </svg>
);

export const IconEdit = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 20h4L19 9a2 2 0 0 0-3-3L5 17z" />
  </svg>
);

export const IconBook = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 6.2C10.2 4.8 7.7 4.4 5 4.7v13.3c2.7-.3 5.2.1 7 1.5 1.8-1.4 4.3-1.8 7-1.5V4.7c-2.7-.3-5.2.1-7 1.5z" />
    <path d="M12 6.2V19" />
  </svg>
);

export const IconFolder = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3.5 6.5A2 2 0 0 1 5.5 4.5h4l2 2.5h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
  </svg>
);

/** 三餐：碗口 + 碗身 + 两缕热气（线条勾勒） */
export const IconBowl = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3.5 11.5h17" />
    <path d="M4.6 11.5a7.4 7.4 0 0 0 14.8 0" />
    <path d="M9.7 8c-.4-.9.4-1.6.4-2.6M14.2 8c-.4-.9.4-1.6.4-2.6" />
  </svg>
);

/** 奶茶：杯身 + 杯盖 + 吸管（线条勾勒） */
export const IconCup = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M6.5 9h11l-1.2 9.6a1.4 1.4 0 0 1-1.4 1.2H9.1a1.4 1.4 0 0 1-1.4-1.2z" />
    <path d="M9 9V7.3A3 3 0 0 1 15 7.3V9" />
    <path d="M12 6.4v7.6" />
  </svg>
);

/** 记账：圆 + ¥ 符号（线条勾勒） */
export const IconCoin = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8.2v7.6M9.9 9.8c0-1 .9-1.5 2.1-1.5s2.1.6 2.1 1.5-1 1.4-2.1 1.4-2.1.5-2.1 1.4 1 1.5 2.1 1.5 2.1-.6 2.1-1.5" />
  </svg>
);

/**
 * 七房间 → 线条图标映射。
 * 用途：Home 与 Together 的房间网格统一用线条勾勒，不再依赖 emoji 字体。
 */
export const ROOM_ICONS: Record<
  string,
  (p: SVGProps<SVGSVGElement>) => JSX.Element
> = {
  meal: IconBowl,
  sleep: IconMoon,
  ledger: IconCoin,
  boba: IconCup,
  words: IconBook,
  wrong: IconClose,
  reward: IconSpark,
};

/** 汉堡菜单（侧边栏开关） */
export const IconMenu = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 7h16" />
    <path d="M4 12h16" />
    <path d="M4 17h16" />
  </svg>
);

/** 相册：两张叠放的照片（线条勾勒） */
export const IconImages = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="4" y="6" width="13" height="13" rx="2.2" />
    <path d="M8.5 4.5h11A1.5 1.5 0 0 1 21 6v11" />
    <circle cx="9.5" cy="11" r="1.6" />
    <path d="M6.5 18l4-4 3 3 3-3 3.5 3.5" />
  </svg>
);

/** 用户（「我」） */
export const IconUser = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8.5" r="3.6" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
);

/** 刷新（换一句） */
export const IconRefresh = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M20 12a8 8 0 1 1-2.3-5.6" />
    <path d="M20 4v3.4h-3.4" />
  </svg>
);

/** 日历（共享日历 / 纪念日 / 约会计划） */
export const IconCalendar = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="4" y="5" width="16" height="15" rx="2.6" />
    <path d="M4 9.5h16" />
    <path d="M8.5 3v4M15.5 3v4" />
    <path d="M8 14h3" />
  </svg>
);

/** 音乐（共享歌单 / 同步听歌） */
export const IconMusic = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M9 17.5V6l10-2v11.5" />
    <circle cx="6.8" cy="17.5" r="2.4" />
    <circle cx="16.8" cy="15.5" r="2.4" />
    <path d="M16.8 15.5V8.5" />
  </svg>
);

/** 旅游（出行打卡 / 旅行轨迹） */
export const IconTravel = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.4" />
    <path d="M15.6 8.4 12.8 12.8 8.4 14.1 11.2 9.7z" />
  </svg>
);

/** 健康（作息 / 健康打卡） */
export const IconHealth = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 12h4l2-5 3.2 9 2-6 1.4 2.2H21" />
  </svg>
);

/** 额度（共同预算管理） */
export const IconWallet = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3" y="6.5" width="18" height="12" rx="2.6" />
    <path d="M3 10.5h18" />
    <circle cx="16.5" cy="14" r="1.3" />
  </svg>
);

/** 朋友圈（情侣动态广场） */
export const IconMoments = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="9" cy="9" r="3.2" />
    <path d="M3.4 19a5.6 5.6 0 0 1 11.2 0" />
    <circle cx="16.6" cy="10" r="2.6" />
    <path d="M14.8 15.4a5 5 0 0 1 5.6 3.6" />
  </svg>
);

/** 生图室（AI 插画生成） */
export const IconStudio = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="4" y="5" width="16" height="14" rx="2.6" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="M6 17l4-4 3 2.4 2-1.6 3 3" />
    <path d="M17 3.2l.9 2.3 2.3.9-2.3.9L17 9.6l-.9-2.3-2.3-.9 2.3-.9z" />
  </svg>
);

/** 共读听影（同步读书 / 观影 / 听音频） */
export const IconLounge = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4.5 14v-1.6a7.5 7.5 0 0 1 15 0V14" />
    <path d="M4.5 14a2 2 0 0 1 2 2v2a2 2 0 0 1-4 0v-2a2 2 0 0 1 2-2z" />
    <path d="M19.5 14a2 2 0 0 1 2 2v2a2 2 0 0 1-4 0v-2a2 2 0 0 1 2-2z" />
  </svg>
);

/** 记忆（珍贵瞬间存档合集） */
export const IconMemory = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M7 5.5h10a1 1 0 0 1 1 1V20l-6-3.6L6 20V6.5a1 1 0 0 1 1-1z" />
  </svg>
);

/** 一对一联系（快捷呼叫 / 消息直达） */
export const IconPhone = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M6.5 4h3l1.5 4-2 1.6a11 11 0 0 0 5 5l1.6-2 4 1.5v3a2 2 0 0 1-2.2 2A15 15 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4z" />
  </svg>
);

/** 更多（三点） */
export const IconDots = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="5.5" cy="12" r="1.15" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none" />
    <circle cx="18.5" cy="12" r="1.15" fill="currentColor" stroke="none" />
  </svg>
);

/** 相机（输入栏左侧那颗圆钮） */
export const IconCamera = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 8.5h3l1.4-2h7.2L17 8.5h3a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1z" />
    <circle cx="12" cy="13.4" r="3.1" />
  </svg>
);
