import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  IconChat,
  IconHeart,
  IconMoments,
  IconPhone,
  IconEdit,
  IconImages,
  IconStudio,
  IconLounge,
  IconMemory,
  IconCalendar,
  IconTravel,
  IconMusic,
  IconHealth,
  IconWallet,
  IconCoin,
  IconRefresh,
  IconPlay,
  IconPause,
} from "../components/ui/icons";
import { useText } from "../lib/content/useText";
import { useLifeStore } from "../stores/lifeStore";
import { daysTogether } from "../lib/life/derive";
import { getTodayMessage } from "../lib/home/todayMessage";

const WEEK = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

/* 图标底色的几组奶油渐变 */
const TILES = {
  cream: { "--tile-a": "#ffffff", "--tile-b": "#f7ece5" },
  blue: { "--tile-a": "#ffffff", "--tile-b": "#eef0f4" },
  sand: { "--tile-a": "#ffffff", "--tile-b": "#f5efe2" },
  blush: { "--tile-a": "#fbeeeb", "--tile-b": "#f3d3ce" },
  mint: { "--tile-a": "#ffffff", "--tile-b": "#e9f0e8" },
} as const;
type TileKey = keyof typeof TILES;

/**
 * 首页（小手机桌面 · 三屏纯横滑 + 留白美 · 杂志风）：
 * 第 1 屏 社交互动 / 第 2 屏 记录创作 / 第 3 屏 生活工具。
 * 每屏像翻一本杂志的内页，功能以清爽 app 图标排列，配信息卡与装饰模块。
 */
