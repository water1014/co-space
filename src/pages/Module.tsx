import { useNavigate } from "react-router-dom";
import type { SVGProps } from "react";
import {
  IconChevron,
  IconCalendar,
  IconTravel,
  IconMusic,
  IconHealth,
  IconCoin,
  IconWallet,
} from "../components/ui/icons";

type Kind = "calendar" | "travel" | "music" | "health" | "ledger" | "budget";

const META: Record<
  Kind,
  { title: string; sub: string; desc: string; icon: React.ComponentType<SVGProps<SVGSVGElement>> }
> = {
  calendar: {
    title: "日历",
    sub: "共享日历 · 纪念日 · 约会计划",
    desc: "把两个人的日子放到同一张日历上：纪念日自动高亮，约会计划一键添加，未来的每一页都值得期待。",
    icon: IconCalendar,
  },
  travel: {
    title: "旅游",
    sub: "出行打卡 · 旅行轨迹记录",
    desc: "从一次说走就走的短途，到攒了很久的长假。把去过的地方、拍下的瞬间，连成一条只属于你们的轨迹。",
    icon: IconTravel,
  },
  music: {
    title: "音乐",
    sub: "共享歌单 · 同步听歌",
    desc: "同一首歌，同一时刻，隔着屏幕也能同频。把私房歌单分享给彼此，让旋律替你们说话。",
    icon: IconMusic,
  },
  health: {
    title: "健康",
    sub: "作息 · 健康打卡记录",
    desc: "早睡早起、喝水运动，小小的打卡串成习惯。照顾好自己，也是好好爱彼此的方式。",
    icon: IconHealth,
  },
  ledger: {
    title: "账本",
    sub: "共同记账",
    desc: "每一笔开销都记下来，谁请的奶茶、周末的晚饭，清清楚楚。钱要一起花，也要一起算。",
    icon: IconCoin,
  },
  budget: {
    title: "额度",
    sub: "共同预算管理",
    desc: "给彼此一点自由支配的空间，也给共同的目标留一份底气。预算之内，随心所欲。",
    icon: IconWallet,
  },
};

export function Module({ kind }: { kind: Kind }) {
  const m = META[kind];
  const navigate = useNavigate();
  const Icon = m.icon;

  return (
    <div className="module-page px-5 pt-6 pb-10">
      <div className="flex items-start gap-2 pb-2 pt-1">
        <button onClick={() => navigate(-1)} aria-label="返回" className="press mt-2 text-ink-faint">
          <IconChevron width={16} height={16} className="rotate-180" />
        </button>
        <div>
          <h1 className="page-head-title text-[30px] leading-none text-ink">{m.title}</h1>
          <p className="page-head-sub mt-1 text-[12.5px]">{m.sub}</p>
        </div>
      </div>

      <div className="card mt-5 flex flex-col items-center rounded-3xl px-6 py-9 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-deep)]">
          <Icon width={30} height={30} />
        </span>
        <p className="mt-4 text-[14px] leading-[1.8] text-ink-soft">{m.desc}</p>
        <p className="mt-4 text-[12px] tracking-[0.14em] text-ink-ghost">即将上线 · COMING SOON</p>
      </div>
    </div>
  );
}
