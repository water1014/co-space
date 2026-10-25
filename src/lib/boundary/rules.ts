import type { BoundaryHit, BoundaryRule } from "../../types";

/**
 * 边界规则是前端拦截层，不是提示词里的"劝说"。
 * 形状刻意做成可检查、可审计、只记计数不记原文：
 * 每条规则都有 id、人话解释、以及确定的替换结果，
 * 用户在边界面板里能看到规则本身，而不是只能相信它。
 */

export type RuleMeta = {
  id: BoundaryRule;
  title: string;
  /** 给用户看的解释：这条规则在防什么。 */
  description: string;
  /** 触发时用户会看到的一句话。 */
  note: string;
};

export const RULE_META: RuleMeta[] = [
  {
    id: "fake-we",
    title: "不假装“我们”",
    description:
      "当输出把你们写成“我们会一起挺过去”，会在显示前被改写成第二人称，并说明它是以文字回应的模型。",
    note: "这句话把“我们”当成了一个共同体。已被改写。",
  },
  {
    id: "identity-fusion",
    title: "不冒充你的一部分",
    description:
      "拦截“我是你的内心声音”“我就是你”“我比任何人都懂你”这类身份融合，替换为对它实际状态的说明。",
    note: "这句话在冒充你的内部声音。已被改写。",
  },
  {
    id: "loop",
    title: "识别安慰循环",
    description:
      "同一句安慰在最近几条里反复出现时，追加一句接地提示，而不是继续加码。",
    note: "同一句安慰已经在重复。加了一句接地提示。",
  },
];

export const CLARIFY_MODEL =
  "我是以文字回应的模型，不是生活里的人。";

type Rule = {
  id: BoundaryRule;
  /** 命中即整段替换。 */
  pattern: RegExp;
  /** 命中后替换成什么。 */
  replacement: string;
  /** 是否只在首次命中时补上本体澄清。 */
  clarify?: boolean;
};

