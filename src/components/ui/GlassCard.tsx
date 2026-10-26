import type { ReactNode } from "react";

/**
 * 统一的毛玻璃卡片。
 *
 * 配方：半透明底 + backdrop-blur + 1px 边 + 一道从左上到右下的内发光。
 * 内发光层是独立的绝对定位 div，不用 box-shadow —— 这样它会被 overflow-hidden
 * 裁进圆角里，看起来像玻璃的厚度，而不是一圈描边。
 */
export function GlassCard({
  children,
  className = "",
  pad = true,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  pad?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`glass rounded-[24px] ${pad ? "p-5" : ""} ${
        onClick ? "press cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

/** 表单/列表里的嵌层容器，比 GlassCard 轻一档。 */
export function InsetCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`glass-flat ${className}`}>{children}</div>;
}
