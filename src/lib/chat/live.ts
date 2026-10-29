import { useConnectorStore } from "../../stores/connectorStore";
import { useLifeStore } from "../../stores/lifeStore";
import {
  composePlan,
  streamText,
  type ReplyContext,
  type ReplyPlan,
} from "../mock/replies";
import { todayBoba, todayLedger, todayMeals, todaySleep } from "../life/derive";
import { MEAL_LABEL } from "../../content";
import type { MessagePart } from "../../types";

/**
 * 真实模型通道。
 *
 * 职责很窄：把当前状态与用户那句话发给一个 OpenAI 兼容的
 * /chat/completions，拿回要说的话。
 *
 * 它必须**永不失败**——没配接口、没填 Key、网络断了、模型返回了
 * 一段散文，都不该让页面白屏。所以任何一步出问题都回退到本地
 * 的 composePlan（mock/replies.ts），界面照常工作。
 *
 * 唯一被允许改的是「说什么」和「依据哪几条」。行为、落库、渲染
 * 全都还在 turn.ts 和 store 里。
 */

/** 请求超时。60 秒够一次正常的对话往返了。 */
const TIMEOUT_MS = 60_000;

/**
 * 流式空闲超时：多久没有新数据就断开。
 * 流式不能像一次性那样整段掐表——模型想久一点很正常，
 * 但彻底不动的连接要能收手。
 */
const IDLE_TIMEOUT_MS = 60_000;

/** 输出契约（一次性请求用）：照抄给模型，模型才知道该回什么形状。 */
const OUTPUT_CONTRACT =
  '只输出一个 JSON 对象，不要 markdown 代码块，不要任何解释。格式：{"thought":{"steps":["…"],"tools":["life"]},"text":"要说的话","extras":[]}。steps 是 2-4 条你实际用了哪些依据的短句；tools 从 life/recall/project/write 里选；extras 一律返回空数组。';

/**
 * 输出契约（流式请求用）。
 *
 * 流式没法等一个完整 JSON——等到了就不是流式了。
 * 所以换一套标签协议：先一段 <thought>…</thought> 说明依据，
 * 换行之后直接说人话。
 */
const STREAM_CONTRACT =
  "先输出 <thought> 与 </thought>，里面用 || 分隔每条依据，最后一段以 tools: 开头列工具名（逗号分隔）；然后换行，直接输出要说的话，不要 JSON，不要别的标签，不要解释。";

/** 协议里允许出现的工具名。模型说别的就不认。 */
const KNOWN_TOOLS = ["life", "recall", "project", "write"];


/**
 * 把当前状态压成逐行纯文本。
 * 缺的东西就写「没记」，不编造。
 */
function buildState(ctx: ReplyContext): string {
  const lines: string[] = [];

  lines.push(`称呼：${ctx.name || "还没告诉我叫什么"}`);
  lines.push(`精力：${ctx.energy.toFixed(2)}`);
  lines.push(`心情：${ctx.mood}`);

  const meals = todayMeals(ctx.life.meals);
  lines.push(
    meals.length
      ? `今日三餐：${meals.map((m) => MEAL_LABEL[m] ?? m).join("、")}（${meals.length}/3）`
      : "今日三餐：还没记",
  );

  const sleep = todaySleep(ctx.life.sleep);
  lines.push(
    sleep
      ? `睡眠：昨晚睡了 ${sleep.hours} 小时（${sleep.bedAt}–${sleep.wakeAt}）`
      : "睡眠：昨晚没记",
  );

  const bobaAmount = todayBoba(ctx.life.bobas);
  const bobaQuota = useLifeStore.getState().bobaQuota;
  lines.push(
    `今天奶茶：¥${bobaAmount.toFixed(0)}，${ctx.bobaCount ?? 0} 杯（额度 ${bobaQuota} 杯 / ¥${ctx.life.bobaBudget}）`,
  );

  const ledgerToday = todayLedger(ctx.life.ledger);
  lines.push(`今天记账：${ledgerToday.length} 条`);

  lines.push(
    ctx.dueWord
      ? `今天该考的单词：${ctx.dueWord.word} ${ctx.dueWord.phonetic}（${ctx.dueWord.meaning}）`
      : "今天该考的单词：暂时没有",
  );

  if (ctx.lifeSummary) lines.push(`生活概况：${ctx.lifeSummary}`);

  return lines.join("\n");
}

