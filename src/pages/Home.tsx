import { useLayoutEffect, useRef, useState } from "react";
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

/** 入口锚在图上"物件"的位置，双语标题贴着物件浮起（参考图那种发光热点）。 */
const places: Place[] = [
  { id: "calendar", title: "月序历", en: "Calendar", to: "/calendar", x: 12, y: 18, level: "minor" },
  { id: "chat", title: "同心阁", en: "Whisper", to: "/chat", x: 20, y: 52, level: "major" },
  { id: "memory", title: "藏忆阁", en: "Memory", to: "/memory", x: 30, y: 74, level: "major" },
  { id: "album", title: "浮光相册", en: "Album", to: "/album", x: 38, y: 44, level: "major" },
  { id: "diary", title: "拾光日记", en: "Diary", to: "/diary", x: 46, y: 70, level: "minor" },
  { id: "moments", title: "心绪片刻", en: "Moments", to: "/moments", x: 50, y: 22, level: "minor" },
  { id: "together", title: "共游境", en: "Together", to: "/together", x: 54, y: 40, level: "major" },
  { id: "lounge", title: "共读听影", en: "Lounge", to: "/lounge", x: 62, y: 38, level: "minor" },
  { id: "studio", title: "幻梦工坊", en: "Studio", to: "/studio", x: 72, y: 66, level: "major" },
  { id: "partner", title: "月下人", en: "Partner", to: "/partner", x: 82, y: 46, level: "major" },
  { id: "mit", title: "镜心", en: "Settings", to: "/mit", x: 92, y: 30, level: "minor", side: "right" },
  { id: "travel", title: "山海行记", en: "Travel", to: "/travel", x: 26, y: 86, level: "minor" },
  { id: "music", title: "听月台", en: "Music", to: "/music", x: 50, y: 88, level: "minor" },
  { id: "health", title: "安康录", en: "Health", to: "/health", x: 68, y: 16, level: "minor" },
  { id: "ledger", title: "清欢账", en: "Ledger", to: "/ledger", x: 80, y: 86, level: "minor" },
  { id: "budget", title: "共同预算", en: "Budget", to: "/budget", x: 90, y: 18, level: "minor", side: "right" },
];

const PANORAMA_PROGRESS_KEY = "jinghua-home-panorama-progress";

/** 漂浮的尘埃微光，给场景一点"梦核"景深。 */
const MOTES = [
  { l: 16, t: 24, s: 1.0, d: 0 },
  { l: 33, t: 14, s: 0.7, d: 1.6 },
  { l: 47, t: 30, s: 1.2, d: 3.1 },
  { l: 61, t: 18, s: 0.8, d: 2.2 },
  { l: 74, t: 26, s: 1.05, d: 4.0 },
  { l: 86, t: 20, s: 0.75, d: 1.1 },
  { l: 41, t: 64, s: 0.9, d: 3.6 },
  { l: 68, t: 58, s: 1.1, d: 2.7 },
];

function Hotspot({ place }: { place: Place }) {
  const above = place.y <= 22;
  return (
    <Link
      to={place.to}
      className={`moon-hotspot ${place.level === "major" ? "is-major" : "is-minor"} ${above ? "label-above" : ""} ${place.side === "right" ? "is-right" : ""}`}
      style={{ left: `${place.x}%`, top: `${place.y}%` }}
      aria-label={`前往${place.title} · ${place.en}`}
    >
      <span className="moon-hotspot__halo" aria-hidden="true" />
      <span className="moon-hotspot__dot" aria-hidden="true" />
      <span className="moon-hotspot__label">
        <span className="moon-hotspot__en">{place.en}</span>
        <span className="moon-hotspot__cn">{place.title}</span>
      </span>
    </Link>
  );
}

