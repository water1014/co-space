import { db } from "./schema";
import type { MemoryEntry } from "../../types";

const DAY = 86_400_000;
/** 每天衰减到原来的 96%：两周后仍然可召回，两个月后基本沉底。 */
const DECAY_PER_DAY = 0.96;
const MIN_WEIGHT = 0.04;

export async function listMemories(): Promise<MemoryEntry[]> {
  const all = await db.memories.toArray();
  return all.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.createdAt - a.createdAt;
  });
}

export async function putMemory(entry: MemoryEntry): Promise<MemoryEntry> {
  await db.memories.put(entry);
  return entry;
}

export async function patchMemory(
  id: string,
  patch: Partial<MemoryEntry>,
): Promise<MemoryEntry | null> {
  const current = await db.memories.get(id);
  if (!current) return null;
  const next: MemoryEntry = { ...current, ...patch, updatedAt: Date.now() };
  await db.memories.put(next);
  return next;
}

export async function deleteMemory(id: string): Promise<void> {
  await db.memories.delete(id);
}

export async function clearMemories(): Promise<void> {
  await db.memories.clear();
}

export async function searchMemories(query: string): Promise<MemoryEntry[]> {
  const q = query.trim().toLowerCase();
  if (!q) return listMemories();
  const all = await db.memories.toArray();
  return all
    .filter((m) => m.text.toLowerCase().includes(q))
    .sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * 按时间做一次衰减。只在启动和手动刷新时跑，不放在渲染路径上。
 * 封存（sealed）的记忆不衰减，但也不会被召回。
 */
export async function decayMemories(): Promise<MemoryEntry[]> {
  const all = await db.memories.toArray();
  const now = Date.now();
  const changed: MemoryEntry[] = [];

  for (const m of all) {
    if (m.pinned || m.sealed) continue;
    const days = (now - m.updatedAt) / DAY;
    if (days < 1) continue;
    const weight = Math.max(MIN_WEIGHT, m.weight * Math.pow(DECAY_PER_DAY, days));
    if (Math.abs(weight - m.weight) > 0.001) {
      changed.push({ ...m, weight, updatedAt: now });
    }
  }

  if (changed.length) await db.memories.bulkPut(changed);
  return listMemories();
}

/** 召回候选：排除封存，按 weight × 新近度打分。 */
export function rankForRecall(
  memories: MemoryEntry[],
  limit = 3,
): MemoryEntry[] {
  const now = Date.now();
  return memories
    .filter((m) => !m.sealed)
    .map((m) => {
      const days = (now - m.createdAt) / DAY;
      const recency = 1 / (1 + days / 7);
      return { m, score: m.weight * 0.7 + recency * 0.3 + (m.pinned ? 0.5 : 0) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.m);
}
