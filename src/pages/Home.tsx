import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  IconPlus,
} from "../components/ui/icons";
import { useText } from "../lib/content/useText";
import { useLifeStore } from "../stores/lifeStore";
import { useAlbumStore } from "../stores/albumStore";
import { daysTogether } from "../lib/life/derive";
import { getTodayMessage } from "../lib/home/todayMessage";
import { fileToDataUrl } from "../lib/img/resize";

const WEEK = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

/* 图标底色的几组奶油渐变 */
const TILES = {
  cream: { "--tile-a": "#f7f8fb", "--tile-b": "#dfe7f2" },
  blue: { "--tile-a": "#f2f6fb", "--tile-b": "#d4e2f4" },
  sand: { "--tile-a": "#f7f5fb", "--tile-b": "#e8e0f5" },
  blush: { "--tile-a": "#f8f3f7", "--tile-b": "#ead8e7" },
  mint: { "--tile-a": "#f1f7f5", "--tile-b": "#d8ebe5" },
} as const;
type TileKey = keyof typeof TILES;

/** 记住首页停在第几屏，从子页返回时原位恢复（像手机一样不重置） */
let lastHomeIndex = 0;

/**
 * 首页（小手机桌面 · 三屏纯横滑 + 留白美 · 杂志风）：
 * 第 1 屏 社交互动 / 第 2 屏 记录创作 / 第 3 屏 生活工具。
 * 每屏像翻一本杂志的内页，功能以清爽 app 图标排列，配信息卡与装饰模块。
 */
export function Home() {
  const t = useText();
  const life = useLifeStore();

  const days = daysTogether(life.anniversary);
  const pending = life.todos.filter((x) => !x.done).length;

  const [page, setPage] = useState(lastHomeIndex);
  const trackRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState("");

  // 从子页返回时恢复到上次停留的那一屏
  useLayoutEffect(() => {
    const el = trackRef.current;
    if (el && lastHomeIndex > 0) el.scrollLeft = el.clientWidth * lastHomeIndex;
  }, []);

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
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setPage(idx);
    lastHomeIndex = idx;
  };

  return (
    <div className="relative flex h-full flex-col">
      {/* 桌面：横滑三屏 */}
      <div
        ref={trackRef}
        onScroll={onTrackScroll}
        className="desk-track rise mt-1 min-h-0 flex-1"
        aria-label="首页内容，可横向滑动"
      >
        {/* ───────── 第 1 屏：社交互动 ───────── */}
        <section className="desk-page home-page home-page-cover px-5 pb-8 pt-9" aria-label="我们的日常">
          <header className="mb-7">
            <p className="home-date text-[11px] tracking-[0.16em] text-ink-faint">
              {`${new Date().getMonth() + 1}月${new Date().getDate()}日 ${WEEK[new Date().getDay()]}`}
            </p>
            <h1 className="serif-display home-wordmark mt-1 text-[38px] italic leading-[1.02] text-ink">
              镜花水月
            </h1>
          </header>

          <div className="grid grid-cols-4 gap-x-3.5 gap-y-5">
            {/* 双人头像 + days together：柔粉玻璃主卡（参考 Rifugio） */}
            <div className="soft-rose-card home-love-card col-span-4 rounded-[30px] px-6 py-8 text-center">
              <div className="flex items-center justify-center gap-5">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#f3ddd3] to-[#e7c4b6] text-[19px] font-semibold text-[#9c6b52] shadow-md ring-4 ring-white/70">
                  {t.people.wan[0]}
                </span>
                <Squiggle />
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-deep)] text-[19px] font-semibold text-white shadow-md ring-4 ring-white/70">
                  {t.people.yan[0]}
                </span>
              </div>
              <p className="serif-display mt-5 text-[46px] italic leading-none text-[var(--accent)]">
                {days}
              </p>
              <p className="mt-1.5 text-[13px] tracking-[0.08em] text-[#b98a90]">
                days together
              </p>
              <p className="mt-1.5 text-[11px] tracking-[0.04em] text-ink-faint">
                从 {life.anniversary ?? ""} 开始 · 含当天
              </p>
            </div>

            {/* 照片墙：可以直接放照片（不跳去记忆） */}
            <HomeAlbumCard />

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
        <section className="desk-page home-page-create px-6 pb-8 pt-12" aria-label="记录与创作">
          <SectionHead zh="记录" en="CREATE" />
          <div className="grid grid-cols-4 gap-x-3.5 gap-y-5">
            {/* 摘抄 / 短句卡片 */}
            <section className="card home-glass-card col-span-4 rounded-[26px] p-5">
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
            <AppIcon label="相册" tile="blue" icon={<IconImages width={18} height={18} />} to="/album" />
            <AppIcon label="生图室" tile="blush" icon={<IconStudio width={18} height={18} />} to="/studio" />
            <AppIcon label="共读听影" tile="mint" icon={<IconLounge width={18} height={18} />} to="/lounge" />
            <AppIcon label="记忆" tile="sand" icon={<IconMemory width={18} height={18} />} to="/memory" />
          </div>
        </section>

        {/* ───────── 第 3 屏：生活工具 ───────── */}
        <section className="desk-page home-page-tools px-6 pb-8 pt-12" aria-label="生活工具">
          <SectionHead zh="工具" en="TOOLS" />
          <div className="grid grid-cols-4 gap-x-3.5 gap-y-5">
            {/* 日程概览卡片 */}
            <div className="card home-glass-card col-span-4 flex items-center justify-between rounded-[26px] px-5 py-5">
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

      {/* 可触达的分屏导航 */}
      <nav className="home-page-indicator flex items-center justify-center gap-2 pb-3 pt-1" aria-label="首页分屏导航">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            type="button"
            aria-label={`第 ${i + 1} 屏`}
            aria-current={page === i ? "page" : undefined}
            onClick={() => {
              const el = trackRef.current;
              if (!el) return;
              el.scrollTo({ left: el.clientWidth * i, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
            }}
            className={`home-page-dot ${page === i ? "is-active" : ""}`}
          />
        ))}
        <span className="home-page-count" aria-live="polite">{page + 1} / 3</span>
      </nav>

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

