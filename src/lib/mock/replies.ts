import type { BobaEntry, MemoryEntry, MessagePart, Mood } from "../../types";
import { todayBoba, todayLedger, todayMeals, todaySleep } from "../life/derive";
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
    bobas: BobaEntry[];
    bobaBudget: number;
  };
  /** 聊天里说的话触发了哪些记录动作，会写进思考过程里。 */
  actions?: { summary: string }[];
  /** 今天该考的一个词；用户说"考我单词"时用。 */
  dueWord?: { word: string; phonetic: string; meaning: string };
  /** 一句话的生活概况：在一起第几天、今天三餐、奶茶、单词、奖惩分。 */
  lifeSummary?: string;
  /** 今天喝了几杯奶茶。 */
  bobaCount?: number;
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
  const boba = todayBoba(ctx.life.bobas);
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
  if (ctx.lifeSummary) {
    steps.push(`生活概况：${ctx.lifeSummary}`);
  }

  if (ctx.memories.length) {
    tools.push("recall");
    steps.push(`召回 ${ctx.memories.length} 条记忆，最高一条「${clip(ctx.memories[0].text, 18)}」`);
  } else {
    steps.push("记忆里没有能对上的，按没有处理");
  }

  // 聊天里说的话落到记录里了——必须说出来，让人知道它做了什么。
  if (ctx.actions?.length) {
    tools.push("write");
    ctx.actions.forEach((a) => steps.push(a.summary));
  }

  /* ---- 优先处理生活事实 ---- */
  if (boba > ctx.life.bobaBudget) {
    text = `${you}奶茶额度已经用完了。\n\n今天到此为止。明天再喝，我不拦。`;
  } else if (sleep && sleep.hours < 6.5) {
    text = `你昨晚只睡了 ${sleep.hours} 小时。\n\n今天别硬撑。能早点回来就早点回来。`;
  } else if (meals.length < 2 && hour >= 15) {
    text = `今天到现在只吃了一顿。\n\n先去吃，回来再说别的。`;
  }

  // 写完记录要回一句"记上了"，让对方知道它做了什么。
  if (ctx.actions?.length) {
    const ack = ctx.actions.map((a) => a.summary).join("；");
    text = text ? `${text}\n\n（${ack}，已经放进对应的房间了。）` : `记上了：${ack}。\n\n都在"一起"里，你自己去看。`;
  }

  /* ---- 再看用户说了什么 ---- */
  if (!text) {
    if (/(考我单词|背单词|单词|默写|听写)/.test(input)) {
      const w = ctx.dueWord;
      text = w
        ? `来。\n\n${w.word} —— ${w.phonetic}\n\n意思是什么？\n\n答错三次它会自己进错词本，别想赖掉。`
        : `词都背完了？\n\n那换点别的。`;
    } else if (/(看看记录|看记账|看我的记录|一起看看|记录怎么样|今天的记录)/.test(input)) {
      const t = todayLedger(ctx.life.ledger);
      const spend = t.reduce((s, e) => s + e.amount, 0);
      text = `看到了。\n\n三餐 ${meals.length}/3。奶茶 ${ctx.bobaCount ?? 0} 杯。${
        sleep ? `昨晚睡了 ${sleep.hours} 小时。` : "昨晚没记睡眠。"
      }今天花了 ¥${spend.toFixed(0)}，${t.length} 笔。\n\n${ctx.lifeSummary ?? ""}`;
    } else if (/(累|撑不住|没力气|困|加班|不想动)/.test(input)) {
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
