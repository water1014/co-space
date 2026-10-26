import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { BackgroundLayer } from "./BackgroundLayer";
import {
  IconBook,
  IconChat,
  IconGear,
  IconHome,
  IconSpark,
  IconHeart,
} from "../components/ui/icons";

/**
 * 导航顺序：对话 / 首页 / 记忆 / 共处 / 日记 / 设置。
 * 药丸浮在底部居中，是悬浮的，不占内容布局。
 */
const TABS = [
  { to: "/chat", label: "对话", icon: IconChat },
  { to: "/", label: "首页", icon: IconHome },
  { to: "/memory", label: "记忆", icon: IconSpark },
  { to: "/together", label: "共处", icon: IconHeart },
  { to: "/diary", label: "日记", icon: IconBook },
  { to: "/mit", label: "设置", icon: IconGear },
];

/**
 * App Shell：全屏冷色底图 + 居中内容列 + 悬浮药丸导航。
 * 桌面上内容收成一条窄列，移动端全屏。
 */
export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();

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
          <PillNav />
        </div>
      </div>
    </div>
  );
}

function PillNav() {
  return (
    <nav
      className="fixed bottom-6 left-1/2 z-50 flex w-[90%] max-w-sm -translate-x-1/2 items-center justify-between rounded-full border border-white/10 bg-white/10 px-6 py-3 shadow-2xl backdrop-blur-xl"
      style={{
        boxShadow:
          "0 18px 50px -20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.18)",
      }}
    >
      {TABS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            `tap group flex flex-col items-center gap-1 rounded-full px-2 py-1 ${
              isActive ? "text-ink" : "text-ink-faint hover:text-ink-soft"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`relative flex h-8 w-9 items-center justify-center rounded-full transition-colors duration-300 ${
                  isActive ? "bg-[var(--glass-hi)]" : ""
                }`}
              >
                <Icon width={19} height={19} strokeWidth={isActive ? 1.7 : 1.3} />
              </span>
              <span className="text-[10px] tracking-[0.04em]">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
