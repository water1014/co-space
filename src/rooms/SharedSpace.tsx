import { ParticleLayer } from "../components/presence/ParticleLayer";
import { RoomHeader } from "../components/layout/RoomHeader";
import { ThreadBridge } from "../components/chat/ThreadBridge";
import { usePresenceStore } from "../stores/presenceStore";
import { useRelationStore } from "../stores/relationStore";
import { useState } from "react";

export function SharedSpace() {
  return (
    <div className="ambient-glow relative h-full overflow-hidden">
      <ParticleLayer intensity={1} />
      <div className="vignette pointer-events-none absolute inset-0" />

      <div className="relative z-10 flex h-full flex-col">
        <RoomHeader room="共同空间" />
        <DependencyNudge />
        <ThreadBridge />
      </div>
    </div>
  );
}

/**
 * 依赖度提醒不是弹窗。
 * 它出现在空间顶部，语气是商量，可以直接拒绝；拒绝后半小时内不再出现。
 */
function DependencyNudge() {
  const depend = usePresenceStore((s) => s.dependSignal);
  const quietMode = useRelationStore((s) => s.quietMode);
  const snoozedAt = useRelationStore((s) => s.reminderSnoozedAt);
  const setQuietMode = useRelationStore((s) => s.setQuietMode);
  const snooze = useRelationStore((s) => s.snoozeReminder);
  const [dismissed, setDismissed] = useState(false);

  const snoozeExpired = Date.now() - snoozedAt > 30 * 60_000;
  const visible =
    !dismissed && !quietMode && snoozeExpired && depend > 0.62;

  if (!visible) return null;

  return (
    <div className="fadein relative z-20 mx-6 mb-2 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-white/6 py-2.5 text-[11.5px] text-muted/70 sm:mx-10">
      <span className="text-[rgb(var(--ambient)/0.7)]">·</span>
      <span>今天说得有点多了。要不要让它安静一会儿？</span>
      <span className="flex items-center gap-4">
        <button
          onClick={() => {
            setQuietMode(true);
            setDismissed(true);
          }}
          className="text-paper/70 underline decoration-white/20 underline-offset-4 hover:text-paper"
        >
          好
        </button>
        <button
          onClick={() => {
            snooze();
            setDismissed(true);
          }}
          className="text-faint hover:text-muted"
        >
          不用
        </button>
      </span>
    </div>
  );
}
