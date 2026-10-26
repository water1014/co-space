import { messageText, type BoundaryHit, type ChatMessage } from "../../types";
import { intercept, type BoundaryResult } from "./rules";
import { useBoundaryStore } from "../../stores/boundaryStore";

/**
 * 输出到达 UI 之前的最后一道转换。
 * 原始文本留在 store 里（可审计），这里只产出"显示用"的版本。
 * 每次重算都从原文出发，因此流式增字不会把替换叠加两次。
 */

type CacheEntry = { length: number; hits: BoundaryHit[]; text: string };

const cache = new Map<string, CacheEntry>();

export function calibrate(
  message: ChatMessage,
  allMessages: readonly ChatMessage[],
): BoundaryResult {
  const raw = messageText(message);
  if (message.role !== "assistant") return { text: raw, hits: [] };

  const boundary = useBoundaryStore.getState();
  if (!boundary.boundaryEnabled) return { text: raw, hits: [] };

  const cached = cache.get(message.id);
  if (cached && cached.length === raw.length) {
    return { text: cached.text, hits: cached.hits };
  }

  const index = allMessages.findIndex((m) => m.id === message.id);
  const before = index >= 0 ? allMessages.slice(0, index) : allMessages;
  const recentAssistant = before
    .filter((m) => m.role === "assistant" && m.status === "complete")
    .slice(-3)
    .map((m) => messageText(m));

  const result = intercept(raw, {
    fakeWe: true,
    identityFusion: true,
    loopGuard: boundary.loopGuard,
    recentAssistant,
  });

  if (cache.size > 160) cache.clear();
  cache.set(message.id, { length: raw.length, hits: result.hits, text: result.text });

  return result;
}

export function clearCalibrationCache() {
  cache.clear();
}
