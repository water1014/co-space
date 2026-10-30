import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import type { ReactNode, SVGProps } from "react";
import { BackgroundLayer } from "./BackgroundLayer";
import { IconGear, IconSpark, IconHome, IconChat, IconBook, IconHeart } from "../components/ui/icons";
import { BeautifyPanel } from "../components/ui/BeautifyPanel";

/**
 * Persistent pocket navigation: the four daily destinations stay reachable
 * from every page; appearance controls remain one tap away.
 */
type TabDef =
  | { kind: "route"; to: string; label: string; icon: TabIcon; match: (path: string) => boolean }
  | { kind: "action"; action: "beauty"; label: string; icon: TabIcon };

const TAB_DEFS: TabDef[] = [
  { kind: "route", to: "/", label: "首页", icon: IconHome, match: (p) => p === "/" },
  { kind: "route", to: "/chat", label: "聊天", icon: IconChat, match: (p) => p.startsWith("/chat") },
  { kind: "route", to: "/diary", label: "记录", icon: IconBook, match: (p) => ["/diary", "/album", "/moments", "/memory"].includes(p) },
  { kind: "route", to: "/together", label: "共处", icon: IconHeart, match: (p) => ["/together", "/calendar", "/travel", "/music", "/health", "/ledger", "/budget", "/lounge"].includes(p) },
  { kind: "route", to: "/mit", label: "设置", icon: IconGear, match: (p) => p === "/mit" },
  { kind: "action", action: "beauty", label: "美化", icon: IconSpark },
];

const depthOf = (p: string) => p.split("/").filter(Boolean).length;

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [beauty, setBeauty] = useState(false);

  const mainRef = useRef<HTMLElement>(null);
  const scrollMem = useRef<Record<string, number>>({});
  const prevPath = useRef(location.pathname);

  // 更深 = 前进（右滑入），否则 = 返回（左滑入）
  const dir = depthOf(location.pathname) > depthOf(prevPath.current) ? "page-push" : "page-pop";

  // 切页后恢复该页上次的滚动位置
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
    <div className="relative h-full w-full overflow-hidden">
      <BackgroundLayer />

      <div className="pocket-shell relative flex h-full w-full justify-center">
        <div className="relative flex h-full w-full max-w-[600px] flex-col">
          <main
            key={location.pathname}
            ref={mainRef}
            onScroll={onScroll}
            className={`scroll-area min-h-0 flex-1 pb-24 ${dir}`}
          >
            {children}
          </main>

          <TabBar onBeauty={() => setBeauty(true)} />
        </div>
      </div>

      <BeautifyPanel open={beauty} onClose={() => setBeauty(false)} />
    </div>
  );
}

type TabIcon = React.ComponentType<SVGProps<SVGSVGElement> & { strokeWidth?: number }>;

/** 底部悬浮胶囊导航（参考「河床」的浮动底栏） */
function TabBar({ onBeauty }: { onBeauty: () => void }) {
  const location = useLocation();
  return (
    <nav
      aria-label="主导航"
      className="fixed inset-x-0 bottom-0 z-40"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
    >
      <div className="pocket-dock mx-auto flex w-[min(94%,420px)] items-center rounded-[26px] border border-[var(--glass-border)] bg-[var(--glass-bg-strong)] px-1.5 py-1.5 shadow-[var(--shadow-float)] backdrop-blur-2xl">
        {TAB_DEFS.map((item, i) =>
          item.kind === "route" ? (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              aria-current={item.match(location.pathname) ? "page" : undefined}
              className={({ isActive }) => {
                const active = item.match(location.pathname) || isActive;
                return `tap flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[19px] py-2 transition-all duration-300 ${
                  active ? "bg-[var(--accent-soft)] text-[var(--accent-deep)]" : "text-ink-faint hover:text-ink-soft"
                }`;
              }}
            >
              {({ isActive }) => {
                const active = item.match(location.pathname) || isActive;
                return (
                  <>
                    <item.icon width={19} height={19} strokeWidth={active ? 1.9 : 1.35} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </>
                );
              }}
            </NavLink>
          ) : (
            <button
              key={i}
              onClick={onBeauty}
              className="tap flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[19px] py-2 text-ink-faint transition-colors hover:text-ink-soft"
            >
              <item.icon width={19} height={19} strokeWidth={1.35} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ),
        )}
      </div>
    </nav>
  );
}
