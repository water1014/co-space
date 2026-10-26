import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { BackgroundLayer } from "./BackgroundLayer";
import {
  IconChat,
  IconGear,
  IconHeart,
  IconHome,
  IconSpark,
} from "../components/ui/icons";

const TABS = [
  { to: "/", label: "首页", icon: IconHome },
  { to: "/chat", label: "对话", icon: IconChat },
  { to: "/memory", label: "记忆", icon: IconSpark },
  { to: "/together", label: "共处", icon: IconHeart },
  { to: "/mit", label: "设置", icon: IconGear },
];

/**
 * App Shell：背景层 + 可滚动出口 + 底部五格。
 * 桌面上是一块浮在微光里的玻璃板，移动端是全屏。
 */
export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="relative h-full">
      <BackgroundLayer />
      <div className="relative flex h-full items-center justify-center md:p-6">
        <div
          className="relative flex h-full w-full max-w-[560px] flex-col overflow-hidden border-[var(--line)] md:h-[min(940px,94vh)] md:rounded-[40px] md:border"
          style={{
            background: "rgb(var(--glow-c) / 0.02)",
            boxShadow: "0 40px 120px -50px rgba(0,0,0,0.8)",
          }}
        >
          <main
            key={location.pathname}
            className="scroll-area fadein flex-1"
            style={{ scrollbarGutter: "stable" }}
          >
            {children}
          </main>
          <BottomNav />
        </div>
      </div>
    </div>
  );
}

function BottomNav() {
  return (
    <nav
      className="relative z-30 flex items-stretch border-t border-[var(--line)] px-2 pt-1.5"
      style={{
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
        background: "color-mix(in srgb, var(--bg) 72%, transparent)",
        backdropFilter: "blur(26px) saturate(1.6)",
        WebkitBackdropFilter: "blur(26px) saturate(1.6)",
      }}
    >
      {TABS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            `tap group relative flex flex-1 flex-col items-center gap-1 rounded-2xl py-1.5 ${
              isActive ? "text-ink" : "text-ink-faint hover:text-ink-soft"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`relative flex h-7 w-11 items-center justify-center rounded-full transition-colors duration-300 ${
                  isActive ? "bg-[var(--glass-hi)]" : ""
                }`}
              >
                <Icon width={19} height={19} strokeWidth={isActive ? 1.6 : 1.3} />
              </span>
              <span className="text-[10px] tracking-[0.06em]">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
