/**
 * 背景层：底色 + 三团微光 + 颗粒 + 暗角。
 * 全是 CSS，没有图片请求；日夜两套由 [data-theme] 切变量。
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
