import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import type { ReactNode, SVGProps } from "react";
import { BackgroundLayer } from "./BackgroundLayer";
import { IconGear, IconSpark } from "../components/ui/icons";
import { BeautifyPanel } from "../components/ui/BeautifyPanel";

/**
 * 底部 dock：设置 / 美化。只在首页出现；进入子页即隐藏。
 * 页面切换做「推入 / 弹出」转场，并记住每页滚动位置，接近手机原生。
 */
type TabDef =
  | { kind: "route"; to: string; label: string; icon: TabIcon }
  | { kind: "action"; action: "beauty"; label: string; icon: TabIcon };

const TAB_DEFS: TabDef[] = [
  { kind: "route", to: "/mit", label: "设置", icon: IconGear },
  { kind: "action", action: "beauty", label: "美化", icon: IconSpark },
];

const depthOf = (p: string) => p.split("/").filter(Boolean).length;

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [beauty, setBeauty] = useState(false);
  const isHome = location.pathname === "/";

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
            className={`scroll-area min-h-0 flex-1 ${isHome ? "pb-24" : "pb-0"} ${dir}`}
          >
            {children}
          </main>

          {isHome && <TabBar onBeauty={() => setBeauty(true)} />}
        </div>
      </div>

      <BeautifyPanel open={beauty} onClose={() => setBeauty(false)} />
    </div>
  );
}

type TabIcon = React.ComponentType<SVGProps<SVGSVGElement> & { strokeWidth?: number }>;

/** 底部悬浮胶囊导航（参考「河床」的浮动底栏） */
function TabBar({ onBeauty }: { onBeauty: () => void }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
    >
      <div className="pocket-dock mx-auto flex w-[min(68%,320px)] items-center rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg-strong)] px-3 py-1.5 shadow-[var(--shadow-float)] backdrop-blur-2xl">
        {TAB_DEFS.map((item, i) =>
          item.kind === "route" ? (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `tap flex flex-1 flex-col items-center gap-[2px] rounded-full py-1.5 transition-colors ${
                  isActive
                    ? "bg-[var(--accent-soft)] text-[var(--accent-deep)]"
                    : "text-ink-faint hover:text-ink-soft"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon width={20} height={20} strokeWidth={isActive ? 1.8 : 1.3} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ) : (
            <button
              key={i}
              onClick={onBeauty}
              className="tap flex flex-1 flex-col items-center gap-[2px] rounded-full py-1.5 text-ink-faint transition-colors hover:text-ink-soft"
            >
              <item.icon width={20} height={20} strokeWidth={1.3} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ),
        )}
      </div>
    </nav>
  );
}
