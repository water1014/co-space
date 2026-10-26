import { create } from "zustand";
import { dbClient } from "../lib/db/client";
import { rankForRecall } from "../lib/db/repo";
import type { Echo, Imprint, MemoryEntry, MemoryKind } from "../types";
import { uid } from "../lib/utils/id";

export type MemoryFilter = "all" | "pinned" | "todo";

type MemoryState = {
  memories: MemoryEntry[];
  echoes: Echo[];
  imprints: Imprint[];
  loading: boolean;
  filter: MemoryFilter;

  load: () => Promise<void>;
  createMemory: (
    text: string,
    input?: {
      kind?: MemoryKind;
      source?: MemoryEntry["source"];
      tags?: string[];
      sourceRef?: string;
    },
  ) => Promise<void>;
  patchMemory: (id: string, patch: Partial<MemoryEntry>) => Promise<void>;
  removeMemory: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  toggleResolved: (id: string) => Promise<void>;
  setFilter: (f: MemoryFilter) => void;

  /** 记一次召回：命中就带得分，没命中也要留痕。 */
  recordEcho: (
    query: string,
  ) => Promise<{ hit: boolean; score: number; nearId?: string }>;
  createImprint: (input: {
    title: string;
    prompt: string;
    messageId?: string;
  }) => Promise<Imprint>;
  removeImprint: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
};

export const useMemoryStore = create<MemoryState>((set, get) => ({
  memories: [],
  echoes: [],
  imprints: [],
  loading: false,
  filter: "all",

  load: async () => {
    set({ loading: true });
    try {
      const [memories, echoes, imprints] = await Promise.all([
        dbClient.decayMemories(),
        dbClient.listEchoes(),
        dbClient.listImprints(),
      ]);
      set({ memories, echoes, imprints, loading: false });
    } catch (err) {
      console.error("[memory] load failed", err);
      set({ loading: false });
    }
  },

  createMemory: async (text, input = {}) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const now = Date.now();
    const entry: MemoryEntry = {
      id: uid("m"),
      text: trimmed,
      kind: input.kind ?? "fact",
      tags: input.tags ?? [],
      source: input.source ?? "manual",
      sourceRef: input.sourceRef,
      createdAt: now,
      updatedAt: now,
      weight: 1,
      pinned: false,
      resolved: false,
    };
    await dbClient.putMemory(entry);
    set((s) => ({ memories: [entry, ...s.memories] }));
  },

  patchMemory: async (id, patch) => {
    const next = await dbClient.patchMemory(id, patch);
    if (!next) return;
    set((s) => ({ memories: s.memories.map((m) => (m.id === id ? next : m)) }));
  },

  removeMemory: async (id) => {
    await dbClient.deleteMemory(id);
    set((s) => ({ memories: s.memories.filter((m) => m.id !== id) }));
  },

  togglePin: async (id) => {
    const entry = get().memories.find((m) => m.id === id);
    if (!entry) return;
    await get().patchMemory(id, { pinned: !entry.pinned });
  },

  toggleResolved: async (id) => {
    const entry = get().memories.find((m) => m.id === id);
    if (!entry) return;
    await get().patchMemory(id, { resolved: !entry.resolved });
  },

  setFilter: (filter) => set({ filter }),

  recordEcho: async (query) => {
    const ranked = rankForRecall(get().memories, 3);
    const top = ranked[0];
    // 阈值写死在这里：低于 0.35 就当作"没想起来"。
    const hit = Boolean(top && top.score >= 0.35);
    const echo: Echo = {
      id: uid("e"),
      at: Date.now(),
      query: query.slice(0, 40),
      hit,
      score: Number((top?.score ?? 0.12).toFixed(2)),
      nearId: top?.memory.id,
      note: hit ? undefined : "最近的也够不上",
    };
    await dbClient.putEcho(echo);
    set((s) => ({ echoes: [echo, ...s.echoes].slice(0, 80) }));
    return { hit, score: echo.score, nearId: echo.nearId };
  },

  createImprint: async ({ title, prompt, messageId }) => {
    const imprint: Imprint = {
      id: uid("i"),
      title,
      seed: Math.floor(Math.random() * 10000),
      at: Date.now(),
      prompt,
      messageId,
    };
    await dbClient.putImprint(imprint);
    set((s) => ({ imprints: [imprint, ...s.imprints] }));
    return imprint;
  },

  removeImprint: async (id) => {
    await dbClient.deleteImprint(id);
    set((s) => ({ imprints: s.imprints.filter((i) => i.id !== id) }));
  },

  clearAll: async () => {
    await dbClient.clearAll();
    set({ memories: [], echoes: [], imprints: [] });
  },
}));
