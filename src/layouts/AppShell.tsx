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

/** 底部悬浮胶囊导航（参考「河床」的浮动底栏） */
function TabBar({ tabs }: { tabs: TabItem[] }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
    >
      <div className="mx-auto flex w-[min(88%,380px)] items-center rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg-strong)] px-2 py-1.5 shadow-[var(--shadow-float)] backdrop-blur-2xl">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
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
                <Icon width={20} height={20} strokeWidth={isActive ? 1.8 : 1.3} />
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
