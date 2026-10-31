import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BackButton } from "../components/ui/BackButton";
import { useMemoryStore } from "../stores/memoryStore";
import type { MemoryEntry } from "../types";
import "./memory-tree.css";

const pad = (n: number) => String(n).padStart(2, "0");
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const entryDay = (m: MemoryEntry) => dayKey(new Date(m.createdAt));

export function MemoryTree() {
  const memories = useMemoryStore((s) => s.memories);
  const frame = useRef<HTMLIFrameElement>(null);
  const navigate = useNavigate();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [openedDay, setOpenedDay] = useState<string | null>(null);
  const years = useMemo(() => [...new Set(memories.map(m => new Date(m.createdAt).getFullYear()))].sort((a,b)=>b-a), [memories]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const moveMonth = (delta: number) => { const next = new Date(year, month - 1 + delta, 1); setYear(next.getFullYear()); setMonth(next.getMonth() + 1); };
  const jumpCurrentMonth = () => { const now = new Date(); setYear(now.getFullYear()); setMonth(now.getMonth() + 1); };
  const records = useMemo(() => {
    const grouped = new Map<string, MemoryEntry[]>();
    memories.filter(m => { const d = new Date(m.createdAt); return d.getFullYear() === year && d.getMonth() + 1 === month; }).forEach(m => { const k=entryDay(m); grouped.set(k,[...(grouped.get(k)||[]),m]); });
    return [...grouped.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([day, entries])=>({day,count:entries.length,text:entries.map(m=>m.text).join(" · "),createdAt:entries[0]?.createdAt ?? Date.now()}));
  }, [memories, year, month]);
  useEffect(() => {
    const send = () => frame.current?.contentWindow?.postMessage({type:"mirror-memory-data",records},window.location.origin);
    const onMessage = (e: MessageEvent) => {
      if(e.origin!==window.location.origin || e.source!==frame.current?.contentWindow)return;
      if(e.data?.type==="mirror-memory-ready")send();
      if(e.data?.type==="mirror-memory-height" && typeof e.data.height==="number" && Number.isFinite(e.data.height)){frame.current.style.height=`${Math.max(720,Math.min(2400,Math.ceil(e.data.height)))}px`;}
      if(e.data?.type==="mirror-memory-open" && typeof e.data.day==="string" && /^\d{4}-\d{2}-\d{2}$/.test(e.data.day) && dayKey(new Date(e.data.day+"T12:00:00"))===e.data.day)setOpenedDay(e.data.day);
    };
    window.addEventListener("message",onMessage); send(); return ()=>window.removeEventListener("message",onMessage);
  }, [records,navigate]);
  const openedEntries = openedDay ? memories.filter((entry) => entryDay(entry) === openedDay).sort((a,b) => a.createdAt - b.createdAt) : [];
  const closeMemory = () => setOpenedDay(null);
  return <main className="memory-tree-page">
    <div className="mt-floating-nav"><BackButton /><button className="mt-tools-trigger" type="button" aria-label="打开时日树工具" aria-expanded={toolsOpen} onClick={()=>setToolsOpen(v=>!v)}><span></span><span></span><span></span></button></div>
    {toolsOpen && <aside className="mt-tools-panel" aria-label="时日树辅助工具">
      <div className="mt-tools-title"><span>THE TREE OF DAYS</span><button type="button" onClick={()=>setToolsOpen(false)} aria-label="关闭">×</button></div>
      <h2>时日树</h2>
      <p className="mt-tools-note">让走过的日子，在枝头留下回响。</p>
      <div className="mt-tools-period"><label>年份<select value={year} onChange={e=>setYear(Number(e.target.value))}>{[...new Set([new Date().getFullYear(),...years])].sort((a,b)=>b-a).map(y=><option key={y} value={y}>{y} 年</option>)}</select></label><label>月份<select value={month} onChange={e=>setMonth(Number(e.target.value))}>{Array.from({length:12},(_,i)=>i+1).map(m=><option key={m} value={m}>{m} 月</option>)}</select></label></div>
      <div className="mt-tools-actions"><button onClick={() => moveMonth(-1)}>上个月</button><button onClick={jumpCurrentMonth}>回到本月</button><button onClick={() => moveMonth(1)}>下个月</button></div>
      <p className="mt-tools-count">{records.length} 个有记忆的日子 <i>·</i> {records.reduce((n,r)=>n+r.count,0)} 段记忆</p>
      <p className="mt-tools-hint">轻触树上的挂签，回到那一天。</p>
    </aside>}
    <section className="mt-tree-shell" aria-label="完整时日树">
      <iframe ref={frame} title="镜花水月年度记忆树" src="/co-space/vendor/sealed-days/index.html" className="mt-original-tree" loading="eager" />
    </section>
    {openedDay && <div className="mt-memory-reveal" role="dialog" aria-modal="true" aria-label={`${openedDay} 的记忆`} onMouseDown={(event) => { if (event.target === event.currentTarget) closeMemory(); }}>
      <section className="mt-memory-sheet">
        <div className="mt-memory-sheet-top"><span>JING HUA SHUI YUE <i>/</i> MEMORY NOTE</span><button type="button" onClick={closeMemory} aria-label="关闭记忆">×</button></div>
        <p className="mt-memory-kicker">A DAY PRESERVED IN TIME</p>
        <h2>{new Date(`${openedDay}T12:00:00`).toLocaleDateString("zh-CN", {year:"numeric",month:"long",day:"numeric",weekday:"long"})}</h2>
        <div className="mt-memory-rule"><span>{String(openedEntries.length).padStart(2,"0")} ENTRIES</span><i /></div>
        <div className="mt-memory-list">{openedEntries.length ? openedEntries.map((entry,index) => <article className="mt-memory-entry" key={entry.id}><div className="mt-memory-entry-meta"><span>{String(index+1).padStart(2,"0")}</span><time>{new Date(entry.createdAt).toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit"})}</time><span>{entry.pinned ? "✧ 已珍藏" : entry.kind === "feel" ? "心绪" : entry.kind === "todo" ? "待完成" : "记忆"}</span></div><p>{entry.text}</p>{entry.tags.length > 0 && <div className="mt-memory-tags">{entry.tags.map(tag => <span key={tag}>#{tag}</span>)}</div>}</article>) : <p className="mt-memory-empty">这一天暂时没有可显示的记忆。</p>}</div>
        <div className="mt-memory-bottom"><span>EVERY DAY LEAVES A TRACE</span><button type="button" onClick={() => { navigate(`/memory?day=${openedDay}`); closeMemory(); }}>打开完整档案 ↗</button></div>
      </section>
    </div>}
  </main>;
}
