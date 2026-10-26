import { IconPause, IconPlay } from "../ui/icons";

/**
 * 纯 CSS 黑胶：重复径向渐变做纹槽，conic-gradient 做一道扫光，
 * 这样转起来才看得出在转。
 */
export function VinylRecord({
  playing,
  onToggle,
  size = 104,
}: {
  playing: boolean;
  onToggle: () => void;
  size?: number;
}) {
  return (
    <button
      onClick={onToggle}
      aria-label={playing ? "暂停" : "播放"}
      className="press relative flex-none"
      style={{ width: size, height: size }}
    >
      <div
        className="vinyl-disc absolute inset-0"
        data-playing={playing}
        aria-hidden
      />
      <div
        className="vinyl-label absolute rounded-full"
        style={{
          inset: size * 0.31,
          opacity: playing ? 1 : 0.86,
          transition: "opacity .4s ease",
        }}
        aria-hidden
      />
      <div
        className="absolute rounded-full"
        style={{
          inset: size * 0.455,
          background: "var(--bg)",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,.14)",
        }}
        aria-hidden
      />
      <span
        className="absolute inset-0 flex items-center justify-center text-[var(--accent-ink)]"
        aria-hidden
      >
        {playing ? (
          <IconPause width={13} height={13} />
        ) : (
          <IconPlay width={13} height={13} className="ml-[2px]" />
        )}
      </span>
    </button>
  );
}
