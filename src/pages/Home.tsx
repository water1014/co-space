// 月庭首页：移动端优先的横向沉浸式场景入口。
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLifeStore } from "../stores/lifeStore";
import { daysTogether } from "../lib/life/derive";
import { useThemeStore } from "../stores/themeStore";

const dayArtwork = new URL("../../镜花水月：晨光花庭界面.png", import.meta.url).href;
const nightArtwork = new URL("../../月光下的镜花水月 salon.png", import.meta.url).href;

type Door = { title: string; note: string; to: string; x: number; y: number; kind: "window" | "desk" | "garden" | "record" | "portrait" | "clock" };

const doors: Door[] = [
  { title: "同心阁", note: "在月光下相见", to: "/chat", x: 20, y: 30, kind: "window" },
  { title: "云笺室", note: "写一封未寄出的信", to: "/diary", x: 22, y: 80, kind: "desk" },
  { title: "花镜园", note: "让记忆开成花", to: "/album", x: 72, y: 30, kind: "garden" },
  { title: "月声", note: "收藏此刻的声音", to: "/music", x: 62, y: 80, kind: "record" },
  { title: "月下人", note: "关于那个重要的人", to: "/mit", x: 93, y: 32, kind: "portrait" },
  { title: "月约", note: "把重要的日子留住", to: "/calendar", x: 88, y: 58, kind: "clock" },
];
const nightPositions: Record<string, { x: number; y: number }> = {
  同心阁: { x: 53, y: 45 },
  云笺室: { x: 10, y: 78 },
  花镜园: { x: 86, y: 34 },
  月声: { x: 59, y: 80 },
  月下人: { x: 18, y: 34 },
  月约: { x: 92, y: 60 },
};

export function Home() {
  const life = useLifeStore();
  const theme = useThemeStore((state) => state.theme);
  const days = daysTogether(life.anniversary);
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    // 首次停在场景中段，像从宅邸中央醒来；返回时浏览器保留滚动位置。
    if (el.scrollLeft === 0 && window.matchMedia("(max-width: 640px)").matches) {
      el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) * 0.28);
    }
  }, []);

  return (
    <div className="moon-home">
      <header className="moon-home-head">
        <div>
          <p className="moon-kicker">A PRIVATE WORLD FOR TWO</p>
          <h1>镜花水月</h1>
          <p className="moon-motto">以镜为界，以花为念，以水为时，以月为家。</p>
        </div>
        <div className="moon-days"><span>相伴</span><strong>{days}</strong><span>天</span></div>
      </header>

      <div className="moon-scene-viewport" ref={track} aria-label="月庭全景，可左右滑动探索">
        <div className="moon-scene">
          <div className="moon-artwork" aria-hidden="true">
            <img className="moon-artwork-image" src={theme === "night" ? nightArtwork : dayArtwork} alt="" draggable={false} />
          </div>

          {doors.map((door) => (
            <Link key={door.title} to={door.to} className={`moon-hotspot ${active === door.title ? "is-active" : ""}`} style={{ left: (theme === "night" ? nightPositions[door.title].x : door.x) + "%", top: (theme === "night" ? nightPositions[door.title].y : door.y) + "%" }} onFocus={() => setActive(door.title)} onBlur={() => setActive(null)} onMouseEnter={() => setActive(door.title)} onMouseLeave={() => setActive(null)} onTouchStart={() => setActive(door.title)} aria-label={`进入${door.title}`}>
              <span className={`moon-hotspot-name ${active === door.title ? "is-lit" : ""}`}>{door.title}</span>
              <span className="moon-hotspot-note">{door.note}</span>
            </Link>
          ))}
          <div className="moon-scene-caption">THE MOONLIT COURTYARD <span>·</span> 月庭</div>
        </div>
      </div>
      <div className="moon-explore-hint"><span>←</span> 左右滑动，探索这座家 <span>→</span></div>
      <div className="moon-home-foot"><span>今天也有一处地方，为你留着灯。</span><span>✧</span></div>
    </div>
  );
}
