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
function dateNo(d = new Date()) {
  return `${String(d.getFullYear()).slice(2)}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

const rise = (ms: number) => ({ animationDelay: `${ms}ms` } as const);

/** 杂志式栏目眉题：编号 + 大写英文 + 右侧细线 */
function Kicker({ no, en }: { no: string; en: string }) {
  return (
    <div className="mag-kicker">
      <span className="no">{no}</span>
      <span>{en}</span>
      <span className="rule" />
    </div>
  );
}

/**
 * 首页 v3（杂志风 · 玻璃拟态）：
 * 刊头（Playfair 大刊名 + 期号）→ 玻璃拟态封面（超大天数）→
 * 卷首语（衬线大字 + 首字下沉）→ 写给你的话 →
 * 编号栏目：打卡 / 待办 / 天气 / 音乐 / 相册（带图说）。
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

  const mealCount = life.meals[todayKey()]?.length ?? 0;
  const checkinCount = mealCount + todayLedger(life.ledger).length + todayBobaCount(life.bobas);
  const pendingTodos = life.todos.filter((x) => !x.done).slice(0, 3);

  return (
    <div className="relative flex flex-col px-5 pb-6 pt-9">
      {/* 刊头 masthead */}
      <header className="rise" style={rise(0)}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebar(true)}
            className="tap -ml-1 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] text-ink-soft transition-colors hover:bg-[var(--surface-2)]"
            aria-label="菜单"
          >
            <IconMenu width={20} height={20} />
          </button>
          <div className="text-right">
            <p className="num text-[15px] font-semibold leading-none text-ink">{time}</p>
            <p className="mt-0.5 text-[11px] tracking-[0.12em] text-ink-faint">{todayLabel()}</p>
          </div>
        </div>

        <div className="mt-6 flex items-end justify-between">
          <div>
            <p className="serif-display text-[13px] tracking-[0.04em] text-ink-faint">
              co·space
            </p>
            <h1 className="serif-display mt-0.5 text-[36px] leading-[0.95] text-ink">
              Fall in love
            </h1>
            <p className="mt-2 text-[13px] text-ink-soft">主页 · 我们的第 {days} 天</p>
          </div>
          <p className="serif-display text-right text-[12px] leading-[1.1] text-ink-faint">
            Nº
            <br />
            {String(days).padStart(3, "0")}
          </p>
        </div>
        <div className="mt-4 h-px w-full bg-[var(--line)]" />
      </header>

      {/* 封面：玻璃拟态大卡，超大 Playfair 天数 */}
      <section
        className="glass-cover rise mt-5 px-6 py-8 text-center"
        style={rise(80)}
      >
        <div className="flex items-center justify-center gap-4">
          <AvatarBlock initial={t.people.wan[0]} name={t.people.wan} />
          <IconHeart width={17} height={17} strokeWidth={1.6} className="text-[var(--accent)]" />
          <AvatarBlock initial={t.people.yan[0]} name={t.people.yan} accent />
        </div>
        <p className="mt-6 flex items-baseline justify-center gap-2">
          <span className="serif-display text-[74px] font-medium leading-none text-[var(--accent)]">
            {days}
          </span>
          <span className="text-[13px] font-semibold tracking-[0.24em] text-ink-soft">
            DAYS
          </span>
        </p>
        <p className="mt-3 text-[12px] tracking-[0.34em] text-ink-faint">在 一 起</p>
        <p className="num mt-3 text-[12px] tracking-[0.1em] text-ink-faint">{dateNo()}</p>
      </section>

      {/* 卷首语 pull quote（衬线大字 + 首字下沉） */}
      <section className="rise mt-8" style={rise(160)}>
        <Kicker no="01" en="Manifesto" />
        <p className="mag-quote dropcap">{t.home.quote}</p>
        <p className="mt-2 text-right text-[12px] text-ink-faint">
          — {t.home.quoteAuthor}
        </p>
      </section>

      {/* 写给你的话（模型生成，信件式玻璃卡） */}
      <section className="rise mt-8" style={rise(220)}>
        <Kicker no="02" en="A Note" />
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center gap-2">
            <IconHeart width={14} height={14} strokeWidth={1.6} className="text-[var(--accent)]" />
            <span className="text-[13.5px] font-semibold text-ink">写给你的话</span>
          </div>
          <p className="kai mt-3 min-h-[76px] text-[18px] leading-[1.95] text-ink">
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
              <Link to="/chat" className="text-[13px] font-medium text-[var(--accent)]">
                去聊聊 ›
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 今日打卡 / 待办清单 */}
      <div className="rise mt-8 grid grid-cols-2 gap-3" style={rise(280)}>
        <section>
          <Kicker no="03" en="Daily" />
          <Link to="/together" className="glass press block rounded-3xl p-[18px] text-left">
            <h3 className="text-[15px] font-semibold text-ink">今日打卡</h3>
            <p className="num mt-2.5 text-[26px] font-semibold leading-none text-ink">
              {checkinCount}
            </p>
            <p className="mt-1.5 text-[12px] leading-[1.5] text-ink-faint">件小事已记录</p>
            <span className="mt-3 inline-block text-[12px] font-medium text-[var(--accent)]">
              去记录 ›
            </span>
          </Link>
        </section>

        <section>
          <Kicker no="04" en="To-do" />
          <div className="glass rounded-3xl p-[18px]">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-ink">待办清单</h3>
              <Link
                to="/together"
                aria-label="添加待办"
                className="tap flex h-6 w-6 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
              >
                <IconPlus width={15} height={15} />
              </Link>
            </div>
            <ul className="mt-3 space-y-2">
              {pendingTodos.length === 0 ? (
                <li className="text-[12px] text-ink-faint">都清空啦，真棒</li>
              ) : (
                pendingTodos.map((td) => (
                  <li key={td.id} className="flex items-center gap-2">
                    <span className="h-[13px] w-[13px] flex-none rounded-full border border-[var(--line-strong)]" />
                    <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink">
                      {td.text}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>
      </div>

      {/* 天气 */}
      <section className="rise mt-8" style={rise(340)}>
        <Kicker no="05" en="Weather" />
        <WeatherCard />
      </section>

      {/* 音乐 */}
      <section className="rise mt-8" style={rise(400)}>
        <Kicker no="06" en="Playlist" />
        <MusicCard />
      </section>

      {/* 相册 */}
      <section className="rise mt-8" style={rise(460)}>
        <Kicker no="07" en="Gallery" />
        <AlbumCard />
      </section>

      <footer className="mt-9">
        <p className="text-center text-[11.5px] tracking-[0.04em] text-ink-faint">
          {t.home.footer}
        </p>
      </footer>

      <Sidebar open={sidebar} onClose={() => setSidebar(false)} footer={t.home.footer} />
    </div>
  );
}

/** 头像 + 名字 */
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
        size={56}
        className={
          accent
            ? "bg-gradient-to-br from-[var(--accent)] to-[var(--accent-deep)] shadow-lg shadow-[var(--accent-soft)] ring-2 ring-white/70"
            : "bg-gradient-to-br from-[#f6e7dc] to-[#e9cdbd] shadow-md ring-2 ring-white/70"
        }
      >
        <span
          className={`text-[18px] font-semibold ${
            accent ? "text-white" : "text-[#9c6b52]"
          }`}
        >
          {initial}
        </span>
      </Avatar>
      <span className="text-[12px] font-medium text-ink-soft">{name}</span>
    </div>
  );
}

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
    <section className="glass flex items-center gap-4 rounded-3xl p-5">
      <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-deep)]">
        <IconSun width={22} height={22} />
      </span>
      <div className="min-w-0 flex-1">
        {w.state === "ok" ? (
          <p className="num text-[26px] leading-none text-ink">
            {w.temp}°<span className="ml-2 text-[13px] text-ink-faint">{w.label}</span>
          </p>
        ) : (
          <p className="num text-[19px] leading-none text-ink-faint">
            {w.state === "loading" ? "定位中…" : "未连接定位"}
          </p>
        )}
        <p className="mt-1.5 text-[12px] text-ink-faint">今天天气</p>
      </div>
    </section>
  );
}

function MusicCard() {
  const [playing, setPlaying] = useState(false);
  const [p, setP] = useState(38);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setP((v) => (v >= 100 ? 0 : v + 0.6)), 1000);
    return () => clearInterval(id);
  }, [playing]);

  return (
    <section className="glass overflow-hidden rounded-3xl p-5">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-deep)] text-white shadow-md shadow-[var(--accent-soft)]">
          <IconPlay width={22} height={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14.5px] font-medium text-ink">晚安，淼淼</p>
          <p className="truncate text-[12px] text-ink-faint">宋祁 · 私房歌单</p>
        </div>
        <button
          onClick={() => setPlaying((v) => !v)}
          className="tap flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)] text-ink transition-colors hover:bg-[var(--accent-soft)]"
          aria-label={playing ? "暂停" : "播放"}
        >
          {playing ? <IconPause width={18} height={18} /> : <IconPlay width={18} height={18} />}
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

/** 相册模块：三张占位 + 杂志式图说 */
function AlbumCard() {
  const caps = ["我们的日常", "未命名 · 秋", "某年某月"];
  return (
    <section className="glass rounded-3xl p-5">
      <div className="mt-1 grid grid-cols-3 gap-2.5">
        {[
          "from-[#f6e3dc] to-[#f0d2c8]",
          "from-[#e9eef2] to-[#dbe5ec]",
          "from-[#f4ecdd] to-[#eadcc2]",
        ].map((g, i) => (
          <figure key={i} className="flex flex-col gap-1.5">
            <div
              className={`flex aspect-square items-center justify-center rounded-2xl bg-gradient-to-br ${g} text-[#b3a08f]`}
            >
              <IconImages width={24} height={24} />
            </div>
            <figcaption className="caption truncate">{caps[i]}</figcaption>
          </figure>
        ))}
      </div>
      <Link
        to="/memory"
        className="mt-3 inline-block text-[12px] text-ink-faint"
      >
        全部照片 ›
      </Link>
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
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] text-ink transition-colors hover:bg-[var(--accent-soft)]"
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
