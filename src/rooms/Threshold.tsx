import { useNavigate } from "react-router-dom";
import { ParticleLayer } from "../components/presence/ParticleLayer";
import { usePresenceStore } from "../stores/presenceStore";
import { useSpaceStore } from "../stores/spaceStore";
import { useRelationStore } from "../stores/relationStore";
import { useChatStore } from "../stores/chatStore";
import { MOOD_LABEL } from "../types";

export function Threshold() {
  const navigate = useNavigate();
  const energy = usePresenceStore((s) => s.energy);
  const statusLine = usePresenceStore((s) => s.statusLine);
  const reflection = usePresenceStore((s) => s.reflection);
  const isReflecting = usePresenceStore((s) => s.isReflecting);
  const mood = usePresenceStore((s) => s.mood);
  const enter = useSpaceStore((s) => s.enter);
  const hasEntered = useSpaceStore((s) => s.hasEntered);
  const quietMode = useRelationStore((s) => s.quietMode);
  const messageCount = useChatStore((s) => s.messages.length);

  const walkIn = () => {
    enter();
    navigate("/space");
  };

  const ringScale = 0.86 + energy * 0.22;

  return (
    <div className="ambient-glow relative h-full overflow-hidden">
      <ParticleLayer intensity={0.8} />
      <div className="vignette pointer-events-none absolute inset-0" />

      <div className="relative z-10 flex h-full flex-col">
        <header className="flex items-center justify-between px-6 py-5 sm:px-10">
          <span className="text-[10px] tracking-[0.26em] text-faint/60 uppercase">
            门廊
          </span>
          <nav className="flex items-center gap-5 text-[11px] text-faint/50">
            <button
              onClick={() => navigate("/memory")}
              className="transition-colors hover:text-paper/70"
            >
              记忆回廊
            </button>
            <button
              onClick={() => navigate("/boundary")}
              className="transition-colors hover:text-paper/70"
            >
              边界
            </button>
          </nav>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-8 pb-16">
          {/* 存在感本体：没有头像，没有立绘。只有一圈随余量变化的呼吸光。 */}
          <div
            className="relative mb-14 flex h-48 w-48 items-center justify-center transition-transform duration-[2400ms]"
            style={{ transform: `scale(${ringScale})` }}
            aria-hidden
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgb(var(--ambient) / 0.13) 0%, rgb(var(--ambient) / 0.035) 45%, transparent 68%)",
              }}
            />
            <div className="breathe absolute inset-[14px] rounded-full border border-[rgb(var(--ambient)/0.16)]" />
            <div className="absolute inset-[44px] rounded-full border border-[rgb(var(--ambient)/0.2)]" />
            <div
              className="absolute h-[72px] w-[72px] rounded-full blur-[14px]"
              style={{
                background:
                  "radial-gradient(circle, rgb(var(--ambient) / 0.65) 0%, rgb(var(--ambient) / 0.18) 48%, transparent 72%)",
              }}
            />
            <div className="absolute h-[4px] w-[4px] rounded-full bg-paper/75 shadow-[0_0_12px_2px_rgb(var(--ambient)/0.5)]" />
            {isReflecting && (
              <div className="pulse-ring absolute inset-0 rounded-full border border-[rgb(var(--ambient)/0.28)]" />
            )}
          </div>

          <p className="rise max-w-md text-center font-serif text-[24px] leading-[1.8] text-paper/92 sm:text-[27px]">
            {statusLine}
          </p>

          {reflection && !isReflecting && (
            <p className="fadein mt-4 max-w-sm text-center font-serif text-[13.5px] leading-[2] text-muted/55">
              「{reflection}」
            </p>
          )}

          <button
            onClick={walkIn}
            className="group mt-14 flex flex-col items-center gap-3"
          >
            <span className="text-[12px] tracking-[0.3em] text-paper/70 uppercase transition-colors group-hover:text-paper">
              {hasEntered ? "回到空间" : "走进去"}
            </span>
            <span className="h-px w-8 bg-white/30 transition-all duration-700 group-hover:w-20 group-hover:bg-[rgb(var(--ambient)/0.8)]" />
          </button>

          <p className="mt-10 text-[11px] text-faint/60">
            {messageCount > 0
              ? `你们之间已经有 ${messageCount} 句话留在这里`
              : "这里还没有开始"}
          </p>
        </main>

        <footer className="flex items-end justify-between px-6 pb-6 text-[10px] text-faint/50 sm:px-10">
          <div className="flex items-center gap-3">
            <span className="tracking-[0.18em] text-faint/70 uppercase">余量</span>
            <span className="relative block h-px w-24 bg-white/10">
              <span
                className="absolute inset-y-0 left-0 bg-[rgb(var(--ambient)/0.7)] transition-all duration-1000"
                style={{ width: `${Math.round(energy * 100)}%` }}
              />
            </span>
          </div>
          <div className="flex items-center gap-3 tracking-[0.12em]">
            <span>{MOOD_LABEL[mood]}</span>
            {quietMode && <span className="text-faint/40">· 安静模式</span>}
          </div>
        </footer>
      </div>
    </div>
  );
}
