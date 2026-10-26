/** 全站领域类型。UI 只认这些形状。 */

export type Theme = "night" | "day";
export type TabKey = "home" | "chat" | "memory" | "together" | "diary" | "mit";

export type Mood = "calm" | "warm" | "low" | "focused";

export const MOOD_LABEL: Record<Mood, string> = {
  calm: "平静",
  warm: "温和",
  low: "低电量",
  focused: "专注",
};

/* ---------------- 边界 ---------------- */

export type BoundaryRule = "fake-we" | "identity-fusion" | "loop";

export const BOUNDARY_RULE_LABEL: Record<BoundaryRule, string> = {
  "fake-we": "关系融合",
  "identity-fusion": "身份融合",
  loop: "安慰循环",
};

export type BoundaryHit = {
  rule: BoundaryRule;
  original: string;
  replacement: string;
  at: number;
};

/* ---------------- 消息 ---------------- */

/** 一条消息由若干段组成：文字、思考、语音、文件、图片。 */
export type MessagePart =
  | { type: "text"; text: string }
  | {
      type: "thought";
      seconds: number;
      tools: string[];
      steps: string[];
    }
  | {
      type: "voice";
      duration: number;
      peaks: number[];
      transcript?: string;
    }
  | { type: "file"; name: string; size: number; mime: string }
  | { type: "image"; seed: number; caption?: string };

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  parts: MessagePart[];
  createdAt: number;
  status: "streaming" | "complete" | "cancelled";
  origin: "user" | "initiative" | "reply";
  boundary?: { hits: BoundaryHit[]; calibrated: string };
};

/** 取消息里的纯文本（预览、复制、记忆提取都用它）。 */
export const messageText = (m: ChatMessage): string =>
  m.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n\n");

/* ---------------- 记忆 ---------------- */

export type MemoryKind = "fact" | "feel" | "todo";

export const MEMORY_KIND_LABEL: Record<MemoryKind, string> = {
  fact: "事实",
  feel: "感受",
  todo: "待兑现",
};

export type MemorySource = "conversation" | "manual" | "reflection";

export const MEMORY_SOURCE_LABEL: Record<MemorySource, string> = {
  conversation: "从对话留下",
  manual: "你写下的",
  reflection: "它自己记下的",
};

export type MemoryEntry = {
  id: string;
  text: string;
  kind: MemoryKind;
  tags: string[];
  source: MemorySource;
  sourceRef?: string;
  createdAt: number;
  updatedAt: number;
  /** 0–1，随时间衰减，用于召回排序。 */
  weight: number;
  pinned: boolean;
  resolved: boolean;
  /** 生命期：自然来去（默认）还是慢忘（衰减更慢，刻意留住）。 */
  decay?: MemoryDecay;
};

/** 记忆的生命期：自然来去 vs 慢忘。 */
export type MemoryDecay = "natural" | "slow";

/** 记忆的可见状态：正常 / 待兑现 / 钉住。由 pinned + kind + resolved 推导。 */
export type MemoryStatus = "normal" | "todo" | "pinned";

export const memoryStatusOf = (m: MemoryEntry): MemoryStatus => {
  if (m.pinned) return "pinned";
  if (m.kind === "todo" && !m.resolved) return "todo";
  return "normal";
};

export const MEMORY_STATUS_LABEL: Record<MemoryStatus, string> = {
  normal: "正常",
  todo: "待兑现",
  pinned: "钉住",
};

export const MEMORY_DECAY_LABEL: Record<MemoryDecay, string> = {
  natural: "自然来去",
  slow: "慢忘",
};

/** 回声：它每次尝试回忆的流水，含得分。黑盒可视化。 */
export type Echo = {
  id: string;
  at: number;
  query: string;
  hit: boolean;
  score: number;
  /** 未命中时最接近的那条。 */
  nearId?: string;
  note?: string;
};

/** 印记：记忆被画出来的那一张。 */
export type Imprint = {
  id: string;
  title: string;
  seed: number;
  at: number;
  prompt: string;
  messageId?: string;
};

/* ---------------- 生活 ---------------- */

