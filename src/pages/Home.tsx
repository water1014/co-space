// 月庭首页：移动端优先的横向沉浸式场景入口。
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLifeStore } from "../stores/lifeStore";
import { daysTogether } from "../lib/life/derive";
import { useThemeStore } from "../stores/themeStore";

const dayArtwork = new URL("../../镜花水月：晨光花庭界面.png", import.meta.url).href;
const nightArtwork = new URL("../../月光下的镜花水月 salon.png", import.meta.url).href;

type Door = { title: string; note: string; to: string; x: number; y: number };

const dayDoors: Door[] = [
  { title: "同心阁", note: "与我相见，说说今天的心情", to: "/chat", x: 21, y: 28 },
  { title: "云笺室", note: "写一封想说的话", to: "/diary", x: 21, y: 83 },
  { title: "花镜园", note: "让回忆在这里生长", to: "/album", x: 74, y: 28 },
  { title: "月声", note: "收藏此刻的声音", to: "/music", x: 63, y: 83 },
  { title: "月下人", note: "关于那个重要的人", to: "/mit", x: 93, y: 32 },
  { title: "月约", note: "把重要的日子留住", to: "/calendar", x: 89, y: 59 },
];

const nightDoors: Door[] = [
  { title: "藏忆阁", note: "收藏我们的回忆", to: "/memory", x: 12, y: 27 },
  { title: "幽梦居", note: "只属于我们的夜晚", to: "/studio", x: 10, y: 79 },
  { title: "同心阁", note: "与我相见，说说今天的心情", to: "/chat", x: 53, y: 42 },
  { title: "花镜园", note: "让回忆在这里生长", to: "/album", x: 87, y: 29 },
  { title: "月约", note: "把重要的日子留住", to: "/calendar", x: 92, y: 67 },
  { title: "月声", note: "收藏此刻的声音", to: "/music", x: 59, y: 81 },
];

export function Home() {
  const life = useLifeStore();
  const theme = useThemeStore((state) => state.theme);
  const doors = theme === "night" ? nightDoors : dayDoors;
  const days = daysTogether(life.anniversary);
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
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
            <img className="moon-artwork-backdrop" src={theme === "night" ? nightArtwork : dayArtwork} alt="" draggable={false} />
            <img className="moon-artwork-image" src={theme === "night" ? nightArtwork : dayArtwork} alt="" draggable={false} />
          </div>

          {doors.map((door) => (
            <Link
              key={door.title}
              to={door.to}
              className={`moon-hotspot ${active === door.title ? "is-active" : ""}`}
              style={{ left: (14.375 + door.x * 0.7125) + "%", top: door.y + "%" }}
              onFocus={() => setActive(door.title)}
              onBlur={() => setActive(null)}
              onMouseEnter={() => setActive(door.title)}
              onMouseLeave={() => setActive(null)}
              onTouchStart={() => setActive(door.title)}
              aria-label={`进入${door.title}`}
            >
              <span className="moon-hotspot-name">{door.title}</span>
              <span className="moon-hotspot-note">{door.note}</span>
            </Link>
          ))}
        </div>
      </div>
      <div className="moon-explore-hint"><span>←</span> 左右滑动，探索这座家 <span>→</span></div>
      <div className="moon-home-foot"><span>今天也有一处地方，为你留着灯。</span><span>✧</span></div>
    </div>
  );
}
