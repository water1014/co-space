import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ChatMessage, MessagePart } from "../types";
import { chatSeed } from "../content";

type ChatState = {
  messages: ChatMessage[];
  isRunning: boolean;
  draft: string;

  setDraft: (v: string) => void;
  append: (msg: ChatMessage) => void;
  appendStreaming: (msg: ChatMessage) => void;
  appendPart: (id: string, part: MessagePart) => void;
  updatePart: (id: string, part: MessagePart) => void;
  remove: (id: string) => void;
  appendText: (id: string, chunk: string) => void;
  replaceLastText: (id: string, text: string) => void;
  finish: (id: string, status?: "complete" | "cancelled") => void;
  setMessages: (m: ChatMessage[]) => void;
  setRunning: (v: boolean) => void;
  reset: () => void;
};


/** 参考图里那段对话：新设备第一次打开就能对上画面。 */
const at = (h: number, m: number) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
};

const seedMessages = (): ChatMessage[] =>
  chatSeed.map((s, i) => ({
    id: `seed-${i}`,
    role: s.role,
    parts: s.voice
      ? [
          {
            type: "voice" as const,
            duration: s.voice.duration,
            peaks: Array.from(
              { length: 30 },
              (_, k) => 0.25 + Math.abs(Math.sin(k * 0.7)) * 0.65,
            ),
            transcript: s.voice.transcript,
          },
        ]
      : s.steps
        ? [
            {
              type: "thought" as const,
              seconds: 2.4,
              tools: [],
              steps: s.steps,
            },
            ...(s.text ? [{ type: "text" as const, text: s.text }] : []),
          ]
        : [{ type: "text" as const, text: s.text ?? "" }],
    createdAt: at(s.at[0], s.at[1]),
    status: "complete" as const,
    origin: (s.role === "user" ? "user" : "reply") as
      | "user"
      | "reply"
      | "initiative",
  }));

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: seedMessages(),
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

      /**
       * 替换某条消息里的一个 part（按 type 匹配）。
       * 流式思考用：先把空的思考卡建好，模型给了依据再填进去。
       * 只动这一条消息，不整表重写。
       */
      updatePart: (id, part) =>
        set((s) => ({
          messages: s.messages.map((m) => {
            if (m.id !== id) return m;
            const idx = m.parts.findIndex((p) => p.type === part.type);
            if (idx === -1) return { ...m, parts: [...m.parts, part] };
            const parts = [...m.parts];
            parts[idx] = part;
            return { ...m, parts };
          }),
        })),

      /** 撤掉一条消息（没来得及说出一句话就取消时用）。 */
      remove: (id) =>
        set((s) => ({
          messages: s.messages.filter((m) => m.id !== id),
          isRunning: false,
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
