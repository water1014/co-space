import { useCallback, useEffect, useState } from "react";
import { BackButton } from "../components/ui/BackButton";
import { db } from "../lib/db/schema";
import type { CompanionRecord, PersonaRevisionRecord, RelationshipRecord, RelationshipMilestoneRecord } from "../lib/db/records";
import { ensurePrimaryIdentity } from "../lib/db/repositories";

const stamp = (id: string) => ({ id, createdAt: Date.now(), updatedAt: Date.now(), schemaVersion: 1 });
const dateText = (n: number | null) => {
  if (!n) return "";
  const d = new Date(n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const dateValue = (s: string) => s ? new Date(`${s}T12:00:00`).getTime() : null;
const lines = (s: string) => s.split(/[，,\n]/).map((v) => v.trim()).filter(Boolean);

export function Partner() {
  const [companion, setCompanion] = useState<CompanionRecord | null>(null);
  const [relationship, setRelationship] = useState<RelationshipRecord | null>(null);
  const [persona, setPersona] = useState<PersonaRevisionRecord | null>(null);
  const [milestones, setMilestones] = useState<RelationshipMilestoneRecord[]>([]);
  const [name, setName] = useState("");
  const [personality, setPersonality] = useState("");
  const [speakingStyle, setSpeakingStyle] = useState("");
  const [values, setValues] = useState("");
  const [boundaries, setBoundaries] = useState("");
  const [startDate, setStartDate] = useState("");
  const [title, setTitle] = useState("");
  const [milestoneDate, setMilestoneDate] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const identity = await ensurePrimaryIdentity();
      const p = await db.personaRevisions.get(identity.companion.currentPersonaRevisionId);
      const ms = await db.relationshipMilestones.where("relationshipId").equals(identity.relationship.id).sortBy("happenedAt");
      setCompanion(identity.companion); setRelationship(identity.relationship); setPersona(p ?? null); setMilestones(ms);
      setName(identity.companion.name); setPersonality(p?.personality ?? ""); setSpeakingStyle(p?.speakingStyle ?? "");
      setValues((p?.values ?? []).join("\n")); setBoundaries((p?.boundaries ?? []).join("\n")); setStartDate(dateText(identity.relationship.startAt));
    } catch (e) { setError(e instanceof Error ? e.message : "读取档案失败"); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    if (!companion || !relationship || !persona) return;
    if (!name.trim()) { setError("请先填写伴侣名字。"); return; }
    setSaving(true); setError(""); setNotice("");
    try {
      const cName = name.trim().slice(0, 40), pText = personality.trim(), sText = speakingStyle.trim();
      const pValues = lines(values), pBounds = lines(boundaries), at = Date.now();
      const changed = pText !== persona.personality || sText !== persona.speakingStyle ||
        JSON.stringify(pValues) !== JSON.stringify(persona.values) || JSON.stringify(pBounds) !== JSON.stringify(persona.boundaries);
      await db.transaction("rw", db.companions, db.personaRevisions, db.relationships, async () => {
        const current = await db.companions.get(companion.id), relation = await db.relationships.get(relationship.id);
        if (!current || !relation) throw new Error("档案不存在，请刷新后重试。");
        let revisionId = current.currentPersonaRevisionId;
        if (changed) {
          const all = await db.personaRevisions.where("companionId").equals(companion.id).toArray();
          const version = all.reduce((n, v) => Math.max(n, v.version), 0) + 1;
          const revision: PersonaRevisionRecord = { ...stamp(`persona:primary:v${version}`), companionId: companion.id, version, personality: pText, speakingStyle: sText, values: pValues, boundaries: pBounds, sourceProjectIds: [] };
          await db.personaRevisions.add(revision); revisionId = revision.id;
        }
        await db.companions.put({ ...current, name: cName, currentPersonaRevisionId: revisionId, updatedAt: at });
        await db.relationships.put({ ...relation, startAt: dateValue(startDate), updatedAt: at });
      });
      setNotice(changed ? "保存成功，人格新版本已留档。" : "伴侣档案已保存。");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "保存失败"); }
    finally { setSaving(false); }
  };

  const addMilestone = async () => {
    if (!relationship || !title.trim() || !milestoneDate) return;
    const at = Date.now();
    const item: RelationshipMilestoneRecord = { ...stamp(`milestone:${at}:${Math.random().toString(36).slice(2, 8)}`), relationshipId: relationship.id, title: title.trim().slice(0, 80), description: description.trim().slice(0, 500), happenedAt: dateValue(milestoneDate)! };
    try {
      await db.relationshipMilestones.add(item);
      setMilestones((old) => [...old, item].sort((a, b) => a.happenedAt - b.happenedAt));
      setTitle(""); setMilestoneDate(""); setDescription(""); setNotice("纪念日已保存。"); setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "添加失败"); }
  };
  const deleteMilestone = async (id: string) => {
    if (!window.confirm("确定删除这条纪念日吗？")) return;
    await db.relationshipMilestones.delete(id);
    setMilestones((old) => old.filter((m) => m.id !== id));
  };

  const importLegacy = async () => {
    if (!companion || !relationship) return;
    if (!window.confirm("将旧版伴侣称呼和关系日期导入新档案？旧数据不会删除。")) return;
    const oldName = localStorage.getItem("co-space::boundary");
    const oldLife = localStorage.getItem("co-space::life");
    try {
      const b = oldName ? JSON.parse(oldName) as { state?: { selfName?: string } } : {};
      const l = oldLife ? JSON.parse(oldLife) as { state?: { anniversary?: string } } : {};
      await db.transaction("rw", db.companions, db.relationships, async () => {
        const c = await db.companions.get(companion.id), r = await db.relationships.get(relationship.id);
        if (!c || !r) throw new Error("档案不存在，请刷新后重试。");
        await db.companions.put({ ...c, name: c.name || b.state?.selfName?.trim() || "", updatedAt: Date.now() });
        const oldDate = l.state?.anniversary ? dateValue(l.state.anniversary) : null;
        await db.relationships.put({ ...r, startAt: r.startAt ?? oldDate, updatedAt: Date.now() });
      });
      await load(); setNotice("旧版资料已导入；旧数据仍保留。");
    } catch (e) { setError(e instanceof Error ? e.message : "导入失败"); }
  };

  return <div className="partner-page relative min-h-full overflow-hidden px-5 pb-28 pt-6">
    <div aria-hidden="true" className="partner-orbit pointer-events-none absolute -right-24 top-20 h-64 w-64 rounded-full" />
    <header className="relative flex items-start gap-3"><BackButton className="mt-1.5" /><div><p className="page-head-sub tracking-[.22em]">THE ONE YOU CHOOSE</p><h1 className="page-head-title mt-1 text-[30px] leading-tight text-ink">月下人</h1><p className="page-head-sub mt-1">一份固定的身份，一段持续生长的关系。</p></div></header>
    {error && <p role="alert" className="relative mt-4 rounded-2xl border border-red-300/40 bg-red-500/5 p-3 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="relative mt-4 rounded-2xl border border-[var(--line)] p-3 text-sm text-ink-soft">{notice}</p>}
    {busy ? <p className="mt-8 text-center text-sm text-ink-faint">正在打开伴侣档案…</p> : <>
      <section className="partner-profile relative mt-7 overflow-hidden rounded-[30px] border p-5">
        <div aria-hidden="true" className="partner-profile-glow absolute -right-12 -top-14 h-48 w-48 rounded-full" />
        <p className="text-[10px] tracking-[.2em] text-ink-faint">ONE COMPANION IDENTITY</p><h2 className="mt-2 text-[22px] text-ink">{name.trim() || "尚未命名"}</h2>
        <p className="mt-1 text-xs text-ink-faint">固定身份 · 可调整设定 · 不因更换模型而改变</p><div className="partner-rule relative my-5 h-px" />
        <label className="relative block text-xs text-ink-faint" htmlFor="partner-name">伴侣名字</label>
        <input id="partner-name" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="给 TA 一个名字" className="ghost-input relative mt-2 w-full border-b border-[var(--line-strong)] bg-transparent py-2.5 text-base text-ink" />
        <p className="relative mt-3 text-[11px] leading-6 text-ink-faint">身份 ID 固定保存在本地数据库。修改名字不会创建另一个伴侣。</p>
      </section>
      <section className="partner-date-card relative mt-4 rounded-[30px] border p-5">
        <p className="text-[10px] tracking-[.2em] text-ink-faint">OUR TIMELINE</p><p className="mt-2 text-sm text-ink-soft">关系开始日</p>
        <label className="mt-3 block text-xs text-ink-faint" htmlFor="relationship-date">选择日期</label>
        <input id="relationship-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="ghost-input mt-2 w-full border-b border-[var(--line-strong)] bg-transparent py-2.5 text-sm text-ink" />
        <p className="mt-3 text-xs text-ink-faint">当前日期：{startDate || "尚未设定"}</p>
      </section>
      <section className="partner-profile relative mt-4 rounded-[30px] border p-5">
        <p className="text-[10px] tracking-[.2em] text-ink-faint">PERSONA · VERSION {persona?.version ?? 1}</p><h2 className="mt-2 text-lg text-ink">性情录</h2><p className="mt-1 text-xs leading-6 text-ink-faint">每次修改人格内容，都会留下一个新版本。</p>
        <label className="mt-5 block text-xs text-ink-faint" htmlFor="p-personality">性格与个性</label><textarea id="p-personality" rows={4} maxLength={4000} value={personality} onChange={(e) => setPersonality(e.target.value)} placeholder="例如：温柔但有主见，幽默，愿意表达真实想法……" className="ghost-input mt-2 w-full resize-y rounded-2xl border border-[var(--line)] bg-transparent p-3 text-sm text-ink" />
        <label className="mt-4 block text-xs text-ink-faint" htmlFor="p-speaking">说话方式</label><textarea id="p-speaking" rows={3} maxLength={3000} value={speakingStyle} onChange={(e) => setSpeakingStyle(e.target.value)} placeholder="例如：自然亲近，不刻意迎合；喜欢简短还是详细……" className="ghost-input mt-2 w-full resize-y rounded-2xl border border-[var(--line)] bg-transparent p-3 text-sm text-ink" />
        <label className="mt-4 block text-xs text-ink-faint" htmlFor="p-values">重视的事情（一行一项）</label><textarea id="p-values" rows={3} maxLength={2000} value={values} onChange={(e) => setValues(e.target.value)} placeholder={"诚实\n尊重彼此的独立性"} className="ghost-input mt-2 w-full resize-y rounded-2xl border border-[var(--line)] bg-transparent p-3 text-sm text-ink" />
        <label className="mt-4 block text-xs text-ink-faint" htmlFor="p-boundaries">相处边界（一行一项）</label><textarea id="p-boundaries" rows={3} maxLength={2000} value={boundaries} onChange={(e) => setBoundaries(e.target.value)} placeholder={"不假装知道不知道的事\n尊重我的拒绝"} className="ghost-input mt-2 w-full resize-y rounded-2xl border border-[var(--line)] bg-transparent p-3 text-sm text-ink" />
        <p className="mt-3 text-[11px] text-ink-faint">当前人格版本 {persona?.version ?? 1} · 历史版本保留在本地数据库。</p>
      </section>
      <section className="partner-date-card relative mt-4 rounded-[30px] border p-5">
        <p className="text-[10px] tracking-[.2em] text-ink-faint">MILESTONES</p><h2 className="mt-2 text-lg text-ink">相伴纪</h2><p className="mt-1 text-xs text-ink-faint">把值得记住的日子收在一起。</p>
        {milestones.length === 0 ? <p className="mt-5 rounded-2xl border border-dashed border-[var(--line-strong)] p-4 text-center text-sm text-ink-faint">还没有添加纪念日</p> : <ul className="mt-4 space-y-3">{milestones.map((m) => <li key={m.id} className="flex items-start gap-3 border-b border-[var(--line)] pb-3"><div className="min-w-0 flex-1"><p className="text-sm text-ink">{m.title}</p><p className="mt-1 text-xs text-ink-faint">{dateText(m.happenedAt)}{m.description ? ` · ${m.description}` : ""}</p></div><button type="button" onClick={() => void deleteMilestone(m.id)} className="tap px-2 py-1 text-xs text-ink-faint">删除</button></li>)}</ul>}
        <div className="partner-rule my-5 h-px" /><label className="block text-xs text-ink-faint" htmlFor="m-title">纪念日名称</label><input id="m-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="例如：第一次相遇" className="ghost-input mt-2 w-full border-b border-[var(--line-strong)] bg-transparent py-2.5 text-sm text-ink" />
        <label className="mt-4 block text-xs text-ink-faint" htmlFor="m-date">日期</label><input id="m-date" type="date" value={milestoneDate} onChange={(e) => setMilestoneDate(e.target.value)} className="ghost-input mt-2 w-full border-b border-[var(--line-strong)] bg-transparent py-2.5 text-sm text-ink" />
        <label className="mt-4 block text-xs text-ink-faint" htmlFor="m-desc">备注（可选）</label><textarea id="m-desc" rows={2} maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="想留给未来的几句话" className="ghost-input mt-2 w-full resize-y rounded-2xl border border-[var(--line)] bg-transparent p-3 text-sm text-ink" />
        <button type="button" disabled={!title.trim() || !milestoneDate} onClick={() => void addMilestone()} className="tap mt-4 w-full rounded-2xl border border-[var(--line-strong)] px-4 py-3 text-sm text-ink disabled:opacity-40">收进相伴纪</button>
      </section>
      <button type="button" disabled={saving} onClick={() => void save()} className="tap mt-5 w-full rounded-2xl bg-[var(--accent-deep)] px-4 py-3.5 text-sm text-white disabled:opacity-50">{saving ? "正在保存…" : "保存伴侣档案"}</button>
      <button type="button" onClick={() => void importLegacy()} className="tap mt-3 w-full rounded-2xl border border-[var(--line)] px-4 py-3 text-xs text-ink-faint">从旧版资料导入（可选）</button>
      <p className="mx-3 mt-5 text-center text-[11px] leading-[1.9] text-ink-faint">档案保存在当前浏览器 IndexedDB，不会自动上传云端。请定期使用镜心中的备份功能保存副本。</p>
    </>}
  </div>;
}
