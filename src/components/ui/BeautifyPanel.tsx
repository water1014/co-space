import { useEffect } from "react";
import { PRESETS, WALLPAPERS, useBeautyStore } from "../../stores/beautyStore";
import { useThemeStore } from "../../stores/themeStore";
import { IconClose, IconSun, IconMoon, IconCheck } from "../ui/icons";

/** 美化面板：底部弹层，一键换肤 + 壁纸 + 日夜切换，呼应「自己装修美化」。 */
export function BeautifyPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const presetId = useBeautyStore((s) => s.presetId);
  const setPreset = useBeautyStore((s) => s.setPreset);
  const wallpaperId = useBeautyStore((s) => s.wallpaperId);
  const setWallpaper = useBeautyStore((s) => s.setWallpaper);
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[min(100%,460px)] rounded-t-[26px] border border-[var(--line)] bg-[var(--surface)] p-5 pb-[calc(env(safe-area-inset-bottom)+20px)] shadow-[var(--shadow-float)]">
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-[var(--line-strong)]" />

        <div className="flex items-center justify-between">
          <h2 className="serif-display text-[20px] text-ink">美化</h2>
          <button
            onClick={onClose}
            className="tap flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-2)] text-ink-soft"
            aria-label="关闭"
          >
            <IconClose width={15} height={15} />
          </button>
        </div>
        <p className="mt-0.5 text-[12.5px] text-ink-faint">挑一套喜欢的配色，全站即时生效</p>

        <p className="mt-5 mb-2.5 text-[11px] tracking-[0.16em] text-ink-faint">主题色</p>
        <div className="grid grid-cols-5 gap-3">
          {PRESETS.map((p) => {
            const active = p.id === presetId;
            return (
              <button
                key={p.id}
                onClick={() => setPreset(p.id)}
                className="tap flex flex-col items-center gap-1.5"
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-transform ${
                    active ? "ring-2 ring-[var(--accent-deep)] ring-offset-2 ring-offset-[var(--surface)]" : ""
                  }`}
                  style={{ background: p.swatch }}
                >
                  <span className="h-3 w-3 rounded-full bg-white/85" />
                </span>
                <span
                  className={`text-[11px] ${active ? "text-[var(--accent-deep)]" : "text-ink-faint"}`}
                >
                  {p.name}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-5 mb-2.5 text-[11px] tracking-[0.16em] text-ink-faint">壁纸</p>
        <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1">
          {WALLPAPERS.map((w) => {
            const active = w.id === wallpaperId;
            return (
              <button
                key={w.id}
                onClick={() => setWallpaper(w.id)}
                className="tap flex flex-none flex-col items-center gap-1.5"
              >
                <span
                  className={`relative flex h-16 w-12 items-center justify-center overflow-hidden rounded-2xl border transition-transform ${
                    active
                      ? "border-[var(--accent-deep)] ring-2 ring-[var(--accent-deep)] ring-offset-2 ring-offset-[var(--surface)]"
                      : "border-[var(--line)]"
                  }`}
                  style={{
                    background:
                      w.css || "linear-gradient(165deg,#faf7f4 0%,#efe9e3 100%)",
                  }}
                >
                  {active && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/85 text-[var(--accent-deep)]">
                      <IconCheck width={12} height={12} strokeWidth={2.4} />
                    </span>
                  )}
                  {!active && w.id === "none" && (
                    <span className="text-[10px] text-ink-faint">默认</span>
                  )}
                </span>
                <span
                  className={`text-[10.5px] ${
                    active ? "text-[var(--accent-deep)]" : "text-ink-faint"
                  }`}
                >
                  {w.name}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-5 mb-2.5 text-[11px] tracking-[0.16em] text-ink-faint">外观</p>
        <div className="flex gap-2.5">
          {(["day", "night"] as const).map((m) => {
            const active = theme === m;
            const Icon = m === "day" ? IconSun : IconMoon;
            return (
              <button
                key={m}
                onClick={() => theme !== m && toggle()}
                className={`tap flex flex-1 items-center justify-center gap-2 rounded-2xl border py-3 text-[13px] font-medium transition-colors ${
                  active
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-deep)]"
                    : "border-[var(--line)] bg-[var(--surface)] text-ink-soft"
                }`}
              >
                <Icon width={16} height={16} />
                {m === "day" ? "日间" : "夜间"}
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-center text-[11.5px] text-ink-ghost">
          更多小组件排版，正在路上 ✦
        </p>
      </div>
    </div>
  );
}
