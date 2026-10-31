import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useThemeStore } from "../stores/themeStore";
import "./home-scene.css";

const dayArtwork = `${import.meta.env.BASE_URL}日.jpg`;
const nightArtwork = `${import.meta.env.BASE_URL}夜.jpg`;

type Door = { id: string; title: string; note: string; to: string; x: number; y: number };

// 每个独立页面只出现一次；同一页面内的子功能留在房间内部。
const doors: Door[] = [
  { id: "chat", title: "同心阁", note: "与那个特别的存在相见", to: "/chat", x: 8, y: 48 },
  { id: "memory", title: "藏忆阁", note: "记忆与珍藏", to: "/memory", x: 19, y: 71 },
  { id: "album", title: "浮光相册", note: "把瞬间收进光里", to: "/album", x: 29, y: 39 },
  { id: "diary", title: "拾光日记", note: "写下今天", to: "/diary", x: 38, y: 68 },
  { id: "moments", title: "心绪片刻", note: "留下此刻心情", to: "/moments", x: 47, y: 32 },
  { id: "together", title: "共游境", note: "一起探索与成长", to: "/together", x: 56, y: 65 },
  { id: "lounge", title: "共读听影", note: "共享一段故事", to: "/lounge", x: 65, y: 39 },
  { id: "studio", title: "幻梦工坊", note: "灵感与创作", to: "/studio", x: 74, y: 70 },
  { id: "partner", title: "月下人", note: "关于彼此", to: "/partner", x: 84, y: 42 },
  { id: "mit", title: "镜心", note: "这座世界的设置", to: "/mit", x: 94, y: 67 },
  { id: "calendar", title: "月序历", note: "日历与纪念日", to: "/calendar", x: 14, y: 20 },
  { id: "travel", title: "山海行记", note: "收藏去过的远方", to: "/travel", x: 25, y: 87 },
  { id: "music", title: "听月台", note: "声音与氛围", to: "/music", x: 51, y: 87 },
  { id: "health", title: "安康录", note: "照顾自己的日常", to: "/health", x: 70, y: 17 },
  { id: "ledger", title: "清欢账", note: "日常收支", to: "/ledger", x: 80, y: 87 },
  { id: "budget", title: "共同预算", note: "计划与愿望", to: "/budget", x: 91, y: 20 },
];

let savedScrollLeft = 0;

export function Home() {
  const theme = useThemeStore((state) => state.theme);
  const track = useRef<HTMLDivElement>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    if (window.matchMedia("(max-width: 899px)").matches) {
      el.scrollLeft = savedScrollLeft > 0 ? Math.min(savedScrollLeft, max) : max * 0.38;
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
    <main className={`moon-home immersive-moon ${theme === "night" ? "is-night" : "is-day"}`}>
      <div
        className="moon-scene-viewport"
        ref={track}
        role="region"
        tabIndex={0}
        aria-label="月庭全景，左右滑动探索各个空间"
        onScroll={(event) => { savedScrollLeft = event.currentTarget.scrollLeft; }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { pointerStart.current = null; }}
      >
        <div className="moon-scene">
          <img
            className="moon-artwork-image"
            src={theme === "night" ? nightArtwork : dayArtwork}
            alt=""
            draggable={false}
          />
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
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
