import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconChevron,
  IconBook,
  IconMusic,
  IconPlay,
  IconPause,
  IconHeart,
} from "../components/ui/icons";
import { useText } from "../lib/content/useText";
import "./lounge-editorial.css";

type RoomKey = "read" | "listen" | "watch";

const ROOMS: Record<
  RoomKey,
  {
    icon: React.ComponentType<{ width?: number; height?: number }>;
    title: string;
    sub: string;
    desc: string;
    media: string;
    by: string;
    total: number;
    progress: number;
  }
> = {
  read: {
    icon: IconBook,
    title: "共读",
    sub: "同步读书",
    desc: "同一本书，同一页进度。读到心动的句子，划给彼此看。",
    media: "《小王子》",
    by: "安托万·德·圣埃克苏佩里",
    total: 96,
    progress: 32,
  },
  listen: {
    icon: IconMusic,
    title: "共听",
    sub: "同步听音频",
    desc: "同一档播客、同一首歌，让声音把两个人连在一起。",
    media: "晚安，淼淼",
    by: "宋祁 · 私房歌单",
    total: 214,
    progress: 82,
  },
  watch: {
    icon: IconPlay,
    title: "共影",
    sub: "同步观影",
    desc: "隔着屏幕一起按下播放键，吐槽和爆笑都实时同步。",
    media: "怦然心动",
    by: "2012 · 爱情 / 喜剧",
    total: 6303,
    progress: 2410,
  },
};

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function Lounge() {
  const navigate = useNavigate();
  const t = useText();
  const [open, setOpen] = useState<RoomKey | null>(null);
  const [playing, setPlaying] = useState(true);

  return (
    <div className="lounge-page px-5 pt-6 pb-10">
      <div className="lounge-heading flex items-start gap-2 pb-2 pt-1">
        <button onClick={() => navigate(-1)} aria-label="返回" className="press mt-2 text-ink-faint">
          <IconChevron width={16} height={16} className="rotate-180" />
        </button>
        <div>
          <h1 className="page-head-title text-[30px] leading-none text-ink">共读听影</h1>
          <p className="page-head-sub mt-1 text-[12.5px]">同步读书 · 听音频 · 观影</p>
        </div>
      </div>

      <p className="lounge-intro mt-5 text-[14px] leading-[1.8] text-ink-soft">
        把一个人的消遣，变成两个人的仪式。同一时刻，做同一件事，距离就短了一截。
      </p>

      {/* 三个功能入口 */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {(Object.keys(ROOMS) as RoomKey[]).map((k) => {
          const r = ROOMS[k];
          const Icon = r.icon;
          const active = open === k;
          return (
            <button
              key={k}
              onClick={() => {
                setOpen(active ? null : k);
                setPlaying(true);
              }}
              className={`lounge-room-card card tap flex flex-col items-center gap-2 rounded-3xl px-3 py-5 text-center transition-colors ${
                active ? "ring-2 ring-[var(--accent)]" : ""
              }`}
            >
              <span className="lounge-room-icon flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-deep)]">
                <Icon width={24} height={24} />
              </span>
              <p className="text-[15px] font-semibold text-ink">{r.title}</p>
              <p className="text-[11px] text-ink-faint">{r.sub}</p>
            </button>
          );
        })}
      </div>

      {/* 同步会话演示 */}
      {open ? (
        <SessionDemo
          room={ROOMS[open]}
          playing={playing}
          onToggle={() => setPlaying((v) => !v)}
          wan={t.people.wan}
          yan={t.people.yan}
        />
      ) : (
        <p className="lounge-empty mt-6 text-center text-[12px] tracking-[0.14em] text-ink-ghost">
          选择一个功能，进入同步房间
        </p>
      )}
    </div>
  );
}

/** 同步房间演示：双人在线 + 同一进度 */
function SessionDemo({
  room,
  playing,
  onToggle,
  wan,
  yan,
}: {
  room: (typeof ROOMS)[RoomKey];
  playing: boolean;
  onToggle: () => void;
  wan: string;
  yan: string;
}) {
  const mins = room.total > 600 ? Math.floor(room.total / 60) : room.total;
  const cur = Math.round((room.progress / room.total) * mins);
  const Icon = room.icon;
  return (
    <section className="lounge-session card mt-4 overflow-hidden rounded-3xl p-5">
      {/* 在线双人 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#f3ddd3] to-[#e7c4b6] text-[13px] font-semibold text-[#9c6b52]">
            {wan[0]}
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-deep)] text-[13px] font-semibold text-white">
            {yan[0]}
          </span>
        </div>
        <span className="lounge-sync flex items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--accent-deep)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          已同步
        </span>
      </div>

      {/* 媒体信息 */}
      <div className="mt-4 flex items-center gap-3">
        <span className="lounge-media-icon flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--accent-deep)]">
          <Icon width={26} height={26} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium text-ink">{room.media}</p>
          <p className="truncate text-[12px] text-ink-faint">{room.by}</p>
        </div>
      </div>

      {/* 进度条 */}
      <div className="mt-4">
        <div className="lounge-progress h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500"
            style={{ width: `${room.progress / room.total * 100}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] text-ink-faint">
          <span className="num">{room.total > 600 ? fmt(cur * 60) : `${cur} 页`}</span>
          <span className="num">
            {room.total > 600 ? fmt(mins * 60) : `${mins} 页`}
          </span>
        </div>
      </div>

      {/* 控制 */}
      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          onClick={onToggle}
          aria-label={playing ? "暂停" : "播放"}
          className="lounge-play tap flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-md shadow-[var(--accent-soft)]"
        >
          {playing ? <IconPause width={18} height={18} /> : <IconPlay width={18} height={18} />}
        </button>
        <p className="flex items-center gap-1 text-[12px] text-ink-faint">
          <IconHeart width={13} height={13} className="text-[var(--accent)]" />
          两人进度一致
        </p>
      </div>
    </section>
  );
}
