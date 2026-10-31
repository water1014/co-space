// 月庭：桌面完整铺展，手机端保留可探索的横向场景。
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useLifeStore } from "../stores/lifeStore";
import { daysTogether } from "../lib/life/derive";
import { useThemeStore } from "../stores/themeStore";

const dayArtwork = `${import.meta.env.BASE_URL}日.jpg`;
const nightArtwork = `${import.meta.env.BASE_URL}夜.jpg`;
let savedMobileScrollLeft = 0;

type Door = { id: string; title: string; en: string; note: string; to: string; x: number; y: number; align?: "right" };
const dayDoors: Door[] = [
  { id: "memory", title: "藏忆阁", en: "LA MÉMOIRE", note: "收藏我们的回忆", to: "/memory", x: 15, y: 34 },
  { id: "chat", title: "同心阁", en: "LE SALON", note: "与我说说话吧", to: "/chat", x: 52, y: 44 },
  { id: "partner", title: "月下人", en: "NOTRE HISTOIRE", note: "认识与你相伴的人", to: "/partner", x: 84, y: 64, align: "right" },
  { id: "mit", title: "镜心", en: "LES RÉGLAGES", note: "布置我们的世界", to: "/mit", x: 29, y: 73 },
];
const nightDoors: Door[] = [
  { id: "memory", title: "藏忆阁", en: "LA MÉMOIRE", note: "收藏我们的回忆", to: "/memory", x: 15, y: 34 },
  { id: "chat", title: "同心阁", en: "LE SALON", note: "与我说说话吧", to: "/chat", x: 52, y: 44 },
  { id: "partner", title: "月下人", en: "NOTRE HISTOIRE", note: "认识与你相伴的人", to: "/partner", x: 84, y: 64, align: "right" },
  { id: "mit", title: "镜心", en: "LES RÉGLAGES", note: "布置我们的世界", to: "/mit", x: 29, y: 73 },
];

export function Home() {
  const life = useLifeStore();
  const theme = useThemeStore((state) => state.theme);
  const doors = theme === "night" ? nightDoors : dayDoors;
  const days = daysTogether(life.anniversary);
  const viewport = useRef<HTMLDivElement>(null);
  const date = new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric" }).format(new Date());

  useEffect(() => {
    const el = viewport.current;
    if (!el || !window.matchMedia("(max-width: 767px)").matches) return;
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    el.scrollLeft = Math.min(savedMobileScrollLeft || max * 0.28, max);
  }, []);

  return (
    <section className={`moon-home moon-home-immersive ${theme === "night" ? "is-night" : "is-day"}`}>
      <div className="moon-scene-viewport" ref={viewport} aria-label="月庭场景">
        <div className="moon-scene">
          <img className="moon-artwork-image" src={theme === "night" ? nightArtwork : dayArtwork} alt="" draggable={false} />
          <div className="moon-artwork-shade" aria-hidden="true" />

          <header className="moon-immersive-brand">
            <span className="moon-brand-overline">A WORLD BETWEEN US</span>
            <h1>镜花水月</h1>
            <span className="moon-brand-translation">MIRROR · FLOWER · MOON</span>
            <i aria-hidden="true" />
            <p>有些相遇，<br />是为了在一生里，慢慢看。</p>
          </header>

          <div className="moon-immersive-date">
            <span className="moon-date-symbol">{theme === "night" ? "☾" : "✧"}</span>
            <span>{date}</span><i /><span>相伴 {days} 天</span>
          </div>

          <div className="moon-scene-doors">
            {doors.map((door, index) => (
              <Link key={door.id} to={door.to}
                className={`moon-hotspot moon-door-${door.id} ${door.align === "right" ? "align-right" : ""}`}
                style={{ left: `${door.x}%`, top: `${door.y}%`, ["--door-order" as string]: index }}>
                <span className="moon-door-en">{door.en}</span>
                <span className="moon-hotspot-name">{door.title}</span>
                <span className="moon-hotspot-note">{door.note} <b>→</b></span>
                <span className="moon-door-rule" aria-hidden="true" />
              </Link>
            ))}
          </div>

          <div className="moon-scene-signature">
            <span>THE PLACE WE CALL HOME</span>
            <span>一方只属于我们的天地</span>
          </div>
          <div className="moon-mobile-swipe" aria-hidden="true">轻触文字进入 · 左右滑动探索 <span>↔</span></div>
        </div>
      </div>
    </section>
  );
}
