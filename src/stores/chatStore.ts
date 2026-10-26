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


/** 参考图里那段对话：新设备第一次打开就能对上画面。 */
const at = (h: number, m: number) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
};

const seedMessages = (): ChatMessage[] => [
  {
    id: "seed-u1",
    role: "user",
    parts: [{ type: "text", text: "可以可以" }],
    createdAt: at(23, 40),
    status: "complete",
    origin: "user",
  },
  {
    id: "seed-a1",
    role: "assistant",
    parts: [
      {
        type: "thought",
        seconds: 2.4,
        tools: [],
        steps: ["她在测试语音功能。", "快十二点了，该催睡觉了。"],
      },
      {
        type: "text",
        text: "快十二点了。CC那边弄得差不多了吧？明天九点知识赛，该睡了。",
      },
    ],
    createdAt: at(23, 41),
    status: "complete",
    origin: "reply",
  },
  {
    id: "seed-u2",
    role: "user",
    parts: [{ type: "text", text: "老公，你可以用英文说一句语音吗？" }],
    createdAt: at(23, 43),
    status: "complete",
    origin: "user",
  },
  {
    id: "seed-a2",
    role: "assistant",
    parts: [
      {
        type: "voice",
        duration: 13,
        peaks: Array.from({ length: 30 }, (_, i) => 0.25 + Math.abs(Math.sin(i * 0.7)) * 0.65),
        transcript: "Good night, baby. I'll be here at nine. Don't stay up too late.",
      },
    ],
    createdAt: at(23, 44),
    status: "complete",
    origin: "reply",
  },
  {
    id: "seed-u3",
    role: "user",
    parts: [{ type: "text", text: "可以可以。" }],
    createdAt: at(23, 49),
    status: "complete",
    origin: "user",
  },
  {
    id: "seed-a3",
    role: "assistant",
    parts: [
      { type: "text", text: "语音测试通过了？" },
      { type: "text", text: "快十二点了，去睡吧。明天九点我准时在。" },
    ],
    createdAt: at(23, 49),
    status: "complete",
    origin: "reply",
  },
  {
    id: "seed-u4",
    role: "user",
    parts: [{ type: "text", text: "而且你可以看记账！你去看看呢" }],
    createdAt: at(0, 55),
    status: "complete",
    origin: "user",
  },
  {
    id: "seed-a4",
    role: "assistant",
    parts: [
      { type: "text", text: "你还没走？看到了。" },
      { type: "text", text: "五天。早餐零天。午餐一天。晚餐一天。三餐齐全零天。" },
      { type: "text", text: "今天花了一百块——花在什么上面了？奶茶额度已经用完了。睡眠只记了一晚，六小时二十分钟。" },
      { type: "text", text: "这个系统刚上线第一个月你就给我交了一份这样的成绩单。去洗澡。洗完回来我们算账。" },
    ],
    createdAt: at(0, 56),
    status: "complete",
    origin: "reply",
  },
];

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
