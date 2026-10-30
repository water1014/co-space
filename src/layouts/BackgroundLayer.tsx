import { WALLPAPERS, useBeautyStore } from "../stores/beautyStore";

/**
 * 背景层：彩虹磨砂玻璃 + 可选壁纸。
 * 夜间 = 黑烟玻璃；日间 = 白雾玻璃透出柔彩光斑（粉/青/黄/绿/紫）。
 * 壁纸叠在光斑之上，给「自己装修」用。全部 CSS，无图片请求。
 */
export function BackgroundLayer() {
  const wallpaperId = useBeautyStore((s) => s.wallpaperId);
  const wp = WALLPAPERS.find((w) => w.id === wallpaperId);

  return (
    <div className="app-bg fixed inset-0" aria-hidden>
      {wp && wp.css && <div className="app-wall" style={{ background: wp.css }} />}
      <div className="glow" />
      <div className="grain" />
      <div className="shade" />
    </div>
  );
}
