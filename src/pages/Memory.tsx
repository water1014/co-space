import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BackButton } from "../components/ui/BackButton";
import { Sheet } from "../components/ui/kit";
import { useMemoryStore } from "../stores/memoryStore";
import type { MemoryEntry } from "../types";
import "./memory-archive.css";

const MONTHS = ["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"];
const pad = (n: number) => String(n).padStart(2, "0");
const dayKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const entryDay = (entry: MemoryEntry) => dayKey(new Date(entry.createdAt));
const parseTags = (value: string) => [...new Set(value.split(/[，,、]/).map((tag) => tag.trim().replace(/^#/, "")).filter(Boolean))].slice(0, 8).map((tag) => tag.slice(0, 20));

export function Memory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const memories = useMemoryStore((s) => s.memories);
  const loading = useMemoryStore((s) => s.loading);
  const initialDay = searchParams.get("day");
  const parsedInitialDay = initialDay && /^\d{4}-\d{2}-\d{2}$/.test(initialDay) ? new Date(`${initialDay}T12:00:00`) : new Date();
  const [month, setMonth] = useState(() => new Date(parsedInitialDay.getFullYear(), parsedInitialDay.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(() => dayKey(parsedInitialDay));
  const [view, setView] = useState<"saved" | "index">("index");
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [opened, setOpened] = useState<MemoryEntry | null>(null);
  const [editingOpened, setEditingOpened] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftTags, setDraftTags] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newText, setNewText] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState<"edit" | "new" | null>(null);
  useEffect(() => {
    const candidate = initialDay && /^\d{4}-\d{2}-\d{2}$/.test(initialDay) ? new Date(initialDay + "T12:00:00") : null;
    if (!candidate || dayKey(candidate) !== initialDay) return;
    setSelectedDay(initialDay);
    setMonth(new Date(candidate.getFullYear(), candidate.getMonth(), 1));
  }, [initialDay]);
  const createMemory = useMemoryStore((s) => s.createMemory);
  const patchMemory = useMemoryStore((s) => s.patchMemory);
  const removeMemory = useMemoryStore((s) => s.removeMemory);
  const togglePin = useMemoryStore((s) => s.togglePin);
  const monthLabel = `${month.getFullYear()}年 · ${MONTHS[month.getMonth()]}`;
  const firstWeekday = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    memories.forEach((m) => map.set(entryDay(m), (map.get(entryDay(m)) ?? 0) + 1));
    return map;
  }, [memories]);
  const tagOptions = useMemo(() => [...new Set(memories.flatMap((memory) => memory.tags))].sort((a, b) => a.localeCompare(b, "zh-CN")), [memories]);
  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return memories.filter((m) => view === "saved" ? m.pinned : entryDay(m) === selectedDay)
      .filter((m) => !q || m.text.toLocaleLowerCase().includes(q) || m.tags.some((tag) => tag.toLocaleLowerCase().includes(q)))
      .filter((m) => !selectedTag || m.tags.includes(selectedTag))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [memories, query, selectedDay, selectedTag, view]);
  const moveMonth = (delta: number) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  const selectDay = (key: string) => { setSelectedDay(key); setSearchParams({ day: key }, { replace: true }); const [y, m] = key.split("-").map(Number); setMonth(new Date(y, m - 1, 1)); };
  const moveDay = (delta: number) => { const [y,m,d] = selectedDay.split("-").map(Number); const next = new Date(y,m-1,d+delta); selectDay(dayKey(next)); };
  const jumpToday = () => selectDay(dayKey(new Date()));
  const openEntry = (entry: MemoryEntry) => { setOpened(entry); setDraft(entry.text); setDraftTags(entry.tags.join("，")); setEditingOpened(false); setActionError(""); setConfirmDelete(false); };
  const runMemoryAction = async (key: string, action: () => Promise<void>, onSuccess?: () => void) => {
    setBusyAction(key);
    setActionError("");
    try {
      await action();
      onSuccess?.();
    } catch (error) {
      console.error("[memory] action failed", error);
      setActionError("这次没有保存成功，请检查网络或稍后重试；刚才填写的内容仍为你保留。");
    } finally {
      setBusyAction(null);
    }
  };
  const saveNewMemory = () => runMemoryAction("create", () => createMemory(newText, { tags: parseTags(newTags), createdAt: new Date(`${selectedDay}T12:00:00`).getTime() }), () => { setNewText(""); setNewTags(""); setShowComposer(false); });
  const saveOpenedMemory = () => opened && runMemoryAction("edit", () => patchMemory(opened.id, { text: draft.trim(), tags: parseTags(draftTags) }), () => { setOpened(null); setEditingOpened(false); });
  const deleteOpenedMemory = () => opened && runMemoryAction("delete", () => removeMemory(opened.id), () => setOpened(null));
  const requestCloseOpened = () => {
    const changed = Boolean(editingOpened && opened && (draft !== opened.text || parseTags(draftTags).join("|") !== opened.tags.join("|")));
    if (changed) setConfirmDiscard("edit"); else setOpened(null);
  };
  const requestCloseComposer = () => {
    if (newText.trim() || newTags.trim()) setConfirmDiscard("new"); else setShowComposer(false);
  };
  const discardPendingChanges = () => {
    if (confirmDiscard === "edit") { setOpened(null); setEditingOpened(false); }
    if (confirmDiscard === "new") { setShowComposer(false); setNewText(""); setNewTags(""); }
    setConfirmDiscard(null);
  };
  const exportMemories = () => {
    const payload = { exportedAt: new Date().toISOString(), format: "jinghua-memory-backup-v1", memories };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `镜花水月-记忆备份-${dayKey(new Date())}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <main className="memory-archive-page">
    <header className="ma-topline"><BackButton /><span>JING HUA SHUI YUE <i>/</i> MEMORY ATLAS</span><span className="ma-top-index">03 — 12</span></header>
    <section className="ma-heading"><div><p className="ma-eyebrow">A MAP OF THE DAYS WE KEEP</p><h1>藏忆阁<span>。</span></h1><p className="ma-subtitle">把走过的日子，慢慢收进时间里。</p></div><div className="ma-seal" aria-hidden="true"><span>忆</span><small>MEMORY</small></div></section>
    <nav className="ma-nav" aria-label="记忆档案分类">
      <button className={view === "index" ? "active" : ""} onClick={() => setView("index")}><b>01</b> 时日笺</button>
      <button className={view === "saved" ? "active" : ""} onClick={() => setView("saved")}><b>02</b> 珍藏页</button>
      <Link className="ma-tree-link" to="/memory/tree"><b>03</b> 时日树 ↗</Link>
    </nav>
    {view === "index" && <section className="ma-calendar-section">
      <div className="ma-section-head"><div><span className="ma-eyebrow">BROWSE BY DATE</span><h2>日历索引</h2></div><div className="ma-month-control"><button aria-label="上个月" onClick={() => moveMonth(-1)}>‹</button><strong>{monthLabel}</strong><button aria-label="下个月" onClick={() => moveMonth(1)}>›</button></div></div>
      <div className="ma-calendar">{["日","一","二","三","四","五","六"].map((d) => <span className="ma-weekday" key={d}>{d}</span>)}
        {Array.from({ length: firstWeekday }, (_, i) => <span className="ma-day-empty" key={`blank-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => { const day = i + 1; const key = dayKey(new Date(month.getFullYear(), month.getMonth(), day)); const count = counts.get(key) ?? 0; return <button key={key} className={`ma-day ${selectedDay === key ? "selected" : ""} ${count ? "has-memory" : ""}`} onClick={() => selectDay(key)}><span>{day}</span>{count > 0 && <i aria-label={`${count} 条记忆`} />}</button>; })}
      </div>
      <div className="ma-calendar-foot"><span><i /> 有记忆的日子</span><div className="ma-day-jump"><button onClick={() => moveDay(-1)} aria-label="前一天">‹</button><button onClick={jumpToday}>今天</button><button onClick={() => moveDay(1)} aria-label="后一天">›</button><span>{selectedDay} · {counts.get(selectedDay) ?? 0} 条</span></div></div>
    </section>}
    <section className="ma-records">
      {actionError && <p className="ma-action-error" role="alert">{actionError}</p>}
      {view === "saved" && <div className="ma-collection-intro"><div className="ma-collection-kicker"><span>THE PRIVATE EDITION</span><i>✧</i><span>VOL. 01</span></div><div className="ma-collection-title"><div><span className="ma-eyebrow">A FEW THINGS WORTH KEEPING</span><h2>珍藏<span>。</span></h2><p>那些不想让时间带走的片刻。</p></div><div className="ma-collection-index"><strong>{memories.filter((m) => m.pinned).length.toString().padStart(2,"0")}</strong><small>KEPT MOMENTS</small></div></div><div className="ma-collection-rule"><span>SELECTED MEMORIES</span><i /></div></div>}
      <div className="ma-record-heading"><div><span className="ma-eyebrow">{view === "saved" ? "KEPT CLOSE, KEPT SAFE" : "A DAY IN YOUR STORY"}</span><h2>{view === "saved" ? "精选目录" : "日常记忆"}</h2></div><span className="ma-record-count">{visible.length.toString().padStart(2, "0")} <small>ENTRIES</small></span></div>
      <label className="ma-search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索文字、标签与片段…" />{query && <button className="ma-search-clear" type="button" onClick={() => setQuery("")}>清除</button>}<kbd>SEARCH</kbd></label>
      <div className="ma-tools-row"><div className="ma-tag-filters" aria-label="按标签筛选"><button type="button" className={!selectedTag ? "active" : ""} aria-pressed={!selectedTag} onClick={() => setSelectedTag("")}>全部标签</button>{tagOptions.map((tag) => <button type="button" key={tag} className={selectedTag === tag ? "active" : ""} aria-pressed={selectedTag === tag} onClick={() => setSelectedTag(selectedTag === tag ? "" : tag)}>#{tag}</button>)}</div><button type="button" className="ma-export" onClick={exportMemories} disabled={!memories.length}>↓ 导出备份</button></div>
      <div className="ma-entry-list">{visible.map((entry, index) => <article className={`ma-entry ${view === "saved" ? "ma-entry-saved" : ""} ${view === "saved" && index === 0 ? "ma-entry-featured" : ""}`} key={entry.id}><div className="ma-entry-rail"><span>{String(index + 1).padStart(2, "0")}</span><i /></div><button className="ma-entry-body" onClick={() => openEntry(entry)}>{view === "saved" && (!visible[index - 1] || entryDay(visible[index - 1]) !== entryDay(entry)) && <span className="ma-entry-date-divider"><i />{new Date(entry.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}<small>DAY NOTE</small></span>}<div className="ma-entry-meta"><span>{new Date(entry.createdAt).toLocaleString("zh-CN", { month:"numeric", day:"numeric", hour:"2-digit", minute:"2-digit" })}</span><span>{entry.pinned ? "✦ 已珍藏" : entry.kind === "todo" ? "待完成" : entry.kind === "feel" ? "心绪" : "记忆"}</span></div><p>{entry.text}</p>{entry.tags.length > 0 && <div className="ma-tags">{entry.tags.slice(0, 4).map((tag) => <span key={tag}>#{tag}</span>)}</div>}</button><button className={`ma-pin ${entry.pinned ? "is-pinned" : ""}`} aria-label={entry.pinned ? "取消珍藏" : "加入珍藏"} onClick={() => void runMemoryAction(`pin:${entry.id}`, () => togglePin(entry.id))} disabled={busyAction === `pin:${entry.id}`}>✧</button></article>)}
        {!visible.length && <div className="ma-empty"><span>◌</span><strong>{loading ? "正在整理记忆…" : view === "saved" ? "还没有珍藏的片段" : "这一天暂时空白"}</strong><p>{view === "saved" ? "试试其他关键词，或把值得留下的片段标记为珍藏。" : "留白也是时间的一部分。你可以在这里写下一段记忆。"}</p></div>}
      </div>
      {view === "index" ? <button className="ma-compose" onClick={() => setShowComposer(true)}><span>＋</span> 写下一段记忆</button> : <p className="ma-collection-note">在时日笺中，点亮记录旁的 ✧，便能把它收进这本私人选集。</p>}
    </section>
    <footer className="ma-footer"><span>EVERY DAY LEAVES A TRACE</span><span>镜花水月 · 私人记忆档案</span></footer>
    <Sheet open={Boolean(opened)} onClose={requestCloseOpened} title="时日笺" panelClassName="memory-mirror-sheet">{opened && <div className="ma-detail">{actionError && <p className="ma-action-error" role="alert">{actionError}</p>}{confirmDiscard === "edit" && <div className="ma-discard-confirm" role="alertdialog" aria-label="放弃未保存的修改"><strong>还有修改没有保存</strong><p>现在离开，这些编辑内容将不会保留。</p><div><button type="button" onClick={() => setConfirmDiscard(null)}>继续编辑</button><button type="button" className="danger" onClick={discardPendingChanges}>放弃修改</button></div></div>}<p className="ma-eyebrow">{new Date(opened.createdAt).toLocaleString("zh-CN", { dateStyle: "long", timeStyle: "short" })}</p>{editingOpened ? <><textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={7} maxLength={5000} /><label className="ma-tag-editor"><span>记忆标签</span><input value={draftTags} onChange={(e) => setDraftTags(e.target.value)} maxLength={180} placeholder="用逗号分隔，例如：旅行，日常" /></label></> : <div className="ma-reading-text"><p>{opened.text}</p>{opened.tags.length > 0 && <div className="ma-tags">{opened.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>}</div>}<div className="ma-detail-actions">{editingOpened ? <><button disabled={!draft.trim() || busyAction !== null} onClick={() => void saveOpenedMemory()}>{busyAction === "edit" ? "正在保存…" : "保存修改"}</button><button disabled={busyAction !== null} onClick={() => { setDraft(opened.text); setDraftTags(opened.tags.join("，")); setEditingOpened(false); }}>取消编辑</button></> : <button disabled={busyAction !== null} onClick={() => setEditingOpened(true)}>编辑内容</button>}<button disabled={busyAction !== null} onClick={() => void runMemoryAction("detail-pin", () => togglePin(opened.id), () => setOpened(null))}>{opened.pinned ? "取消珍藏" : "珍藏这段"}</button><button className="danger" disabled={busyAction !== null} onClick={() => setConfirmDelete((value) => !value)}>删除</button><button disabled={busyAction !== null} onClick={() => { selectDay(dayKey(new Date(opened.createdAt))); setView("index"); setOpened(null); setEditingOpened(false); }}>查看这一天</button></div>{confirmDelete && <div className="ma-delete-confirm" role="alertdialog" aria-labelledby="ma-delete-title"><strong id="ma-delete-title">确定要删除这段记忆吗？</strong><p>删除后，这段记录将从藏忆阁中移除。</p><div><button type="button" disabled={busyAction !== null} onClick={() => setConfirmDelete(false)}>再想一想</button><button type="button" className="danger" disabled={busyAction !== null} onClick={() => void deleteOpenedMemory()}>{busyAction === "delete" ? "正在删除…" : "确认删除"}</button></div></div>}</div>}</Sheet>
    <Sheet open={showComposer} onClose={requestCloseComposer} title="写下一段记忆" panelClassName="memory-mirror-sheet"><div className="ma-detail">{actionError && <p className="ma-action-error" role="alert">{actionError}</p>}{confirmDiscard === "new" && <div className="ma-discard-confirm" role="alertdialog" aria-label="放弃尚未收入的记忆"><strong>这段记忆还没有收入</strong><p>离开后，当前填写的内容将被清空。</p><div><button type="button" onClick={() => setConfirmDiscard(null)}>继续写</button><button type="button" className="danger" onClick={discardPendingChanges}>放弃内容</button></div></div>}<p className="ma-eyebrow">A SMALL NOTE TO KEEP</p><div className="ma-compose-date"><span>写入日期</span><strong>{selectedDay}</strong><button onClick={jumpToday}>改为今天</button></div><textarea value={newText} onChange={(e) => setNewText(e.target.value)} rows={6} maxLength={5000} placeholder="今天有什么想留下？" /><label className="ma-tag-editor"><span>添加标签 <small>选填 · 最多 8 个</small></span><input value={newTags} onChange={(e) => setNewTags(e.target.value)} maxLength={180} placeholder="例如：生活，灵感，旅行" /></label><div className="ma-detail-actions"><button disabled={!newText.trim() || busyAction !== null} onClick={() => void saveNewMemory()}>{busyAction === "create" ? "正在收入…" : "收入记忆"}</button></div></div></Sheet>
  </main>;
}
