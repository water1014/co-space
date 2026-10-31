import { BackButton } from "../components/ui/BackButton";
import { useBoundaryStore } from "../stores/boundaryStore";
import { useLifeStore } from "../stores/lifeStore";
import { daysTogether } from "../lib/life/derive";

/** 只展示用户主动设定的伴侣资料；编辑后由本地 store 自动持久化。 */
export function Partner() {
  const selfName = useBoundaryStore((s) => s.selfName);
  const setSelfName = useBoundaryStore((s) => s.setSelfName);
  const anniversary = useLifeStore((s) => s.anniversary);
  const setAnniversary = useLifeStore((s) => s.setAnniversary);
  const days = daysTogether(anniversary);

  return (
    <div className="partner-page relative min-h-full overflow-hidden px-5 pb-28 pt-6">
      <div aria-hidden="true" className="partner-orbit pointer-events-none absolute -right-24 top-20 h-64 w-64 rounded-full" />
      <header className="relative flex items-start gap-3">
        <BackButton className="mt-1.5" />
        <div className="min-w-0">
          <p className="page-head-sub tracking-[.22em]">A PLACE FOR THE ONE YOU CHOOSE</p>
          <h1 className="page-head-title mt-1 text-[30px] leading-tight text-ink">月下人</h1>
          <p className="page-head-sub mt-1">为重要的那个人，留一页专属的位置。</p>
        </div>
      </header>

      <section className="partner-profile relative mt-7 overflow-hidden rounded-[30px] border p-5">
        <div aria-hidden="true" className="partner-profile-glow absolute -right-12 -top-14 h-48 w-48 rounded-full" />
        <div className="relative flex items-center gap-4">
          <div className="partner-moon flex h-[76px] w-[76px] flex-none items-center justify-center rounded-full">
            <svg viewBox="0 0 72 72" width="54" height="54" fill="none" role="img" aria-label="月亮装饰">
              <circle cx="36" cy="36" r="29" stroke="currentColor" strokeOpacity=".22" strokeWidth=".8"/>
              <path d="M43.8 12.5c-10.4 3.1-17.1 13.9-14.7 24.8 2.4 10.9 13.1 17.9 24.1 15.7A27 27 0 1 1 43.8 12.5Z" fill="currentColor" fillOpacity=".78"/>
              <path d="m16 19 1.7 3.5 3.8.5-2.8 2.7.7 3.8-3.4-1.8-3.4 1.8.7-3.8-2.8-2.7 3.8-.5L16 19Z" fill="currentColor" fillOpacity=".62"/>
              <circle cx="54" cy="17" r="1.5" fill="currentColor"/>
              <circle cx="57" cy="39" r="1" fill="currentColor" fillOpacity=".7"/>
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] tracking-[.2em] text-ink-faint">COMPANION PROFILE</p>
            <h2 className="mt-1 truncate text-[22px] text-ink">{selfName.trim() || "尚未命名"}</h2>
            <p className="mt-1 text-xs text-ink-faint">由你亲自写下的称呼</p>
          </div>
        </div>
        <div className="partner-rule relative my-5 h-px" />
        <label className="relative block text-xs tracking-wide text-ink-faint" htmlFor="partner-name">名字 / 日常称呼</label>
        <input id="partner-name" value={selfName} maxLength={24} onChange={(e) => setSelfName(e.target.value)} placeholder="给 TA 一个名字" className="ghost-input relative mt-2 w-full border-b border-[var(--line-strong)] bg-transparent py-2.5 text-[16px] text-ink placeholder:text-ink-ghost" />
        <p className="relative mt-3 text-[11.5px] leading-[1.8] text-ink-faint">这里保存的是你设定的角色资料，不代表 AI 已经拥有独立意识或自动记住了所有经历。</p>
      </section>

      <section className="partner-date-card relative mt-4 overflow-hidden rounded-[30px] border p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] tracking-[.2em] text-ink-faint">THE DAY WE MARK</p>
            <p className="mt-2 text-sm text-ink-soft">一起走过的日子</p>
            <p className="serif-display mt-1 text-[42px] leading-none text-ink">{days}<span className="ml-2 text-sm tracking-wider">DAYS</span></p>
          </div>
          <svg aria-hidden="true" viewBox="0 0 64 64" className="mt-1 h-14 w-14 text-[var(--accent-deep)]" fill="none">
            <circle cx="32" cy="32" r="25" stroke="currentColor" strokeOpacity=".25"/>
            <path d="M32 8v48M8 32h48M15 15l34 34M49 15 15 49" stroke="currentColor" strokeOpacity=".28" strokeWidth=".7"/>
            <path d="M32 18c-5.5 7-8 11-8 16a8 8 0 0 0 16 0c0-5-2.5-9-8-16Z" fill="currentColor" fillOpacity=".5"/>
          </svg>
        </div>
        <div className="partner-rule my-5 h-px" />
        <label className="block text-xs tracking-wide text-ink-faint" htmlFor="relationship-date">关系纪念日</label>
        <input id="relationship-date" type="date" value={anniversary} onChange={(e) => setAnniversary(e.target.value)} className="ghost-input mt-2 w-full border-b border-[var(--line-strong)] bg-transparent py-2.5 text-sm text-ink" />
      </section>

      <p className="mx-3 mt-5 text-center text-[11px] leading-[1.9] text-ink-faint">修改会自动保存在当前浏览器。暂未同步到云端；更换设备前请先做好数据备份。</p>
    </div>
  );
}
