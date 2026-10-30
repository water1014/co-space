import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  IconEdit,
  IconSpark,
  IconImages,
  IconFile,
  IconPlus,
  IconBowl,
  IconCoin,
  IconCup,
  IconBook,
  IconSun,
  IconPlay,
  IconPause,
  IconRefresh,
  IconHeart,
} from "../components/ui/icons";
import { useText } from "../lib/content/useText";
import { useLifeStore } from "../stores/lifeStore";
import { daysTogether, todayKey, todayLedger, todayBobaCount } from "../lib/life/derive";
import { getTodayMessage } from "../lib/home/todayMessage";

const WEEK = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

const CODE_MAP: Record<number, string> = {
  0: "晴", 1: "大致晴", 2: "多云", 3: "阴", 45: "雾", 48: "雾凇",
  51: "小毛雨", 53: "毛毛雨", 55: "密毛雨", 61: "小雨", 63: "中雨",
  65: "大雨", 71: "小雪", 73: "中雪", 75: "大雪", 80: "阵雨",
  82: "暴雨", 95: "雷阵雨",
};

function todayLabel(d = new Date()) {
  return `${d.getMonth() + 1}月${d.getDate()}日 ${WEEK[d.getDay()]}`;
}

/* 图标底色的几组奶油渐变：暖白粉 / 暖白蓝 / 暖白杏 / 浅绯 */
const TILES = {
  cream: { "--tile-a": "#ffffff", "--tile-b": "#f7ece5" },
  blue: { "--tile-a": "#ffffff", "--tile-b": "#eef0f4" },
  sand: { "--tile-a": "#ffffff", "--tile-b": "#f5efe2" },
  blush: { "--tile-a": "#fbeeeb", "--tile-b": "#f3d3ce" },
} as const;
type TileKey = keyof typeof TILES;

const rise = (ms: number) => ({ animationDelay: `${ms}ms` } as const);

/**
 * 首页（桌面式 · Rifugio 排版 × 杂志风）：
 * 功能像 app 图标一样摆在网格里，与纪念日卡 / 拱形照片 / 引言卡混排，
 * 横滑翻页 + 指示点，右上「编辑 / ＋」装修入口，底部 dock（AppShell）。
 */
