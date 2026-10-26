import type { MemoryEntry, MessagePart, Mood } from "../../types";
import { todayBoba, todayMeals, todaySleep } from "../life/derive";
import type { LedgerEntry, MealKey, SleepLog } from "../../types";

/**
 * 本地回应层：只负责"说什么"，不负责"什么时候说"。
 * 它的判断建立在真实的生活数据上——所以首页那句话和这里的回复不会互相矛盾。
 */

export type ReplyContext = {
  name: string;
  energy: number;
  mood: Mood;
  memories: MemoryEntry[];
  /** 当前激活项目的人格正文（md 设定）。为空时退回全局人设。 */
  persona?: string;
  life: {
    meals: Record<string, MealKey[]>;
    sleep: SleepLog[];
    ledger: LedgerEntry[];
    bobaBudget: number;
  };
};

export type ReplyPlan = {
  thought: Extract<MessagePart, { type: "thought" }>;
  text: string;
  extras: MessagePart[];
};

const clip = (s: string, n = 16) => {
  const t = s.trim().replace(/\s+/g, " ");
  return t.length > n ? `${t.slice(0, n)}…` : t;
};

const peaksFrom = (seed: number, n = 30) =>
  Array.from({ length: n }, (_, i) => {
    const v = Math.sin(seed * (i + 1) * 0.63) * 0.5 + 0.5;
    return 0.22 + v * 0.74;
  });

const hashOf = (s: string) =>
  Array.from(s).reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 99991, 7);

export function composePlan(input: string, ctx: ReplyContext): ReplyPlan {
  const meals = todayMeals(ctx.life.meals);
  const sleep = todaySleep(ctx.life.sleep);
  const boba = todayBoba(ctx.life.ledger);
  const hour = new Date().getHours();
  const you = ctx.name ? `${ctx.name}，` : "";

  const steps: string[] = [];
  const tools: string[] = [];
  const extras: MessagePart[] = [];
  let text = "";

  /* ---- 判断依据，写进思考过程里，让人能核对 ---- */
  if (ctx.persona) {
    steps.push(`读当前项目人格：${ctx.persona.replace(/\s+/g, " ").slice(0, 22)}…`);
    tools.push("project");
  }
  steps.push(`读今日记录：三餐 ${meals.length}/3，奶茶 ¥${boba.toFixed(0)}`);
  tools.push("life");

  if (ctx.memories.length) {
    tools.push("recall");
    steps.push(`召回 ${ctx.memories.length} 条记忆，最高一条「${clip(ctx.memories[0].text, 18)}」`);
  } else {
    steps.push("记忆里没有能对上的，按没有处理");
  }

  /* ---- 优先处理生活事实 ---- */
  if (boba > ctx.life.bobaBudget) {
    text = `${you}奶茶额度已经用完了。\n\n今天到此为止。明天再喝，我不拦。`;
  } else if (sleep && sleep.hours < 6.5) {
    text = `你昨晚只睡了 ${sleep.hours} 小时。\n\n今天别硬撑。能早点回来就早点回来。`;
  } else if (meals.length < 2 && hour >= 15) {
    text = `今天到现在只吃了一顿。\n\n先去吃，回来再说别的。`;
  }

  /* ---- 再看用户说了什么 ---- */
  if (!text) {
    if (/(累|撑不住|没力气|困|加班|不想动)/.test(input)) {
      text = `听起来是那种"事情没做完，人已经到极限"的累。\n\n不用现在把一切想明白。先把手上这件放下。`;
    } else if (/(难过|想哭|委屈|崩|孤独|一个人)/.test(input)) {
      text = `这句话我听见了，没有想马上把它修好。\n\n你可以继续说，也可以停在这儿。`;
    } else if (/(你是谁|真人|你是人吗|有意识)/.test(input)) {
      text = `我是文字。会回应你，但没有身体，也不出现在你的生活里。\n\n这一点我不想说得含糊。`;
    } else if (/(画|印记|记住这个|生成)/.test(input)) {
      text = `好。我把这一段画下来，放进印记里。\n\n不确定像不像，但比文字多一点。`;
    } else if (/(语音|听我说|录|说给你)/.test(input)) {
      text = `我用声音回你一句。\n\n别的都在文字里。`;
    } else if (/(文件|简历|报告|文档)/.test(input)) {
      text = `给你留了一份，下载或者直接打开都行。\n\n里面是我按你的说法整理的，不满意再改。`;
    } else {
      text = `「${clip(input, 18)}」，我记下了。\n\n你想从哪一头说起？`;
    }
  }

  /* ---- 多模态：按需附加，不做无意义的装饰 ---- */
  if (/(语音|听我说|录|说给你)/.test(input)) {
    extras.push({
      type: "voice",
      duration: 6.4,
      peaks: peaksFrom(hashOf(input)),
      transcript: text.replace(/\n+/g, " ").slice(0, 60),
    });
  }

  if (/(文件|简历|报告|文档)/.test(input)) {
    extras.push({
      type: "file",
      name: "整理稿.docx",
      size: 284_160,
      mime: "application/vnd.openxmlformats",
    });
    steps.push("生成了一份整理稿，等你确认");
  }

  if (/(画|印记|记住这个|生成)/.test(input)) {
    extras.push({
      type: "image",
      seed: hashOf(input),
      caption: clip(input, 20),
    });
    tools.push("image");
    steps.push("把这一段画成一张印记，存进记忆");
  }

  return {
    thought: {
      type: "thought",
      seconds: 0, // 真正耗时由 turn.ts 填
      tools,
      steps,
    },
    text,
    extras,
  };
}

/** 模拟流式：按短句切块，节奏不均匀，接近真实 token 流。 */
export async function* streamText(
  text: string,
  signal: AbortSignal,
): AsyncGenerator<string> {
  const chunks = text.match(/[^。！？!?\n]+[。！？!?]?|\n+/g) ?? [text];
  for (const chunk of chunks) {
    if (signal.aborted) return;
    const pieces = chunk.match(/.{1,3}/gs) ?? [chunk];
    for (const piece of pieces) {
      if (signal.aborted) return;
      await new Promise((r) => setTimeout(r, 45 + Math.random() * 70));
      yield piece;
    }
  }
}
