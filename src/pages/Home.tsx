// 月庭：全屏沉浸式横向场景，文字入口融入原画。
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLifeStore } from "../stores/lifeStore";
import { daysTogether } from "../lib/life/derive";
import { useThemeStore } from "../stores/themeStore";

const dayArtwork = `${import.meta.env.BASE_URL}日.jpg`;
const nightArtwork = `${import.meta.env.BASE_URL}夜.jpg`;
let savedMoonSceneScrollLeft = 0;

type Door = {
  id: string;
  title: string;
  en: string;
  note: string;
  to: string;
  x: number;
  y: number;
  align?: "left" | "right";
};

const dayDoors: Door[] = [
  { id: "chat", title: "同心阁", en: "LE SALON", note: "与我相见 · 聊聊此刻", to: "/chat", x: 51, y: 49 },
  { id: "memory", title: "藏忆阁", en: "LA MÉMOIRE", note: "收藏我们共同的时光", to: "/memory", x: 17, y: 29 },
  { id: "partner", title: "月下人", en: "LES RÉVEILS", note: "认识那个与你相伴的人", to: "/partner", x: 74, y: 43 },
  { id: "mit", title: "镜心", en: "LES RÉGLAGES", note: "把这里布置成喜欢的模样", to: "/mit", x: 87, y: 72, align: "right" },
];

const nightDoors: Door[] = [
  { id: "chat", title: "同心阁", en: "LE SALON", note: "与我相见 · 聊聊此刻", to: "/chat", x: 53, y: 57 },
  { id: "memory", title: "藏忆阁", en: "LA MÉMOIRE", note: "收藏我们共同的时光", to: "/memory", x: 19, y: 36 },
  { id: "partner", title: "月下人", en: "LES RÉVEILS", note: "认识那个与你相伴的人", to: "/partner", x: 75, y: 34 },
  { id: "mit", title: "镜心", en: "LES RÉGLAGES", note: "把这里布置成喜欢的模样", to: "/mit", x: 88, y: 73, align: "right" },
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
    const step = Math.max(240, Math.round(el.clientWidth * 0.62));
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
    <div className={`moon-home moon-home-immersive ${theme === "night" ? "is-night" : "is-day"}`}>
      <div className="moon-scene-viewport" ref={track} role="region" tabIndex={0}
        aria-label="月庭全景，可左右滑动探索" aria-roledescription="横向全景"
        onScroll={rememberScenePosition} onKeyDown={handleSceneKeyDown}
        onPointerDown={onPointerDown} onPointerUp={onPointerUp}
        onPointerCancel={() => { pointerStart.current = null; }}>
        <div className="moon-scene">
          <div className="moon-artwork" aria-hidden="true">
            <img key={theme} className="moon-artwork-image"
              src={theme === "night" ? nightArtwork : dayArtwork} alt="" draggable={false} />
          </div>

          <header className="moon-immersive-brand">
            <span className="moon-brand-overline">A WORLD BETWEEN US</span>
            <h1>镜花水月</h1>
            <span className="moon-brand-translation">MIRROR · FLOWER · MOON</span>
            <i aria-hidden="true" />
            <p>有些相遇，是为了在一生里，慢慢看。</p>
          </header>

          <div className="moon-immersive-date" aria-label={`相伴${days}天`}>
            <span className="moon-date-symbol">{theme === "night" ? "☾" : "✧"}</span>
            <span>{date}</span>
            <i />
            <span>相伴 {days} 天</span>
          </div>

          {doors.map((door, index) => (
            <Link key={door.id} to={door.to}
              className={`moon-hotspot moon-door-${door.id} ${door.align === "right" ? "align-right" : ""} ${active === door.id ? "is-active" : ""}`}
              style={{ left: `${door.x}%`, top: `${door.y}%`, ["--door-order" as string]: index }}
              onClick={(event) => {
                if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); }
                suppressClick.current = false;
              }}
              onFocus={() => setActive(door.id)} onBlur={() => setActive(null)}
              onMouseEnter={() => setActive(door.id)} onMouseLeave={() => setActive(null)}
              onTouchStart={() => setActive(door.id)}
              aria-label={`进入${door.title}：${door.note}`}>
              <span className="moon-door-en">{door.en}</span>
              <span className="moon-hotspot-name">{door.title}</span>
              <span className="moon-hotspot-note">{door.note}</span>
              <span className="moon-door-rule" aria-hidden="true" />
            </Link>
          ))}

          <div className="moon-immersive-footer" aria-hidden="true">
            <span>THE PLACE WE CALL HOME</span>
            <span>向右滑动，继续探索 <b>→</b></span>
          </div>
        </div>
      </div>
      <div className="moon-immersive-progress" aria-hidden="true">
        <span style={{ width: `${sceneProgress}%` }} />
      </div>
    </div>
  );
}
