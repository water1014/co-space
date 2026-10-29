import { NavLink, useLocation } from "react-router-dom";
import type { ReactNode, SVGProps } from "react";
import { BackgroundLayer } from "./BackgroundLayer";
import { IconHome, IconHeart, IconUser } from "../components/ui/icons";

/**
 * 底部三栏导航：主页 / 共处 / 我。
 * 其余页面（聊天 / 日记 / 记忆）走首页左上汉堡拉出的侧边栏。
 */
const TAB_DEFS = [
  { to: "/", label: "主页", icon: IconHome },
  { to: "/together", label: "共处", icon: IconHeart },
  { to: "/mit", label: "我", icon: IconUser },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="relative h-full w-full overflow-hidden">
      <BackgroundLayer />

      <div className="relative flex h-full w-full justify-center">
        <div className="relative flex h-full w-full max-w-[600px] flex-col">
          <main
            key={location.pathname}
            className="scroll-area fadein min-h-0 flex-1 pb-24"
          >
            {children}
          </main>

          <TabBar tabs={[...TAB_DEFS]} />
        </div>
      </div>
    </div>
  );
}

type TabItem = {
  to: string;
  label: string;
  icon: React.ComponentType<SVGProps<SVGSVGElement> & { strokeWidth?: number }>;
};

/** 底部三栏导航条 */
function TabBar({ tabs }: { tabs: TabItem[] }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--surface)]/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-[600px]">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `tap flex flex-1 flex-col items-center gap-[3px] py-2.5 ${
                isActive
                  ? "text-[var(--accent)]"
                  : "text-ink-faint hover:text-ink-soft"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon width={22} height={22} strokeWidth={isActive ? 1.8 : 1.3} />
                <span className="tab-label">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
