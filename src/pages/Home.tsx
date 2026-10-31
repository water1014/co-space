import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useLifeStore } from "../stores/lifeStore";
import { daysTogether } from "../lib/life/derive";
import { useThemeStore } from "../stores/themeStore";
import "./home-panorama.css";

const dayArtwork = `${import.meta.env.BASE_URL}日.jpg`;
const nightArtwork = `${import.meta.env.BASE_URL}夜.jpg`;
let savedMobileScrollLeft = 0;

type Feature = {
  id: string;
  name: string;
  en: string;
  room: string;
  roomNo: string;
  to: string;
  x: number;
  y: number;
  symbol: string;
  size?: "large" | "small";
};

const features: Feature[] = [
  { id: "chat", name: "传音", en: "MESSAGE", room: "同心阁", roomNo: "01", to: "/chat", x: 9, y: 39, symbol: "信", size: "large" },
  { id: "moments", name: "花间笺", en: "MOMENTS", room: "同心阁", roomNo: "01", to: "/moments", x: 15, y: 66, symbol: "笺" },
  { id: "together", name: "双栖庭", en: "OUR HOME", room: "同心阁", roomNo: "01", to: "/together", x: 21, y: 43, symbol: "庭", size: "large" },

  { id: "diary", name: "拾光日记", en: "DIARY", room: "藏忆阁", roomNo: "02", to: "/diary", x: 29, y: 30, symbol: "日", size: "large" },
  { id: "album", name: "浮光相册", en: "ALBUM", room: "藏忆阁", roomNo: "02", to: "/album", x: 35, y: 57, symbol: "影", size: "large" },
  { id: "studio", name: "幻梦工坊", en: "DREAM STUDIO", room: "藏忆阁", roomNo: "02", to: "/studio", x: 41, y: 34, symbol: "梦" },
  { id: "memory", name: "岁月藏书", en: "MEMORY", room: "藏忆阁", roomNo: "02", to: "/memory", x: 46, y: 68, symbol: "书" },
  { id: "journal", name: "月笺手账", en: "JOURNAL", room: "藏忆阁", roomNo: "02", to: "/diary", x: 52, y: 39, symbol: "月" },

  { id: "music", name: "听月台", en: "LISTEN", room: "共游境", roomNo: "03", to: "/music", x: 59, y: 24, symbol: "音", size: "large" },
  { id: "travel", name: "山海行记", en: "TRAVEL", room: "共游境", roomNo: "03", to: "/travel", x: 65, y: 57, symbol: "山", size: "large" },
  { id: "lounge", name: "共赏阁", en: "TOGETHER", room: "共游境", roomNo: "03", to: "/lounge", x: 71, y: 31, symbol: "赏" },

  { id: "calendar", name: "月序历", en: "CALENDAR", room: "流年居", roomNo: "04", to: "/calendar", x: 78, y: 64, symbol: "历", size: "large" },
  { id: "health", name: "安康录", en: "WELLNESS", room: "流年居", roomNo: "04", to: "/health", x: 83, y: 32, symbol: "安" },
  { id: "ledger", name: "用度簿", en: "LEDGER", room: "流年居", roomNo: "04", to: "/ledger", x: 88, y: 58, symbol: "账" },
  { id: "budget", name: "清欢账", en: "BUDGET", room: "流年居", roomNo: "04", to: "/budget", x: 94, y: 35, symbol: "清" },

  { id: "identity", name: "此间之人", en: "IDENTITY", room: "月下人", roomNo: "05", to: "/partner", x: 103, y: 31, symbol: "人", size: "large" },
  { id: "persona", name: "性情录", en: "PERSONA", room: "月下人", roomNo: "05", to: "/partner", x: 109, y: 62, symbol: "心" },
  { id: "milestones", name: "相伴纪", en: "MILESTONES", room: "月下人", roomNo: "05", to: "/partner", x: 115, y: 35, symbol: "纪" },
  { id: "wishes", name: "心意集", en: "OUR PROMISES", room: "月下人", roomNo: "05", to: "/partner", x: 121, y: 66, symbol: "愿" },

  { id: "appearance", name: "昼夜幻境", en: "APPEARANCE", room: "镜心", roomNo: "06", to: "/mit", x: 129, y: 28, symbol: "昼", size: "large" },
  { id: "access", name: "界域权限", en: "PERMISSIONS", room: "镜心", roomNo: "06", to: "/mit", x: 135, y: 58, symbol: "界" },
  { id: "connector", name: "灵犀接口", en: "CONNECTION", room: "镜心", roomNo: "06", to: "/mit", x: 141, y: 32, symbol: "灵" },
  { id: "engine", name: "灵枢配置", en: "SYSTEM", room: "镜心", roomNo: "06", to: "/mit", x: 147, y: 66, symbol: "枢" },
  { id: "trace", name: "心迹管理", en: "ACTIVITY", room: "镜心", roomNo: "06", to: "/mit", x: 153, y: 37, symbol: "迹" },
  { id: "backup", name: "归藏备份", en: "ARCHIVE", room: "镜心", roomNo: "06", to: "/mit", x: 159, y: 62, symbol: "藏" },
];