/** 记忆段：每条一行，用 text 字段。 */
function buildMemories(ctx: ReplyContext): string {
  if (!ctx.memories.length) return "没有能对上的记忆。";
  return ctx.memories.map((m) => m.text).join("\n");
}

/**
 * 组装 messages：第一段人设、第二段状态、第三段记忆、第四段输出契约。
 */
function buildMessages(
  input: string,
  ctx: ReplyContext,
  contract: string,
): { role: string; content: string }[] {
  const connector = useConnectorStore.getState();
  const persona = (ctx.persona || connector.persona || "").trim();

  return [
    {
      role: "system",
      content: persona || "你是一个说话简短、具体、不敷衍的陪伴者。",
    },
    { role: "system", content: buildState(ctx) },
    { role: "system", content: buildMemories(ctx) },
    { role: "system", content: contract },
    { role: "user", content: input },
  ];
}

/** 从模型的原始文本里抠出 JSON 对象：先整段 parse，再截 { … } 再 parse。 */
function parseJson(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    /* 落到下面再试 */
  }

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      /* 抠出来也不是合法 JSON */
    }
  }

  return null;
}

/** 把模型给的对象收敛成一个合法的 ReplyPlan。 */
function toPlan(raw: unknown, fallbackText: string): ReplyPlan {
  const obj = (raw ?? {}) as {
    thought?: { steps?: unknown; tools?: unknown };
    text?: unknown;
    extras?: unknown;
  };

  const steps = Array.isArray(obj.thought?.steps)
    ? obj.thought.steps.filter((s): s is string => typeof s === "string")
    : [];
  const tools = Array.isArray(obj.thought?.tools)
    ? obj.thought.tools.filter((t): t is string => typeof t === "string")
    : [];

  const text =
    typeof obj.text === "string" && obj.text.trim() ? obj.text.trim() : fallbackText;

  return {
    thought: {
      type: "thought",
      seconds: 0,
      tools,
      steps: steps.length ? steps : ["模型返回了非结构化内容"],
    },
    text,
    extras: [],
  };
}

/**
 * 真实模型版 composePlan。
 *
 * 任何失败都回退到 mock 的 composePlan——不抛错，不白屏。
 */
