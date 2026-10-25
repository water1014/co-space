import type { BoundaryHit, ChatMessage } from "../../types";
import { intercept, type BoundaryResult } from "./rules";
import { useRelationStore } from "../../stores/relationStore";

/**
 * 输出到达 UI 之前的最后一道转换。
 * 原始文本永远留在 store 里（可审计），这里只产出"显示用"的版本。
 * 每次重算都从原文出发，因此流式增字不会把替换叠加两次。
 */

type CacheEntry = {
  /** 原文长度：流式时长度会变，变了就重算。 */
  length: number;
  hits: BoundaryHit[];
  text: string;
};

const cache = new Map<string, CacheEntry>();

export function calibrate(
  message: ChatMessage,
  allMessages: readonly ChatMessage[],
): BoundaryResult {
  if (message.role !== "assistant") {
    return { text: message.text, hits: [] };
  }

  const relation = useRelationStore.getState();
  if (!relation.boundaryEnabled) {
    return { text: message.text, hits: [] };
  }

  const enabledKey = `${relation.boundaryEnabled ? 1 : 0}${relation.name}`;
  const cached = cache.get(message.id);
  if (
    cached &&
    cached.length === message.text.length &&
    cache.get(`${message.id}:key`)?.text === enabledKey
  ) {
    return { text: cached.text, hits: cached.hits };
  }

  const index = allMessages.findIndex((m) => m.id === message.id);
  const before = index >= 0 ? allMessages.slice(0, index) : allMessages;
  const recentAssistant = before
    .filter((m) => m.role === "assistant" && m.status === "complete")
    .slice(-3)
    .map((m) => m.text);

  const result = intercept(message.text, {
    fakeWe: true,
    identityFusion: true,
    loopGuard: relation.loopGuard,
    recentAssistant,
  });

  if (cache.size > 120) cache.clear();
  cache.set(message.id, {
    length: message.text.length,
    hits: result.hits,
    text: result.text,
  });
  cache.set(`${message.id}:key`, { length: 0, hits: [], text: enabledKey });

  return result;
}

export function clearCalibrationCache() {
  cache.clear();
}
