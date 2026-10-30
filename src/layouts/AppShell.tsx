import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import type { ReactNode, SVGProps } from "react";
import { BackgroundLayer } from "./BackgroundLayer";
import { IconGear, IconSpark } from "../components/ui/icons";
import { BeautifyPanel } from "../components/ui/BeautifyPanel";

/**
 * 底部 dock：设置 / 美化。
 * 设置进入全局设置页；美化为底部弹层，一键换肤 + 日夜切换。
 * 其余页面（聊天 / 日记 / 记忆 / 共处）从首页桌面的 app 图标进入，子页自带返回。
 */
type TabDef =
  | { kind: "route"; to: string; label: string; icon: TabIcon }
  | { kind: "action"; action: "beauty"; label: string; icon: TabIcon };

const TAB_DEFS: TabDef[] = [
  { kind: "route", to: "/mit", label: "设置", icon: IconGear },
  { kind: "action", action: "beauty", label: "美化", icon: IconSpark },
];

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [beauty, setBeauty] = useState(false);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <BackgroundLayer />

      <div className="relative flex h-full w-full justify-center">
        <div className="relative flex h-full w-full max-w-[600px] flex-col">
          <main key={location.pathname} className="scroll-area fadein min-h-0 flex-1 pb-24">
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
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
    >
      <div className="mx-auto flex w-[min(64%,300px)] items-center rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg-strong)] px-3 py-1.5 shadow-[var(--shadow-float)] backdrop-blur-2xl">
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
