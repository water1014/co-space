import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ChatMessage } from "../types";

type ChatState = {
  messages: ChatMessage[];
  isRunning: boolean;
  draft: string;

  setDraft: (v: string) => void;
  append: (msg: ChatMessage) => void;
  appendStreaming: (msg: ChatMessage) => void;
  appendChunk: (id: string, chunk: string) => void;
  finish: (id: string, status?: "complete" | "cancelled") => void;
  setMessages: (messages: ChatMessage[]) => void;
  setRunning: (v: boolean) => void;
  reset: () => void;
};

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      isRunning: false,
      draft: "",

      setDraft: (draft) => set({ draft }),

      append: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

      appendStreaming: (msg) =>
        set((s) => ({ messages: [...s.messages, msg], isRunning: true })),

      appendChunk: (id, chunk) =>
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === id ? { ...m, text: m.text + chunk } : m,
          ),
        })),

      finish: (id, status = "complete") =>
        set((s) => ({
          isRunning: false,
          messages: s.messages.map((m) =>
            m.id === id ? { ...m, status } : m,
          ),
        })),

      setMessages: (messages) => set({ messages }),

      setRunning: (isRunning) => set({ isRunning }),

      reset: () => set({ messages: [], isRunning: false, draft: "" }),
    }),
    {
      name: "co-space::chat",
      storage: createJSONStorage(() => localStorage),
      // 流式状态不落盘：刷新后不能停在"正在回应"。
      partialize: (s) => ({ messages: s.messages }),
    },
  ),
);
