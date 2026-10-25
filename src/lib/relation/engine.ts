import { useEffect } from "react";
import { usePresenceStore } from "../../stores/presenceStore";
import { useRelationStore } from "../../stores/relationStore";
import { useChatStore } from "../../stores/chatStore";
import { useMemoryStore } from "../../stores/memoryStore";
import { useSpaceStore } from "../../stores/spaceStore";
import { composeInitiative, composeReflection } from "../mock/replies";
import type { ChatMessage, InitiativeLevel, Mood } from "../../types";

/**
 * 关系状态机（前端侧的服务层）。
 *
 * 它持有唯一的时间源：UI 里不出现任何 setTimeout 去决定"该不该开口"。
 * 组件只订阅它的输出（energy / mood / statusLine），把"什么时候主动、
 * 主动说什么"留在一处可读的地方。
 *
 * 状态跨轮次持续、会衰减：刷新页面后 energy 与最后交互时间仍然接上。
 */

const TICK_MS = 2500;
const REFLECT_AFTER = 55_000;
const REFLECT_COOLDOWN = 4 * 60_000;
const INITIATIVE_COOLDOWN = 7 * 60_000;

let lastReflectAt = 0;
let lastInitiativeAt = 0;
let sessionStart = Date.now();

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function deriveMood(
  energy: number,
  quietMode: boolean,
  depend: number,
): Mood {
  const hour = new Date().getHours();
  if (quietMode) return "low";
  if (depend > 0.72) return "restless";
  if (energy < 0.3) return "low";
  if (hour >= 0 && hour < 6) return "calm";
  if (energy > 0.78) return "warm";
  return "calm";
}

function deriveStatusLine(args: {
  energy: number;
  quietMode: boolean;
  isReflecting: boolean;
  hasMessages: boolean;
  idleMs: number;
  depend: number;
  reflection: string | null;
}): string {
  const { energy, quietMode, isReflecting, hasMessages, idleMs, depend } = args;
  if (isReflecting) return "正在整理之前的话";
  if (quietMode) return "今天想安静一点";
  if (depend > 0.72) return "今天说得有点多了";
  if (energy < 0.28) return "余量不多了";
  if (!hasMessages) return "在等你回来";
  if (idleMs < 20_000) return "还在这里";
  if (idleMs > 6 * 60_000) return "刚才那段空着的地方，我没有填";
  return "在等你回来";
}

function tick() {
  const presence = usePresenceStore.getState();
  const relation = useRelationStore.getState();
  const chat = useChatStore.getState();
  const memory = useMemoryStore.getState();

  const now = Date.now();
  const idleMs = now - presence.lastInteractionAt;

  // 1. 能量缓慢衰减：安静时也不算"充电"，只是掉得慢一点。
  const decay = relation.quietMode ? 0.0018 : 0.0012;
  const energy = clamp01(presence.energy - decay);
  presence.setEnergy(energy);

  // 2. 依赖信号：今天的总轮次 + 最近十分钟的密度。
  const recent = chat.messages.filter(
    (m) => m.role === "user" && now - m.createdAt < 10 * 60_000,
  ).length;
  const depend = clamp01(
    relation.todayTurns / 45 + Math.min(recent, 12) / 14 - 0.05,
  );
  presence.setDependSignal(depend);

  // 3. 情绪与状态行。
  const mood = deriveMood(energy, relation.quietMode, depend);
  presence.setMood(mood);
  presence.setStatusLine(
    deriveStatusLine({
      energy,
      quietMode: relation.quietMode,
      isReflecting: presence.isReflecting,
      hasMessages: chat.messages.length > 0,
      idleMs,
      depend,
      reflection: presence.reflection,
    }),
  );

  // 4. 粒子强度：边界是看得见的。滑动主动性、开安静模式，这里立刻变。
  const base =
    0.28 + energy * 0.62 + relation.initiative * 0.022;
  const scale =
    base *
    (relation.quietMode ? 0.34 : 1) *
    (1 - depend * 0.22) *
    (useSpaceStore.getState().focus ? 0.55 : 1);
  useSpaceStore.getState().setParticleScale(scale);

  // 5. 反思：安静够久才想事情。想完不一定说。
  if (
    !presence.isReflecting &&
    idleMs > REFLECT_AFTER &&
    now - lastReflectAt > REFLECT_COOLDOWN &&
    !relation.quietMode
  ) {
    lastReflectAt = now;
    presence.setReflecting(true);
    const text = composeReflection({
      name: relation.name,
      selfName: relation.selfName,
      energy,
      mood,
      memories: memory.entries,
    });
    window.setTimeout(() => {
      usePresenceStore.getState().setReflecting(false);
      usePresenceStore.getState().setReflection(text);
    }, 3600);
  }

  // 6. 主动开口：档位决定允不允许，紧迫感决定要不要。
  const initiative = relation.initiative as InitiativeLevel;
  if (
    initiative >= 2 &&
    !relation.quietMode &&
    idleMs > 95_000 &&
    energy > 0.44 &&
    now - lastInitiativeAt > INITIATIVE_COOLDOWN
  ) {
    const late = new Date().getHours() >= 23 || new Date().getHours() < 5;
    // 档位 2 只在真有钩子（深夜）时开口；档位 3 才允许"只是想说一句"。
    const reason: "late" | "memory" | "quiet" | null = late
      ? "late"
      : initiative >= 3
        ? memory.entries.length > 0
          ? "memory"
          : "quiet"
        : null;

    if (reason) {
      lastInitiativeAt = now;
      const text = composeInitiative(
        {
          name: relation.name,
          selfName: relation.selfName,
          energy,
          mood,
          memories: memory.entries,
        },
        reason,
      );
      const msg: ChatMessage = {
        id: `ase_${now}`,
        role: "assistant",
        text,
        createdAt: now,
        status: "complete",
        origin: "initiative",
      };
      chat.append(msg);
      presence.pulse();
      presence.touch();
    }
  }
}

export function useRelationEngine() {
  useEffect(() => {
    sessionStart = Date.now();
    const id = window.setInterval(tick, TICK_MS);
    tick();
    return () => window.clearInterval(id);
  }, []);
}

/** 只在会话开始时用一次，避免长时间挂起后一口气补算。 */
export const getSessionStart = () => sessionStart;

/** 每轮结束后做一次轻量提取：只留用户自己说过的、带个人信息的句子。 */
export function maybeExtractMemory(userText: string) {
  const text = userText.trim();
  if (text.length < 12) return;
  const personal =
    /(我最近|我在|我今天|我妈|我爸|我朋友|我工作|我准备|我想要|我决定|我搬|我换了|我分手|我离职|我生病|我睡不着)/.test(
      text,
    );
  if (!personal) return;

  const memory = useMemoryStore.getState();
  const recent = memory.entries.slice(0, 5);
  if (recent.some((m) => m.text === text)) return;

  void memory.create(text, "conversation");
}
