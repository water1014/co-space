import { createPortal } from "react-dom";
import type { ReactNode } from "react";

/**
 * 把浮层挂到 document.body。
 *
 * 页面转场给 <main> 加了 transform / will-change，这会让 <main> 变成
 * fixed 后代的包含块——弹层于是被"关"在滚动容器里，跟着内容一起漂。
 * 所有全屏浮层（抽屉、底部面板、确认框）都必须走这里。
 */
export function Portal({ children }: { children: ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
