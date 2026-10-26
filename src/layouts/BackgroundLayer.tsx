/**
 * 背景层：暗色森林图（低透明度）+ 暗化渐变遮罩 + 三团微光 + 颗粒 + 暗角。
 * 图是真实照片（public/bg-dark-forest.jpg），其余全是 CSS，无额外请求。
 * 用 BASE_URL 拼路径，兼容 /co-space/ 这种带仓库名前缀的部署。
 * 日夜两套由 [data-theme] 切遮罩与微光变量。
 */
export function BackgroundLayer() {
  const bg = `${import.meta.env.BASE_URL}bg-dark-forest.jpg`;
  return (
    <div className="app-bg fixed inset-0" aria-hidden>
      {/* 底层肌理：暗色森林图，低透明度，给整体一点纵深与通透感 */}
      <img
        src={bg}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-30"
        style={{ filter: "saturate(0.85) brightness(0.7)" }}
      />
      {/* 暗化渐变遮罩：上轻下重，把图压进夜色里（日间由 CSS 覆写为浅色） */}
      <div className="bg-veil absolute inset-0 bg-gradient-to-b from-[#07080c]/55 via-[#07080c]/70 to-[#07080c]/92" />
      <div className="glow" />
      <div className="grain" />
      <div className="shade" />
    </div>
  );
}
