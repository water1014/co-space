import { useEffect, type ReactNode } from "react";
import { IconClose } from "./icons";

/* ---------------- 卡片 ---------------- */

export { GlassCard, InsetCard } from "./GlassCard";
export { GlassCard as Card } from "./GlassCard";

export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between px-1">
      <h2 className="serif text-[14.5px] tracking-[0.06em] text-ink-soft">
        {children}
      </h2>
      {action}
    </div>
  );
}

/* ---------------- 开关 ---------------- */

export function Switch({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      data-on={on}
      onClick={() => onChange(!on)}
      className="switch press"
    >
      <span />
    </button>
  );
}

/* ---------------- 分段 ---------------- */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: {
  options: { key: T; label: string; badge?: number }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div
      className={`glass-flat flex items-center gap-0.5 p-1 ${className}`}
      role="tablist"
    >
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.key)}
            className={`tap relative flex-1 rounded-[12px] py-1.5 text-[13.5px] ${
              active
                ? "bg-[var(--glass-hi)] text-ink shadow-[inset_0_1px_0_var(--sheen)]"
                : "text-ink-faint hover:text-ink-soft"
            }`}
          >
            {o.label}
            {typeof o.badge === "number" && o.badge > 0 && (
              <span className="ml-1 text-[12px] text-ink-faint">{o.badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- 数据块 ---------------- */

export function Stat({
  label,
  value,
  unit,
  hint,
  onClick,
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="press flex flex-1 flex-col items-start gap-1 rounded-2xl px-1 py-1 text-left disabled:cursor-default"
    >
      <span className="eyebrow">{label}</span>
      <span className="flex items-baseline gap-0.5">
        <span className="num text-[27px] leading-none text-ink">{value}</span>
        {unit && <span className="text-[13px] text-ink-faint">{unit}</span>}
      </span>
      {hint && <span className="text-[12.5px] text-ink-faint">{hint}</span>}
    </button>
  );
}

export function Row({
  label,
  desc,
  right,
  onClick,
  last,
}: {
  label: ReactNode;
  desc?: ReactNode;
  right?: ReactNode;
  onClick?: () => void;
  last?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 py-3.5 ${
        last ? "" : "border-b border-[var(--line)]"
      } ${onClick ? "press cursor-pointer" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <div className="text-[15px] text-ink">{label}</div>
        {desc && (
          <div className="mt-0.5 text-[13.5px] leading-[1.7] text-ink-faint">
            {desc}
          </div>
        )}
      </div>
      {right}
    </div>
  );
}

/* ---------------- 底部浮层 ---------------- */

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`absolute inset-x-0 bottom-0 mx-auto w-full max-w-[560px] overflow-hidden rounded-t-[26px] border-t border-[var(--line)] transition-transform duration-400 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          background: "var(--glass-solid)",
          backdropFilter: "blur(30px) saturate(1.5)",
          WebkitBackdropFilter: "blur(30px) saturate(1.5)",
          boxShadow: "0 -24px 60px -30px rgba(0,0,0,0.75)",
          transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="flex items-center justify-between px-5 pt-3 pb-1">
          <span className="serif text-[14.5px] text-ink-soft">{title}</span>
          <button
            onClick={onClose}
            aria-label="关闭"
            className="press -mr-1 rounded-full p-1.5 text-ink-faint"
          >
            <IconClose width={18} height={18} />
          </button>
        </div>
        <div className="scroll-area max-h-[68vh] px-5 pt-2 pb-4">{children}</div>
      </div>
    </div>
  );
}

/* ---------------- 空态 ---------------- */

export function Empty({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-2 px-2 py-14">
      <p className="serif text-[16px] leading-[1.9] text-ink-soft">{title}</p>
      {hint && (
        <p className="max-w-[26rem] text-[13.5px] leading-[1.9] text-ink-faint">
          {hint}
        </p>
      )}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
