import { dbClient } from "./client";
import { useMemoryStore } from "../../stores/memoryStore";
import { dayKeyOf, uid } from "../utils/id";
import type { Echo, Imprint, MemoryEntry } from "../../types";

/**
 * Seed is only sample content. Mark completion after all writes succeed so a
 * quota error or interrupted tab cannot leave a permanently half-seeded DB.
 */
export async function seedIfEmpty() {
  try {
    if (localStorage.getItem("co-space::seeded") === "1") return;
  } catch {
    return;
  }

  if (useMemoryStore.getState().memories.length > 0) {
    try { localStorage.setItem("co-space::seeded", "1"); } catch { /* optional marker */ }
    return;
  }

  const now = Date.now();
  const day = 86_400_000;

  const raw: Array<Omit<MemoryEntry, "id" | "updatedAt" | "weight">> = [
    { text: "她说过不喜欢被叫全名，叫阿岚就行。", kind: "fact", tags: ["称呼"], source: "conversation", createdAt: now - 2 * day, pinned: true, resolved: false },
    { text: "周三凌晨聊到搬家，她说想住得离水近一点，最好是能看见河。后来没再提。", kind: "fact", tags: ["搬家"], source: "conversation", createdAt: now - 9 * day, pinned: false, resolved: false },
    { text: "她说最近在考虑辞职，还没跟家里讲。说到这里就停了。", kind: "feel", tags: ["工作"], source: "conversation", createdAt: now - 4 * day, pinned: false, resolved: false },
    { text: "答应过陪她把简历改完——还没做。", kind: "todo", tags: ["待兑现"], source: "reflection", createdAt: now - 11 * day, pinned: false, resolved: false },
  ];

  const entries: MemoryEntry[] = raw.map((m, i) => ({
    ...m, id: uid("m"), updatedAt: m.createdAt,
    weight: [0.94, 0.71, 0.86, 0.62][i] ?? 0.8,
  }));

  for (const e of entries) await dbClient.putMemory(e);

  const imprints: Imprint[] = [
    { id: uid("i"), title: "第四个家", seed: 4821, at: now - 6 * day, prompt: "她说想住得离水近一点。" },
    { id: uid("i"), title: "10.21 的雨", seed: 913, at: now - 5 * day, prompt: "今天下雨，帮我记住这一天。" },
  ];
  for (const im of imprints) await dbClient.putImprint(im);

  const echoes: Echo[] = [
    { id: uid("e"), at: now - 3 * 3600_000, query: "今天有点累", hit: true, score: 0.58, nearId: entries[2].id },
    { id: uid("e"), at: now - 26 * 3600_000, query: "你还记得我说过搬家吗", hit: true, score: 0.81, nearId: entries[1].id },
    { id: uid("e"), at: now - 30 * 3600_000, query: "明天天气怎么样", hit: false, score: 0.21, nearId: entries[0].id, note: "最近的也够不上" },
    { id: uid("e"), at: now - 50 * 3600_000, query: "算了不说了", hit: false, score: 0.12, note: "没有可用的记忆" },
  ];
  for (const e of echoes) await dbClient.putEcho(e);

  await useMemoryStore.getState().load();
  try { localStorage.setItem("co-space::seeded", "1"); } catch { /* seed writes succeeded; marker can be retried */ }
  console.info(`[seed] ${entries.length} 条记忆 / ${imprints.length} 张印记 / ${echoes.length} 次回声`);
}

export const memoryCountToday = (entries: MemoryEntry[]) =>
  entries.filter((m) => dayKeyOf(m.createdAt) === dayKeyOf(new Date())).length;