const rooms = [
  { no: "01", name: "同心阁", en: "THE INNER COURT", x: 15 },
  { no: "02", name: "藏忆阁", en: "THE MEMORY WING", x: 41 },
  { no: "03", name: "共游境", en: "THE SHARED GARDEN", x: 65 },
  { no: "04", name: "流年居", en: "THE HOUSE OF TIME", x: 88 },
  { no: "05", name: "月下人", en: "THE ONE BESIDE YOU", x: 112 },
  { no: "06", name: "镜心", en: "THE MIRROR ROOM", x: 145 },
];

export function Home() {
  const life = useLifeStore();
  const theme = useThemeStore((state) => state.theme);
  const days = daysTogether(life.anniversary);
  const viewport = useRef<HTMLDivElement>(null);
  const date = new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric" }).format(new Date());

  useEffect(() => {
    const el = viewport.current;
    if (!el || !window.matchMedia("(max-width: 767px)").matches) return;
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    el.scrollLeft = Math.min(savedMobileScrollLeft || 0, max);
  }, []);

  const rememberScroll = () => {
    if (viewport.current) savedMobileScrollLeft = viewport.current.scrollLeft;
  };

  return (
    <section className={`moon-home moon-home-immersive moon-home-atlas ${theme === "night" ? "is-night" : "is-day"}`}>
      <div className="moon-scene-viewport moon-atlas-viewport" ref={viewport} onScroll={rememberScroll} aria-label="月庭全景，可左右滑动探索全部功能">
        <div className="moon-scene moon-atlas-scene">
          <img className="moon-artwork-image" src={theme === "night" ? nightArtwork : dayArtwork} alt="" draggable={false} />
          <div className="moon-artwork-shade" aria-hidden="true" />

          <header className="moon-atlas-brand">
            <span className="moon-atlas-kicker">A WORLD BETWEEN US · 25 LITTLE DOORS</span>
            <h1>镜花水月</h1>
            <span className="moon-atlas-translation">MIRROR · FLOWER · MOON</span>
            <p>把日子安放在月光里。<br />每一处风景，都藏着一段生活。</p>
          </header>

          <div className="moon-atlas-date">
            <span>{theme === "night" ? "☾" : "✧"}</span>
            <time>{date}</time><i />
            <span>相伴 {days} 天</span>
          </div>

          <div className="moon-atlas-room-labels" aria-hidden="true">
            {rooms.map((room) => (
              <div className="moon-atlas-room" key={room.no} style={{ left: `${room.x / 1.65}%` }}>
                <span>{room.no} / {room.en}</span>
                <strong>{room.name}</strong>
              </div>
            ))}
          </div>

          <nav className="moon-atlas-features" aria-label="月庭全部功能">
            {features.map((feature, index) => (
              <Link
                key={feature.id}
                to={feature.to}
                className={`moon-atlas-feature ${feature.size === "large" ? "is-large" : ""}`}
                style={{ left: `${feature.x / 1.65}%`, top: `${feature.y}%`, ["--feature-order" as string]: index }}
                aria-label={`${feature.room}：${feature.name}`}
                title={`${feature.name} · ${feature.room}`}
              >
                <span className="moon-atlas-object" aria-hidden="true">
                  <span className="moon-atlas-object-ring" />
                  <span className="moon-atlas-object-glyph">{feature.symbol}</span>
                  <span className="moon-atlas-object-orbit" />
                </span>
                <span className="moon-atlas-feature-copy">
                  <small>{feature.en}</small>
                  <strong>{feature.name}</strong>
                </span>
              </Link>
            ))}
          </nav>

          <div className="moon-atlas-signature">
            <span>THE PLACE WE CALL HOME</span>
            <span>左右滑动 · 探索全部二十五处日常</span>
          </div>
        </div>
      </div>
      <div className="moon-atlas-scroll-hint" aria-hidden="true"><span /> 向左或向右滑动</div>
    </section>
  );
}
