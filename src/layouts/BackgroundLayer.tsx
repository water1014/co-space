/**
 * 背景层：彩虹磨砂玻璃。
 * 夜间 = 黑烟玻璃；日间 = 白雾玻璃透出柔彩光斑（粉/青/黄/绿/紫）。
 * 全部 CSS：五团径向渐变 + 颗粒 + 暗角，无图片请求。
 * 日夜两套由 [data-theme] 切换 --blob-* 变量。
 */
export function BackgroundLayer() {
  return (
    <div className="app-bg fixed inset-0" aria-hidden>
      <div className="glow" />
      <div className="grain" />
      <div className="shade" />
    </div>
  );
}
