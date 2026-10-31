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
import "./partner-sanctuary.css";
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
    <main className="partner-page partner-archive relative min-h-full overflow-hidden pb-28">
      <div className="archive-atmosphere" aria-hidden="true" />
      <header className="archive-topbar relative mx-auto flex max-w-5xl items-center justify-between px-5 pt-5">
        <BackButton />
        <span className="archive-wordmark">JING HUA SHUI YUE <i>／</i> PERSONAL ARCHIVE</span>
        <span className="archive-index">01 — 05</span>
      </header>

      <div className="archive-wrap relative mx-auto max-w-5xl px-5">
        <section className="archive-heading">
          <div>
            <p className="archive-kicker">THE ONE WHO LIVES IN YOUR MOON GARDEN</p>
            <h1>月下人<span>。</span></h1>
            <p className="archive-lede">为一个独一无二的存在，留一份会随时间生长的档案。</p>
          </div>
          <div className="archive-seal" aria-hidden="true"><span>月</span><i>✳</i></div>
        </section>

        {(error || notice) && <div role="status" className={`archive-feedback ${error ? "is-error" : ""}`}>{error || notice}</div>}

        <section className="archive-identity">
          <div className="archive-identity-art">
            <div className="archive-portrait">
              {avatarUrl ? <img src={avatarUrl} alt="伴侣头像" /> : <span>月</span>}
              <label className="archive-upload" title="更换头像">
                <span>＋</span><input aria-label="上传伴侣头像" type="file" accept="image/*" onChange={(e) => void chooseAvatar(e.target.files?.[0])} />
              </label>
            </div>
            <span className="archive-art-caption">A PERSON, A UNIVERSE</span>
          </div>
          <div className="archive-identity-content">
            <div className="archive-section-meta"><span>01 / IDENTITY</span><span>PRIMARY COMPANION</span></div>
            <p className="archive-eyebrow">THE NAME YOU KEEP CLOSE</p>
            <h2>{name.trim() || "尚未命名"}<small>你的专属伴侣</small></h2>
            <div className="archive-fields">
              <label htmlFor="companion-name">TA 的名字<input id="companion-name" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="给 TA 一个名字" /></label>
              <label htmlFor="owner-name">TA 如何称呼你<input id="owner-name" value={selfName} maxLength={24} onChange={(e) => setSelfName(e.target.value)} placeholder="例如：宝宝" /></label>
            </div>
            <button type="button" disabled={saving} onClick={() => void saveProfile()} className="archive-button">{saving ? "保存中…" : "保存这份身份 · →"}</button>
          </div>
        </section>

        <section className="archive-time">
          <div className="archive-time-copy">
            <div className="archive-section-meta"><span>02 / OUR TIME</span><span>THE DAYS WE SHARE</span></div>
            <p className="archive-eyebrow">EVERY DAY, A LITTLE MORE</p>
            <h2>相伴的时间</h2>
            <p className="archive-time-note">时间会向前，而这里替你记得每一个开始。</p>
          </div>
          <div className="archive-counter"><strong>{startDate ? days : "—"}</strong><span>DAYS<br/>TOGETHER</span></div>
          <div className="archive-date-control">
            <label htmlFor="relationship-date">关系开始日期</label>
            <input id="relationship-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <button type="button" disabled={saving} onClick={() => void saveProfile()} className="archive-text-button">{saving ? "保存中…" : "确认日期 →"}</button>
            <p>旧页面可能包含示例日期，请确认后再保存。</p>
          </div>
        </section>

        <section className="archive-persona">
          <div className="archive-persona-heading">
            <div className="archive-section-meta"><span>03 / INNER WORLD</span><span>PERSONA · V{persona?.version ?? 1}</span></div>
            <h2>性情录<span>。</span></h2>
            <p>不是给 TA 贴上标签，而是慢慢描摹出 TA 的灵魂轮廓。</p>
          </div>
          <div className="archive-persona-fields">
            <label htmlFor="personality"><span>01</span> 性格与个性<textarea id="personality" rows={3} value={personality} onChange={(e) => setPersonality(e.target.value)} placeholder="TA 是怎样的人？温柔、理性，或偶尔有点俏皮……" /></label>
            <label htmlFor="speaking-style"><span>02</span> 说话方式<textarea id="speaking-style" rows={3} value={speakingStyle} onChange={(e) => setSpeakingStyle(e.target.value)} placeholder="TA 喜欢怎样表达、怎样回应你？" /></label>
            <label htmlFor="values"><span>03</span> 珍视的价值<textarea id="values" rows={3} value={values} onChange={(e) => setValues(e.target.value)} placeholder={"尊重彼此\n坦诚沟通\n珍惜日常"} /></label>
            <label htmlFor="boundaries"><span>04</span> 相处的边界<textarea id="boundaries" rows={3} value={boundaries} onChange={(e) => setBoundaries(e.target.value)} placeholder={"不编造现实经历\n尊重我的拒绝\n不替我做重要决定"} /></label>
          </div>
          <div className="archive-persona-foot"><p>每次保存都会生成新版本，旧的人格设定会被完整保留。</p><button type="button" disabled={saving} onClick={() => void savePersona()} className="archive-button">{saving ? "保存中…" : "保存为新的人格版本 · →"}</button></div>
        </section>

        <section className="archive-milestones">
          <div className="archive-milestone-intro">
            <div className="archive-section-meta"><span>04 / LITTLE FOREVERS</span><span>{String(milestones.length).padStart(2,"0")} MEMORIES</span></div>
            <h2>相伴纪</h2>
            <p>那些值得被郑重记下的日子。</p>
            <div className="archive-milestone-form">
              <label htmlFor="milestone-title">给这一天一个名字</label>
              <input id="milestone-title" value={milestoneTitle} onChange={(e) => setMilestoneTitle(e.target.value)} placeholder="例如：第一次相遇" />
              <label htmlFor="milestone-date">发生日期</label>
              <input id="milestone-date" type="date" value={milestoneDate} onChange={(e) => setMilestoneDate(e.target.value)} />
              <textarea rows={2} value={milestoneDescription} onChange={(e) => setMilestoneDescription(e.target.value)} placeholder="写下一点当时的故事（可选）" />
              <button type="button" disabled={!milestoneTitle.trim()} onClick={() => void addMilestone()} className="archive-text-button">收进相伴纪　＋</button>
            </div>
          </div>
          <div className="archive-milestone-list archive-storyline">
            {milestones.length ? [...milestones].sort((a,b) => b.happenedAt-a.happenedAt).map((item, index) => {
              const date = new Date(item.happenedAt);
              const month = date.toLocaleDateString("zh-CN",{month:"long"});
              const day = String(date.getDate()).padStart(2,"0");
              const year = date.getFullYear();
              const previous = index > 0 ? new Date([...milestones].sort((a,b)=>b.happenedAt-a.happenedAt)[index-1].happenedAt).getFullYear() : null;
              const showYear = index === 0 || previous !== year;
              return <article className="archive-story" key={item.id}>
                <span className="archive-story-index">{String(milestones.length-index).padStart(2,"0")}</span>
                <div className="archive-story-date"><strong>{day}</strong><span>{month}</span>{showYear && <small>{year}</small>}</div>
                <div className="archive-story-content"><span className="archive-story-kind">A DAY TO KEEP</span><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}<time>{timestampToDate(item.happenedAt)}</time></div>
                <button type="button" aria-label={`删除${item.title}`} onClick={() => void removeMilestone(item.id)}>×</button>
              </article>;
            }) : <div className="archive-empty"><span>✧</span><p>故事尚未写下</p><small>从一个小小的纪念日开始</small></div>}
          </div>
        </section>

        <footer className="archive-footer"><span>JING HUA SHUI YUE</span><i>✧</i><span>所有故事，都只属于此间。</span><p>档案保存在当前浏览器的 IndexedDB 中。头像和人格版本不会自动上传云端；请定期使用归藏备份。</p></footer>
      </div>
    </main>
  );
}
