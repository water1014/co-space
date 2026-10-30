import { useNavigate } from "react-router-dom";
import { IconChevron, IconBook, IconPlay, IconLounge } from "../components/ui/icons";

const ROOMS = [
  {
    icon: IconBook,
    title: "共读",
    sub: "同步读书",
    desc: "同一本书，同一页进度。读到心动的句子，划给彼此看。",
  },
  {
    icon: IconPlay,
    title: "共影",
    sub: "同步观影",
    desc: "隔着屏幕一起按下播放键，吐槽和爆笑都实时同步。",
  },
  {
    icon: IconLounge,
    title: "共听",
    sub: "同步听音频",
    desc: "同一档播客、同一首歌，让声音把两个人连在一起。",
  },
];

export function Lounge() {
  const navigate = useNavigate();

  return (
    <div className="px-5 pt-6 pb-10">
      <div className="flex items-start gap-2 pb-2 pt-1">
        <button onClick={() => navigate(-1)} aria-label="返回" className="press mt-2 text-ink-faint">
          <IconChevron width={16} height={16} className="rotate-180" />
        </button>
        <div>
          <h1 className="page-head-title text-[30px] leading-none text-ink">共读听影</h1>
          <p className="page-head-sub mt-1 text-[12.5px]">同步读书 · 观影 · 听音频</p>
        </div>
      </div>

      <p className="mt-5 text-[14px] leading-[1.8] text-ink-soft">
        把一个人的消遣，变成两个人的仪式。同一时刻，做同一件事，距离就短了一截。
      </p>

      <div className="mt-4 space-y-3">
        {ROOMS.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.title} className="card flex items-center gap-4 rounded-3xl p-4">
              <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-deep)]">
                <Icon width={24} height={24} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-ink">
                  {r.title}
                  <span className="ml-2 text-[12px] font-normal text-ink-faint">{r.sub}</span>
                </p>
                <p className="mt-0.5 text-[12.5px] leading-[1.6] text-ink-soft">{r.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-5 text-center text-[12px] tracking-[0.14em] text-ink-ghost">同步引擎 · 即将上线</p>
    </div>
  );
}