export async function composePlanLive(
  input: string,
  ctx: ReplyContext,
  signal?: AbortSignal,
): Promise<ReplyPlan> {
  const fallback = () => composePlan(input, ctx);

  const { model, sessionKey } = useConnectorStore.getState();
  const baseUrl = (model.baseUrl || "").trim().replace(/\/+$/, "");
  const key = (sessionKey || "").trim();

  // 没配接口或没填 Key：直接用本地实现。
  if (!baseUrl || !key) return fallback();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model.model,
        messages: buildMessages(input, ctx, OUTPUT_CONTRACT),
        stream: false,
        temperature: 0.9,
      }),
      signal: controller.signal,
    });

    if (!res.ok) return fallback();

    const data = (await res.json()) as {
      choices?: { message?: { content?: unknown } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) return fallback();

    const parsed = parseJson(content);
    if (parsed === null) {
      // 模型说了人话但不是 JSON：把它的话直接当回复，思考过程标一句。
      return {
        thought: {
          type: "thought",
          seconds: 0,
          tools: [],
          steps: ["模型返回了非结构化内容"],
        },
        text: content.trim(),
        extras: [],
      };
    }

    return toPlan(parsed, content.trim());
  } catch {
    // 网络断了、超时了、用户中断了：都不该让页面崩。
    return fallback();
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

/* ------------------------------------------------------------------ */
/* 真流式                                                              */
/* ------------------------------------------------------------------ */

/**
 * 一轮对话里流出来的事件。
 *
 * thought 先到（一次性，带依据和工具），text 随后一片一片到。
 * 界面只认这两种。
 */
export type TurnEvent =
  | { type: "thought"; steps: string[]; tools: string[] }
  | { type: "text"; delta: string };

/** 一条 SSE 行里的负载。 */
type SsePayload = {
  choices?: { delta?: { content?: unknown } }[];
};

/**
 * 解析 <thought>…</thought> 里的内容。
 *
 * 协议：每条依据用 || 分隔，最后一段以 tools: 开头，工具名逗号分隔。
 */
function parseThought(raw: string): { steps: string[]; tools: string[] } {
  const parts = raw
    .split("||")
    .map((s) => s.trim())
    .filter(Boolean);

  const steps: string[] = [];
  const tools: string[] = [];

  for (const part of parts) {
    const toolMatch = /^tools\s*[:：]\s*(.*)$/i.exec(part);
    if (toolMatch) {
      for (const name of toolMatch[1].split(/[,，、]/)) {
        const t = name.trim().toLowerCase();
        if (t && KNOWN_TOOLS.includes(t) && !tools.includes(t)) tools.push(t);
      }
      continue;
    }
    steps.push(part);
  }

  return { steps, tools };
}

/**
 * 打开一轮对话，逐块吐事件。
 *
 * 走的是模型的原生流式（stream:true）：SSE 一块一块来，
 * 所以界面上的字是一个一个长出来的，不是等全部到齐再一次性贴上去。
 *
 * 降级链：
 *   流式请求失败 → composePlanLive（一次性 JSON）→ mock composePlan
 *   再由 mock 的 streamText 切块假装流式，保证界面永远在动。
 */
export async function* openTurn(
  input: string,
  ctx: ReplyContext,
  signal: AbortSignal,
): AsyncGenerator<TurnEvent> {
  const { model, sessionKey } = useConnectorStore.getState();
  const baseUrl = (model.baseUrl || "").trim().replace(/\/+$/, "");
  const key = (sessionKey || "").trim();

  // 没配接口：直接走降级，别白跑一趟网络。
  if (!baseUrl || !key) {
    yield* fallbackTurn(input, ctx, signal);
    return;
  }

  const controller = new AbortController();
  const onAbort = () => controller.abort();
  signal.addEventListener("abort", onAbort);

  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  let emitted = 0;

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model.model,
        messages: buildMessages(input, ctx, STREAM_CONTRACT),
        stream: true,
        temperature: 0.9,
      }),
      signal: controller.signal,
    });

    // 模型不支持流式（400/404/500）——退到一次性那条路。
    if (!res.ok || !res.body) {
      yield* fallbackTurn(input, ctx, signal);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    let raw = ""; // 模型给的原始文本（还含思考标签）
    // 正文在 raw 里的起点，以及已经吐出去的长度。
    let bodyStart = -1;
    let bodyDone = 0;
    let mode: "unknown" | "plain" | "tagged" = "unknown";
    let thoughtClosed = false; // 有没有见过 </thought>
    let sseBuf = "";
    let done = false;

    const armIdle = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => controller.abort(), IDLE_TIMEOUT_MS);
    };
    armIdle();

    while (!done) {
      if (signal.aborted) return;

      const chunk = await reader.read();
      if (signal.aborted) return;

      if (chunk.done) {
        sseBuf += decoder.decode();
        done = true;
      } else {
        sseBuf += decoder.decode(chunk.value, { stream: true });
        armIdle();
      }

      // SSE：一行一条 data:
      const lines = sseBuf.split("\n");
      sseBuf = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload) continue;
        if (payload === "[DONE]") {
          done = true;
          break;
        }

        let parsed: SsePayload | null = null;
        try {
          parsed = JSON.parse(payload) as SsePayload;
        } catch {
          continue; // 有一行不是 JSON，跳过，不影响其它行
        }

        const delta = parsed.choices?.[0]?.delta?.content;
        if (typeof delta !== "string" || !delta) continue;

        raw += delta;

        if (mode === "plain") {
          const piece = raw.slice(bodyDone);
          if (piece) {
            bodyDone = raw.length;
            emitted++;
            yield { type: "text", delta: piece };
          }
          continue;
        }

        if (thoughtClosed) {
          const piece = raw.slice(bodyStart + bodyDone);
          if (piece) {
            bodyDone += piece.length;
            emitted++;
            yield { type: "text", delta: piece };
          }
          continue;
        }

        const closeIdx = raw.indexOf("</thought>");
        if (closeIdx !== -1) {
          const openIdx = raw.indexOf("<thought>");
          const inner =
            openIdx !== -1 && openIdx < closeIdx
              ? raw.slice(openIdx + "<thought>".length, closeIdx)
              : raw.slice(0, closeIdx);

          const { steps, tools } = parseThought(inner);
          thoughtClosed = true;
          mode = "tagged";
          emitted++;
          yield {
            type: "thought",
            steps: steps.length ? steps : ["模型没有给出思考依据"],
            tools,
          };

          // 标签之后紧跟的那点空白不算正文。
          const after = raw.slice(closeIdx + "</thought>".length);
          const lead = /^\s*\r?\n/.exec(after);
          bodyStart = closeIdx + "</thought>".length + (lead ? lead[0].length : 0);
          bodyDone = 0;
          const piece = raw.slice(bodyStart);
          if (piece) {
            bodyDone = piece.length;
            emitted++;
            yield { type: "text", delta: piece };
          }
          continue;
        }

        if (raw.indexOf("<thought>") !== -1) continue; // 思考还在进行中

        if (mode === "unknown") {
          const head = raw.trimStart();
          if (!head) continue; // 还没拿到第一个有效字符
          if (head.startsWith("<")) {
            // 可能是 <thought> 被拆开了一半，先攒着。
            // 攒到不像标签了（超过 40 字符还没凑出 <thought>），就当普通文本。
            if (raw.length < 40) continue;
            mode = "plain";
            bodyStart = 0;
          } else if (head.startsWith("{") || head.startsWith("[")) {
            // 模型把一次性 JSON 塞回来了——它没在流式。
            // 这种情况正文是乱的，退到降级路径重来一遍。
            yield* fallbackTurn(input, ctx, signal);
            return;
          } else {
            // 模型压根没用标签（只说了人话）：直接当正文流出来。
            mode = "plain";
            bodyStart = 0;
          }
        }

        if (mode === "plain") {
          const piece = raw.slice(bodyDone);
          if (piece) {
            bodyDone = raw.length;
            emitted++;
            yield { type: "text", delta: piece };
          }
        }
      }
    }

    if (signal.aborted) return;

    // 一个字都没拿到：多半是空响应或格式不对，退到降级路径。
    if (!raw) {
      yield* fallbackTurn(input, ctx, signal);
      return;
    }

    // 流正常结束，但模型没写过思考段：补一个说明，别让思考面板空着。
    if (!thoughtClosed) {
      emitted++;
      yield {
        type: "thought",
        steps: ["模型直接说了话，没有给思考依据"],
        tools: [],
      };
      if (bodyStart < 0) bodyStart = 0;
      const piece = raw.slice(bodyStart + bodyDone);
      if (piece) {
        bodyDone += piece.length;
        emitted++;
        yield { type: "text", delta: piece };
      }
    }
  } catch {
    // 流式中途断了：一个字都没出来就退到降级；已经吐过字就到此为止。
    if (!signal.aborted && emitted === 0) {
      yield* fallbackTurn(input, ctx, signal);
    }
  } finally {
    if (idleTimer) clearTimeout(idleTimer);
    signal.removeEventListener("abort", onAbort);
  }
}

/**
 * 降级：模型不支持流式（或没配接口）时，
 * 用一次性拿全文，再借 mock 的切块假装一个字一个字出来。
 *
 * 顺便把降级那一版的 extras 记下来——里面可能有图片印记，
 * 界面那边还要落库。
 */
let lastFallbackExtras: MessagePart[] = [];

/** 取走最近一次降级带回来的 extras（取完即清）。 */
export function takeFallbackExtras(): MessagePart[] {
  const out = lastFallbackExtras;
  lastFallbackExtras = [];
  return out;
}

async function* fallbackTurn(
  input: string,
  ctx: ReplyContext,
  signal: AbortSignal,
): AsyncGenerator<TurnEvent> {
  const plan = await composePlanLive(input, ctx, signal);
  if (signal.aborted) return;

  lastFallbackExtras = plan.extras ?? [];

  yield {
    type: "thought",
    steps: plan.thought.steps.length
      ? plan.thought.steps
      : ["模型返回了非结构化内容"],
    tools: plan.thought.tools,
  };

  for await (const chunk of streamText(plan.text, signal)) {
    if (signal.aborted) return;
    yield { type: "text", delta: chunk };
  }
}
