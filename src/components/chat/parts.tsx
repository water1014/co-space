import { useEffect, useRef, useState } from "react";
import type { MessagePart } from "../../types";
import {
  IconChevron,
  IconFile,
  IconPause,
  IconPlay,
} from "../ui/icons";
import { ToolCallBadge } from "./ToolCallBadge";

/* ---------------- 思考过程 ---------------- */

export function ThoughtCard({
  part,
}: {
  part: Extract<MessagePart, { type: "thought" }>;
}) {
  return (
    <div className="mb-2.5">
      <ToolCallBadge tools={part.tools} />
      <details className="group glass-flat px-3.5 py-2.5">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-[12.5px] text-ink-soft/85">
          <span className="h-[5px] w-[5px] flex-none rounded-full bg-[var(--accent)] opacity-80" />
          <span>思考 {part.seconds.toFixed(1)} 秒</span>
          <IconChevron
            width={13}
            height={13}
            className="ml-auto opacity-70 transition-transform duration-300 group-open:rotate-90"
          />
        </summary>
        <div className="mt-2.5 space-y-1.5 border-l border-[var(--line)] pl-3">
          {part.steps.map((step, i) => (
            <p key={i} className="text-[12px] leading-[1.9] text-ink-faint">
              {step}
            </p>
          ))}
        </div>
      </details>
    </div>
  );
}

/* ---------------- 语音 ---------------- */

export function VoiceBubble({
  part,
}: {
  part: Extract<MessagePart, { type: "voice" }>;
}) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearInterval(timer.current);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  const stop = () => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setPlaying(false);
    setProgress(0);
  };

  const play = () => {
    if (playing) {
      stop();
      return;
    }
    // 没有真实音频文件时，用 TTS 把转写读出来——播放是真的，不是动画。
    const text = part.transcript ?? "";
    if ("speechSynthesis" in window && text) {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "zh-CN";
      utter.rate = 1.02;
      utter.onend = stop;
      window.speechSynthesis.speak(utter);
    }
    setPlaying(true);
    const started = Date.now();
    timer.current = window.setInterval(() => {
      const p = Math.min(1, (Date.now() - started) / (part.duration * 1000));
      setProgress(p);
      if (p >= 1 && !("speechSynthesis" in window)) stop();
    }, 100);
  };

  return (
    <div className="glass-flat p-3">
      <div className="flex items-center gap-3">
        <button
          onClick={play}
          aria-label={playing ? "停止播放" : "播放语音"}
          className="press flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-ink)]"
        >
          {playing ? (
            <IconPause width={14} height={14} />
          ) : (
            <IconPlay width={14} height={14} />
          )}
        </button>

        <div className="flex h-8 flex-1 items-center gap-[2.5px]">
          {part.peaks.map((peak, i) => {
            const passed = i / part.peaks.length <= progress;
            return (
              <span
                key={i}
                className="flex-1 rounded-full transition-all duration-300"
                style={{
                  height: `${Math.max(12, peak * 100)}%`,
                  background: passed
                    ? "var(--accent)"
                    : "color-mix(in srgb, var(--ink) 28%, transparent)",
                  opacity: playing ? 0.95 : 0.75,
                }}
              />
            );
          })}
        </div>

        <span className="num flex-none text-[12.5px] text-ink-faint">
          {part.duration.toFixed(1)}″
        </span>
      </div>
      {part.transcript && (
        <p className="mt-2 border-t border-[var(--line)] pt-2 text-[13.5px] leading-[1.8] text-ink-faint">
          {part.transcript}
        </p>
      )}
    </div>
  );
}

/* ---------------- 文件 ---------------- */

export function FileCard({
  part,
}: {
  part: Extract<MessagePart, { type: "file" }>;
}) {
  const [hint, setHint] = useState(false);

  const size =
    part.size > 1024 * 1024
      ? `${(part.size / 1024 / 1024).toFixed(1)} MB`
      : `${Math.max(1, Math.round(part.size / 1024))} KB`;

  /** 下载：用 Blob 真的落一个文件到本地（占位正文，接后端后换成真字节）。 */
  const download = () => {
    const blob = new Blob(
      [`这是「${part.name}」的本地占位文件。\n接入真实后端后，这里会是文件真正的字节。`],
      { type: part.mime || "application/octet-stream" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = part.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-flat flex items-center gap-3 p-3">
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[var(--glass-hi)] text-ink-soft">
        <IconFile width={17} height={17} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] text-ink">{part.name}</p>
        <p className="mt-0.5 text-[12.5px] text-ink-faint">
          {size} · {part.mime}
        </p>
      </div>
      <div className="flex flex-none items-center gap-1.5">
        <button
          onClick={() => {
            setHint(true);
            window.setTimeout(() => setHint(false), 2200);
          }}
          className="tap rounded-full border border-[var(--line)] px-3 py-1 text-[13px] text-ink-soft hover:text-ink"
        >
          {hint ? "未接入" : "打开"}
        </button>
        <button
          onClick={download}
          className="tap rounded-full border border-[var(--line)] px-3 py-1 text-[13px] text-ink-soft hover:text-ink"
        >
          下载
        </button>
      </div>
    </div>
  );
}

/* ---------------- 图片 / 印记 ---------------- */

export function imprintStyle(seed: number) {
  const a = (seed * 47) % 360;
  const b = (a + 62) % 360;
  return {
    background: `
      radial-gradient(88% 76% at 26% 16%, hsl(${a} 24% 54% / 0.9), transparent 64%),
      radial-gradient(78% 66% at 84% 24%, hsl(${b} 18% 46% / 0.72), transparent 62%),
      radial-gradient(130% 110% at 50% 112%, hsl(${(a + 14) % 360} 12% 16% / 0.96), transparent 72%),
      linear-gradient(162deg, hsl(${a} 15% 34%), hsl(${b} 11% 19%))
    `,
  };
}

export function ImageBubble({
  part,
  onClick,
  compact,
}: {
  part: Extract<MessagePart, { type: "image" }>;
  onClick?: () => void;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="press group relative block w-full overflow-hidden rounded-2xl border border-[var(--line)]"
    >
      <div
        className="grain-self relative w-full"
        style={{ ...imprintStyle(part.seed), height: compact ? 150 : 210 }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
        {part.caption && (
          <p className="serif absolute inset-x-3 bottom-2.5 text-left text-[13.5px] text-white/85">
            {part.caption}
          </p>
        )}
      </div>
    </button>
  );
}
