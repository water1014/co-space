import { create } from "zustand";
import { dbClient } from "../lib/db/client";
import type { MemoryEntry, MemorySource } from "../types";

export type MemoryFilter = "all" | "pinned" | "sealed";

type MemoryState = {
  entries: MemoryEntry[];
  loading: boolean;
  query: string;
  filter: MemoryFilter;

  load: () => Promise<void>;
  create: (text: string, source?: MemorySource, sourceRef?: string) => Promise<void>;
  patch: (id: string, patch: Partial<MemoryEntry>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  toggleSeal: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  setQuery: (q: string) => void;
  setFilter: (f: MemoryFilter) => void;
};

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const useMemoryStore = create<MemoryState>((set, get) => ({
  entries: [],
  loading: false,
  query: "",
  filter: "all",

  load: async () => {
    set({ loading: true });
    try {
      const entries = await dbClient.decay();
      set({ entries, loading: false });
    } catch (err) {
      console.error("[memory] load failed", err);
      set({ loading: false });
    }
  },

  create: async (text, source = "manual", sourceRef) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const now = Date.now();
    const entry: MemoryEntry = {
      id: uid(),
      text: trimmed,
      source,
      sourceRef,
      createdAt: now,
      updatedAt: now,
      weight: 1,
      pinned: false,
      sealed: false,
    };
    await dbClient.put(entry);
    set((s) => ({ entries: [entry, ...s.entries] }));
  },

  patch: async (id, patch) => {
    const next = await dbClient.patch(id, patch);
    if (!next) return;
    set((s) => ({
      entries: s.entries.map((m) => (m.id === id ? next : m)),
    }));
  },

  remove: async (id) => {
    await dbClient.remove(id);
    set((s) => ({ entries: s.entries.filter((m) => m.id !== id) }));
  },

  togglePin: async (id) => {
    const entry = get().entries.find((m) => m.id === id);
    if (!entry) return;
    await get().patch(id, { pinned: !entry.pinned });
  },

  toggleSeal: async (id) => {
    const entry = get().entries.find((m) => m.id === id);
    if (!entry) return;
    await get().patch(id, { sealed: !entry.sealed, pinned: entry.sealed ? entry.pinned : false });
  },

  clearAll: async () => {
    await dbClient.clear();
    set({ entries: [] });
  },

  setQuery: (query) => set({ query }),
  setFilter: (filter) => set({ filter }),
}));
