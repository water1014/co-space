import { db } from "./schema";
import type { Echo, Imprint, MemoryEntry } from "../../types";

const DAY = 86_400_000;
/** 每天衰减到原来的 96%：两周后仍可召回，两个月后基本沉底。 */
const DECAY_PER_DAY = 0.96;
const MIN_WEIGHT = 0.04;

/* ---------------- 记忆 ---------------- */

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

export async function searchMemories(query: string): Promise<MemoryEntry[]> {
  const q = query.trim().toLowerCase();
  if (!q) return listMemories();
  const all = await db.memories.toArray();
  return all
    .filter((m) => m.text.toLowerCase().includes(q))
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** 按时间做一次衰减。只在启动时跑，不放在渲染路径上。 */
export async function decayMemories(): Promise<MemoryEntry[]> {
  const all = await db.memories.toArray();
  const now = Date.now();
  const changed: MemoryEntry[] = [];

  for (const m of all) {
    if (m.pinned || m.resolved) continue;
    const days = (now - m.updatedAt) / DAY;
    if (days < 1) continue;
    const weight = Math.max(
      MIN_WEIGHT,
      m.weight * Math.pow(DECAY_PER_DAY, days),
    );
    if (Math.abs(weight - m.weight) > 0.001) {
      changed.push({ ...m, weight, updatedAt: now });
    }
  }

  if (changed.length) await db.memories.bulkPut(changed);
  return listMemories();
}

/** 召回候选：按 weight × 新近度打分，返回前三名与各自得分。 */
export function rankForRecall(
  memories: MemoryEntry[],
  limit = 3,
): { memory: MemoryEntry; score: number }[] {
  const now = Date.now();
  return memories
    .filter((m) => !m.resolved)
    .map((m) => {
      const days = (now - m.createdAt) / DAY;
      const recency = 1 / (1 + days / 7);
      return {
        memory: m,
        score: m.weight * 0.68 + recency * 0.32 + (m.pinned ? 0.35 : 0),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/* ---------------- 回声 ---------------- */

export async function listEchoes(limit = 80): Promise<Echo[]> {
  const all = await db.echoes.toArray();
  return all.sort((a, b) => b.at - a.at).slice(0, limit);
}

export async function putEcho(echo: Echo): Promise<Echo> {
  await db.echoes.put(echo);
  const count = await db.echoes.count();
  if (count > 400) {
    const old = await db.echoes.orderBy("at").limit(count - 400).toArray();
    await db.echoes.bulkDelete(old.map((e) => e.id));
  }
  return echo;
}

/* ---------------- 印记 ---------------- */

export async function listImprints(): Promise<Imprint[]> {
  const all = await db.imprints.toArray();
  return all.sort((a, b) => b.at - a.at);
}

export async function putImprint(imprint: Imprint): Promise<Imprint> {
  await db.imprints.put(imprint);
  return imprint;
}

export async function deleteImprint(id: string): Promise<void> {
  await db.imprints.delete(id);
}

/* ---------------- 全局 ---------------- */

export async function clearAll(): Promise<void> {
  await Promise.all([
    db.memories.clear(),
    db.echoes.clear(),
    db.imprints.clear(),
  ]);
}
