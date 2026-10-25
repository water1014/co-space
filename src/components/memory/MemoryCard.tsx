import { useState } from "react";
import { MEMORY_SOURCE_LABEL, type MemoryEntry } from "../../types";
import { useMemoryStore } from "../../stores/memoryStore";
import { formatClock, formatDate } from "../../lib/utils/id";

export function MemoryCard({ entry }: { entry: MemoryEntry }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.text);
  const [confirming, setConfirming] = useState(false);
  const patch = useMemoryStore((s) => s.patch);
  const remove = useMemoryStore((s) => s.remove);
  const togglePin = useMemoryStore((s) => s.togglePin);
  const toggleSeal = useMemoryStore((s) => s.toggleSeal);

  const save = async () => {
    const text = draft.trim();
    if (!text) return;
    await patch(entry.id, { text });
    setEditing(false);
  };

  return (
    <article
      className={`group relative transition-opacity duration-500 ${
        entry.sealed ? "opacity-45" : "opacity-100"
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] tracking-[0.14em] text-faint/70 uppercase">
        <span>{MEMORY_SOURCE_LABEL[entry.source]}</span>
        <span className="h-px w-3 bg-white/12" />
        <span>{formatDate(entry.createdAt)}</span>
        <span>{formatClock(entry.createdAt)}</span>
        {entry.pinned && (
          <span className="text-[rgb(var(--ambient)/0.8)] normal-case tracking-normal">
            · 固定
          </span>
        )}
        {entry.sealed && (
          <span className="normal-case tracking-normal text-faint">· 已封存</span>
        )}
      </div>

      {editing ? (
        <div className="mt-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            autoFocus
            className="w-full resize-none bg-transparent font-serif text-[15.5px] leading-[2] text-paper/90 outline-none"
          />
          <div className="mt-2 flex items-center gap-4 text-[11px]">
            <button
              onClick={() => void save()}
              className="text-paper/80 hover:text-paper"
            >
              保存
            </button>
            <button
              onClick={() => {
                setDraft(entry.text);
                setEditing(false);
              }}
              className="text-faint hover:text-muted"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-2.5 whitespace-pre-wrap font-serif text-[15.5px] leading-[2] text-paper/85">
          {entry.text}
        </p>
      )}

      {/* 清晰度：记忆会随时间变淡。线长就是它现在的强度，不写数字。 */}
      <div className="mt-3.5 h-px w-full bg-white/5">
        <div
          className="h-px bg-[rgb(var(--ambient)/0.28)] transition-all duration-700"
          style={{ width: `${Math.round(entry.weight * 100)}%` }}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-within:opacity-100">
        <button
          onClick={() => {
            setDraft(entry.text);
            setEditing(true);
          }}
          className="text-faint hover:text-paper/80"
        >
          编辑
        </button>
        <button
          onClick={() => void togglePin(entry.id)}
          className="text-faint hover:text-paper/80"
        >
          {entry.pinned ? "取消固定" : "固定"}
        </button>
        <button
          onClick={() => void toggleSeal(entry.id)}
          className="text-faint hover:text-paper/80"
        >
          {entry.sealed ? "解封" : "封存"}
        </button>
        {confirming ? (
          <span className="flex items-center gap-3">
            <button
              onClick={() => void remove(entry.id)}
              className="text-[#c98a8a] hover:text-[#e0a0a0]"
            >
              确认删除
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-faint hover:text-muted"
            >
              算了
            </button>
          </span>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="text-faint hover:text-[#c98a8a]"
          >
            删除
          </button>
        )}
      </div>
    </article>
  );
}
