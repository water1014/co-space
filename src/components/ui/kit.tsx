import type { ReactNode } from "react";
import { IconClose } from "./icons";
import { Portal } from "./Portal";

/* ---------------- 卡片 ---------------- */

export { GlassCard, InsetCard } from "./GlassCard";
export { GlassCard as Card } from "./GlassCard";

/* ---------------- 页面头 ---------------- */

/**
 * 页面头。
 *
 * Canoe 的写法：极小号大写英文眉题 + 大号中文标题 + 一句灰字说明。
 * 三个信息块的间距固定，页面之间切换不会跳动。
 */
export function PageHead({
  eyebrow,
  title,
  sub,
  right,
}: {
  eyebrow?: string;
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="px-5 pt-7 pb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="page-head-title mt-1.5 text-[28px] leading-[1.15]">
            {title}
          </h1>
          {sub && <p className="page-head-sub mt-2 text-[14px]">{sub}</p>}
        </div>
        {right && <div className="flex flex-none items-center gap-2">{right}</div>}
      </div>
    </header>
  );
}

/* ---------------- 分组 ---------------- */

/**
 * 编号分组标题。
 *
 * 左侧「01 连接与生成」，右侧英文分类名（CONNECTION）——Canoe 设置页
 * 最鲜明的结构记忆点。
 */
export function GroupTitle({
  index,
  title,
  en,
  action,
}: {
  index?: string;
  title: ReactNode;
  en?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 mt-7 flex items-baseline justify-between gap-3 px-5 first:mt-0">
      <div className="flex items-baseline gap-2.5">
        {index && <span className="num text-[13px] text-[var(--accent)]">{index}</span>}
        <h2 className="group-title">{title}</h2>
      </div>
      {action ?? (en ? <span className="eyebrow">{en}</span> : null)}
    </div>
  );
}

/** 旧的 SectionTitle：保留兼容，内部走新的分组样式。 */
export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between px-5">
      <h2 className="group-title">{children}</h2>
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
            className={`tap relative flex-1 rounded-[10px] py-1.5 text-[13.5px] ${
              active
                ? "bg-[var(--accent-soft)] text-[var(--accent)] font-medium"
                : "text-ink-faint"
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

/** 列表行：左标题、右操作，中间发丝线隔开——Canoe 设置页的基本行。 */
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
      className={`flex items-center gap-4 px-5 py-3.5 ${
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

/* ---------------- 头像 / 图标按钮 / 搜索 ---------------- */

export function Avatar({
  children,
  size = 40,
  className = "",
}: {
  children?: ReactNode;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`avatar ${className}`}
      style={{ height: size, width: size }}
    >
      {children}
    </span>
  );
}

export function IconButton({
  children,
  onClick,
  label,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`icon-btn ${className}`}
    >
      {children}
    </button>
  );
}

export function SearchBar({
  value,
  onChange,
  placeholder = "搜索",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="search-bar">
      <IconSearch />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="ghost-input w-full bg-transparent text-[14px]"
      />
    </div>
  );
}

/* ---------------- 分段标签（英文大写 + 下划线） ---------------- */

export function ChipTabs<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={`flex gap-6 px-5 ${className}`}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            data-on={active}
            className="chip-tab"
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- 会话行（头像 + 主副标题 + 时间） ---------------- */

export function ConversationRow({
  avatar,
  title,
  preview,
  meta,
  badge,
  onClick,
}: {
  avatar?: ReactNode;
  title: ReactNode;
  preview?: ReactNode;
  meta?: ReactNode;
  badge?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="list-row press w-full text-left"
    >
      {avatar}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="truncate text-[16px] font-medium text-ink">
            {title}
          </span>
          {meta && (
            <span className="flex-none text-[12.5px] text-ink-ghost">{meta}</span>
          )}
        </div>
        {preview && (
          <div className="mt-0.5 truncate text-[13.5px] text-ink-faint">
            {preview}
          </div>
        )}
      </div>
      {badge}
    </button>
  );
}

/* ---------------- 底部浮层 ---------------- */

export function Sheet({
  open,
  onClose,
  title,
  children,
  panelClassName = "",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  panelClassName?: string;
}) {
  // 仅在打开时挂键盘监听，关掉即移除。
  useEsc(onClose, open);

  return (
    <Portal>
      <div
        className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/25 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`sheet-solid ${panelClassName} absolute inset-x-0 bottom-0 mx-auto w-full max-w-[560px] overflow-hidden rounded-t-[24px] transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          boxShadow: "0 -12px 40px -20px rgba(11,11,15,0.3)",
          transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <span className="text-[15px] font-semibold text-ink">{title}</span>
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
    </Portal>
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
      <p className="text-[16px] leading-[1.9] text-ink-soft">{title}</p>
      {hint && (
        <p className="max-w-[26rem] text-[13.5px] leading-[1.9] text-ink-faint">
          {hint}
        </p>
      )}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

/* ---------------- 内部 ---------------- */

import { useEffect } from "react";

function useEsc(onClose: () => void, open: boolean) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
}

function IconSearch() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}
