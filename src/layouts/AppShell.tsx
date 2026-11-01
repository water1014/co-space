import { useEffect, useLayoutEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import type { ReactNode, SVGProps } from "react";
import { BackgroundLayer } from "./BackgroundLayer";
import { IconGear, IconHome, IconChat, IconBook, IconHeart } from "../components/ui/icons";

/** 五个常驻空间：每个入口都对应独立、明确的产品职责。 */
type TabDef = { to: string; label: string; icon: TabIcon; match: (path: string) => boolean };
const TAB_DEFS: TabDef[] = [
  { to: "/", label: "月庭", icon: IconHome, match: (p) => p === "/" },
  { to: "/chat", label: "同心阁", icon: IconChat, match: (p) => p === "/chat" },
  { to: "/memory", label: "藏忆阁", icon: IconBook, match: (p) => p.startsWith("/memory") || ["/diary", "/album", "/moments"].includes(p) },
  { to: "/partner", label: "月下人", icon: IconHeart, match: (p) => p === "/partner" },
  { to: "/mit", label: "镜心", icon: IconGear, match: (p) => p === "/mit" },
];

const depthOf = (p: string) => p.split("/").filter(Boolean).length;

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isMoonGarden = location.pathname === "/";
  const isWideLounge = location.pathname === "/lounge";
  const mainRef = useRef<HTMLElement>(null);
  const scrollMem = useRef<Record<string, number>>({});
  const prevPath = useRef(location.pathname);
  const dir = depthOf(location.pathname) > depthOf(prevPath.current) ? "page-push" : "page-pop";

  useLayoutEffect(() => {
    const el = mainRef.current;
    if (el) el.scrollTop = scrollMem.current[location.pathname] ?? 0;
  }, [location.pathname]);

  useEffect(() => {
    prevPath.current = location.pathname;
  }, [location.pathname]);

  const onScroll = () => {
    const el = mainRef.current;
    if (el) scrollMem.current[location.pathname] = el.scrollTop;
  };

  return (
    <div className={`relative h-full w-full overflow-hidden ${isMoonGarden ? "moon-garden-shell" : ""}`}>
      {!isMoonGarden && <BackgroundLayer />}
      <div className="pocket-shell relative flex h-full w-full justify-center">
        <div className={`relative flex h-full w-full ${isMoonGarden || isWideLounge ? "max-w-none" : "max-w-[600px]"} flex-col`}>
          <main
            key={location.pathname}
            ref={mainRef}
            onScroll={onScroll}
            className={`scroll-area min-h-0 flex-1 ${isMoonGarden ? "h-full overflow-hidden p-0" : "pb-24"} ${dir}`}
          >
            {children}
          </main>
          {!isMoonGarden && <TabBar />}
        </div>
      </div>
    </div>
  );
}

type TabIcon = React.ComponentType<SVGProps<SVGSVGElement> & { strokeWidth?: number }>;

/** 底部悬浮胶囊导航（仅在房间页面显示；月庭由场景入口承担导航） */
function TabBar() {
  const location = useLocation();
  return (
    <nav aria-label="主导航" className="fixed inset-x-0 bottom-0 z-40" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}>
      <div className="pocket-dock mx-auto flex w-[min(94%,420px)] items-center rounded-[26px] border border-[var(--glass-border)] bg-[var(--glass-bg-strong)] px-1.5 py-1.5 shadow-[var(--shadow-float)] backdrop-blur-2xl">
        {TAB_DEFS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === "/"}
            aria-current={item.match(location.pathname) ? "page" : undefined}
            className={({ isActive }) => {
              const active = item.match(location.pathname) || isActive;
              return `tap flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[19px] py-2 transition-all duration-300 ${active ? "bg-[var(--accent-soft)] text-[var(--accent-deep)]" : "text-ink-faint hover:text-ink-soft"}`;
            }}>
            {({ isActive }) => {
              const active = item.match(location.pathname) || isActive;
              return <><item.icon width={20} height={20} strokeWidth={active ? 1.8 : 1.35} /><span className="text-[10px] font-medium">{item.label}</span></>;
            }}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
