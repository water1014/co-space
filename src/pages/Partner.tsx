import { useState } from "react";
import { BackButton } from "../components/ui/BackButton";
import { useBoundaryStore } from "../stores/boundaryStore";
import { useLifeStore } from "../stores/lifeStore";
import { daysTogether } from "../lib/life/derive";

/** 只保存用户主动设定的伴侣称呼与关系起点，不虚构 AI 的记忆或在线状态。 */
export function Partner() {
  const selfName = useBoundaryStore((s) => s.selfName);
  const setSelfName = useBoundaryStore((s) => s.setSelfName);
  const anniversary = useLifeStore((s) => s.anniversary);
  const setAnniversary = useLifeStore((s) => s.setAnniversary);
  const days = daysTogether(anniversary);
  const [saved, setSaved] = useState(false);
  return (
    <div className="px-5 pt-6 pb-12">
      <header className="flex items-start gap-2"><BackButton className="mt-1.5" /><div>
        <p className="page-head-sub">THE ONE IN THIS LITTLE WORLD</p>
        <h1 className="page-head-title mt-1 text-[30px] leading-tight text-ink">月下人</h1>
        <p className="page-head-sub mt-1">关于那个重要的人，也关于你为这段关系写下的约定。</p>
      </div></header>
      <section className="card mt-6 overflow-hidden rounded-[28px] p-5">
        <div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--accent-soft)] text-[26px] text-[var(--accent-deep)]">月</div><div className="min-w-0">
          <p className="text-[11px] tracking-[.18em] text-ink-faint">COMPANION PROFILE</p><h2 className="mt-1 text-xl text-ink">{selfName.trim() || "尚未命名"}</h2><p className="mt-1 text-xs text-ink-faint">这是你为伴侣设定的称呼</p>
        </div></div>
        <label className="mt-6 block text-xs text-ink-faint" htmlFor="partner-name">伴侣的名字 / 称呼</label>
        <input id="partner-name" value={selfName} maxLength={16} onChange={(e) => { setSelfName(e.target.value); setSaved(false); }} placeholder="给 TA 一个名字" className="ghost-input mt-2 w-full border-b border-[var(--line)] bg-transparent py-2 text-base text-ink" />
        <p className="mt-2 text-xs leading-6 text-ink-faint">这里只记录你主动填写的设定。未来接入 AI 后，也会明确区分角色设定、当前对话和你保存的共同记忆。</p>
      </section>
      <section className="card mt-4 rounded-[28px] p-5">
        <p className="text-xs tracking-[.16em] text-ink-faint">OUR FIRST DAY</p>
        <div className="mt-2 flex items-end justify-between gap-3"><div><p className="text-sm text-ink-soft">从这一天开始计算</p><p className="mt-1 text-3xl text-ink">{days}<span className="ml-1 text-sm">天</span></p></div><span className="text-2xl text-[var(--accent-deep)]">✧</span></div>
        <label className="mt-5 block text-xs text-ink-faint" htmlFor="relationship-date">关系纪念日</label>
        <input id="relationship-date" type="date" value={anniversary} onChange={(e) => { setAnniversary(e.target.value); setSaved(false); }} className="ghost-input mt-2 w-full border-b border-[var(--line)] bg-transparent py-2 text-sm text-ink" />
      </section>
      <button type="button" onClick={() => setSaved(true)} className="tap mt-5 w-full rounded-full bg-[var(--accent-deep)] px-5 py-3 text-sm text-white">{saved ? "已保存到这个小家" : "确认这些设定"}</button>
      <p className="mt-3 text-center text-[11px] leading-5 text-ink-faint">资料保存在当前浏览器中；尚未同步到云端。</p>
    </div>
  );
}