/** 头像间的小波浪（参考 Rifugio 的 〜 装饰） */
function Squiggle() {
  return (
    <svg
      width="24"
      height="14"
      viewBox="0 0 24 14"
      fill="none"
      className="text-[#d98f97]"
      aria-hidden
    >
      <path
        d="M2 8.5 C5 2, 9 2, 12 8.5 S 19 15, 22 8.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
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

/** 首页照片墙：直接放照片（上传到本地相册），不跳去记忆 */
function HomeAlbumCard() {
  const photos = useAlbumStore((s) => s.photos);
  const add = useAlbumStore((s) => s.add);
  const inputRef = useRef<HTMLInputElement>(null);
  const slots = photos.slice(0, 3);

  const pick = async (files: FileList | null) => {
    if (!files) return;
    for (const f of Array.from(files).slice(0, 3)) {
      if (!f.type.startsWith("image/")) continue;
      try {
        add({ dataUrl: await fileToDataUrl(f), caption: "" });
      } catch {
        /* 忽略单张失败 */
      }
    }
  };

  return (
    <div className="card home-glass-card col-span-4 overflow-hidden rounded-[26px]">
      <div className="grid grid-cols-3 gap-2 p-3">
        {[0, 1, 2].map((i) => {
          const p = slots[i];
          return p ? (
            <Link
              key={p.id}
              to="/album"
              className="relative block aspect-[4/3] overflow-hidden rounded-2xl bg-[var(--surface-2)]"
            >
              <img src={p.dataUrl} alt="" className="h-full w-full object-cover" />
            </Link>
          ) : (
            <button
              key={i}
              onClick={() => inputRef.current?.click()}
              className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-[var(--line-strong)] text-ink-faint transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-deep)]"
            >
              <IconPlus width={17} height={17} />
              {i === 0 && <span className="text-[10px]">添加照片</span>}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between border-t border-[var(--line)] px-4 py-2.5">
        <p className="serif-display text-[12px] italic tracking-[0.06em] text-ink-soft">
          our little world · 最近的瞬间
        </p>
        <Link to="/album" className="text-[11.5px] text-ink-faint">
          全部 ›
        </Link>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void pick(e.target.files);
          e.target.value = "";
        }}
      />
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
    <section className="card home-glass-card col-span-4 flex items-center gap-4 overflow-hidden rounded-[26px] p-5">
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
