// 月庭首页：保留原画与轻量入口，让入口自然融入场景。
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLifeStore } from "../stores/lifeStore";
import { daysTogether } from "../lib/life/derive";
import { useThemeStore } from "../stores/themeStore";

const dayArtwork = `${import.meta.env.BASE_URL}日.jpg`;
const nightArtwork = `${import.meta.env.BASE_URL}夜.jpg`;

let savedMoonSceneScrollLeft = 0;

type Door = { id: string; title: string; note: string; to: string; x: number; y: number };

const dayDoors: Door[] = [
  { id: "chat", title: "同心阁", note: "与我相见", to: "/chat", x: 18, y: 47 },
  { id: "memory", title: "藏忆阁", note: "收藏我们的时光", to: "/memory", x: 39, y: 68 },
  { id: "together", title: "共游境", note: "一起去看看", to: "/together", x: 59, y: 39 },
  { id: "partner", title: "月下人", note: "关于那个重要的人", to: "/partner", x: 77, y: 67 },
  { id: "mit", title: "镜心", note: "布置这座小小世界", to: "/mit", x: 91, y: 42 },
];

const nightDoors: Door[] = [
  { id: "memory", title: "藏忆阁", note: "收藏我们的时光", to: "/memory", x: 16, y: 64 },
  { id: "chat", title: "同心阁", note: "与我相见", to: "/chat", x: 37, y: 40 },
  { id: "together", title: "共游境", note: "一起去看看", to: "/together", x: 58, y: 66 },
  { id: "partner", title: "月下人", note: "关于那个重要的人", to: "/partner", x: 77, y: 40 },
  { id: "mit", title: "镜心", note: "布置这座小小世界", to: "/mit", x: 91, y: 65 },
];

export function Home() {
  const life = useLifeStore();
  const theme = useThemeStore((state) => state.theme);
  const doors = theme === "night" ? nightDoors : dayDoors;
  const days = daysTogether(life.anniversary);
  const track = useRef<HTMLDivElement>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const [active, setActive] = useState<string | null>(null);
  const [sceneProgress, setSceneProgress] = useState(0);
  const date = new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric" }).format(new Date());

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    if (window.matchMedia("(max-width: 899px)").matches) {
      el.scrollLeft = savedMoonSceneScrollLeft > 0
        ? Math.min(savedMoonSceneScrollLeft, maxScroll)
        : maxScroll * 0.42;
    }
    setSceneProgress(maxScroll > 0 ? (el.scrollLeft / maxScroll) * 100 : 0);
  }, []);

  const rememberScenePosition = () => {
    const el = track.current;
    if (!el) return;
    savedMoonSceneScrollLeft = el.scrollLeft;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setSceneProgress(maxScroll > 0 ? (el.scrollLeft / maxScroll) * 100 : 0);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerStart.current = { x: event.clientX, y: event.clientY };
    suppressClick.current = false;
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStart.current) return;
    const dx = Math.abs(event.clientX - pointerStart.current.x);
    const dy = Math.abs(event.clientY - pointerStart.current.y);
    suppressClick.current = dx > 10 && dx > dy;
    pointerStart.current = null;
  };

  const handleSceneKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const el = track.current;
    if (!el) return;
    const step = Math.max(220, Math.round(el.clientWidth * 0.58));
    const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      el.scrollBy({ left: event.key === "ArrowRight" ? step : -step, behavior });
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      el.scrollTo({ left: event.key === "Home" ? 0 : el.scrollWidth, behavior });
    }
  };

  return (
    <div className="moon-home">
      <header className="moon-home-head">
        <div className="moon-heading-copy">
          <p className="moon-kicker">A PRIVATE WORLD FOR YOU</p>
          <h1>镜花水月</h1>
          <p className="moon-motto">以镜为界，以花为念，以月为家。</p>
        </div>
        <div className="moon-days" aria-label={`相伴${days}天`}>
          <span>相伴</span><strong>{days}</strong><span>天</span>
        </div>
      </header>

      <section className="moon-panorama-wrap" aria-label="月庭探索">
        <div
          className="moon-scene-viewport"
          ref={track}
          role="region"
          tabIndex={0}
          aria-label="月庭全景，可左右滑动探索"
          aria-roledescription="横向全景"
          onScroll={rememberScenePosition}
          onKeyDown={handleSceneKeyDown}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => { pointerStart.current = null; }}
        >
          <div className="moon-scene">
            <div className="moon-artwork" aria-hidden="true">
              <img
                key={theme}
                className="moon-artwork-image"
                src={theme === "night" ? nightArtwork : dayArtwork}
                alt=""
                draggable={false}
              />
            </div>

            <div className="moon-scene-brand" aria-hidden="true">
              <span className="moon-brand-title">镜花水月</span>
              <span className="moon-brand-divider">✧</span>
              <span className="moon-brand-motto">有些相遇，是为了在一生里，慢慢看。</span>
            </div>
            <div className="moon-scene-meta" aria-hidden="true">
              <span>{theme === "night" ? "☾" : "☼"}</span>
              <span>{theme === "night" ? "月色" : "晨光"}</span>
              <i />
              <span>{date}</span>
            </div>

            {doors.map((door) => (
              <Link
                key={door.id}
                to={door.to}
                className={`moon-hotspot ${active === door.id ? "is-active" : ""}`}
                style={{ left: `${door.x}%`, top: `${door.y}%` }}
                onClick={(event) => {
                  if (suppressClick.current) {
                    event.preventDefault();
                    event.stopPropagation();
                  }
                  suppressClick.current = false;
                }}
                onFocus={() => setActive(door.id)}
                onBlur={() => setActive(null)}
                onMouseEnter={() => setActive(door.id)}
                onMouseLeave={() => setActive(null)}
                onTouchStart={() => setActive(door.id)}
                aria-label={`进入${door.title}：${door.note}`}
              >
                <span className="moon-hotspot-name">{door.title}</span>
                <span className="moon-hotspot-note">{door.note}</span>
                <span className="moon-hotspot-mark" aria-hidden="true">✧</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="moon-panorama-progress" role="progressbar" aria-label="月庭全景浏览位置" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(sceneProgress)}>
          <span style={{ width: `${sceneProgress}%` }} />
        </div>
      </section>

      <div className="moon-explore-hint"><span>←</span> 左右滑动，慢慢探索这座家 <span>→</span></div>
      <footer className="moon-home-foot"><span>今天也有一处地方，为你留着灯。</span><span>✧</span></footer>
    </div>
  );
}
