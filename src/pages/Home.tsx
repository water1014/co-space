import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useThemeStore } from "../stores/themeStore";
import "./home-scene.css";

const dayArtwork = `${import.meta.env.BASE_URL}日.jpg`;
const nightArtwork = `${import.meta.env.BASE_URL}夜.jpg`;

type Place = {
  id: string;
  title: string;
  to: string;
  x: number;
  y: number;
  level?: "major" | "minor";
  side?: "left" | "right";
};

const places: Place[] = [
  { id: "chat", title: "同心阁", to: "/chat", x: 8, y: 48, level: "major" },
  { id: "memory", title: "藏忆阁", to: "/memory", x: 18, y: 70, level: "major" },
  { id: "album", title: "浮光相册", to: "/album", x: 29, y: 39, level: "major" },
  { id: "diary", title: "拾光日记", to: "/diary", x: 38, y: 69, level: "minor" },
  { id: "moments", title: "心绪片刻", to: "/moments", x: 47, y: 27, level: "minor" },
  { id: "together", title: "共游境", to: "/together", x: 56, y: 62, level: "major" },
  { id: "lounge", title: "共读听影", to: "/lounge", x: 65, y: 37, level: "minor" },
  { id: "studio", title: "幻梦工坊", to: "/studio", x: 74, y: 68, level: "major" },
  { id: "partner", title: "月下人", to: "/partner", x: 84, y: 43, level: "major" },
  { id: "mit", title: "镜心", to: "/mit", x: 93, y: 68, level: "minor", side: "right" },
  { id: "calendar", title: "月序历", to: "/calendar", x: 13, y: 18, level: "minor" },
  { id: "travel", title: "山海行记", to: "/travel", x: 25, y: 88, level: "minor" },
  { id: "music", title: "听月台", to: "/music", x: 51, y: 88, level: "minor" },
  { id: "health", title: "安康录", to: "/health", x: 70, y: 16, level: "minor" },
  { id: "ledger", title: "清欢账", to: "/ledger", x: 80, y: 88, level: "minor" },
  { id: "budget", title: "共同预算", to: "/budget", x: 91, y: 17, level: "minor", side: "right" },
];

const PANORAMA_PROGRESS_KEY = "jinghua-home-panorama-progress";

function EntranceMark() {
  return <svg className="moon-entry-mark" viewBox="0 0 28 12" aria-hidden="true"><path d="M1 6h8m10 0h8M14 1l4 5-4 5-4-5 4-5Z" /></svg>;
}

export function Home() {
  const theme = useThemeStore((state) => state.theme);
  const track = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const artwork = useRef<HTMLImageElement>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const dragState = useRef<{ pointerId: number; x: number; scrollLeft: number; moved: boolean } | null>(null);

  useEffect(() => {
    const fitArtwork = () => {
      const viewport = track.current;
      const sceneElement = scene.current;
      const image = artwork.current;
      if (!viewport || !sceneElement || !image?.naturalWidth || !image?.naturalHeight) return;
      const naturalWidth = image.naturalWidth / image.naturalHeight * viewport.clientHeight;
      sceneElement.style.width = `${Math.max(viewport.clientWidth, naturalWidth)}px`;
    };
    fitArtwork();
    window.addEventListener("resize", fitArtwork);
    return () => window.removeEventListener("resize", fitArtwork);
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
        onScroll={(event) => { const el = event.currentTarget; const max = Math.max(0, el.scrollWidth - el.clientWidth); sessionStorage.setItem(PANORAMA_PROGRESS_KEY, String(max > 0 ? el.scrollLeft / max : 0)); }}
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
        <div className="moon-scene" ref={scene}>
          <img ref={artwork} onLoad={() => {
            const image = artwork.current;
            const viewport = track.current;
            const sceneElement = scene.current;
            if (!image || !viewport || !sceneElement) return;
            sceneElement.style.width = `${Math.max(viewport.clientWidth, image.naturalWidth / image.naturalHeight * viewport.clientHeight)}px`;
            requestAnimationFrame(() => {
              const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
              const stored = Number(sessionStorage.getItem(PANORAMA_PROGRESS_KEY));
              const progress = Number.isFinite(stored) && stored >= 0 ? Math.min(stored, 1) : 0.36;
              viewport.scrollLeft = max * progress;
            });
          }} className="moon-artwork-image" src={theme === "night" ? nightArtwork : dayArtwork} alt="镜花水月的日夜全景地图" draggable={false} />
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
                <span className="moon-map-label">{place.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
