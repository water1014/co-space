import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useThemeStore } from "../stores/themeStore";
import "./home-scene.css";

const dayArtwork = `${import.meta.env.BASE_URL}日.jpg`;
const nightArtwork = `${import.meta.env.BASE_URL}夜.jpg`;

type Place = { id: string; title: string; to: string; x: number; y: number; side?: "left" | "right" };
const places: Place[] = [
  { id: "chat", title: "同心阁", to: "/chat", x: 8, y: 48 },
  { id: "memory", title: "藏忆阁", to: "/memory", x: 18, y: 70 },
  { id: "album", title: "浮光相册", to: "/album", x: 29, y: 39 },
  { id: "diary", title: "拾光日记", to: "/diary", x: 38, y: 69 },
  { id: "moments", title: "心绪片刻", to: "/moments", x: 47, y: 27 },
  { id: "together", title: "共游境", to: "/together", x: 56, y: 62 },
  { id: "lounge", title: "共读听影", to: "/lounge", x: 65, y: 37 },
  { id: "studio", title: "幻梦工坊", to: "/studio", x: 74, y: 68 },
  { id: "partner", title: "月下人", to: "/partner", x: 84, y: 43 },
  { id: "mit", title: "镜心", to: "/mit", x: 93, y: 68, side: "right" },
  { id: "calendar", title: "月序历", to: "/calendar", x: 13, y: 18 },
  { id: "travel", title: "山海行记", to: "/travel", x: 25, y: 88 },
  { id: "music", title: "听月台", to: "/music", x: 51, y: 88 },
  { id: "health", title: "安康录", to: "/health", x: 70, y: 16 },
  { id: "ledger", title: "清欢账", to: "/ledger", x: 80, y: 88 },
  { id: "budget", title: "共同预算", to: "/budget", x: 91, y: 17, side: "right" },
];

let savedScrollLeft = 0;

export function Home() {
  const theme = useThemeStore((state) => state.theme);
  const track = useRef<HTMLDivElement>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);

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
  };
  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStart.current) return;
    const dx = Math.abs(event.clientX - pointerStart.current.x);
    const dy = Math.abs(event.clientY - pointerStart.current.y);
    suppressClick.current = dx > 12 && dx > dy;
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
        onPointerUp={onPointerUp}
        onPointerCancel={() => { pointerStart.current = null; }}
      >
        <div className="moon-scene">
          <img
            className="moon-artwork-image"
            src={theme === "night" ? nightArtwork : dayArtwork}
            alt="镜花水月的日夜全景地图"
            draggable={false}
          />
          <svg className="moon-map-trail" viewBox="0 0 1000 562" preserveAspectRatio="none" aria-hidden="true">
            <path d="M80 270 C120 190 155 420 180 394 S270 170 290 220 S360 440 380 388 S455 120 470 152 S535 360 560 349 S620 180 650 208 S710 420 740 382 S820 200 840 242 S900 420 930 382" />
            <path className="moon-map-trail-soft" d="M130 100 C260 35 330 135 420 92 S590 55 690 88 S850 45 930 95" />
          </svg>
          {places.map((place) => (
            <Link
              key={place.id}
              to={place.to}
              className={`moon-map-place ${place.side === "right" ? "is-right" : ""}`}
              style={{ left: `${place.x}%`, top: `${place.y}%` }}
              onClick={(event) => {
                if (suppressClick.current) {
                  event.preventDefault();
                  event.stopPropagation();
                }
                suppressClick.current = false;
              }}
              aria-label={`前往${place.title}`}
            >
              <span className="moon-map-pin" aria-hidden="true"><i /></span>
              <span className="moon-map-label">{place.title}</span>
            </Link>
          ))}
          <span className="moon-map-compass" aria-hidden="true">✧</span>
        </div>
      </div>
    </main>
  );
}
