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

const ROOMS: Record<RoomKey, {
  icon: React.ComponentType<{ width?: number; height?: number }>;
  title: string;
  sub: string;
  desc: string;
  media: string;
  by: string;
  total: number;
  progress: number;
}> = {
  read: {
    icon: IconBook,
    title: "共读",
    sub: "READ TOGETHER",
    desc: "同一本书，同一页进度。读到心动的句子，划给彼此看。",
    media: "《小王子》",
    by: "安托万·德·圣埃克苏佩里",
    total: 96,
    progress: 32,
  },
  listen: {
    icon: IconMusic,
    title: "共听",
    sub: "LISTEN TOGETHER",
    desc: "同一档播客、同一首歌，让声音把两个人连在一起。",
    media: "晚安，淼淼",
    by: "宋祁 · 私房歌单",
    total: 214,
    progress: 82,
  },
  watch: {
    icon: IconPlay,
    title: "共影",
    sub: "WATCH TOGETHER",
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
  const selected = open ?? "read";
  const current = ROOMS[selected];

  return (
    <main className="lounge-page">
      <header className="lounge-topline">
        <button onClick={() => navigate(-1)} aria-label="返回" className="lounge-back">
          <IconChevron width={17} height={17} className="rotate-180" />
        </button>
        <span>JING HUA SHUI YUE</span>
        <span>TOGETHER · SHARED MOMENTS</span>
      </header>

      <section className="lounge-intro">
        <p className="lounge-kicker">TOGETHER / OUR PRIVATE SPACE</p>
        <h1>Together<em> · 共处</em></h1>
        <p className="lounge-lede">同一页书，同一段旋律，同一场电影。让相隔的日常，在这里拥有相同的节拍。</p>
        <div className="lounge-intro-foot"><span>共处 · 一起听、一起读、一起看</span><span>01 — 03</span></div>
      </section>

      <section className="lounge-room-section" aria-label="选择共处方式">
        <div className="lounge-section-heading">
          <div><span>THREE WAYS TO BE TOGETHER</span><h2>选择我们的共同时间</h2></div>
          <span className="lounge-heading-note">三种共享方式</span>
        </div>
        <div className="lounge-room-list">
          {(Object.keys(ROOMS) as RoomKey[]).map((key, index) => {
            const room = ROOMS[key];
            const Icon = room.icon;
            const active = selected === key;
            return (
              <button key={key} onClick={() => { setOpen(key); setPlaying(true); }}
                className={`lounge-room-choice ${active ? "is-active" : ""}`} aria-pressed={active}>
                <span className="lounge-room-number">0{index + 1}</span>
                <span className="lounge-room-icon"><Icon width={19} height={19} /></span>
                <span className="lounge-room-name"><strong>{room.title}</strong><small>{room.sub}</small></span>
                <span className="lounge-room-arrow">↗</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="lounge-session-wrap">
        <div className="lounge-section-heading lounge-session-heading">
          <div><span>NOW IN OUR LITTLE ROOM</span><h2>正在共享的时光</h2></div>
          <span className="lounge-live"><i /> ROOM OPEN</span>
        </div>
        <SessionDemo room={current} playing={playing} onToggle={() => setPlaying(v => !v)}
          wan={t.people.wan} yan={t.people.yan} />
      </section>

      <footer className="lounge-footer"><span>JING HUA SHUI YUE</span><i>✧</i><span>Love you to the moon and back.</span></footer>
    </main>
  );
}

function SessionDemo({ room, playing, onToggle, wan, yan }: {
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
    <article className="lounge-session">
      <div className="lounge-session-art" aria-hidden="true">
        <span className="lounge-orbit lounge-orbit-one" />
        <span className="lounge-orbit lounge-orbit-two" />
        <span className="lounge-art-glyph">{room.title === "共读" ? "页" : room.title === "共听" ? "音" : "影"}</span>
        <span className="lounge-art-index">A SHARED MOMENT</span>
        <span className="lounge-art-star">✧</span>
      </div>
      <div className="lounge-session-content">
        <div className="lounge-session-meta">
          <span>OUR ROOM / 0{room.title === "共读" ? "1" : room.title === "共听" ? "2" : "3"}</span>
          <span className="lounge-sync"><i /> 已同步</span>
        </div>
        <div className="lounge-session-title">
          <div><p>{room.sub}</p><h3>{room.media}</h3><span>{room.by}</span></div>
          <span className="lounge-media-icon"><Icon width={23} height={23} /></span>
        </div>
        <p className="lounge-session-desc">{room.desc}</p>
        <div className="lounge-progress-track"><span style={{ width: `${room.progress / room.total * 100}%` }} /></div>
        <div className="lounge-progress-label">
          <span>{room.total > 600 ? fmt(cur * 60) : `${cur} / ${mins} 页`}</span>
          <span>{room.total > 600 ? fmt(mins * 60) : `${mins} 页`}</span>
        </div>
        <div className="lounge-session-bottom">
          <div className="lounge-together-people">
            <span className="lounge-person lounge-person-one">{wan[0]}</span>
            <span className="lounge-person lounge-person-two">{yan[0]}</span>
            <span>两个人都在这里</span>
          </div>
          <button onClick={onToggle} aria-label={playing ? "暂停" : "播放"} className="lounge-play-button">
            {playing ? <IconPause width={17} height={17} /> : <IconPlay width={17} height={17} />}
          </button>
        </div>
        <p className="lounge-session-note"><IconHeart width={13} height={13} /> 同步的不只是进度，还有此刻。</p>
      </div>
    </article>
  );
}
