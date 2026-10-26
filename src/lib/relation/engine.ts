import { useEffect } from "react";
import { usePresenceStore } from "../../stores/presenceStore";
import { useBoundaryStore } from "../../stores/boundaryStore";
import { useChatStore } from "../../stores/chatStore";
import { useLifeStore } from "../../stores/lifeStore";
import { dueWords } from "../life/derive";
import { DAILY_WORD_PROMPT, INITIATIVE_LINES as INITIATIVE_DEFAULT } from "../../content";
import { useContentStore } from "../../stores/contentStore";
import { uid } from "../utils/id";
import type { ChatMessage, InitiativeLevel } from "../../types";

/**
 * 关系状态机：全站唯一持有定时器的地方。
 * UI 里没有任何 setTimeout 决定"该不该开口"。
 *
 * 它做三件事：能量缓慢衰减、状态行随数据变化、安静够久且档位允许时才主动说一句。
 */

const TICK_MS = 4000;
const INITIATIVE_COOLDOWN = 18 * 60_000;
let lastInitiativeAt = 0;
/** 今天问过单词了没有：每天最多主动问一次。 */
let lastWordDay = "";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function tick() {
  const presence = usePresenceStore.getState();
  const boundary = useBoundaryStore.getState();
  const chat = useChatStore.getState();

  const now = Date.now();
  const idle = now - presence.lastInteractionAt;

  presence.setEnergy(clamp01(presence.energy - (boundary.quietMode ? 0.0016 : 0.001)));

  const recent = chat.messages.filter(
    (m) => m.role === "user" && now - m.createdAt < 10 * 60_000,
  ).length;
  const depend = clamp01(boundary.todayTurns / 45 + Math.min(recent, 12) / 16 - 0.05);
  presence.setDependSignal(depend);

  presence.setMood(
    boundary.quietMode || presence.energy < 0.3
      ? "low"
      : presence.energy > 0.78
        ? "warm"
        : "calm",
  );

  const hour = new Date().getHours();
  presence.setStatusLine(
    boundary.quietMode
      ? "今天想安静一点"
      : presence.thinking
        ? "正在想"
        : depend > 0.7
          ? "今天说得有点多了"
          : hour >= 0 && hour < 5
            ? "这个点还没睡"
            : idle < 30_000
              ? "还在这里"
              : "在等你回来",
  );

  // 主动开口：档位决定允不允许，安静时长决定要不要。
  const initiative = boundary.initiative as InitiativeLevel;
  if (
    initiative >= 2 &&
    !boundary.quietMode &&
    idle > 150_000 &&
    presence.energy > 0.4 &&
    now - lastInitiativeAt > INITIATIVE_COOLDOWN
  ) {
    lastInitiativeAt = now;
    const ov = useContentStore.getState().overrides;
    const lines =
      hour >= 23 || hour < 5
        ? ov.initiativeLate?.trim() || INITIATIVE_DEFAULT.late
        : ov.initiativeQuiet?.trim() || INITIATIVE_DEFAULT.quiet;
    const msg: ChatMessage = {
      id: uid("ase"),
      role: "assistant",
      parts: [{ type: "text", text: lines }],
      createdAt: now,
      status: "complete",
      origin: "initiative",
    };
    chat.append(msg);
    presence.touch();
    presence.pulse();
  }

  // 每日单词询问：每天最多一次，问的是还没掌握的那一个。
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime();
  const dayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  const asked = chat.messages.some(
    (m) =>
      m.role === "assistant" &&
      m.createdAt >= startOfToday &&
      m.parts.some((p) => p.type === "text" && p.text.includes("今日一词")),
  );
  if (
    !asked &&
    lastWordDay !== dayKey &&
    hour >= 9 &&
    hour < 23 &&
    !boundary.quietMode &&
    idle > 60_000
  ) {
    const life = useLifeStore.getState();
    const w = dueWords(life.wordBook, 1)[0];
    if (w) {
      lastWordDay = dayKey;
      const msg: ChatMessage = {
        id: uid("ase"),
        role: "assistant",
        parts: [
          {
            type: "text",
            text: DAILY_WORD_PROMPT.replace("{word}", w.word).replace(
              "{phonetic}",
              w.phonetic,
            ),
          },
        ],
        createdAt: now,
        status: "complete",
        origin: "initiative",
      };
      chat.append(msg);
      presence.touch();
      presence.pulse();
    }
  }
}

export function useRelationEngine() {
  useEffect(() => {
    const id = window.setInterval(tick, TICK_MS);
    tick();
    return () => window.clearInterval(id);
  }, []);
}