export function Home() {
  const t = useText();
  const life = useLifeStore();

  const days = daysTogether(life.anniversary);
  const since = life.anniversary?.slice(5).replace("-", ".") ?? "";
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState("");
  const [page, setPage] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const [msg, setMsg] = useState<{ text: string; mock: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  const say = (s: string) => {
    setToast(s);
    window.setTimeout(() => setToast(""), 2200);
  };

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
    getTodayMessage().then((m) => {
      if (alive) {
        setMsg(m);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const mealCount = life.meals[todayKey()]?.length ?? 0;
  const checkinCount = mealCount + todayLedger(life.ledger).length + todayBobaCount(life.bobas);

  const onTrackScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    setPage(Math.round(el.scrollLeft / el.clientWidth));
  };

  /** 编辑态点击任何图标都只是提示，不导航 */
  const guard = (fn: () => void) => () => {
    if (editing) {
      say("装修模式：先点「完成」再使用");
      return;
    }
    fn();
  };

  return (
    <div className={`relative flex h-full flex-col ${editing ? "editing" : ""}`}>
      {/* 顶栏：日期 + 花体刊名 | 编辑/＋/美化 */}
      <header className="rise px-5 pt-9" style={rise(0)}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[12px] tracking-[0.08em] text-ink-faint">{todayLabel()}</p>
            <h1 className="serif-display mt-0.5 text-[34px] italic leading-[1.05] text-ink">
              Fall in love
            </h1>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setEditing((v) => !v)}
              className={`tap flex h-9 items-center rounded-full px-3.5 text-[12.5px] font-medium transition-colors ${
                editing
                  ? "bg-[var(--accent)] text-white"
                  : "border border-[var(--line)] bg-[var(--surface)] text-ink-soft shadow-[var(--shadow-card)]"
              }`}
            >
              {editing ? "完成" : "编辑"}
            </button>
            <button
              onClick={() => say("新小组件即将上线，先把家布置舒服")}
              className="tap flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-ink-soft shadow-[var(--shadow-card)]"
              aria-label="添加"
            >
              <IconPlus width={16} height={16} />
            </button>
            <button
              onClick={() => say("美化面板装修中，敬请期待")}
              className="tap flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-ink-soft shadow-[var(--shadow-card)]"
              aria-label="美化"
            >
              <IconSpark width={16} height={16} />
            </button>
          </div>
        </div>
      </header>

      {/* 桌面：横滑两页 */}
      <div
        ref={trackRef}
        onScroll={onTrackScroll}
        className="desk-track rise mt-3 min-h-0 flex-1"
        style={rise(80)}
      >
        {/* ── 第 1 页：家 ── */}
        <div className="desk-page px-5 pb-4">
          <div className="grid grid-cols-4 gap-x-3 gap-y-4">
            <AppIcon
              editing={editing}
              label="日记"
              tile="cream"
              icon={<IconEdit width={22} height={22} />}
              onClick={guard(() => say("日记在左下的 dock 里也可以进"))}
              to="/diary"
            />
            <AppIcon
              editing={editing}
              label="记忆"
              tile="blue"
              icon={<IconSpark width={22} height={22} />}
              onClick={guard(() => say("记忆在左下的 dock 里也可以进"))}
              to="/memory"
            />
            <Link
              to="/together"
              className="card press col-span-2 flex flex-col items-center justify-center rounded-3xl px-4 py-4 text-center"
            >
              <span className="text-[11px] tracking-[0.24em] text-ink-faint">纪念日</span>
              <span className="serif-display mt-0.5 text-[38px] leading-none text-[var(--accent)]">
                {days}
              </span>
              <span className="num mt-1 text-[11px] tracking-[0.08em] text-ink-faint">
                days since {since}
              </span>
            </Link>

            <AppIcon
              editing={editing}
              label="相册"
              tile="sand"
              icon={<IconImages width={22} height={22} />}
              onClick={guard(() => say("相册在左下的 dock 里也可以进"))}
              to="/memory"
            />
            <AppIcon
              editing={editing}
              label="待办"
              tile="cream"
              icon={<IconFile width={22} height={22} />}
              onClick={guard(() => say("待办在「共处」里记录"))}
              to="/together"
            />
            {/* 拱形照片卡：跨两行 */}
            <Link
              to="/memory"
              className="card press arch-card col-span-2 row-span-2 flex flex-col"
            >
              <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-[#f6e3dc] to-[#f0d2c8] text-[#b3a08f]">
                <IconHeart width={30} height={30} strokeWidth={1.2} />
              </div>
              <div className="bg-[var(--surface-2)] px-3 py-2 text-center">
                <p className="serif-display text-[12px] italic tracking-[0.06em] text-ink-soft">
                  our little world
                </p>
              </div>
            </Link>

            {/* 引言卡：跨两列，与拱形卡同排 */}
            <div className="card col-span-2 flex flex-col justify-center rounded-3xl px-4 py-4">
              <p className="text-[10px] font-semibold tracking-[0.24em] text-ink-faint">
                GIVE ME YOUR LOVE
              </p>
              <p className="kai mt-2 text-[16px] leading-[1.8] text-ink">{t.home.quote}</p>
              <p className="mt-1.5 text-right text-[11px] text-ink-faint">— {t.home.quoteAuthor}</p>
            </div>

            {/* 打卡速览 + 拍立得三张斜叠 */}
            <Link
              to="/together"
              className="card press col-span-4 flex items-center justify-between rounded-3xl px-5 py-4"
            >
              <div>
                <p className="text-[11px] tracking-[0.2em] text-ink-faint">DAILY · 今日</p>
                <p className="num mt-1 text-[24px] font-semibold leading-none text-ink">
                  {checkinCount}
                  <span className="ml-1.5 text-[12px] font-normal text-ink-faint">件小事已记录</span>
                </p>
              </div>
              <span className="text-[12px] font-medium text-[var(--accent)]">去记录 ›</span>
            </Link>

            <div className="col-span-4 mt-1 flex items-end justify-center">
              <div className="polaroid z-10 -rotate-6" style={{ width: "34%" }}>
                <div className="ph bg-gradient-to-br from-[#e9eef2] to-[#dbe5ec] text-[#9aa7b1]">
                  <IconImages width={20} height={20} />
                </div>
              </div>
              <div className="polaroid z-20 -mx-3 rotate-1" style={{ width: "38%" }}>
                <div className="ph bg-gradient-to-br from-[#f6e3dc] to-[#f0d2c8] text-[#b3a08f]">
                  <IconHeart width={20} height={20} />
                </div>
              </div>
              <div className="polaroid z-10 -mx-2 rotate-6" style={{ width: "34%" }}>
                <div className="ph bg-gradient-to-br from-[#f4ecdd] to-[#eadcc2] text-[#b3a08f]">
                  <IconImages width={20} height={20} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 第 2 页：工具 ── */}
        <div className="desk-page px-5 pb-4">
          <div className="grid grid-cols-4 gap-x-3 gap-y-4">
            <AppIcon
              editing={editing}
              label="三餐"
              tile="cream"
              icon={<IconBowl width={22} height={22} />}
              onClick={guard(() => say("三餐在「共处」里记录"))}
              to="/together"
            />
            <AppIcon
              editing={editing}
              label="记账"
              tile="sand"
              icon={<IconCoin width={22} height={22} />}
              onClick={guard(() => say("记账在「共处」里记录"))}
              to="/together"
            />
            <AppIcon
              editing={editing}
              label="奶茶"
              tile="blush"
              icon={<IconCup width={22} height={22} />}
              onClick={guard(() => say("奶茶在「共处」里记录"))}
              to="/together"
            />
            <AppIcon
              editing={editing}
              label="单词"
              tile="blue"
              icon={<IconBook width={22} height={22} />}
              onClick={guard(() => say("单词在「共处」里备考"))}
              to="/together"
            />

            {/* 大日期卡 + 天气卡 */}
            <div className="card col-span-2 flex flex-col items-center justify-center rounded-3xl px-4 py-5">
              <span className="serif-display text-[12px] tracking-[0.3em] text-ink-faint">
                {new Date().getFullYear()}
              </span>
              <span className="serif-display mt-1 text-[44px] leading-none text-ink">
                {new Date().getDate()}
              </span>
              <span className="mt-1.5 text-[12px] tracking-[0.2em] text-[var(--accent)]">
                {WEEK[new Date().getDay()]}
              </span>
            </div>
            <WeatherCard />

            <MusicCard />

            {/* 写给你的话（每日情话） */}
            <section className="card col-span-4 rounded-3xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] tracking-[0.24em] text-ink-faint">每日情话</span>
                <button
                  onClick={refresh}
                  disabled={loading}
                  className="tap flex items-center gap-1 text-[12px] text-ink-faint disabled:opacity-50"
                >
                  <IconRefresh width={13} height={13} className={loading ? "animate-spin" : ""} />
                  换一句
                </button>
              </div>
              <p className="kai mt-2.5 min-h-[66px] text-[17px] leading-[1.9] text-ink">
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
          </div>
        </div>
      </div>

      {/* 翻页指示点 */}
      <div className="flex items-center justify-center gap-1.5 pb-2 pt-1">
        {[0, 1].map((i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              page === i ? "w-4 bg-[var(--accent)]" : "w-1.5 bg-[var(--line-strong)]"
            }`}
          />
        ))}
      </div>

      {/* 装修提示 toast */}
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

/** 桌面 app 图标：squircle 瓷砖 + 标签，编辑态摇摆 */
function AppIcon({
  label,
  tile,
  icon,
  to,
  onClick,
  editing,
}: {
  label: string;
  tile: TileKey;
  icon: React.ReactNode;
  to?: string;
  onClick?: () => void;
  editing: boolean;
}) {
  const cls = "app-icon jiggle select-none";
  const body = (
    <>
      <span className="tile" style={TILES[tile] as React.CSSProperties}>
        {icon}
      </span>
      <span className="label">{label}</span>
    </>
  );
  if (to && !editing) {
    return (
      <Link to={to} className={cls}>
        {body}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={`${cls} tap`}>
      {body}
    </button>
  );
}

/** 天气卡（Open-Meteo，无需 key；无定位时显示占位） */
function WeatherCard() {
  const [w, setW] = useState<{ state: string; temp?: number; label?: string }>({
    state: "loading",
  });

  useEffect(() => {
    let alive = true;
    if (!("geolocation" in navigator)) {
      setW({ state: "err" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const url =
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude.toFixed(2)}` +
            `&longitude=${longitude.toFixed(2)}&current=temperature_2m,weather_code`;
          const res = await fetch(url);
          const json = (await res.json()) as {
            current?: { temperature_2m: number; weather_code: number };
          };
          if (!alive) return;
          if (json.current) {
            setW({
              state: "ok",
              temp: Math.round(json.current.temperature_2m),
              label: CODE_MAP[json.current.weather_code] ?? "未知",
            });
          } else setW({ state: "err" });
        } catch {
          if (alive) setW({ state: "err" });
        }
      },
      () => {
        if (alive) setW({ state: "err" });
      },
      { timeout: 8000, maximumAge: 600_000 },
    );
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="card col-span-2 flex flex-col items-center justify-center rounded-3xl px-4 py-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-deep)]">
        <IconSun width={19} height={19} />
      </span>
      {w.state === "ok" ? (
        <p className="num mt-2 text-[24px] leading-none text-ink">
          {w.temp}°<span className="ml-1.5 text-[12px] text-ink-faint">{w.label}</span>
        </p>
      ) : (
        <p className="num mt-2 text-[15px] leading-none text-ink-faint">
          {w.state === "loading" ? "定位中…" : "未连接定位"}
        </p>
      )}
      <p className="mt-1.5 text-[11px] text-ink-faint">今天天气</p>
    </div>
  );
}

/** 音乐播放器卡（本地演示进度） */
function MusicCard() {
  const [playing, setPlaying] = useState(false);
  const [p, setP] = useState(38);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setP((v) => (v >= 100 ? 0 : v + 0.6)), 1000);
    return () => clearInterval(id);
  }, [playing]);

  return (
    <section className="card col-span-4 overflow-hidden rounded-3xl p-5">
      <div className="flex items-center gap-4">
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
      </div>
      <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-1000"
          style={{ width: `${p}%` }}
        />
      </div>
    </section>
  );
}
