import { useChatStore } from "../../stores/chatStore";
import { useRelationStore } from "../../stores/relationStore";
import { usePresenceStore } from "../../stores/presenceStore";
import { useMemoryStore } from "../../stores/memoryStore";
import { composeReply, streamReply } from "../mock/replies";
import { maybeExtractMemory } from "../relation/engine";
import { uid } from "../utils/id";
import type { ChatMessage } from "../../types";

/**
 * 一轮对话的生命周期：落用户消息 → 流式回应 → 收尾 → 轻量记忆提取。
 * 编辑、重写、重答都复用 respond()，避免三条路径各自长歪。
 */

let currentAbort: AbortController | null = null;

export function cancelTurn() {
  currentAbort?.abort();
  currentAbort = null;
}

/** 只负责"回应这一段用户文本"，不碰消息列表的前半部分。 */
async function respond(userText: string): Promise<void> {
  const chat = useChatStore.getState();
  const relation = useRelationStore.getState();
  const presence = usePresenceStore.getState();
  const memory = useMemoryStore.getState();

  const replyText = composeReply(userText, {
    name: relation.name,
    selfName: relation.selfName,
    energy: presence.energy,
    mood: presence.mood,
    memories: memory.entries,
  });

  const assistantId = uid("a");
  chat.appendStreaming({
    id: assistantId,
    role: "assistant",
    text: "",
    createdAt: Date.now(),
    status: "streaming",
    origin: "reply",
  });

  const controller = new AbortController();
  currentAbort = controller;

  try {
    for await (const chunk of streamReply(replyText, controller.signal)) {
      useChatStore.getState().appendChunk(assistantId, chunk);
    }
    useChatStore.getState().finish(assistantId, "complete");
  } catch (err) {
    console.error("[turn] stream failed", err);
    useChatStore.getState().finish(assistantId, "cancelled");
  } finally {
    if (currentAbort === controller) currentAbort = null;
  }

  // 回应也消耗余量：不是每轮都"回复完更有精神"。
  usePresenceStore.getState().nudgeEnergy(-0.025);
  usePresenceStore.getState().touch();
  maybeExtractMemory(userText);
}

export async function sendTurn(rawText: string): Promise<void> {
  const text = rawText.trim();
  if (!text) return;

  const chat = useChatStore.getState();
  if (chat.isRunning) return;

  const relation = useRelationStore.getState();
  const presence = usePresenceStore.getState();

  chat.append({
    id: uid("u"),
    role: "user",
    text,
    createdAt: Date.now(),
    status: "complete",
    origin: "user",
  });
  chat.setDraft("");
  chat.setRunning(true);
  relation.bumpTurn();
  presence.touch();
  presence.nudgeEnergy(0.07);
  presence.pulse();

  await respond(text);
}

/** 重写某一轮：截断到这条用户消息之前，把同样的话再说一遍。 */
export async function rewriteFrom(messageId: string): Promise<void> {
  const chat = useChatStore.getState();
  const index = chat.messages.findIndex((m) => m.id === messageId);
  if (index < 0) return;
  const target = chat.messages[index];
  if (target.role !== "user") return;
  chat.setMessages(chat.messages.slice(0, index));
  await sendTurn(target.text);
}

/** runtime 的编辑入口：替换这条用户消息，丢掉它之后的回应，重新生成。 */
export async function editTurn(
  messageId: string,
  nextText: string,
): Promise<void> {
  const chat = useChatStore.getState();
  const index = chat.messages.findIndex((m) => m.id === messageId);
  if (index < 0) return;
  const target = chat.messages[index];
  if (target.role !== "user") return;

  const edited: ChatMessage = { ...target, text: nextText, createdAt: Date.now() };
  chat.setMessages([...chat.messages.slice(0, index), edited]);
  chat.setRunning(true);
  useRelationStore.getState().bumpTurn();
  usePresenceStore.getState().pulse();
  await respond(nextText);
}

/** 重答最后一条：删掉末尾的 assistant，用同一句用户输入再生成一次。 */
export async function regenerateLast(): Promise<void> {
  const chat = useChatStore.getState();
  if (chat.isRunning) return;
  const messages = [...chat.messages];
  while (messages.length && messages[messages.length - 1].role === "assistant") {
    messages.pop();
  }
  const lastUser = messages[messages.length - 1];
  if (!lastUser || lastUser.role !== "user") return;
  chat.setMessages(messages);
  chat.setRunning(true);
  await respond(lastUser.text);
}

export function deleteMessage(messageId: string) {
  const chat = useChatStore.getState();
  chat.setMessages(chat.messages.filter((m) => m.id !== messageId));
}
