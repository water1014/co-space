import { Link, NavLink } from "react-router-dom";
import { usePresenceStore } from "../../stores/presenceStore";
import { MOOD_LABEL } from "../../types";

const navItems = [
  { to: "/space", label: "共同空间", short: "空间" },
  { to: "/memory", label: "记忆回廊", short: "记忆" },
  { to: "/boundary", label: "边界", short: "边界" },
];

export function RoomHeader({ room }: { room: string }) {
  const statusLine = usePresenceStore((s) => s.statusLine);
  const mood = usePresenceStore((s) => s.mood);

  return (
    <header className="relative z-20 flex items-center justify-between gap-6 px-6 py-5 sm:px-10">
      <div className="flex min-w-0 items-baseline gap-3">
        <Link
          to="/"
          className="shrink-0 text-[10px] tracking-[0.24em] text-faint/70 uppercase transition-colors hover:text-paper/70"
        >
          门廊
        </Link>
        <span className="hidden h-px w-4 shrink-0 bg-white/12 sm:block" />
        <span className="hidden truncate text-[11px] tracking-[0.16em] text-muted/70 sm:inline">
          {room}
        </span>
      </div>

      <p className="hidden min-w-0 flex-1 truncate text-center text-[11px] text-muted/65 md:block">
        {statusLine}
        <span className="ml-2 text-faint/40">· {MOOD_LABEL[mood]}</span>
      </p>

      <nav className="flex shrink-0 items-center gap-5 sm:gap-6">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `text-[11px] tracking-[0.12em] transition-colors ${
                isActive ? "text-paper/85" : "text-faint/60 hover:text-paper/60"
              }`
            }
          >
            <span className="sm:hidden">{item.short}</span>
            <span className="hidden sm:inline">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
