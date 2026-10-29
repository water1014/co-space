import type { ReactNode } from "react";

/**
 * 卡片。
 *
 * Canoe 的基础容器语言：白底 + 发丝线 + 极浅阴影 + 大圆角。
 * 没有玻璃、没有渐变、没有内发光——层级靠留白和线来分。
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
      className={`glass rounded-[20px] ${pad ? "p-5" : ""} ${
        onClick ? "press cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

/** 填充面容器：比卡片轻一档，用于表单区块、占位块。 */
export function InsetCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`glass-flat ${className}`}>{children}</div>;
}
