import { useEffect, useState } from "react";
import { BackButton } from "../components/ui/BackButton";
import { useBoundaryStore } from "../stores/boundaryStore";
import { useLifeStore } from "../stores/lifeStore";
import { daysTogether } from "../lib/life/derive";
import { db } from "../lib/db/schema";
import {
  appendPersonaRevision,
  ensurePrimaryIdentity,
  saveCompanionAvatar,
} from "../lib/db/repositories";
import type {
  CompanionRecord,
  PersonaRevisionRecord,
  RelationshipMilestoneRecord,
  RelationshipRecord,
} from "../lib/db/records";

const splitLines = (value: string) => value.split("\n").map((v) => v.trim()).filter(Boolean);
const dateToTimestamp = (value: string) => value ? new Date(`${value}T12:00:00`).getTime() : null;
const timestampToDate = (value: number | null) => { if (!value) return ""; const d = new Date(value); const pad = (n: number) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

export function Partner() {
  const legacyName = useBoundaryStore((s) => s.name);
  const legacySetName = useBoundaryStore((s) => s.setName);
  const legacySetAnniversary = useLifeStore((s) => s.setAnniversary);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [companion, setCompanion] = useState<CompanionRecord | null>(null);
  const [relationship, setRelationship] = useState<RelationshipRecord | null>(null);
  const [persona, setPersona] = useState<PersonaRevisionRecord | null>(null);
  const [milestones, setMilestones] = useState<RelationshipMilestoneRecord[]>([]);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [name, setName] = useState("");
  const [selfName, setSelfName] = useState(legacyName);
  const [startDate, setStartDate] = useState("");
  const [personality, setPersonality] = useState("");
  const [speakingStyle, setSpeakingStyle] = useState("");
  const [values, setValues] = useState("");
  const [boundaries, setBoundaries] = useState("");
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDate, setMilestoneDate] = useState(timestampToDate(Date.now()));
  const [milestoneDescription, setMilestoneDescription] = useState("");
  const days = daysTogether(startDate);

  const refresh = async () => {
    const identity = await ensurePrimaryIdentity();
    const currentPersona = await db.personaRevisions.get(identity.companion.currentPersonaRevisionId);
    const list = await db.relationshipMilestones.where("relationshipId").equals(identity.relationship.id).sortBy("happenedAt");
    const avatar = identity.companion.avatarAssetId
      ? await db.mediaAssets.get(identity.companion.avatarAssetId)
      : undefined;
    if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    setAvatarUrl(avatar ? URL.createObjectURL(avatar.blob) : "");
    setCompanion(identity.companion);
    setRelationship(identity.relationship);
    setPersona(currentPersona ?? null);
    setMilestones(list);
    setName(identity.companion.name);
    setStartDate(timestampToDate(identity.relationship.startAt));
    if (currentPersona) {
      setPersonality(currentPersona.personality);
      setSpeakingStyle(currentPersona.speakingStyle);
      setValues(currentPersona.values.join("\n"));
      setBoundaries(currentPersona.boundaries.join("\n"));
    }
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        await refresh();
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "读取伴侣档案失败");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    };
    // Load once; refresh is deliberately local to this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProfile = async () => {
    if (!companion || !relationship) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const now = Date.now();
      await db.companions.update(companion.id, { name: name.trim().slice(0, 40), updatedAt: now });
      await db.relationships.update(relationship.id, { startAt: dateToTimestamp(startDate), updatedAt: now });
      // Legacy conversation address is updated only after the user presses Save.
      legacySetName(selfName.trim().slice(0, 16));
      legacySetAnniversary(startDate);
      await refresh();
      setNotice("基础资料已保存");
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally { setSaving(false); }
  };

  const savePersona = async () => {
    if (!companion) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const next = await appendPersonaRevision({
        companionId: companion.id, personality, speakingStyle,
        values: splitLines(values), boundaries: splitLines(boundaries),
      });
      setPersona(next);
      await refresh();
      setNotice(`人格设定已保存为第 ${next.version} 版，旧版本仍会保留`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "人格保存失败");
    } finally { setSaving(false); }
  };

  const addMilestone = async () => {
    if (!relationship || !milestoneTitle.trim()) return;
    setError(""); setNotice("");
    try {
      const now = Date.now();
      await db.relationshipMilestones.add({
        id: `milestone:${now}:${Math.random().toString(36).slice(2, 7)}`,
        relationshipId: relationship.id, title: milestoneTitle.trim(),
        description: milestoneDescription.trim(),
        happenedAt: dateToTimestamp(milestoneDate) ?? now,
        createdAt: now, updatedAt: now, schemaVersion: 1,
      });
      setMilestoneTitle(""); setMilestoneDescription("");
      await refresh(); setNotice("纪念日已加入");
    } catch (e) { setError(e instanceof Error ? e.message : "添加纪念日失败"); }
  };

  const removeMilestone = async (id: string) => {
    try {
      await db.relationshipMilestones.delete(id);
      await refresh(); setNotice("纪念日已删除");
    } catch (e) { setError(e instanceof Error ? e.message : "删除失败"); }
  };

  const chooseAvatar = async (file?: File) => {
    if (!file || !companion) return;
    if (!file.type.startsWith("image/")) { setError("请选择图片文件"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("头像图片请控制在 5MB 以内"); return; }
    try {
      await saveCompanionAvatar({ companionId: companion.id, blob: file, mimeType: file.type });
      await refresh(); setNotice("头像已保存到本机");
    } catch (e) { setError(e instanceof Error ? e.message : "头像保存失败"); }
  };

  if (loading) return <div className="px-5 py-16 text-center text-sm text-ink-faint">正在打开月下人档案……</div>;

  return (
    <div className="partner-page partner-editorial relative min-h-full overflow-hidden px-5 pb-28 pt-6">
      <div aria-hidden="true" className="partner-orbit pointer-events-none absolute -right-24 top-20 h-64 w-64 rounded-full" />
      <header className="relative flex items-start gap-3">
        <BackButton className="mt-1.5" />
        <div className="min-w-0">
          <p className="page-head-sub tracking-[.22em]">THE ONE YOU CHOOSE</p>
          <h1 className="page-head-title mt-1 text-[30px] leading-tight text-ink">月下人</h1>
          <p className="page-head-sub mt-1">一个固定的 TA，一份持续生长的档案。</p>
        </div>
      </header>

      <div className="partner-editorial-intro relative mt-7 mb-2">
        <span>PERSONAL ARCHIVE · NO. 01</span>
        <p>把关于 TA 的细节，慢慢收进<br/><em>属于你们的时间里。</em></p>
        <i aria-hidden="true">✳</i>
      </div>

      {(error || notice) && <div role="status" className={`relative mt-4 rounded-2xl border px-4 py-3 text-sm ${error ? "border-red-300 text-red-700" : "border-[var(--line-strong)] text-ink-soft"}`}>{error || notice}</div>}

      <section className="partner-profile partner-sheet partner-sheet--identity relative mt-7 overflow-hidden rounded-[30px] border p-5">
        <div aria-hidden="true" className="partner-profile-glow absolute -right-12 -top-14 h-48 w-48 rounded-full" />
        <div className="relative flex items-center gap-4">
          <label className="partner-moon flex h-[76px] w-[76px] flex-none cursor-pointer items-center justify-center overflow-hidden rounded-full" title="更换伴侣头像">
            {avatarUrl ? <img src={avatarUrl} alt="伴侣头像" className="h-full w-full object-cover" /> : <span className="text-3xl text-ink-faint">月</span>}
            <input aria-label="上传伴侣头像" type="file" accept="image/*" className="sr-only" onChange={(e) => void chooseAvatar(e.target.files?.[0])} />
          </label>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] tracking-[.2em] text-ink-faint">ONE COMPANION · PRIMARY IDENTITY</p>
            <h2 className="mt-1 truncate text-[22px] text-ink">{name.trim() || "尚未命名"}</h2>
            <p className="mt-1 text-xs text-ink-faint">点击圆形区域更换头像 · 仅保存在当前设备</p>
          </div>
        </div>
        <div className="partner-rule relative my-5 h-px" />
        <label className="relative block text-xs tracking-wide text-ink-faint" htmlFor="companion-name">TA 的名字</label>
        <input id="companion-name" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="给 TA 一个名字" className="ghost-input relative mt-2 w-full border-b border-[var(--line-strong)] bg-transparent py-2.5 text-base text-ink placeholder:text-ink-ghost" />
        <label className="relative mt-4 block text-xs tracking-wide text-ink-faint" htmlFor="owner-name">TA 平时怎么称呼你</label>
        <input id="owner-name" value={selfName} maxLength={24} onChange={(e) => setSelfName(e.target.value)} placeholder="例如：宝宝、阿淼" className="ghost-input relative mt-2 w-full border-b border-[var(--line-strong)] bg-transparent py-2.5 text-base text-ink placeholder:text-ink-ghost" />
        <button type="button" disabled={saving} onClick={() => void saveProfile()} className="relative mt-5 w-full rounded-full border border-[var(--line-strong)] px-5 py-3 text-sm text-ink disabled:opacity-50">{saving ? "保存中…" : "保存基础资料"}</button>
      </section>

      <section className="partner-date-card partner-sheet partner-sheet--timeline relative mt-4 overflow-hidden rounded-[30px] border p-5">
        <p className="text-[10px] tracking-[.2em] text-ink-faint">OUR TIMELINE</p>
        <p className="mt-2 text-sm text-ink-soft">一起走过的日子</p>
        <p className="serif-display mt-1 text-[42px] leading-none text-ink">{startDate ? days : "—"}<span className="ml-2 text-sm tracking-wider">DAYS</span></p>
        <div className="partner-rule my-5 h-px" />
        <label className="block text-xs tracking-wide text-ink-faint" htmlFor="relationship-date">关系开始日期</label>
        <input id="relationship-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="ghost-input mt-2 w-full border-b border-[var(--line-strong)] bg-transparent py-2.5 text-sm text-ink" />
        <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">旧页面的默认日期可能是示例数据；请在这里确认并保存真实日期。</p>
        <button type="button" disabled={saving} onClick={() => void saveProfile()} className="mt-4 w-full rounded-full border border-[var(--line-strong)] px-5 py-3 text-sm text-ink disabled:opacity-50">保存关系日期</button>
      </section>

      <section className="partner-profile partner-sheet partner-sheet--persona relative mt-4 rounded-[30px] border p-5">
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-[10px] tracking-[.2em] text-ink-faint">PERSONA · VERSION {persona?.version ?? 1}</p><h2 className="mt-1 text-lg text-ink">性情录</h2></div>
          <span className="text-xs text-ink-faint">每次保存都会留档</span>
        </div>
        <label className="mt-5 block text-xs text-ink-faint" htmlFor="personality">性格与个性</label>
        <textarea id="personality" rows={3} value={personality} onChange={(e) => setPersonality(e.target.value)} placeholder="TA 是怎样的人？例如温柔、理性、偶尔有点俏皮……" className="ghost-input mt-2 w-full resize-y rounded-xl border border-[var(--line-strong)] bg-transparent p-3 text-sm text-ink" />
        <label className="mt-4 block text-xs text-ink-faint" htmlFor="speaking-style">说话方式</label>
        <textarea id="speaking-style" rows={3} value={speakingStyle} onChange={(e) => setSpeakingStyle(e.target.value)} placeholder="TA 喜欢怎样表达、怎样回应你？" className="ghost-input mt-2 w-full resize-y rounded-xl border border-[var(--line-strong)] bg-transparent p-3 text-sm text-ink" />
        <label className="mt-4 block text-xs text-ink-faint" htmlFor="values">价值观（每行一项）</label>
        <textarea id="values" rows={3} value={values} onChange={(e) => setValues(e.target.value)} placeholder={"尊重彼此\n坦诚沟通\n珍惜日常"} className="ghost-input mt-2 w-full resize-y rounded-xl border border-[var(--line-strong)] bg-transparent p-3 text-sm text-ink" />
        <label className="mt-4 block text-xs text-ink-faint" htmlFor="boundaries">相处边界（每行一项）</label>
        <textarea id="boundaries" rows={3} value={boundaries} onChange={(e) => setBoundaries(e.target.value)} placeholder={"不编造现实经历\n尊重我的拒绝\n不替我做重要决定"} className="ghost-input mt-2 w-full resize-y rounded-xl border border-[var(--line-strong)] bg-transparent p-3 text-sm text-ink" />
        <button type="button" disabled={saving} onClick={() => void savePersona()} className="mt-5 w-full rounded-full border border-[var(--line-strong)] px-5 py-3 text-sm text-ink disabled:opacity-50">{saving ? "保存中…" : "保存为新的人格版本"}</button>
        <p className="mt-3 text-[11px] leading-relaxed text-ink-faint">旧人格版本不会被覆盖。这里记录的是角色设定，实际对话效果仍取决于已连接的模型及发送给模型的上下文。</p>
      </section>

      <section className="partner-date-card partner-sheet partner-sheet--milestones relative mt-4 rounded-[30px] border p-5">
        <p className="text-[10px] tracking-[.2em] text-ink-faint">MILESTONES</p>
        <h2 className="mt-1 text-lg text-ink">相伴纪</h2>
        <div className="mt-4 space-y-3">
          {milestones.length ? milestones.map((item) => <article key={item.id} className="flex items-start gap-3 border-b border-[var(--line-strong)] pb-3">
            <div className="min-w-0 flex-1"><p className="text-sm text-ink">{item.title}</p><p className="mt-1 text-xs text-ink-faint">{timestampToDate(item.happenedAt)}{item.description ? ` · ${item.description}` : ""}</p></div>
            <button type="button" onClick={() => void removeMilestone(item.id)} className="text-xs text-ink-faint">删除</button>
          </article>) : <p className="text-xs text-ink-faint">还没有记录。把值得纪念的日子留在这里吧。</p>}
        </div>
        <div className="partner-rule my-5 h-px" />
        <label className="block text-xs text-ink-faint" htmlFor="milestone-title">纪念事件</label>
        <input id="milestone-title" value={milestoneTitle} onChange={(e) => setMilestoneTitle(e.target.value)} placeholder="例如：第一次相遇" className="ghost-input mt-2 w-full border-b border-[var(--line-strong)] bg-transparent py-2.5 text-sm text-ink" />
        <label className="mt-4 block text-xs text-ink-faint" htmlFor="milestone-date">发生日期</label>
        <input id="milestone-date" type="date" value={milestoneDate} onChange={(e) => setMilestoneDate(e.target.value)} className="ghost-input mt-2 w-full border-b border-[var(--line-strong)] bg-transparent py-2.5 text-sm text-ink" />
        <textarea rows={2} value={milestoneDescription} onChange={(e) => setMilestoneDescription(e.target.value)} placeholder="补充一点当时的故事（可选）" className="ghost-input mt-4 w-full resize-y rounded-xl border border-[var(--line-strong)] bg-transparent p-3 text-sm text-ink" />
        <button type="button" onClick={() => void addMilestone()} disabled={!milestoneTitle.trim()} className="mt-4 w-full rounded-full border border-[var(--line-strong)] px-5 py-3 text-sm text-ink disabled:opacity-40">添加到相伴纪</button>
      </section>
      <p className="mx-3 mt-5 text-center text-[11px] leading-[1.9] text-ink-faint">档案保存在当前浏览器的 IndexedDB 中。头像和人格版本不会自动上传云端；请定期使用归藏备份。</p>
    </div>
  );
}
