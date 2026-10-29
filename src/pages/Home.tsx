import { useEffect, useState } from "react";
import type { ComponentType, SVGProps } from "react";
import { Link, NavLink } from "react-router-dom";
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
} from "../components/ui/icons";
import { Avatar } from "../components/ui/kit";
import { useText } from "../lib/content/useText";
import { useLifeStore } from "../stores/lifeStore";
import { daysTogether } from "../lib/life/derive";
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
  return `${d.getMonth() + 1}月${d.getDate()}日 ${WEEK[d.getDay()]}`;
}

/**
 * 首页（2026-10-29 定稿草图）：
 * 顶栏时间 + 左上汉堡侧边栏；双圆形头像（淼淼 ↔ 宋祁）中间红线；
 * 主卡「他今天想对我说的话」由模型每日生成；下方音乐卡（首屏只露边缘引导下滑）；
 * 一排三个（天气 / 写日记 / 设置）；相册三图占位；底部三栏导航（AppShell）。
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

  return (
    <div className="relative flex flex-col px-5 pb-4 pt-9">
      {/* 顶栏：汉堡 + 时间 */}
      <header className="flex items-center justify-between">
        <button
          onClick={() => setSidebar(true)}
          className="tap -ml-1 flex h-9 w-9 items-center justify-center rounded-full text-ink-soft"
          aria-label="菜单"
        >
          <IconMenu width={22} height={22} />
        </button>
        <p className="num text-[13px] text-ink-soft">{time}</p>
      </header>

      {/* 草图②：左右圆形头像，中间圆角矩形（红线 + 在一起 N 天） */}
      <section className="mt-5 flex items-center justify-center gap-4">
        <AvatarBlock initial={t.people.wan[0]} name={t.people.wan} />
        <div className="glass flex h-[64px] min-w-[116px] flex-col items-center justify-center gap-0.5 rounded-2xl px-3">
          <RedThread />
          <p className="num text-[11.5px] text-ink-soft">
            在一起{" "}
            <span className="font-semibold text-[var(--accent)]">{days}</span> 天
          </p>
        </div>
        <AvatarBlock initial={t.people.yan[0]} name={t.people.yan} accent />
      </section>

      {/* 修改意见：介绍/日期挪到主卡上方小字 */}
      <p className="mt-3 text-center text-[12px] text-ink-faint">
        {todayLabel()}
      </p>

      {/* 草图③：主卡（最大）——他今天想对我说的话；撑到 58vh，首屏下只露音乐卡边缘 */}
      <section className="glass mt-3 flex min-h-[58vh] flex-col rounded-3xl px-5 py-5">
        <div className="flex items-center justify-between">
          <h2 className="card-title text-ink">他今天想对我说的话</h2>
          <button
            onClick={refresh}
            disabled={loading}
            className="tap flex items-center gap-1 text-[12px] text-ink-faint disabled:opacity-50"
            aria-label="换一句"
          >
            <IconRefresh width={14} height={14} className={loading ? "animate-spin" : ""} />
            换一句
          </button>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center px-2 text-center">
          <span
            aria-hidden
            className="display select-none self-start text-[46px] leading-[0.6] text-[var(--accent)] opacity-30"
          >
            &ldquo;
          </span>
          <p className="kai mt-2 text-[20px] leading-[2] text-ink">
            {loading ? "正在想今天要对你说的话…" : msg?.text}
          </p>
          <div className="mt-4 opacity-70">
            <RedThread />
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-[var(--line)] pt-3">
          <span className="text-[12px] text-ink-faint">
            — {t.people.yan}
            {msg?.mock ? "（示例）" : ""}
          </span>
          <Link to="/chat" className="text-[13px] text-[var(--accent)]">
            去聊聊 ›
          </Link>
        </div>
      </section>

      {/* 音乐卡（首屏只露边缘，引导下滑） */}
      <MusicCard />

      {/* 一排三个：天气 / 写日记 / 设置 */}
      <div className="mt-3 grid grid-cols-3 gap-3">
        <WeatherCard />
        <QuickTile icon={IconEdit} label="写日记" sub="记下今天" to="/diary" />
        <QuickTile icon={IconGear} label="设置" sub="偏好与模型" to="/mit" />
      </div>

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

/** 天气卡：Open-Meteo（无需 key），拿不到定位就不编造 */
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
    <div className="glass flex flex-col items-center rounded-2xl px-2 py-3.5 text-center">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-deep)]">
        <IconSun width={17} height={17} />
      </span>
      <span className="mt-2 text-[13px] font-medium text-ink">天气</span>
      <span className="mt-0.5 text-[11px] leading-[1.5] text-ink-faint">
        {w.state === "ok"
          ? `${w.temp}° ${w.label}`
          : w.state === "loading"
            ? "定位中…"
            : "未连接"}
      </span>
    </div>
  );
}

/** 快捷入口小卡（与天气格同构：圆形图标 + 标题 + 副行） */
function QuickTile({
  icon: Icon,
  label,
  sub,
  to,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  sub: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="glass press flex flex-col items-center rounded-2xl px-2 py-3.5 text-center"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-deep)]">
        <Icon width={17} height={17} />
      </span>
      <span className="mt-2 text-[13px] font-medium text-ink">{label}</span>
      <span className="mt-0.5 text-[11px] leading-[1.5] text-ink-faint">{sub}</span>
    </Link>
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
            className="tap flex h-9 w-9 items-center justify-center rounded-full text-ink-soft"
            aria-label="关闭"
          >
            <IconClose width={18} height={18} />
          </button>
        </div>
        <nav className="flex-1 px-3">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `tap flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] ${
                  isActive
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-ink hover:bg-[var(--surface-2)]"
                }`
              }
            >
              <Icon width={19} height={19} />
              {label}
            </NavLink>
          ))}
        </nav>
        <p className="px-5 py-6 text-[12px] text-ink-faint">{footer}</p>
      </aside>
    </>
  );
}
