import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLifeStore } from "../stores/lifeStore";
import { daysTogether } from "../lib/life/derive";

type Door = { title: string; note: string; to: string; x: number; y: number; kind: "window" | "desk" | "garden" | "record" | "portrait" | "clock" };

const doors: Door[] = [
  { title: "同心阁", note: "在月光下相见", to: "/chat", x: 48, y: 46, kind: "window" },
  { title: "云笺室", note: "写一封未寄出的信", to: "/diary", x: 18, y: 69, kind: "desk" },
  { title: "花镜园", note: "让记忆开成花", to: "/album", x: 82, y: 65, kind: "garden" },
  { title: "月声", note: "收藏此刻的声音", to: "/music", x: 64, y: 76, kind: "record" },
  { title: "月下人", note: "关于那个重要的人", to: "/mit", x: 35, y: 27, kind: "portrait" },
  { title: "月约", note: "把重要的日子留住", to: "/calendar", x: 91, y: 34, kind: "clock" },
];

export function Home() {
  const life = useLifeStore();
  const days = daysTogether(life.anniversary);
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    // 首次停在场景中段，像从宅邸中央醒来；返回时浏览器保留滚动位置。
    if (el.scrollLeft === 0 && window.matchMedia("(max-width: 640px)").matches) {
      el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) * 0.28);
    }
  }, []);

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

      <div className="moon-scene-viewport" ref={track} aria-label="月庭全景，可左右滑动探索">
        <div className="moon-scene">
          <svg className="moon-art" viewBox="0 0 1600 760" preserveAspectRatio="xMidYMid slice" role="img" aria-label="月光下的幻想宅邸、拱窗与玻璃花房">
            <defs>
              <linearGradient id="sky" x2="0" y2="1"><stop stopColor="#23384a"/><stop offset=".56" stopColor="#718b9b"/><stop offset="1" stopColor="#d4dce0"/></linearGradient>
              <linearGradient id="wall" x2="1" y2="1"><stop stopColor="#f0eee8"/><stop offset=".5" stopColor="#cbd4d6"/><stop offset="1" stopColor="#899da8"/></linearGradient>
              <linearGradient id="floor" x2="0" y2="1"><stop stopColor="#a9b9bd"/><stop offset="1" stopColor="#526a78"/></linearGradient>
              <linearGradient id="glass" x2="1" y2="1"><stop stopColor="#eaf5f5" stopOpacity=".78"/><stop offset=".5" stopColor="#9cb9c5" stopOpacity=".18"/><stop offset="1" stopColor="#fff" stopOpacity=".5"/></linearGradient>
              <radialGradient id="moon"><stop stopColor="#fff"/><stop offset=".55" stopColor="#e6edf0"/><stop offset="1" stopColor="#d5e2e7" stopOpacity="0"/></radialGradient>
              <filter id="blur"><feGaussianBlur stdDeviation="22"/></filter>
              <filter id="shadow"><feGaussianBlur stdDeviation="12"/></filter>
            </defs>
            <rect width="1600" height="760" fill="url(#sky)"/>
            <circle cx="1110" cy="150" r="130" fill="url(#moon)"/>
            <g fill="#f2f5f2" opacity=".35" filter="url(#blur)"><ellipse cx="340" cy="280" rx="360" ry="90"/><ellipse cx="1260" cy="390" rx="400" ry="100"/></g>
            <path d="M0 0H1600V590H0Z" fill="url(#wall)" opacity=".24"/>
            <path d="M0 0H1600V90H0Z" fill="#e8e9e4" opacity=".28"/>
            <path d="M0 0H1600V22H0Z" fill="#f5f1e8" opacity=".8"/>
            <g stroke="#edf0ec" strokeWidth="13" fill="url(#glass)">
              <path d="M90 570V190Q90 55 225 55Q360 55 360 190V570Z"/>
              <path d="M400 570V160Q400 20 545 20Q690 20 690 160V570Z"/>
              <path d="M920 570V160Q920 20 1065 20Q1210 20 1210 160V570Z"/>
              <path d="M1240 570V190Q1240 55 1375 55Q1510 55 1510 190V570Z"/>
            </g>
            <g stroke="#f7f7f1" strokeWidth="5" opacity=".7"><path d="M225 55V570M90 340H360M545 20V570M400 300H690M1065 20V570M920 300H1210M1375 55V570M1240 340H1510"/></g>
            <path d="M0 570H1600V760H0Z" fill="url(#floor)"/>
            <path d="M0 610Q800 560 1600 610V760H0Z" fill="#d9e0df" opacity=".2"/>
            <g opacity=".24" stroke="#f5f4ed" strokeWidth="3"><path d="M800 590L800 760M400 610L180 760M1200 610L1420 760"/></g>
            <g>
              <path d="M0 530Q90 510 180 530V590H0M1420 530Q1510 510 1600 530V590H1420" fill="#718b91"/>
              <path d="M0 550Q150 520 280 560L300 590H0M1320 560Q1450 520 1600 550V590H1320" fill="#536f75"/>
            </g>
            <g transform="translate(160 475)">
              <ellipse cx="130" cy="155" rx="180" ry="25" fill="#243d4c" opacity=".3" filter="url(#shadow)"/>
              <path d="M0 70Q0 0 75 0H190Q255 0 255 70V145H0Z" fill="#9eafb5" stroke="#e8eee9" strokeWidth="7"/>
              <path d="M22 62Q22 18 80 18H180Q230 18 230 62V110H22Z" fill="#d9e1df"/>
              <path d="M-20 115H275V155H-20Z" fill="#738c99"/>
              <path d="M18 155V205M238 155V205" stroke="#526b77" strokeWidth="13"/>
              <path d="M40 20Q80 -20 125 20" fill="none" stroke="#f5f3e9" strokeWidth="5"/>
            </g>
            <g transform="translate(710 485)">
              <ellipse cx="90" cy="145" rx="150" ry="20" fill="#263d4c" opacity=".28"/>
              <path d="M0 80Q0 40 42 40H145Q180 40 180 80V100H0Z" fill="#d9dfdc" stroke="#f5f3e9" strokeWidth="6"/>
              <path d="M-12 100H194V122H-12Z" fill="#9baeb4"/>
              <path d="M20 122V170M160 122V170" stroke="#647e89" strokeWidth="9"/>
              <path d="M50 38Q90 -8 130 38" fill="none" stroke="#f8f4e9" strokeWidth="4"/>
            </g>
            <g transform="translate(1280 470)">
              <path d="M0 180V45Q0 0 70 0Q140 0 140 45V180Z" fill="url(#glass)" stroke="#f2f3ec" strokeWidth="8"/>
              <path d="M70 0V180M0 90H140" stroke="#eaf0ed" strokeWidth="4"/>
              <g fill="#dce9df"><circle cx="35" cy="120" r="20"/><circle cx="90" cy="105" r="25"/><circle cx="112" cy="145" r="18"/></g>
              <g stroke="#6e9588" strokeWidth="5"><path d="M35 180V118M90 180V105M112 180V145"/></g>
            </g>
            <g transform="translate(520 530)">
              <path d="M0 0H110L96 75H14Z" fill="#a8b9bc" stroke="#f5f1e8" strokeWidth="5"/>
              <ellipse cx="55" cy="0" rx="55" ry="13" fill="#e5e9e4"/>
              <path d="M55 0Q10 -55 20 -90M55 0Q105 -60 90 -100M55 0Q52 -80 58 -120" fill="none" stroke="#718f83" strokeWidth="6"/>
              <g fill="#e7e2d5"><circle cx="20" cy="-90" r="17"/><circle cx="90" cy="-100" r="19"/><circle cx="58" cy="-120" r="16"/></g>
            </g>
            <g fill="#f5f2e9" opacity=".22"><path d="M0 0H1600V12H0Z"/><path d="M0 565Q800 520 1600 565V580Q800 540 0 580Z"/></g>
          </svg>

          {doors.map((door) => (
            <Link key={door.title} to={door.to} className="moon-hotspot" style={{ left: door.x + "%", top: door.y + "%" }} onFocus={() => setActive(door.title)} onBlur={() => setActive(null)} onMouseEnter={() => setActive(door.title)} onMouseLeave={() => setActive(null)} onTouchStart={() => setActive(door.title)} aria-label={`进入${door.title}`}>
              <span className={`moon-hotspot-name ${active === door.title ? "is-lit" : ""}`}>{door.title}</span>
              <span className="moon-hotspot-note">{door.note}</span>
            </Link>
          ))}
          <div className="moon-scene-caption">THE MOONLIT COURTYARD <span>·</span> 月庭</div>
        </div>
      </div>
      <div className="moon-explore-hint"><span>←</span> 左右滑动，探索这座家 <span>→</span></div>
      <div className="moon-home-foot"><span>今天也有一处地方，为你留着灯。</span><span>✧</span></div>
    </div>
  );
}
