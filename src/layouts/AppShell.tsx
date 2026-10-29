import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import type { ReactNode, SVGProps } from "react";
import { BackgroundLayer } from "./BackgroundLayer";
import {
  IconEdit,
  IconGear,
  IconHeart,
  IconHome,
  IconMore,
  IconMoon,
  IconSpark,
} from "../components/ui/icons";
import { useText } from "../lib/content/useText";

/**
 * 导航：Canoe 式居中浮动胶囊底栏。
 * 主区五项：Home / Moments / Chat / Diary / More；
 * 「More」弹出底部浮层，含 Together 与 设置(Mit)。
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
            className="scroll-area fadein min-h-0 flex-1 pb-32"
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

      {/* More：底部浮层 */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setMoreOpen(false)}
        >
          <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[560px] px-4 pb-28">
            <div className="glass w-full overflow-hidden rounded-3xl p-2">
              {MORE_ITEMS.map(({ to, label, icon: Icon }) => (
                <button
                  key={to}
                  onClick={() => {
                    navigate(to);
                    setMoreOpen(false);
                  }}
                  className="press flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left hover:bg-[var(--surface-2)]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-2)] text-ink-soft">
                    <Icon width={18} height={18} />
                  </span>
                  <span className="text-[15px] text-ink">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
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

/** 居中浮动胶囊底栏：白底 + 发丝线 + 极浅阴影，选中态变墨色。 */
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
    `tap flex flex-col items-center gap-[3px] px-3.5 py-1.5 ${
      active ? "text-ink" : "text-ink-faint hover:text-ink-soft"
    }`;

  return (
    <nav
      className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="glass flex items-start gap-1 rounded-full px-2 py-1.5 shadow-[var(--shadow-float)]">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => item(isActive)}
          >
            {({ isActive }) => (
              <>
                <Icon width={21} height={21} strokeWidth={isActive ? 1.8 : 1.3} />
                <span className="tab-label">{label}</span>
              </>
            )}
          </NavLink>
        ))}
        <button onClick={onMore} className={item(moreActive)}>
          <IconMore
            width={21}
            height={21}
            strokeWidth={moreActive ? 1.8 : 1.3}
          />
          <span className="tab-label">More</span>
        </button>
      </div>
    </nav>
  );
}