export function Home() {
  const theme = useThemeStore((state) => state.theme);
  const [panoramaReady, setPanoramaReady] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const artwork = useRef<HTMLImageElement>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const dragState = useRef<{ pointerId: number; x: number; scrollLeft: number; moved: boolean } | null>(null);

  const fitAndRestorePanorama = () => {
    const viewport = track.current;
    const sceneElement = scene.current;
    const image = artwork.current;
    if (!viewport || !sceneElement || !image?.naturalWidth || !image?.naturalHeight) return false;

    const naturalWidth = (image.naturalWidth / image.naturalHeight) * viewport.clientHeight;
    sceneElement.style.width = `${Math.max(viewport.clientWidth, naturalWidth)}px`;

    const stored = Number(sessionStorage.getItem(PANORAMA_PROGRESS_KEY));
    const progress =
      Number.isFinite(stored) && sessionStorage.getItem(PANORAMA_PROGRESS_KEY) !== null
        ? Math.min(Math.max(stored, 0), 1)
        : 0.36;
    const restore = () => {
      const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      viewport.scrollLeft = max * progress;
      viewport.style.setProperty("--panorama-progress", `${progress * 100}%`);
      setPanoramaReady(true);
    };
    restore();
    requestAnimationFrame(restore);
    return true;
  };

  useLayoutEffect(() => {
    if (artwork.current?.complete && artwork.current.naturalWidth) fitAndRestorePanorama();
    const fitOnResize = () => {
      const viewport = track.current;
      const previousMax = viewport ? Math.max(0, viewport.scrollWidth - viewport.clientWidth) : 0;
      const progress = previousMax > 0 && viewport ? viewport.scrollLeft / previousMax : 0;
      if (fitAndRestorePanorama() && viewport) {
        requestAnimationFrame(() => {
          const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
          viewport.scrollLeft = max * progress;
        });
      }
    };
    window.addEventListener("resize", fitOnResize);
    return () => window.removeEventListener("resize", fitOnResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyTilt = (clientX: number, clientY: number) => {
    const el = track.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = (clientX - r.left - r.width / 2) / (r.width / 2);
    const dy = (clientY - r.top - r.height / 2) / (r.height / 2);
    el.style.setProperty("--px", (dx * 14).toFixed(2));
    el.style.setProperty("--py", (dy * 9).toFixed(2));
    el.style.setProperty("--ry", (dx * 3).toFixed(2));
    el.style.setProperty("--rx", (-dy * 2.4).toFixed(2));
  };
  const resetTilt = () => {
    const el = track.current;
    if (!el) return;
    el.style.setProperty("--px", "0");
    el.style.setProperty("--py", "0");
    el.style.setProperty("--ry", "0");
    el.style.setProperty("--rx", "0");
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerStart.current = { x: event.clientX, y: event.clientY };
    suppressClick.current = false;
    if (event.pointerType === "mouse" && event.button === 0) {
      dragState.current = {
        pointerId: event.pointerId,
        x: event.clientX,
        scrollLeft: event.currentTarget.scrollLeft,
        moved: false,
      };
    }
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    applyTilt(event.clientX, event.clientY);
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
    } else if (pointerStart.current) {
      const dx = Math.abs(event.clientX - pointerStart.current.x);
      const dy = Math.abs(event.clientY - pointerStart.current.y);
      suppressClick.current = dx > 12 && dx > dy;
    }
    pointerStart.current = null;
  };

  return (
    <main
      className={`moon-home immersive-moon moon-world-map ${theme === "night" ? "is-night" : "is-day"} ${
        panoramaReady ? "panorama-ready" : "panorama-restoring"
      }`}
    >
      <div
        className="moon-scene-viewport"
        ref={track}
        role="region"
        tabIndex={0}
        aria-label="镜花水月立体小屋，左右滑动探索地点"
        onScroll={(event) => {
          const el = event.currentTarget;
          const max = Math.max(0, el.scrollWidth - el.clientWidth);
          const progress = max > 0 ? el.scrollLeft / max : 0;
          el.style.setProperty("--panorama-progress", `${progress * 100}%`);
          if (max > 0) sessionStorage.setItem(PANORAMA_PROGRESS_KEY, String(progress));
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          pointerStart.current = null;
          dragState.current = null;
        }}
        onPointerLeave={resetTilt}
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
          <div className="moon-art-stack">
            <img
              ref={artwork}
              onLoad={() => {
                fitAndRestorePanorama();
              }}
              className="moon-artwork-image moon-art-day"
              src={dayArtwork}
              alt="镜花水月日间全景"
              draggable={false}
            />
            <img
              className="moon-artwork-image moon-art-night"
              src={nightArtwork}
              alt="镜花水月夜间全景"
              draggable={false}
            />
          </div>

          <div className="moon-dust" aria-hidden="true">
            {MOTES.map((m, i) => (
              <i
                key={i}
                style={{
                  left: `${m.l}%`,
                  top: `${m.t}%`,
                  transform: `scale(${m.s})`,
                  animationDelay: `${m.d}s`,
                }}
              />
            ))}
          </div>

          <div className="moon-map-entries">
            {places.map((place) => (
              <Hotspot key={place.id} place={place} />
            ))}
          </div>
        </div>
      </div>

      <div className="moon-panorama-guide" aria-hidden="true">
        <span className="moon-panorama-guide-label">拖动 · 探索月庭</span>
        <span className="moon-panorama-guide-en">DRAG TO EXPLORE</span>
        <span className="moon-panorama-progress">
          <i />
        </span>
      </div>
    </main>
  );
}
