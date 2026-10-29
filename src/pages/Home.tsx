import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  IconMenu,
  IconRefresh,
  IconPlay,
  IconPause,
  IconImages,
  IconClose,
  IconHome,
  IconChat,
  IconEdit,
  IconSpark,
  IconHeart,
  IconGear,
  IconSun,
  IconPlus,
} from "../components/ui/icons";
import { Avatar } from "../components/ui/kit";
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

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function todayLabel(d = new Date()) {
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${WEEK[d.getDay()]}`;
}
function isoDate(d = new Date()) {
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/**
 * 首页（排布参考「河床 / Cotton」，模块取自淼淼定稿草图）：
 * 左上大标题 + 右上时间/汉堡侧边栏；
 * Hero 磨砂卡（双头像 + 红线 + 在一起 N 天大数字 + 日期）；
 * 「写给你的话」卡（模型生成）；两列：今日打卡 / 待办清单；
 * 天气通栏卡；音乐卡；相册卡；底部悬浮胶囊三栏导航。
 */
export function Home() {
  const t = useText();
  const life = useLifeStore();

  const days = daysTogether(life.anniversary);
  const [time, setTime] = useState(nowTime());
  const [msg, setMsg] = useState<{ text: string; mock: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebar, setSidebar] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setTime(nowTime()), 30_000);
    return () => clearInterval(id);
  }, []);

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

  // 今日打卡：三餐 + 记账 + 奶茶
  const mealCount = life.meals[todayKey()]?.length ?? 0;
  const checkinCount = mealCount + todayLedger(life.ledger).length + todayBobaCount(life.bobas);
  const pendingTodos = life.todos.filter((x) => !x.done).slice(0, 3);

  return (
    <div className="relative flex flex-col px-5 pb-4 pt-9">
      {/* 顶栏：左汉堡侧边栏，右上时间 */}
      <header className="flex items-center justify-between">
        <button
          onClick={() => setSidebar(true)}
          className="tap -ml-1 flex h-9 w-9 items-center justify-center rounded-full text-ink-soft"
          aria-label="菜单"
        >
          <IconMenu width={22} height={22} />
        </button>
        <p className="num text-[14px] font-semibold tracking-[0.05em] text-ink">{time}</p>
      </header>

      {/* 左上大标题（参考「Home / Fall in love」） */}
      <div className="mt-1">
        <p className="page-title">主页</p>
        <p className="mt-0.5 text-[12px] tracking-[0.06em] text-ink-faint">Fall in love</p>
      </div>

      {/* Hero 磨砂卡：双头像 + 红线 + 在一起 N 天 + 日期 */}
      <section className="glass mt-4 rounded-3xl px-5 py-6 text-center">
        <div className="flex items-center justify-center gap-7">
          <AvatarBlock initial={t.people.wan[0]} name={t.people.wan} />
          <RedThread />
          <AvatarBlock initial={t.people.yan[0]} name={t.people.yan} accent />
        </div>
        <p className="mt-4">
          <span className="num text-[56px] font-semibold leading-none text-[var(--accent)]">
            {days}
          </span>
          <span className="ml-2 text-[15px] text-ink-soft">天</span>
        </p>
        <p className="num mt-1.5 text-[12.5px] tracking-[0.1em] text-ink-faint">{isoDate()}</p>
      </section>

      {/* 他今天写的话（模型生成） */}
      <section className="glass relative mt-4 rounded-3xl p-5">
        <span className="absolute -top-3 right-5 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg-strong)] px-3 py-1 text-[11px] text-[var(--accent-deep)] backdrop-blur-xl">
          写给你的话…
        </span>
        <p className="text-[12px] text-ink-faint">他今天写的话</p>
        <p className="kai mt-2 min-h-[72px] text-[17px] leading-[2] text-ink">
          {loading ? "正在想今天要对你说的话…" : msg?.text}
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-[var(--line)] pt-3">
          <span className="text-[12px] text-ink-faint">
            — {t.people.yan}
            {msg?.mock ? "（示例）" : ""}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={refresh}
              disabled={loading}
              className="tap flex items-center gap-1 text-[12px] text-ink-faint disabled:opacity-50"
            >
              <IconRefresh width={13} height={13} className={loading ? "animate-spin" : ""} />
              换一句
            </button>
            <Link to="/chat" className="text-[13px] text-[var(--accent)]">
              去聊聊 ›
            </Link>
          </div>
        </div>
      </section>

      {/* 两列：今日打卡 / 待办清单 */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Link to="/together" className="glass press rounded-3xl p-4 text-left">
          <h3 className="text-[15px] font-semibold text-ink">今日打卡</h3>
          <p className="mt-2 text-[13px] text-ink">已记 {checkinCount} 件小事</p>
          <p className="mt-1 text-[11.5px] leading-[1.6] text-ink-faint">
            连续记录有小惊喜哦~
          </p>
          <span className="mt-2 inline-block text-[12px] text-[var(--accent)]">去记录 ›</span>
        </Link>

        <section className="glass rounded-3xl p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-ink">待办清单</h3>
            <Link
              to="/together"
              aria-label="添加待办"
              className="tap text-ink-faint hover:text-[var(--accent)]"
            >
              <IconPlus width={16} height={16} />
            </Link>
          </div>
          <ul className="mt-2 space-y-1.5">
            {pendingTodos.length === 0 ? (
              <li className="text-[12px] text-ink-faint">都清空啦，真棒</li>
            ) : (
              pendingTodos.map((td) => (
                <li key={td.id} className="flex items-center gap-2">
                  <span className="h-[14px] w-[14px] flex-none rounded-full border border-[var(--line-strong)]" />
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink">
                    {td.text}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      {/* 天气通栏卡 */}
      <WeatherCard />

      {/* 音乐卡 */}
      <MusicCard />

      {/* 相册模块 */}
      <AlbumCard />

      <footer className="mt-8">
        <p className="text-center text-[12px] text-ink-faint">{t.home.footer}</p>
      </footer>

      <Sidebar open={sidebar} onClose={() => setSidebar(false)} footer={t.home.footer} />
    </div>
  );
}

/** 头像 + 名字（左侧暖沙渐变 / 右侧品牌绯红渐变） */
function AvatarBlock({
  initial,
  name,
  accent,
}: {
  initial: string;
  name: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Avatar
        size={62}
        className={
          accent
            ? "bg-gradient-to-br from-[var(--accent)] to-[var(--accent-deep)] shadow-lg shadow-[var(--accent-soft)]"
            : "bg-gradient-to-br from-[#f6e7dc] to-[#ecd0c0] shadow-md"
        }
      >
        <span
          className={`text-[19px] font-semibold ${
            accent ? "text-white" : "text-[#9c6b52]"
          }`}
        >
          {initial}
        </span>
      </Avatar>
      <span className="text-[12.5px] font-medium text-ink-soft">{name}</span>
    </div>
  );
}

/** 你 ↔ 角色 之间的一根红线（命运感） */
function RedThread() {
  return (
    <svg width="44" height="22" viewBox="0 0 44 22" fill="none" aria-hidden>
      <path
        d="M3 11 C 13 3, 17 19, 22 11 S 35 3, 41 11"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="1 4"
      />
      <circle cx="22" cy="11" r="2.4" fill="var(--accent)" />
    </svg>
  );
}

/** 天气通栏卡：Open-Meteo（无需 key），拿不到定位就不编造 */
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
    <section className="glass mt-3 flex items-center gap-4 rounded-3xl p-4">
      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-deep)]">
        <IconSun width={20} height={20} />
      </span>
      <div className="min-w-0 flex-1">
        {w.state === "ok" ? (
          <p className="num text-[24px] leading-none text-ink">
            {w.temp}°<span className="ml-1.5 text-[13px] text-ink-faint">{w.label}</span>
          </p>
        ) : (
          <p className="num text-[18px] leading-none text-ink-faint">
            {w.state === "loading" ? "定位中…" : "--"}
          </p>
        )}
        <p className="mt-1.5 text-[12px] text-ink-faint">{todayLabel()}</p>
      </div>
    </section>
  );
}

/** 音乐卡：通栏大卡，播放态本地模拟进度 */
function MusicCard() {
  const [playing, setPlaying] = useState(false);
  const [p, setP] = useState(38);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setP((v) => (v >= 100 ? 0 : v + 0.6)), 1000);
    return () => clearInterval(id);
  }, [playing]);

  return (
    <section className="glass mt-3 overflow-hidden rounded-3xl p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-deep)] text-white">
          <IconPlay width={22} height={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-ink">晚安，淼淼</p>
          <p className="truncate text-[12px] text-ink-faint">宋祁 · 私房歌单</p>
        </div>
        <button
          onClick={() => setPlaying((v) => !v)}
          className="tap flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)] text-ink"
          aria-label={playing ? "暂停" : "播放"}
        >
          {playing ? <IconPause width={18} height={18} /> : <IconPlay width={18} height={18} />}
        </button>
      </div>
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-1000"
          style={{ width: `${p}%` }}
        />
      </div>
    </section>
  );
}

/** 相册模块：横向 3 个图片占位框 */
function AlbumCard() {
  return (
    <section className="glass mt-3 rounded-3xl p-4">
      <div className="flex items-center justify-between">
        <h2 className="card-title text-ink">相册</h2>
        <Link to="/memory" className="text-[12px] text-ink-faint">
          全部 ›
        </Link>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          "from-[#f6e3dc] to-[#f0d2c8]",
          "from-[#e9eef2] to-[#dbe5ec]",
          "from-[#f4ecdd] to-[#eadcc2]",
        ].map((g, i) => (
          <div
            key={i}
            className={`flex aspect-square items-center justify-center rounded-2xl bg-gradient-to-br ${g} text-[#b3a08f]`}
          >
            <IconImages width={24} height={24} />
          </div>
        ))}
      </div>
    </section>
  );
}

