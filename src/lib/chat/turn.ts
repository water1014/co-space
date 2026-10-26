import { useChatStore } from "../../stores/chatStore";
import { useBoundaryStore } from "../../stores/boundaryStore";
import { usePresenceStore } from "../../stores/presenceStore";
import { useMemoryStore } from "../../stores/memoryStore";
import { useLifeStore } from "../../stores/lifeStore";
import { useConnectorStore } from "../../stores/connectorStore";
import { useProjectsStore } from "../../stores/projectsStore";
import { composePlan, streamText } from "../mock/replies";
import { parseLifeActions } from "./tools";
import { dueWords, lifeContext } from "../life/derive";
import { uid } from "../utils/id";
import type { ChatMessage, MessagePart } from "../../types";

/**
 * 一轮对话：落用户消息 → 记一次回声 → 真的"想"一会儿 → 流式说 → 补多模态。
 * 编辑、重写、重答都复用 respond()，避免三条路径各自长歪。
 */

let currentAbort: AbortController | null = null;

export function cancelTurn() {
  currentAbort?.abort();
  currentAbort = null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function respond(userText: string): Promise<void> {
  const chat = useChatStore.getState();
  const boundary = useBoundaryStore.getState();
  const presence = usePresenceStore.getState();
  const memory = useMemoryStore.getState();

  presence.setThinking(true);

  // 每一次回应都先"回忆"一次，成功与否都留下一条回声。
  await memory.recordEcho(userText);

  // 聊天里说的话可能变成记录——先落地，再回应。
  const actions = parseLifeActions(userText);
  actions.forEach((a) => a.apply());

  // 记录写完了，重新取一次状态：回复里要说得准。
  const lifeNow = useLifeStore.getState();
  const due = dueWords(lifeNow.wordBook, 1)[0];

  const plan = composePlan(userText, {
    name: boundary.name,
    energy: presence.energy,
    mood: presence.mood,
    memories: memory.memories.slice(0, 3),
    // 激活项目的人格优先；没有就退回全局人设（connector.persona）。
    persona:
      useProjectsStore.getState().activePersona() ??
      (useConnectorStore.getState().persona.trim() || undefined),
    life: {
      meals: lifeNow.meals,
      sleep: lifeNow.sleep,
      ledger: lifeNow.ledger,
      bobas: lifeNow.bobas,
      bobaBudget: lifeNow.bobaBudget,
    },
    actions: actions.map((a) => ({ summary: a.summary })),
    lifeSummary: lifeContext({
      meals: lifeNow.meals,
      sleep: lifeNow.sleep,
      ledger: lifeNow.ledger,
      bobas: lifeNow.bobas,
      words: lifeNow.words,
      wrongWords: lifeNow.wrongWords,
      todos: lifeNow.todos,
      bobaBudget: lifeNow.bobaBudget,
      bobaQuota: lifeNow.bobaQuota,
      rewards: lifeNow.rewards,
      wordBook: lifeNow.wordBook,
      anniversary: lifeNow.anniversary,
    }),
    dueWord: due
      ? { word: due.word, phonetic: due.phonetic, meaning: due.meaning }
      : undefined,
    bobaCount: lifeNow.bobas.filter(
      (b) => new Date(b.at).toDateString() === new Date().toDateString(),
    ).length,
  });

  // 思考阶段：这段时间是可见的，不是假的延迟。
  const started = Date.now();
  await sleep(900 + Math.random() * 900);
  const seconds = (Date.now() - started) / 1000;

  const assistantId = uid("a");
  chat.appendStreaming({
    id: assistantId,
    role: "assistant",
    parts: [{ ...plan.thought, seconds: Number(seconds.toFixed(1)) }],
    createdAt: Date.now(),
    status: "streaming",
    origin: "reply",
  });

  // 图片要落库，否则"印记"只是一次性的装饰。
  const hasImage = plan.extras.some((p) => p.type === "image");
  if (hasImage) {
    await useMemoryStore.getState().createImprint({
      title: `${new Date().getMonth() + 1}.${new Date().getDate()} 的印记`,
      prompt: userText.slice(0, 60),
      messageId: assistantId,
    });
  }

  const controller = new AbortController();
  currentAbort = controller;

  try {
    for await (const chunk of streamText(plan.text, controller.signal)) {
      useChatStore.getState().appendText(assistantId, chunk);
    }
    if (controller.signal.aborted) {
      useChatStore.getState().finish(assistantId, "cancelled");
    } else {
      for (const extra of plan.extras) {
        useChatStore.getState().appendPart(assistantId, extra);
      }
      useChatStore.getState().finish(assistantId, "complete");
    }
  } catch (err) {
    console.error("[turn] stream failed", err);
    useChatStore.getState().finish(assistantId, "cancelled");
  } finally {
    if (currentAbort === controller) currentAbort = null;
    usePresenceStore.getState().setThinking(false);
  }

  usePresenceStore.getState().nudgeEnergy(-0.025);
  usePresenceStore.getState().touch();
  maybeExtractMemory(userText);
}

export async function sendTurn(
  rawText: string,
  attachments: MessagePart[] = [],
): Promise<void> {
  const text = rawText.trim();
  if (!text && attachments.length === 0) return;

  const chat = useChatStore.getState();
  if (chat.isRunning) return;

  const boundary = useBoundaryStore.getState();
  const presence = usePresenceStore.getState();

  chat.append({
    id: uid("u"),
    role: "user",
    parts: [...(text ? [{ type: "text", text } as MessagePart] : []), ...attachments],
    createdAt: Date.now(),
    status: "complete",
    origin: "user",
  });
  chat.setDraft("");
  chat.setRunning(true);
  boundary.bumpTurn();
  presence.touch();
  presence.nudgeEnergy(0.07);
  presence.pulse();

  await respond(text || "（一张图）");
}

export async function rewriteFrom(messageId: string): Promise<void> {
  const chat = useChatStore.getState();
  const index = chat.messages.findIndex((m) => m.id === messageId);
  if (index < 0) return;
  const target = chat.messages[index];
  if (target.role !== "user") return;
  const text =
    target.parts.find((p) => p.type === "text")?.type === "text"
      ? (target.parts.find((p) => p.type === "text") as { text: string }).text
      : "";
  chat.setMessages(chat.messages.slice(0, index));
  await sendTurn(text);
}

export async function editTurn(
  messageId: string,
  nextText: string,
): Promise<void> {
  const chat = useChatStore.getState();
  const index = chat.messages.findIndex((m) => m.id === messageId);
  if (index < 0) return;
  const target = chat.messages[index];
  if (target.role !== "user") return;

  const rest = target.parts.filter((p) => p.type !== "text");
  const edited: ChatMessage = {
    ...target,
    parts: [{ type: "text", text: nextText }, ...rest],
    createdAt: Date.now(),
  };
  chat.setMessages([...chat.messages.slice(0, index), edited]);
  chat.setRunning(true);
  useBoundaryStore.getState().bumpTurn();
  await respond(nextText);
}

export async function regenerateLast(): Promise<void> {
  const chat = useChatStore.getState();
  if (chat.isRunning) return;
  const messages = [...chat.messages];
  while (messages.length && messages[messages.length - 1].role === "assistant") {
    messages.pop();
  }
  const lastUser = messages[messages.length - 1];
  if (!lastUser || lastUser.role !== "user") return;
  const textPart = lastUser.parts.find((p) => p.type === "text");
  const text = textPart && textPart.type === "text" ? textPart.text : "";
  chat.setMessages(messages);
  chat.setRunning(true);
  await respond(text);
}

export function deleteMessage(messageId: string) {
  const chat = useChatStore.getState();
  chat.setMessages(chat.messages.filter((m) => m.id !== messageId));
}

/** 会话结束后做一次轻量提取：只留用户自己说过的、带个人信息的句子。 */
export function maybeExtractMemory(userText: string) {
  const text = userText.trim();
  if (text.length < 12) return;
  const personal =
    /(我最近|我在|我今天|我妈|我爸|我朋友|我工作|我准备|我想要|我决定|我搬|我换了|我分手|我离职|我生病|我睡不着|她|他)/.test(
      text,
    );
  if (!personal) return;

  const memory = useMemoryStore.getState();
  if (memory.memories.slice(0, 6).some((m) => m.text === text)) return;
  void memory.createMemory(text, { source: "conversation", kind: "fact" });
}
