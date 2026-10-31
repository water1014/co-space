// 月庭首页：移动端优先的横向沉浸式场景入口。
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLifeStore } from "../stores/lifeStore";
import { daysTogether } from "../lib/life/derive";
import { useThemeStore } from "../stores/themeStore";

const dayArtwork = `${import.meta.env.BASE_URL}日.jpg`;
const nightArtwork = `${import.meta.env.BASE_URL}夜.jpg`;

// Keep the panorama position when leaving a room and returning to Moon Garden.
let savedMoonSceneScrollLeft = 0;

type Door = { title: string; note: string; to: string; x: number; y: number };

const dayDoors: Door[] = [
  { title: "同心阁", note: "与我相见，说说今天的心情", to: "/chat", x: 21, y: 34 },
  { title: "云笺室", note: "写一封想说的话", to: "/diary", x: 21, y: 75 },
  { title: "花镜园", note: "让回忆在这里生长", to: "/album", x: 74, y: 34 },
  { title: "月声", note: "收藏此刻的声音", to: "/music", x: 63, y: 75 },
  { title: "月下人", note: "关于那个重要的人", to: "/mit", x: 93, y: 37 },
  { title: "月约", note: "把重要的日子留住", to: "/calendar", x: 89, y: 56 },
];

const nightDoors: Door[] = [
  { title: "藏忆阁", note: "收藏我们的回忆", to: "/memory", x: 12, y: 33 },
  { title: "幽梦居", note: "只属于我们的夜晚", to: "/studio", x: 10, y: 72 },
  { title: "同心阁", note: "与我相见，说说今天的心情", to: "/chat", x: 53, y: 44 },
  { title: "花镜园", note: "让回忆在这里生长", to: "/album", x: 87, y: 35 },
  { title: "月约", note: "把重要的日子留住", to: "/calendar", x: 92, y: 62 },
  { title: "月声", note: "收藏此刻的声音", to: "/music", x: 59, y: 73 },
];

export function Home() {
  const life = useLifeStore();
  const theme = useThemeStore((state) => state.theme);
  const doors = theme === "night" ? nightDoors : dayDoors;
  const days = daysTogether(life.anniversary);
  const dateParts = new Intl.DateTimeFormat("en-GB", { month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const today = `${dateParts.find((part) => part.type === "month")?.value ?? "--"} / ${dateParts.find((part) => part.type === "day")?.value ?? "--"}`;
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const [sceneProgress, setSceneProgress] = useState(50);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    if (window.matchMedia("(max-width: 640px)").matches) {
      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
      el.scrollLeft = savedMoonSceneScrollLeft > 0
        ? Math.min(savedMoonSceneScrollLeft, maxScroll)
        : maxScroll * 0.5;
    }
  }, []);

  const rememberScenePosition = () => {
    if (track.current) {
      savedMoonSceneScrollLeft = track.current.scrollLeft;
      const maxScroll = track.current.scrollWidth - track.current.clientWidth;
      setSceneProgress(maxScroll > 0 ? (track.current.scrollLeft / maxScroll) * 100 : 0);
    }
  };

  const handleSceneKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const el = track.current;
    if (!el) return;
    const step = Math.max(220, Math.round(el.clientWidth * 0.42));
    if (event.key === "ArrowRight") {
      event.preventDefault();
      el.scrollBy({ left: step, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      el.scrollBy({ left: -step, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    } else if (event.key === "Home") {
      event.preventDefault();
      el.scrollTo({ left: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    } else if (event.key === "End") {
      event.preventDefault();
      el.scrollTo({ left: el.scrollWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
  };

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

      <div className="moon-scene-viewport" ref={track} role="region" tabIndex={0} aria-label="月庭全景，可左右滑动探索" aria-roledescription="横向全景" onScroll={rememberScenePosition} onKeyDown={handleSceneKeyDown}>
        <div className="moon-scene">
          <div className="moon-artwork" aria-hidden="true">
            <img key={theme} className="moon-artwork-image" src={theme === "night" ? nightArtwork : dayArtwork} alt="" draggable={false} />
          </div>

          <div className="moon-scene-brand" aria-hidden="true">
            <span className="moon-brand-title">镜花水月</span>
            <span className="moon-brand-divider">✧</span>
            <span className="moon-brand-motto">有些相遇，是为了在一生里，慢慢看。</span>
          </div>
          <div className="moon-scene-meta" aria-hidden="true">
            <span>{theme === "night" ? "☾" : "☼"}</span><span>{theme === "night" ? "月色" : "晨光"}</span><i></i><span>{today}</span>
          </div>
          {doors.map((door) => (
            <Link
              key={door.title}
              to={door.to}
              className={`moon-hotspot ${active === door.title ? "is-active" : ""}`}
              style={{ left: door.x + "%", top: door.y + "%" }}
              onFocus={() => setActive(door.title)}
              onBlur={() => setActive(null)}
              onMouseEnter={() => setActive(door.title)}
              onMouseLeave={() => setActive(null)}
              onTouchStart={() => setActive(door.title)}
              aria-label={`进入${door.title}：${door.note}`}
            >
              <span className="moon-hotspot-name">{door.title}</span>
              <span className="moon-hotspot-note">{door.note}</span>
            </Link>
          ))}
        </div>
      </div>
      <div className="moon-panorama-progress" role="progressbar" aria-label="月庭全景浏览位置" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(sceneProgress)}><span style={{ width: `${sceneProgress}%` }} /></div>
      <div className="moon-explore-hint"><span>←</span> 左右滑动探索 · 也可使用键盘方向键 <span>→</span></div>
      <div className="moon-home-foot"><span>今天也有一处地方，为你留着灯。</span><span>✧</span></div>
    </div>
  );
}