export function Home() {
  const t = useText();
  const life = useLifeStore();

  const days = daysTogether(life.anniversary);
  const since = life.anniversary?.slice(5).replace("-", ".") ?? "";
  const pending = life.todos.filter((x) => !x.done).length;

  const [page, setPage] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState("");

  const say = (s: string) => {
    setToast(s);
    window.setTimeout(() => setToast(""), 2000);
  };

  /* 每日情话（写给你的话 / 摘句碎片） */
  const [msg, setMsg] = useState<{ text: string; mock: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = () => {
    setLoading(true);
    getTodayMessage().then((m) => {
      setMsg(m);
      setLoading(false);
    });
  };
  useEffect(() => {
    let alive = true;
    setLoading(true);
    getTodayMessage().then((m) => alive && (setMsg(m), setLoading(false)));
    return () => {
      alive = false;
    };
  }, []);

  const onTrackScroll = () => {
    const el = trackRef.current;
    if (el) setPage(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div className="relative flex h-full flex-col">
      {/* 桌面：横滑三屏 */}
      <div
        ref={trackRef}
        onScroll={onTrackScroll}
        className="desk-track rise mt-1 min-h-0 flex-1"
      >
        {/* ───────── 第 1 屏：社交互动 ───────── */}
        <section className="desk-page px-6 pb-8 pt-12">
          <header className="mb-7">
            <p className="text-[12px] tracking-[0.08em] text-ink-faint">
              {`${new Date().getMonth() + 1}月${new Date().getDate()}日 ${WEEK[new Date().getDay()]}`}
            </p>
            <h1 className="serif-display mt-1 text-[34px] italic leading-[1.05] text-ink">
              Fall in love
            </h1>
          </header>

          <div className="grid grid-cols-4 gap-x-3.5 gap-y-5">
            {/* 双人头像 + 在一起时间：长方形主卡 */}
            <div className="card col-span-4 rounded-[28px] px-6 py-7 text-center">
              <div className="flex items-center justify-center gap-6">
                <MiniAvatar initial={t.people.wan[0]} name={t.people.wan} />
                <IconHeart width={18} height={18} className="text-[var(--accent)]" />
                <MiniAvatar initial={t.people.yan[0]} name={t.people.yan} accent />
              </div>
              <p className="mt-6 text-[12px] tracking-[0.34em] text-ink-faint">
                我 们 在 一 起 的 时 间
              </p>
              <p className="num mt-2 text-[58px] leading-none text-[var(--accent)]">{days}</p>
              <p className="mt-1.5 text-[11px] tracking-[0.22em] text-ink-faint">
                DAYS · SINCE {since}
              </p>
            </div>

            {/* 照片预览卡片（装饰模块） */}
            <Link to="/memory" className="card press col-span-4 overflow-hidden rounded-3xl">
              <div className="grid grid-cols-3 gap-2 p-3">
                {[
                  "from-[#f6e3dc] to-[#f0d2c8]",
                  "from-[#e9eef2] to-[#dbe5ec]",
                  "from-[#f4ecdd] to-[#eadcc2]",
                ].map((g, i) => (
                  <span
                    key={i}
                    className={`flex aspect-[4/3] items-center justify-center rounded-2xl bg-gradient-to-br ${g} text-[#b3a08f]`}
                  >
                    {i === 1 ? <IconHeart width={18} height={18} /> : <IconImages width={18} height={18} />}
                  </span>
                ))}
              </div>
              <div className="border-t border-[var(--line)] px-4 py-2.5 text-center">
                <p className="serif-display text-[12px] italic tracking-[0.06em] text-ink-soft">
                  our little world · 最近的瞬间
                </p>
              </div>
            </Link>

            {/* 四个社交入口 */}
            <AppIcon label="聊天" tile="cream" icon={<IconChat width={18} height={18} />} to="/chat" />
            <AppIcon label="情侣空间" tile="blush" icon={<IconHeart width={18} height={18} />} to="/together" />
            <AppIcon label="朋友圈" tile="blue" icon={<IconMoments width={18} height={18} />} to="/moments" />
            <AppIcon
              label="一对一"
              tile="sand"
              icon={<IconPhone width={18} height={18} />}
              onClick={() => say("正在呼叫 淼淼…（演示）")}
            />
          </div>
        </section>

        {/* ───────── 第 2 屏：记录 & 创作 ───────── */}
        <section className="desk-page px-6 pb-8 pt-12">
          <SectionHead zh="记录" en="CREATE" />
          <div className="grid grid-cols-4 gap-x-3.5 gap-y-5">
            {/* 摘抄 / 短句卡片 */}
            <section className="card col-span-4 rounded-3xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] tracking-[0.2em] text-ink-faint">摘句 · FRAGMENT</span>
                <button
                  onClick={refresh}
                  disabled={loading}
                  className="tap flex items-center gap-1 text-[12px] text-ink-faint disabled:opacity-50"
                >
                  <IconRefresh width={13} height={13} className={loading ? "animate-spin" : ""} />
                  换一句
                </button>
              </div>
              <p className="kai mt-3 min-h-[66px] text-[18px] leading-[1.9] text-ink">
                {loading ? "正在想今天要对你说的话…" : msg?.text}
              </p>
              <div className="mt-2 flex items-center justify-between border-t border-[var(--line)] pt-2.5">
                <span className="text-[12px] text-ink-faint">
                  — {t.people.yan}
                  {msg?.mock ? "（示例）" : ""}
                </span>
                <Link to="/chat" className="text-[13px] font-medium text-[var(--accent)]">
                  去聊聊 ›
                </Link>
              </div>
            </section>

            <AppIcon label="日记" tile="cream" icon={<IconEdit width={18} height={18} />} to="/diary" />
            <AppIcon label="相册" tile="blue" icon={<IconImages width={18} height={18} />} to="/memory" />
            <AppIcon label="生图室" tile="blush" icon={<IconStudio width={18} height={18} />} to="/studio" />
            <AppIcon label="共读听影" tile="mint" icon={<IconLounge width={18} height={18} />} to="/lounge" />
            <AppIcon label="记忆" tile="sand" icon={<IconMemory width={18} height={18} />} to="/memory" />
          </div>
        </section>

        {/* ───────── 第 3 屏：生活工具 ───────── */}
        <section className="desk-page px-6 pb-8 pt-12">
          <SectionHead zh="工具" en="TOOLS" />
          <div className="grid grid-cols-4 gap-x-3.5 gap-y-5">
            {/* 日程概览卡片 */}
            <div className="card col-span-4 flex items-center justify-between rounded-3xl px-5 py-5">
              <div className="flex items-end gap-3">
                <span className="serif-display text-[40px] leading-none text-ink">
                  {new Date().getDate()}
                </span>
                <div className="pb-1">
                  <p className="text-[11px] tracking-[0.16em] text-ink-faint">
                    {new Date().getFullYear()} · {WEEK[new Date().getDay()]}
                  </p>
                  <p className="num mt-0.5 text-[12px] text-[var(--accent)]">
                    在一起 {days} 天
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] tracking-[0.14em] text-ink-faint">待办</p>
                <p className="num text-[24px] leading-none text-ink">{pending}</p>
                <p className="mt-1 text-[11px] text-ink-faint">项待完成</p>
              </div>
            </div>

            <AppIcon label="日历" tile="cream" icon={<IconCalendar width={18} height={18} />} to="/calendar" />
            <AppIcon label="旅游" tile="blue" icon={<IconTravel width={18} height={18} />} to="/travel" />
            <AppIcon label="音乐" tile="blush" icon={<IconMusic width={18} height={18} />} to="/music" />
            <AppIcon label="健康" tile="mint" icon={<IconHealth width={18} height={18} />} to="/health" />
            <AppIcon label="账本" tile="sand" icon={<IconCoin width={18} height={18} />} to="/ledger" />
            <AppIcon label="额度" tile="cream" icon={<IconWallet width={18} height={18} />} to="/budget" />

            {/* 音乐小组件（同步听歌） */}
            <MusicCard />
          </div>
        </section>
      </div>

      {/* 翻页指示点 */}
      <div className="flex items-center justify-center gap-1.5 pb-3 pt-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              page === i ? "w-4 bg-[var(--accent)]" : "w-1.5 bg-[var(--line-strong)]"
            }`}
          />
        ))}
      </div>

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center">
          <p className="glass-solid rounded-full px-4 py-2 text-[12.5px] text-ink shadow-[var(--shadow-float)]">
            {toast}
          </p>
        </div>
      )}
    </div>
  );
}

/** 桌面 app 图标：squircle 瓷砖 + 标签 */
function AppIcon({
  label,
  tile,
  icon,
  to,
  onClick,
}: {
  label: string;
  tile: TileKey;
  icon: React.ReactNode;
  to?: string;
  onClick?: () => void;
}) {
  const body = (
    <>
      <span className="tile" style={TILES[tile] as React.CSSProperties}>
        {icon}
      </span>
      <span className="label">{label}</span>
    </>
  );
  if (to) {
    return (
      <Link to={to} className="app-icon tap select-none">
        {body}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className="app-icon tap select-none">
      {body}
    </button>
  );
}

/** 圆形头像（小） */
function MiniAvatar({ initial, name, accent }: { initial: string; name: string; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className={`flex h-14 w-14 items-center justify-center rounded-full text-[18px] font-semibold shadow-md ${
          accent
            ? "bg-gradient-to-br from-[var(--accent)] to-[var(--accent-deep)] text-white"
            : "bg-gradient-to-br from-[#f3ddd3] to-[#e7c4b6] text-[#9c6b52]"
        }`}
      >
        {initial}
      </span>
      <span className="text-[12px] text-ink-soft">{name}</span>
    </div>
  );
}

/** 分屏小标题（第 2/3 屏，无编号，保持留白美） */
function SectionHead({ zh, en }: { zh: string; en: string }) {
  return (
    <div className="mb-7 flex items-baseline gap-3">
      <h2 className="text-[22px] font-semibold text-ink">{zh}</h2>
      <span className="text-[11px] tracking-[0.24em] text-ink-faint">{en}</span>
    </div>
  );
}

/** 音乐播放器小组件（本地演示进度） */
function MusicCard() {
  const [playing, setPlaying] = useState(false);
  const [p, setP] = useState(38);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setP((v) => (v >= 100 ? 0 : v + 0.6)), 1000);
    return () => clearInterval(id);
  }, [playing]);

  return (
    <section className="card col-span-4 flex items-center gap-4 overflow-hidden rounded-3xl p-5">
      <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-deep)] text-white shadow-md shadow-[var(--accent-soft)]">
        <IconPlay width={19} height={19} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14.5px] font-medium text-ink">晚安，淼淼</p>
        <p className="truncate text-[12px] text-ink-faint">宋祁 · 私房歌单</p>
      </div>
      <button
        onClick={() => setPlaying((v) => !v)}
        className="tap flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[var(--surface-2)] text-ink transition-colors hover:bg-[var(--accent-soft)]"
        aria-label={playing ? "暂停" : "播放"}
      >
        {playing ? <IconPause width={17} height={17} /> : <IconPlay width={17} height={17} />}
      </button>
      <div className="absolute inset-x-0 bottom-0 h-[3px] bg-[var(--surface-2)]">
        <div className="h-full bg-[var(--accent)] transition-[width] duration-1000" style={{ width: `${p}%` }} />
      </div>
    </section>
  );
}
