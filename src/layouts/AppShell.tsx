import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import type { ReactNode, SVGProps } from "react";
import { BackgroundLayer } from "./BackgroundLayer";
import {
  IconEdit,
  IconMoon,
  IconGear,
  IconHeart,
  IconHome,
  IconMore,
  IconSpark,
} from "../components/ui/icons";
import { useText } from "../lib/content/useText";

/**
 * 导航：参考图式底部栏 —— 图标上、斜体衬线小标签下，
 * 选中项整体变绯红。Home / Moments / Chat / Diary / More。
 * 「More」点开底部抽屉（共处 Together 与 设置）。
 */
const TAB_DEFS = [
  { to: "/", key: "home", icon: IconHome },
  { to: "/memory", key: "moments", icon: IconSpark },
  { to: "/chat", key: "chat", icon: IconMoon },
  { to: "/diary", key: "diary", icon: IconEdit },
] as const;

const MORE_DEFS = [
  { to: "/together", key: "together", icon: IconHeart },
  { to: "/mit", key: "settings", icon: IconGear },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const t = useText();
  const TABS = TAB_DEFS.map((d) => ({ ...d, label: t.nav[d.key] }));
  const MORE_ITEMS = MORE_DEFS.map((d) => ({ ...d, label: t.nav[d.key] }));
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE_ITEMS.some((m) => m.to === location.pathname);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <BackgroundLayer />

      <div className="relative flex h-full w-full justify-center">
        <div className="relative flex h-full w-full max-w-[600px] flex-col">
          <main
            key={location.pathname}
            className="scroll-area fadein min-h-0 flex-1 pb-28"
          >
            {children}
          </main>
          <TabBar
            tabs={TABS}
            moreActive={moreActive}
            onMore={() => setMoreOpen((v) => !v)}
          />
        </div>
      </div>

      {/* More：底部抽屉 */}
      {moreOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMoreOpen(false)}
          />
          <div
            className="fixed bottom-24 left-1/2 z-50 w-[90%] max-w-sm -translate-x-1/2 rounded-3xl border border-white/10 bg-white/10 p-2 shadow-2xl backdrop-blur-xl"
            style={{
              boxShadow:
                "0 18px 50px -20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.18)",
            }}
          >
            {MORE_ITEMS.map(({ to, label, icon: Icon }) => (
              <button
                key={to}
                onClick={() => {
                  navigate(to);
                  setMoreOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-white/10"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-ink-soft">
                  <Icon width={18} height={18} />
                </span>
                <span className="text-[15px] text-ink">{label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

type TabItem = {
  to: string;
  key: string;
  label: string;
  icon: React.ComponentType<
    SVGProps<SVGSVGElement> & { strokeWidth?: number }
  >;
};

/** 参考图式底部栏：全宽玻璃条 + 斜体标签，选中变绯红。 */
function TabBar({
  tabs,
  moreActive,
  onMore,
}: {
  tabs: TabItem[];
  moreActive: boolean;
  onMore: () => void;
}) {
  const item = (active: boolean) =>
    `tap flex flex-col items-center gap-[3px] px-2 py-1.5 ${
      active ? "text-[var(--accent)]" : "text-ink-faint hover:text-ink-soft"
    }`;

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-[600px] -translate-x-1/2 border-t border-[var(--line)] bg-[var(--glass-solid)]/80 backdrop-blur-2xl"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 10px)" }}
    >
      <div className="flex items-start justify-around px-3 pt-2">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => item(isActive)}
          >
            {({ isActive }) => (
              <>
                <Icon width={20} height={20} strokeWidth={isActive ? 1.7 : 1.3} />
                <span className="tab-label">{label}</span>
              </>
            )}
          </NavLink>
        ))}
        <button onClick={onMore} className={item(moreActive)}>
          <IconMore width={20} height={20} strokeWidth={moreActive ? 1.7 : 1.3} />
          <span className="tab-label">More</span>
        </button>
      </div>
    </nav>
  );
}
