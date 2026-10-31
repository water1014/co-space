import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useThemeStore } from "../stores/themeStore";
import "./home-scene.css";

const dayArtwork = `${import.meta.env.BASE_URL}日.jpg`;
const nightArtwork = `${import.meta.env.BASE_URL}夜.jpg`;

type Place = {
  id: string;
  title: string;
  en: string;
  to: string;
  x: number;
  y: number;
  level?: "major" | "minor";
  side?: "left" | "right";
};

const places: Place[] = [
  { id: "chat", title: "同心阁", en: "TOGETHER", to: "/chat", x: 8, y: 48, level: "major" },
  { id: "memory", title: "藏忆阁", en: "MEMORIES", to: "/memory", x: 18, y: 70, level: "major" },
  { id: "album", title: "浮光相册", en: "GALLERY", to: "/album", x: 29, y: 39, level: "major" },
  { id: "diary", title: "拾光日记", en: "JOURNAL", to: "/diary", x: 38, y: 69, level: "minor" },
  { id: "moments", title: "心绪片刻", en: "MOMENTS", to: "/moments", x: 47, y: 27, level: "minor" },
  { id: "together", title: "共游境", en: "JOURNEY", to: "/together", x: 56, y: 62, level: "major" },
  { id: "lounge", title: "共读听影", en: "SALON", to: "/lounge", x: 65, y: 37, level: "minor" },
  { id: "studio", title: "幻梦工坊", en: "ATELIER", to: "/studio", x: 74, y: 68, level: "major" },
  { id: "partner", title: "月下人", en: "COMPANION", to: "/partner", x: 84, y: 43, level: "major" },
  { id: "mit", title: "镜心", en: "REFLECTION", to: "/mit", x: 93, y: 68, level: "minor", side: "right" },
  { id: "calendar", title: "月序历", en: "CALENDAR", to: "/calendar", x: 13, y: 18, level: "minor" },
  { id: "travel", title: "山海行记", en: "ATLAS", to: "/travel", x: 25, y: 88, level: "minor" },
  { id: "music", title: "听月台", en: "LISTENING", to: "/music", x: 51, y: 88, level: "minor" },
  { id: "health", title: "安康录", en: "WELLNESS", to: "/health", x: 70, y: 16, level: "minor" },
  { id: "ledger", title: "清欢账", en: "LEDGER", to: "/ledger", x: 80, y: 88, level: "minor" },
  { id: "budget", title: "共同预算", en: "SHARED PLAN", to: "/budget", x: 91, y: 17, level: "minor", side: "right" },
];

let savedScrollLeft = 0;

function EntranceMark() {
  return (
    <svg className="moon-entry-mark" viewBox="0 0 34 22" aria-hidden="true">
      <path d="M1 11h8M25 11h8M17 1v4M17 17v4" />
      <path d="M17 5.5 22.5 11 17 16.5 11.5 11 17 5.5Z" />
      <circle cx="17" cy="11" r="2" />
      <path d="M5 7v8M29 7v8" />
    </svg>
  );
}

export function Home() {
  const theme = useThemeStore((state) => state.theme);
  const track = useRef<HTMLDivElement>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const dragState = useRef<{ pointerId: number; x: number; scrollLeft: number; moved: boolean } | null>(null);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    if (window.matchMedia("(max-width: 899px)").matches) {
      el.scrollLeft = savedScrollLeft > 0 ? Math.min(savedScrollLeft, max) : max * 0.36;
    }
  }, []);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerStart.current = { x: event.clientX, y: event.clientY };
    suppressClick.current = false;
    if (event.pointerType === "mouse" && event.button === 0) {
      dragState.current = { pointerId: event.pointerId, x: event.clientX, scrollLeft: event.currentTarget.scrollLeft, moved: false };
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    if (Math.abs(dx) > 4) drag.moved = true;
    if (drag.moved) event.currentTarget.scrollLeft = drag.scrollLeft - dx;
  };
  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragState.current;
    if (drag && drag.pointerId === event.pointerId) {
      suppressClick.current = drag.moved;
      dragState.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    } else if (pointerStart.current) {
      const dx = Math.abs(event.clientX - pointerStart.current.x);
      const dy = Math.abs(event.clientY - pointerStart.current.y);
      suppressClick.current = dx > 12 && dx > dy;
    }
    pointerStart.current = null;
  };

  return (
    <main className={`moon-home immersive-moon moon-world-map ${theme === "night" ? "is-night" : "is-day"}`}>
      <div
        className="moon-scene-viewport"
        ref={track}
        role="region"
        tabIndex={0}
        aria-label="镜花水月地图，左右滑动探索地点"
        onScroll={(event) => { savedScrollLeft = event.currentTarget.scrollLeft; }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { pointerStart.current = null; dragState.current = null; }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            event.currentTarget.scrollBy({ left: event.currentTarget.clientWidth * 0.72, behavior: "smooth" });
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            event.currentTarget.scrollBy({ left: -event.currentTarget.clientWidth * 0.72, behavior: "smooth" });
          }
        }}
      >
        <div className="moon-scene">
          <img className="moon-artwork-image" src={theme === "night" ? nightArtwork : dayArtwork} alt="镜花水月的日夜全景地图" draggable={false} />
          <div className="moon-map-entries">
            {places.map((place) => (
              <Link
                key={place.id}
                to={place.to}
                className={`moon-map-place ${place.level === "major" ? "is-major" : "is-minor"} ${place.side === "right" ? "is-right" : ""}`}
                style={{ left: `${place.x}%`, top: `${place.y}%` }}
                onClick={(event) => {
                  if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); }
                  suppressClick.current = false;
                }}
                aria-label={`前往${place.title}`}
              >
                <span className="moon-entry-ornament"><EntranceMark /></span>
                <span className="moon-entry-copy">
                  <span className="moon-entry-en">{place.en}</span>
                  <span className="moon-map-label">{place.title}</span>
                </span>
                <span className="moon-entry-rule" aria-hidden="true"><i /></span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
