import { NavLink, useLocation } from "react-router-dom";
import type { ReactNode, SVGProps } from "react";
import { BackgroundLayer } from "./BackgroundLayer";
import { IconHome, IconHeart, IconChat, IconGear } from "../components/ui/icons";

/**
 * 底部 dock：主页 / 共处 / 聊天 / 设置 —— 桌面式的固定四项。
 * 其余页面（日记 / 记忆 / 工具）从首页桌面的 app 图标进入。
 */
const TAB_DEFS = [
  { to: "/", label: "主页", icon: IconHome },
  { to: "/together", label: "共处", icon: IconHeart },
  { to: "/chat", label: "聊天", icon: IconChat },
  { to: "/mit", label: "设置", icon: IconGear },
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
