import { useMemo, useState } from "react";
import { BackButton } from "../components/ui/BackButton";
import { Sheet } from "../components/ui/kit";
import { useMemoryStore } from "../stores/memoryStore";
import type { MemoryEntry } from "../types";
import "./memory-archive.css";

const MONTHS = ["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"];
const pad = (n: number) => String(n).padStart(2, "0");
const dayKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const entryDay = (entry: MemoryEntry) => dayKey(new Date(entry.createdAt));

export function Memory() {
  const memories = useMemoryStore((s) => s.memories);
  const loading = useMemoryStore((s) => s.loading);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(dayKey(new Date()));
  const [view, setView] = useState<"tree" | "saved" | "index">("tree");
  const [query, setQuery] = useState("");
  const [opened, setOpened] = useState<MemoryEntry | null>(null);
  const [draft, setDraft] = useState("");
  const [newText, setNewText] = useState("");
  const [showComposer, setShowComposer] = useState(false);
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
  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return memories.filter((m) => view === "saved" ? m.pinned : view === "index" ? true : entryDay(m) === selectedDay)
      .filter((m) => !q || m.text.toLocaleLowerCase().includes(q) || m.tags.some((tag) => tag.toLocaleLowerCase().includes(q)))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [memories, query, selectedDay, view]);
  const selectedDate = new Date(`${selectedDay}T12:00:00`);
  const moveMonth = (delta: number) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  const openEntry = (entry: MemoryEntry) => { setOpened(entry); setDraft(entry.text); };

  return <main className="memory-archive-page">
    <header className="ma-topline"><BackButton /><span>JING HUA SHUI YUE <i>/</i> MEMORY ATLAS</span><span className="ma-top-index">03 — 12</span></header>
    <section className="ma-heading"><div><p className="ma-eyebrow">A MAP OF THE DAYS WE KEEP</p><h1>藏忆阁<span>。</span></h1><p className="ma-subtitle">把走过的日子，慢慢收进时间里。</p></div><div className="ma-seal" aria-hidden="true"><span>忆</span><small>MEMORY</small></div></section>
    <nav className="ma-nav" aria-label="记忆档案分类">
      <button className={view === "tree" ? "active" : ""} onClick={() => setView("tree")}><b>01</b> 时日树</button>
      <button className={view === "saved" ? "active" : ""} onClick={() => setView("saved")}><b>02</b> 珍藏页</button>
      <button className={view === "index" ? "active" : ""} onClick={() => setView("index")}><b>03</b> 记忆索引</button>
    </nav>
    {view === "tree" && <section className="ma-calendar-section">
      <div className="ma-section-head"><div><span className="ma-eyebrow">THE MEMORY TREE</span><h2>时日树</h2></div><div className="ma-month-control"><button aria-label="上个月" onClick={() => moveMonth(-1)}>‹</button><strong>{monthLabel}</strong><button aria-label="下个月" onClick={() => moveMonth(1)}>›</button></div></div>
      <div className="ma-tree-stage">
        <div className="ma-tree-caption"><span>THE TREE OF DAYS</span><i>✧</i><span>{counts.size} 个被记住的日子</span></div>
        <div className="ma-tree-art">
          <div className="ma-tree-halo" />
          <svg className="ma-tree-svg" viewBox="0 0 360 300" role="img" aria-label="一棵承载记忆的月下之树">
            <defs>
              <linearGradient id="ma-bark" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#b8cbd1"/><stop offset=".48" stopColor="#789eac"/><stop offset="1" stopColor="#d4e1e4"/></linearGradient>
              <linearGradient id="ma-leaf" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f8fcfd"/><stop offset=".55" stopColor="#c5dce3"/><stop offset="1" stopColor="#8fb6c5"/></linearGradient>
              <radialGradient id="ma-moon"><stop stopColor="#fff"/><stop offset="1" stopColor="#d9edf3" stopOpacity=".12"/></radialGradient>
              <filter id="ma-soft"><feGaussianBlur stdDeviation="7"/></filter>
            </defs>
            <circle cx="180" cy="134" r="105" fill="url(#ma-moon)" opacity=".55"/>
            <ellipse cx="180" cy="272" rx="94" ry="12" fill="#8eafbc" opacity=".15" filter="url(#ma-soft)"/>
            <path d="M177 267 C166 230 190 204 177 169 C166 140 144 119 115 99 M180 206 C205 182 216 155 220 124 C224 97 244 82 265 68 M174 179 C148 164 119 159 91 145 M188 186 C215 173 246 171 275 151 M174 142 C163 116 163 91 173 63 M209 151 C191 126 190 99 199 77" fill="none" stroke="url(#ma-bark)" strokeWidth="9" strokeLinecap="round"/>
            <path d="M177 265 C174 232 183 209 178 179" fill="none" stroke="#eef6f8" strokeWidth="2" opacity=".8"/>
            {Array.from({length:24},(_,i)=>{const a=i*2.399;const r=35+(i%5)*17;const x=180+Math.cos(a)*r*1.55;const y=133+Math.sin(a)*r*.82;return <g key={i} transform={`translate(${x} ${y}) rotate(${i*31})`}><ellipse rx={7+(i%3)} ry={13+(i%4)} fill="url(#ma-leaf)" opacity={.72+(i%3)*.08}/><path d="M0 -10 Q1 0 0 10" stroke="#fff" strokeWidth=".8" opacity=".7"/></g>;})}
            <path d="M100 270 Q180 251 260 270" fill="none" stroke="#9bb9c5" strokeWidth="1.4" opacity=".7"/>
            <circle cx="180" cy="268" r="5" fill="#d9e9ee" stroke="#8eafbc"/>
          </svg>
          <div className="ma-tree-orbit ma-orbit-one">✧</div><div className="ma-tree-orbit ma-orbit-two">·</div><div className="ma-tree-orbit ma-orbit-three">✦</div>
          <div className="ma-tree-note ma-note-left"><small>ROOTED IN TIME</small><b>每一日</b><span>都值得被收藏</span></div>
          <div className="ma-tree-note ma-note-right"><small>MEMORY BLOOMS</small><b>{memories.length.toString().padStart(2,"0")}</b><span>段记忆枝叶</span></div>
          {memories.slice().sort((a,b)=>b.createdAt-a.createdAt).slice(0,5).map((entry,i)=><button key={entry.id} className={`ma-tree-charm ma-charm-${i} ${selectedDay===entryDay(entry)?"is-active":""}`} onClick={()=>setSelectedDay(entryDay(entry))} aria-label={`查看${entryDay(entry)}的记忆`}><span>{["✧","❀","◈","✦","❋"][i]}</span><small>{new Date(entry.createdAt).getDate()}</small></button>)}
        </div>
        <p className="ma-tree-motto">“时间没有带走一切，它让珍贵的事物长成了树。”</p>
      </div>
      <div className="ma-calendar">{["日","一","二","三","四","五","六"].map((d) => <span className="ma-weekday" key={d}>{d}</span>)}
        {Array.from({ length: firstWeekday }, (_, i) => <span className="ma-day-empty" key={`blank-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => { const day = i + 1; const key = dayKey(new Date(month.getFullYear(), month.getMonth(), day)); const count = counts.get(key) ?? 0; return <button key={key} className={`ma-day ${selectedDay === key ? "selected" : ""} ${count ? "has-memory" : ""}`} onClick={() => setSelectedDay(key)}><span>{day}</span>{count > 0 && <i aria-label={`${count} 条记忆`} />}</button>; })}
      </div>
      <div className="ma-calendar-foot"><span><i /> 有记忆的日子</span><span>{memories.length} 条记录 · {counts.size} 个日子</span></div>
    </section>}
    <section className="ma-records">
      <div className="ma-record-heading"><div><span className="ma-eyebrow">{view === "tree" ? "A DAY IN YOUR STORY" : view === "saved" ? "KEPT CLOSE, KEPT SAFE" : "FIND A THREAD"}</span><h2>{view === "tree" ? <>{selectedDate.getMonth() + 1}月{selectedDate.getDate()}日 <small>· 当日笺</small></> : view === "saved" ? "珍藏的片段" : "记忆索引"}</h2></div><span className="ma-record-count">{visible.length.toString().padStart(2, "0")} <small>ENTRIES</small></span></div>
      <label className="ma-search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索文字、标签与片段…" /><kbd>SEARCH</kbd></label>
      <div className="ma-entry-list">{visible.map((entry, index) => <article className="ma-entry" key={entry.id}><div className="ma-entry-rail"><span>{String(index + 1).padStart(2, "0")}</span><i /></div><button className="ma-entry-body" onClick={() => openEntry(entry)}><div className="ma-entry-meta"><span>{new Date(entry.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</span><span>{entry.pinned ? "✦ 已珍藏" : entry.kind === "todo" ? "待完成" : entry.kind === "feel" ? "心绪" : "记忆"}</span></div><p>{entry.text}</p>{entry.tags.length > 0 && <div className="ma-tags">{entry.tags.slice(0, 4).map((tag) => <span key={tag}>#{tag}</span>)}</div>}</button><button className={`ma-pin ${entry.pinned ? "is-pinned" : ""}`} aria-label={entry.pinned ? "取消珍藏" : "加入珍藏"} onClick={() => void togglePin(entry.id)}>✧</button></article>)}
        {!visible.length && <div className="ma-empty"><span>◌</span><strong>{loading ? "正在整理记忆…" : "这一天暂时空白"}</strong><p>{view === "tree" ? "留白也是时间的一部分。你可以在这里写下一段记忆。" : "试试其他关键词，或把值得留下的片段标记为珍藏。"}</p></div>}
      </div>
      <button className="ma-compose" onClick={() => setShowComposer(true)}><span>＋</span> 写下一段记忆</button>
    </section>
    <footer className="ma-footer"><span>EVERY DAY LEAVES A TRACE</span><span>镜花水月 · 私人记忆档案</span></footer>
    <Sheet open={Boolean(opened)} onClose={() => setOpened(null)} title="时日笺" panelClassName="memory-mirror-sheet">{opened && <div className="ma-detail"><p className="ma-eyebrow">{new Date(opened.createdAt).toLocaleString("zh-CN", { dateStyle: "long", timeStyle: "short" })}</p><textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={7} /><div className="ma-detail-actions"><button onClick={() => { void patchMemory(opened.id, { text: draft.trim() }); setOpened(null); }}>保存修改</button><button onClick={() => { void togglePin(opened.id); setOpened(null); }}>{opened.pinned ? "取消珍藏" : "珍藏这段"}</button><button className="danger" onClick={() => { void removeMemory(opened.id); setOpened(null); }}>删除</button></div></div>}</Sheet>
    <Sheet open={showComposer} onClose={() => setShowComposer(false)} title="写下一段记忆" panelClassName="memory-mirror-sheet"><div className="ma-detail"><p className="ma-eyebrow">A SMALL NOTE TO KEEP</p><textarea value={newText} onChange={(e) => setNewText(e.target.value)} rows={6} placeholder="今天有什么想留下？" /><div className="ma-detail-actions"><button disabled={!newText.trim()} onClick={() => { void createMemory(newText); setNewText(""); setShowComposer(false); }}>收入记忆</button></div></div></Sheet>
  </main>;
}