/** 左侧抽屉式侧边栏（汉堡拉出） */
function Sidebar({
  open,
  onClose,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  footer: string;
}) {
  const items = [
    { to: "/", label: "主页", icon: IconHome },
    { to: "/chat", label: "聊天", icon: IconChat },
    { to: "/diary", label: "日记", icon: IconEdit },
    { to: "/memory", label: "记忆", icon: IconSpark },
    { to: "/together", label: "共处", icon: IconHeart },
    { to: "/mit", label: "设置", icon: IconGear },
  ];
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[55] bg-black/30 backdrop-blur-[1px]"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-[60] flex h-full w-[80%] max-w-[320px] flex-col border-r border-[var(--glass-border)] bg-[var(--glass-bg-strong)] shadow-2xl backdrop-blur-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex items-center justify-between px-5 pb-4 pt-6">
          <p className="display text-[20px] text-ink">co-space</p>
          <button
            onClick={onClose}
            aria-label="关闭"
            className="tap flex h-9 w-9 items-center justify-center rounded-full text-ink-soft"
          >
            <IconClose width={20} height={20} />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {items.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] text-ink hover:bg-[var(--accent-soft)]"
            >
              <Icon width={19} height={19} className="text-ink-soft" />
              {label}
            </Link>
          ))}
        </nav>
        <p className="px-5 pb-6 pt-2 text-center text-[11.5px] text-ink-ghost">{footer}</p>
      </aside>
    </>
  );
}
