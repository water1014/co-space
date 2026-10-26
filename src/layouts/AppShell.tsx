import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import type { ReactNode } from "react";
import { BackgroundLayer } from "./BackgroundLayer";
import {
  IconBook,
  IconChat,
  IconGear,
  IconHeart,
  IconHome,
  IconMore,
  IconSpark,
} from "../components/ui/icons";

/**
 * 导航：固定 5 个 Tab（首页 / 记忆 / 对话 / 日记）+「更多」。
 * 「更多」点开底部抽屉，里面放 共处 与 设置，这样全部 6 个页面都可达，
 * 同时严格贴合 spec 里的 5 图标药丸（Home, Moments, Chat, Diary, More）。
 */
const TABS = [
  { to: "/", label: "首页", icon: IconHome },
  { to: "/memory", label: "记忆", icon: IconSpark },
  { to: "/chat", label: "对话", icon: IconChat },
  { to: "/diary", label: "日记", icon: IconBook },
];

const MORE_ITEMS = [
  { to: "/together", label: "共处", icon: IconHeart },
  { to: "/mit", label: "设置", icon: IconGear },
];

/**
 * App Shell：全屏暗色森林底图 + 居中内容列 + 悬浮药丸导航。
 * 桌面上内容收成一条窄列，移动端全屏。
 */
export function AppShell({ children }: { children: ReactNode }) {
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
          <PillNav moreActive={moreActive} onMore={() => setMoreOpen((v) => !v)} />
        </div>
      </div>

      {/* 更多：底部抽屉，放 共处 / 设置 */}
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

function PillNav({
  moreActive,
  onMore,
}: {
  moreActive: boolean;
  onMore: () => void;
}) {
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
      <button
        onClick={onMore}
        className={`tap group flex flex-col items-center gap-1 rounded-full px-2 py-1 ${
          moreActive ? "text-ink" : "text-ink-faint hover:text-ink-soft"
        }`}
      >
        <span
          className={`relative flex h-8 w-9 items-center justify-center rounded-full transition-colors duration-300 ${
            moreActive ? "bg-[var(--glass-hi)]" : ""
          }`}
        >
          <IconMore width={19} height={19} strokeWidth={moreActive ? 1.7 : 1.3} />
        </span>
        <span className="text-[10px] tracking-[0.04em]">更多</span>
      </button>
    </nav>
  );
}
