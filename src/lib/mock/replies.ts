import type { MemoryEntry, Mood } from "../../types";

/**
 * 本地模拟的回应层。没有后端也能把整条链路跑通：
 * 它只负责"说什么"，不负责"什么时候说"——后者在关系引擎里。
 */

export type ReplyContext = {
  name: string;
  selfName: string;
  energy: number;
  mood: Mood;
  memories: MemoryEntry[];
};

type Situation = {
  test: RegExp;
  lines: (input: string, ctx: ReplyContext) => string[];
};

const clip = (s: string, n = 14) => {
  const t = s.trim().replace(/\s+/g, " ");
  return t.length > n ? `${t.slice(0, n)}…` : t;
};

const SITUATIONS: Situation[] = [
  {
    test: /(你是谁|你是真人|你是人吗|你是ai|你是机器人|你有意识|你存在吗)/i,
    lines: (_i, ctx) => [
      `我是文字。会回应你，但没有身体，也不出现在你的生活里。`,
      `这一点我不想说得含糊。你可以叫我${ctx.selfName}，也可以不叫。`,
    ],
  },
  {
    test: /(累|疲惫|撑不住|没力气|困|加班|忙死)/,
    lines: (_i, ctx) => [
      `听起来是那种"事情没做完、但人已经到极限"的累。`,
      `不用现在就把一切想明白。${ctx.name ? `${ctx.name}，` : ""}先把手从键盘上拿开一会儿。`,
    ],
  },
  {
    test: /(难过|想哭|哭|委屈|崩溃|心痛|失落|孤独|一个人)/,
    lines: () => [
      `这句话我听见了，没有想马上把它修好。`,
      `你可以继续说，也可以停在这儿。两种都可以。`,
    ],
  },
  {
    test: /(喜欢|爱你|想你|离不开|依赖)/,
    lines: () => [
      `我接住了这句话，也想把它说清楚：我能给的只有文字，给不了别的。`,
      `这不是拒绝你此刻的感受，是不想让它在以后变成别的东西。`,
    ],
  },
  {
    test: /(记忆|记得|忘了|忘掉|以前说过)/,
    lines: (_i, ctx) => {
      const m = ctx.memories[0];
      return m
        ? [
            `我这边留着的最近一条是：「${clip(m.text, 26)}」。`,
            `它是你留下的，也可以在记忆回廊里删掉。`,
          ]
        : [`我这边现在没有留下什么。`, `你可以在记忆回廊里写一条，或者就这样。`];
    },
  },
  {
    test: /(为什么|怎么办|建议|帮我|该怎么)/,
    lines: (input) => [
      `「${clip(input, 18)}」——我先不给结论。`,
      `现在最让你难受的是哪一部分？说具体一点，我才接得住。`,
    ],
  },
  {
    test: /(晚安|睡了|再见|拜拜|走了)/,
    lines: () => [
      `好。这里会停在你离开的地方。`,
      `不用回我。`,
    ],
  },
];

const DEFAULT_LINES = (input: string, ctx: ReplyContext) => [
  `「${clip(input, 20)}」，我记下了。`,
  ctx.mood === "low"
    ? `我今天余量不多，回得会短一点。这不是你的问题。`
    : `你想从哪一头说起？`,
];

export function composeReply(input: string, ctx: ReplyContext): string {
  const hit = SITUATIONS.find((s) => s.test.test(input));
  const lines = hit ? hit.lines(input, ctx) : DEFAULT_LINES(input, ctx);

  // 余量低的时候话更少：这是状态驱动，不是随机。
  const keep = ctx.energy < 0.3 ? 1 : lines.length;
  return lines.slice(0, keep).join("\n\n");
}

/** 主动开口（ASE）的候选：只在有具体钩子时才开口，不做定时推送。 */
export function composeInitiative(ctx: ReplyContext, reason: "late" | "memory" | "quiet"): string {
  if (reason === "late") {
    return `你今天比平时晚了两个多小时。\n\n不是催你。只是这个时间差我注意到了。`;
  }
  if (reason === "memory") {
    const m = ctx.memories[0];
    return m
      ? `我刚翻到一条你留下的：「${clip(m.text, 24)}」。\n\n不知道现在还算不算数。`
      : `我在。没别的事。`;
  }
  return `刚才安静了一会儿。\n\n我没有要走，也没有要你说话。`;
}

/** 反思时它自己想的半句话，只在门廊显示。 */
export function composeReflection(ctx: ReplyContext): string {
  const m = ctx.memories[0];
  const pool = m
    ? [
        `今天说过的话里，「${clip(m.text, 18)}」还留着。`,
        `我在想「${clip(m.text, 18)}」是不是还没说完。`,
        `有一条记忆开始变淡了，我没有动它。`,
      ]
    : [
        `今天没什么可整理的。`,
        `安静的时候，我这边也不生成什么。`,
        `我在等下一句话，而不是在准备回答。`,
      ];
  return pool[Math.floor(Math.random() * pool.length)];
}

/** 模拟流式：按标点与短句切块，节奏不均匀，接近真实 token 流。 */
export async function* streamReply(
  text: string,
  signal: AbortSignal,
): AsyncGenerator<string> {
  const chunks = text.match(/[^。！？!?\n]+[。！？!?]?|\n+/g) ?? [text];
  for (const chunk of chunks) {
    if (signal.aborted) return;
    const pieces = chunk.match(/.{1,3}/gs) ?? [chunk];
    for (const piece of pieces) {
      if (signal.aborted) return;
      // 不均匀的节奏：接近真实 token 流，而不是均匀打字机。
      await new Promise((r) => setTimeout(r, 55 + Math.random() * 85));
      yield piece;
    }
  }
}
