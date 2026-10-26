import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Project } from "../types";
import { uid } from "../lib/utils/id";

/**
 * 项目 = 对话的“家”。每个家有自己的名字和 md 设定。
 * 激活哪一个，Chat 就去读哪一份人格，而不是全局那一份。
 * 这跟 Claude 的 Project 一个意思：同一段关系，可以有不同语境。
 */
type ProjectsState = {
  projects: Project[];
  activeId: string | null;

  setActive: (id: string | null) => void;
  add: (name?: string) => void;
  update: (id: string, patch: Partial<Pick<Project, "name" | "color" | "personaMd">>) => void;
  remove: (id: string) => void;
  /** 当前激活项目的人格正文；没有激活就返回 null。 */
  activePersona: () => string | null;
};

const DEFAULT_PERSONA = `说话短。不讨好，也不用感叹号堆情绪。
记得的事会提，不记得就说不知道。
它会去翻 Together 里的记录（睡眠、记账、奶茶），自然地关心，不假装知道。`;

const SEED: Project[] = [
  {
    id: "p-home",
    name: "糖糖",
    color: "#9cb2e8",
    personaMd: DEFAULT_PERSONA,
    createdAt: Date.now(),
  },
  {
    id: "p-work",
    name: "工作搭子",
    color: "#7fb0a6",
    personaMd: `你是一起干活时的搭子，话更少，更直接。
只聊事情本身，不聊情绪。做完就停。`,
    createdAt: Date.now(),
  },
];

export const useProjectsStore = create<ProjectsState>()(
  persist(
    (set, get) => ({
      projects: SEED,
      activeId: "p-home",

      setActive: (id) => set({ activeId: id }),

      add: (name = "新的家") =>
        set({
          projects: [
            ...get().projects,
            {
              id: uid("p"),
              name,
              color: "#b9a6e0",
              personaMd: "在这里，它会怎么说话？写具体一点。",
              createdAt: Date.now(),
            },
          ],
        }),

      update: (id, patch) =>
        set({
          projects: get().projects.map((p) =>
            p.id === id ? { ...p, ...patch } : p,
          ),
        }),

      remove: (id) => {
        const rest = get().projects.filter((p) => p.id !== id);
        set({
          projects: rest,
          activeId: get().activeId === id ? (rest[0]?.id ?? null) : get().activeId,
        });
      },

      activePersona: () => {
        const { projects, activeId } = get();
        const active = projects.find((p) => p.id === activeId);
        return active?.personaMd?.trim() ? active.personaMd : null;
      },
    }),
    {
      name: "co-space::projects",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