/** 谁记的：婉莹在页面上点，阿晏通过工具调接口记。小圆点区分。 */
export type Who = "wan" | "yan";

export const WHO_LABEL: Record<Who, string> = {
  wan: "婉莹",
  yan: "阿晏",
};

/** 小圆点的颜色：婉莹绯红，阿晏月白。 */
export const WHO_DOT: Record<Who, string> = {
  wan: "var(--accent)",
  yan: "#cfd8e3",
};

export type MealKey = "breakfast" | "lunch" | "dinner";

export const MEAL_LABEL: Record<MealKey, string> = {
  breakfast: "早饭",
  lunch: "午饭",
  dinner: "晚饭",
};

export type SleepLog = {
  /** 夜睡：入睡那天的 dayKey（凌晨两点睡算前一天）；午睡：当天 dayKey。 */
  date: string;
  /** 夜睡 = 小时；午睡 = 分钟，hours 字段冗余存小时数便于统计。 */
  hours: number;
  bedAt: string;
  wakeAt: string;
  kind?: "night" | "nap";
  /** 午睡分钟数。 */
  minutes?: number;
  by?: Who;
};

export type LedgerEntry = {
  id: string;
  at: number;
  amount: number;
  category: string;
  note: string;
  by?: Who;
};

/** 奶茶不并进记账——它有「额度」这个约定，值得单独一间房。 */
export type BobaEntry = {
  id: string;
  at: number;
  price: number;
  note: string;
  by?: Who;
};

/** 错词本：听写/对话里拼错或用错的词，阿晏每天会问。 */
export type WrongWord = {
  id: string;
  word: string;
  reason: string;
  times: number;
  at: number;
  by?: Who;
};

export type Todo = {
  id: string;
  text: string;
  done: boolean;
  at: number;
  /** 截止日 MM.DD，参考图右缘那种 */
  due?: string;
  /** 里程碑（百日/生日）前的月亮标记 */
  moon?: boolean;
};

export type WordProgress = {
  date: string;
  learned: number;
  goal: number;
};

/* ---------------- 关系 / 连接 ---------------- */

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

export type ConnectorId = "map" | "mail" | "files" | "mcp";

export type ConnectorMeta = {
  id: ConnectorId;
  name: string;
  desc: string;
  /** 需要的外部权限，写在开关旁边，不藏起来。 */
  scope: string;
};

export const CONNECTORS: ConnectorMeta[] = [
  { id: "map", name: "地图", desc: "查路线、附近的地方", scope: "位置" },
  { id: "mail", name: "邮件", desc: "读未读、起草回复", scope: "邮箱读写" },
  { id: "files", name: "本地文件", desc: "读你授权的目录", scope: "文件读取" },
  { id: "mcp", name: "MCP 服务", desc: "接入自定义工具", scope: "由服务决定" },
];

export type ModelConfig = {
  baseUrl: string;
  model: string;
  hasKey: boolean;
};

/* ---------------- 日记与阅读 ---------------- */

/** 一篇日记：按天记，一天一篇。 */
export type DiaryEntry = {
  id: string;
  /** dayKey，如 2026-10-26 */
  date: string;
  text: string;
  mood: string;
  createdAt: number;
  updatedAt: number;
};

/** 正在读的一本书：按段落拆好，方便划线批注定位到某一句。 */
export type Book = {
  id: string;
  title: string;
  author: string;
  paragraphs: string[];
};

/** 划线批注：用户选了一段文字，写下批注，AI 针对这段文字回一句。 */
export type Annotation = {
  id: string;
  bookId: string;
  paraIndex: number;
  quote: string;
  note: string;
  reply: string;
  createdAt: number;
};

/* ---------------- 项目（像 Claude 的“家”） ---------------- */

/**
 * 一个项目 = 一个独立的语境：自己的名字、自己的 md 设定。
 * 激活哪一个，对话就去读哪一份人格，而不是全局那一份。
 */
export type Project = {
  id: string;
  name: string;
  /** 主题色，用在导航与卡片上做区分。 */
  color: string;
  /** 挂载的 md 设定正文，会作为 system prompt 第一段发出去。 */
  personaMd: string;
  createdAt: number;
};
