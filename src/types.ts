/** 全站共享的领域类型。UI 只认这些形状，不认后端实现。 */

export type Mood = "calm" | "warm" | "low" | "focused" | "restless";

export const MOOD_LABEL: Record<Mood, string> = {
  calm: "平静",
  warm: "温和",
  low: "低电量",
  focused: "专注",
  restless: "不安",
};

/** 环境色，RGB 三元组，供 CSS 变量与粒子 tint 共用。 */
export const MOOD_RGB: Record<Mood, [number, number, number]> = {
  calm: [127, 166, 184],
  warm: [201, 168, 124],
  low: [110, 106, 130],
  focused: [159, 184, 168],
  restless: [184, 138, 138],
};

export type BoundaryRule = "fake-we" | "identity-fusion" | "loop";

export const BOUNDARY_RULE_LABEL: Record<BoundaryRule, string> = {
  "fake-we": "关系融合表达",
  "identity-fusion": "身份融合表达",
  loop: "安慰循环",
};

export type BoundaryHit = {
  rule: BoundaryRule;
  /** 命中的原文片段，仅用于当场展示，不落库。 */
  original: string;
  replacement: string;
  at: number;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: number;
  status: "streaming" | "complete" | "cancelled";
  /** user = 用户输入 / initiative = 主动开口 / reply = 回应 */
  origin: "user" | "initiative" | "reply";
  /** 拦截层对这一条做过什么。原始文本仍然保留在 text 里。 */
  boundary?: { hits: BoundaryHit[]; calibrated: string };
};

export type MemorySource = "conversation" | "manual" | "reflection";

export const MEMORY_SOURCE_LABEL: Record<MemorySource, string> = {
  conversation: "从对话中留下",
  manual: "你写下的",
  reflection: "它自己记下的",
};

export type MemoryEntry = {
  id: string;
  text: string;
  source: MemorySource;
  /** 来源锚点：消息 id 或对话轮次说明。 */
  sourceRef?: string;
  createdAt: number;
  updatedAt: number;
  /** 0–1，会随时间衰减，用于召回排序。 */
  weight: number;
  pinned: boolean;
  sealed: boolean;
};

export type InitiativeLevel = 0 | 1 | 2 | 3;

export const INITIATIVE_LABEL: Record<InitiativeLevel, string> = {
  0: "安静",
  1: "克制",
  2: "自然",
  3: "主动",
};

export const INITIATIVE_NOTE: Record<InitiativeLevel, string> = {
  0: "不会主动开口。只在你说话时回应。",
  1: "很少主动。只在很久没见时留一句。",
  2: "会在合适的时候开口，比如你比平时晚了很多。",
  3: "更愿意先说话。仍然会等你回应。",
};
