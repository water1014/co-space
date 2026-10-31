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
    const onMessage = (e: MessageEvent) => { if(e.origin!==window.location.origin || e.source!==frame.current?.contentWindow)return; if(e.data?.type==="mirror-memory-ready")send(); if(e.data?.type==="mirror-memory-height" && typeof e.data.height==="number" && Number.isFinite(e.data.height)){frame.current.style.height=`${Math.max(720,Math.min(2400,Math.ceil(e.data.height)))}px`;} if(e.data?.type==="mirror-memory-open" && typeof e.data.day==="string" && /^\d{4}-\d{2}-\d{2}$/.test(e.data.day) && dayKey(new Date(e.data.day+"T12:00:00"))===e.data.day)navigate(`/memory?day=${e.data.day}`); };
    window.addEventListener("message",onMessage); send(); return ()=>window.removeEventListener("message",onMessage);
  }, [records,navigate]);
  return <main className="memory-tree-page">
    <header className="mt-topline"><BackButton /><span>JING HUA SHUI YUE <i>/</i> YEARLY MEMORY</span><small>03 — 03</small></header>
    <section className="mt-heading"><div><p className="mt-eyebrow">A YEAR, HELD IN BRANCHES</p><h1>时日树<span>。</span></h1><p>让走过的日子，在枝头留下回响。</p></div><div className="mt-seal">忆<small>YEARBOOK</small></div></section>
    <div className="mt-toolbar"><div><span className="mt-eyebrow">YOUR MEMORY GARDEN</span><strong>{year}<small> 年 · {String(month).padStart(2,"0")} 月</small></strong></div><div className="mt-period-controls"><label>年份<select value={year} onChange={e=>setYear(Number(e.target.value))}>{[...new Set([new Date().getFullYear(),...years])].sort((a,b)=>b-a).map(y=><option key={y} value={y}>{y} 年</option>)}</select></label><label>月份<select value={month} onChange={e=>setMonth(Number(e.target.value))}>{Array.from({length:12},(_,i)=>i+1).map(m=><option key={m} value={m}>{m} 月</option>)}</select></label><div className="mt-month-jump"><button onClick={() => moveMonth(-1)} aria-label="上个月">‹</button><button onClick={jumpCurrentMonth}>本月</button><button onClick={() => moveMonth(1)} aria-label="下个月">›</button></div></div></div>
    <section className="mt-tree-shell"><div className="mt-tree-caption">✧　THE TREE OF DAYS　✧</div><iframe ref={frame} title="镜花水月年度记忆树" src="/co-space/vendor/sealed-days/index.html" className="mt-original-tree" loading="eager" /><p className="mt-hint">{year} 年 {month} 月 · {records.length ? "轻触枝头的记忆挂签，回到那一天" : "这个月还没有留下记忆，枝叶正等候新的故事"}</p></section>
    <footer className="mt-foot"><span>{records.length} 个有记忆的日子</span><span>{records.reduce((n,r)=>n+r.count,0)} 段记忆 · {year} 年 {month} 月</span></footer>
  </main>;
}