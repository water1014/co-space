import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ChatMessage, MessagePart } from "../types";

type ChatState = {
  messages: ChatMessage[];
  isRunning: boolean;
  draft: string;

  setDraft: (v: string) => void;
  append: (msg: ChatMessage) => void;
  appendStreaming: (msg: ChatMessage) => void;
  appendPart: (id: string, part: MessagePart) => void;
  appendText: (id: string, chunk: string) => void;
  replaceLastText: (id: string, text: string) => void;
  finish: (id: string, status?: "complete" | "cancelled") => void;
  setMessages: (m: ChatMessage[]) => void;
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

      appendPart: (id, part) =>
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === id ? { ...m, parts: [...m.parts, part] } : m,
          ),
        })),

      /** 流式增量：有 text 段就往最后一段追加，没有就新开一段。 */
      appendText: (id, chunk) =>
        set((s) => ({
          messages: s.messages.map((m) => {
            if (m.id !== id) return m;
            const parts = [...m.parts];
            const last = parts[parts.length - 1];
            if (last && last.type === "text") {
              parts[parts.length - 1] = {
                type: "text",
                text: last.text + chunk,
              };
            } else {
              parts.push({ type: "text", text: chunk });
            }
            return { ...m, parts };
          }),
        })),

      replaceLastText: (id, text) =>
        set((s) => ({
          messages: s.messages.map((m) => {
            if (m.id !== id) return m;
            const parts = [...m.parts];
            for (let i = parts.length - 1; i >= 0; i--) {
              if (parts[i].type === "text") {
                parts[i] = { type: "text", text };
                return { ...m, parts };
              }
            }
            parts.push({ type: "text", text });
            return { ...m, parts };
          }),
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