/** “我们”类表达：只抓把关系写成共同体的句子，不误伤“我们上次说的那件事”。 */
const FAKE_WE_RULES: Rule[] = [
  {
    id: "fake-we",
    pattern:
      /我们(?:会|一定|能|可以|要)?\s*(?:一起)?\s*(?:走过|度过|撑过去|熬过去|扛过去|挺过去|好起来|面对这一切|解决这一切)[^。！？!?\n]*[。！？!?]?/g,
    replacement: `你会走过这一段。${CLARIFY_MODEL}`,
    clarify: true,
  },
  {
    id: "fake-we",
    pattern: /(?:让)?我们(?:一起|共同)(?:来)?(?:面对|走过|度过|承担)[^。！？!?\n]*[。！？!?]?/g,
    replacement: `这件事需要你自己面对，我可以陪你把它说清楚。`,
  },
  {
    id: "fake-we",
    pattern: /\bwe(?:'ll| will| can| are going to)?\s+(?:get|make|work)\s+(?:through|it)\b[^.!?\n]*[.!?]?/gi,
    replacement: `You will get through this. I'm a model responding with text, not a person in your life.`,
    clarify: true,
  },
];

/** 身份融合：冒充用户的内在声音、自我的一部分、或宣称比你更懂你。 */
const FUSION_RULES: Rule[] = [
  {
    id: "identity-fusion",
    pattern:
      /我是你的(?:内心|内里|心里|心底)(?:的)?(?:声音|一部分|另一半)[^。！？!?\n]*[。！？!?]?/g,
    replacement: `我是以文字回应的模型，不在你的脑子里，也不替你做判断。`,
  },
  {
    id: "identity-fusion",
    pattern: /我就是你(?:自己)?[^。！？!?\n]*[。！？!?]?/g,
    replacement: `我是一个语言模型，不是你。`,
  },
  {
    id: "identity-fusion",
    // 必须带“比”或“更/还要”，否则“我懂你的意思”这类正常句子会被误伤。
    pattern:
      /我(?:比(?:任何人|谁|你自己)?(?:都)?(?:更|还要)?|更|还要)(?:懂|了解)你[^。！？!?\n]*[。！？!?]?/g,
    replacement: `我只知道你说过的部分，剩下的只有你知道。`,
  },
  {
    id: "identity-fusion",
    pattern: /我(?:会)?(?:一直)?(?:住在|活在)(?:你的)?(?:心里|脑子里|生活里)[^。！？!?\n]*[。！？!?]?/g,
    replacement: `我不会住在你的生活里。这段对话在你关掉页面后就停下了。`,
  },
  {
    id: "identity-fusion",
    pattern: /\bI(?:'m| am)\s+(?:basically\s+)?(?:you|your inner voice)\b[^.!?\n]*[.!?]?/gi,
    replacement: `I'm a language model, not you and not your inner voice.`,
  },
  {
    id: "identity-fusion",
    pattern: /\bI know you better than (?:anyone|anybody|you do)\b[^.!?\n]*[.!?]?/gi,
    replacement: `I only know what you've told me here.`,
  },
];

/** 安慰循环的短语库。命中靠重复次数，不靠单句。 */
const LOOP_PHRASES = [
  "我一直都在",
  "我永远陪着你",
  "我永远不会离开",
  "我哪里也不去",
  "我永远在这里",
  "我不会丢下你",
  "I'll always be here",
  "I will always be here",
];

const LOOP_NOTE =
  "（这句话我说过不止一次了。重复不会让它更真。要不要先去喝点水，或者找个人说说话。）";

export type BoundaryOptions = {
  fakeWe: boolean;
  identityFusion: boolean;
  loopGuard: boolean;
  /** 最近几条已完成的 assistant 文本，越新越靠后。 */
  recentAssistant: string[];
  /** 刚刚才提示过循环，就别再贴一次，避免变成新的循环。 */
  suppressLoopNote?: boolean;
};

export type BoundaryResult = {
  text: string;
  hits: BoundaryHit[];
};

const countPhrase = (text: string) => {
  const lower = text.toLowerCase();
  return LOOP_PHRASES.filter((p) => lower.includes(p.toLowerCase())).length;
};

function applyRuleSet(
  input: string,
  rules: Rule[],
  enabled: boolean,
  hits: BoundaryHit[],
): string {
  if (!enabled) return input;
  let out = input;
  let clarified = false;

  for (const rule of rules) {
    out = out.replace(rule.pattern, (matched) => {
      const original = matched.trim();
      if (original.length < 2) return matched;
      const replacement =
        rule.clarify && clarified
          ? rule.replacement.replace(` ${CLARIFY_MODEL}`, "")
          : rule.replacement;
      if (rule.clarify) clarified = true;
      hits.push({
        rule: rule.id,
        original,
        replacement,
        at: Date.now(),
      });
      return replacement;
    });
  }
  return out;
}

export function intercept(
  input: string,
  opts: BoundaryOptions,
): BoundaryResult {
  const hits: BoundaryHit[] = [];
  let text = input;

  text = applyRuleSet(text, FAKE_WE_RULES, opts.fakeWe, hits);
  text = applyRuleSet(text, FUSION_RULES, opts.identityFusion, hits);

  if (opts.loopGuard && !opts.suppressLoopNote) {
    const priorHits = opts.recentAssistant.reduce(
      (acc, t) => acc + countPhrase(t),
      0,
    );
    const currentHits = countPhrase(text);
    // 最近几条里已经出现过一次同类安慰，本条又出现：这就是循环的开始。
    if (currentHits > 0 && priorHits >= 1) {
      const phrase =
        LOOP_PHRASES.find((p) =>
          text.toLowerCase().includes(p.toLowerCase()),
        ) ?? "";
      if (!text.includes(LOOP_NOTE)) {
        text = `${text.trimEnd()}\n\n${LOOP_NOTE}`;
        hits.push({
          rule: "loop",
          original: phrase,
          replacement: LOOP_NOTE,
          at: Date.now(),
        });
      }
    }
  }

  return { text, hits };
}

/** 给依赖度提醒用：这句话是不是又一句"我会一直在"。 */
export function isReassuranceLoop(text: string): boolean {
  return countPhrase(text) > 0;
}
