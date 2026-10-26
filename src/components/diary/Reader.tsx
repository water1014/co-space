import { useState } from "react";
import type { Annotation, Book } from "../../types";
import { IconClose, IconSpark } from "../ui/icons";
import { Sheet } from "../ui/kit";

/**
 * 阅读器：选中一段文字 → 浮出 [批注] → 写下批注 → AI 针对“那一句”回一句，
 * 以卡片浮在段落下方。划线定位到具体段落（paraIndex），所以回复贴得回去。
 */
export function Reader({
  book,
  annotations,
  onAdd,
}: {
  book: Book;
  annotations: Annotation[];
  onAdd: (paraIndex: number, quote: string, note: string) => void;
}) {
  const [sel, setSel] = useState<{
    paraIndex: number;
    quote: string;
    top: number;
    left: number;
  } | null>(null);
  const [pending, setPending] = useState<{
    paraIndex: number;
    quote: string;
  } | null>(null);
  const [note, setNote] = useState("");

  const handleSelect = (paraIndex: number) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSel(null);
      return;
    }
    const text = selection.toString().trim();
    if (text.length < 2) {
      setSel(null);
      return;
    }
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setSel({
      paraIndex,
      quote: text,
      top: rect.top,
      left: rect.left + rect.width / 2,
    });
  };

  const confirm = () => {
    if (!pending) return;
    onAdd(pending.paraIndex, pending.quote, note.trim());
    setNote("");
    setPending(null);
    setSel(null);
    window.getSelection()?.removeAllRanges();
  };

  return (
    <div className="relative">
      <div className="mb-4 flex items-baseline justify-between px-1">
        <div>
          <p className="serif text-[16px] text-ink">{book.title}</p>
          <p className="mt-0.5 text-[11px] text-ink-faint">{book.author}</p>
        </div>
        <span className="text-[10.5px] text-ink-faint">
          选中一句，点「批注」
        </span>
      </div>

      <article className="space-y-5">
        {book.paragraphs.map((p, i) => {
          const notes = annotations.filter((a) => a.paraIndex === i);
          return (
            <div key={i}>
              <p
                onMouseUp={() => handleSelect(i)}
                className="serif cursor-text text-[15px] leading-[2.05] text-ink/90 selection:bg-[var(--accent)]/30"
              >
                {p}
              </p>

              {notes.map((a) => (
                <div
                  key={a.id}
                  className="mt-3 rounded-2xl border border-[var(--line)] bg-white/5 p-3.5"
                >
                  <p className="text-[12.5px] leading-[1.8] text-ink-faint">
                    “{a.quote}”
                  </p>
                  {a.note && (
                    <p className="mt-2 border-l-2 border-[var(--accent)] pl-2.5 text-[13px] leading-[1.85] text-ink-soft">
                      {a.note}
                    </p>
                  )}
                  <div className="mt-2.5 flex items-start gap-2">
                    <IconSpark
                      width={13}
                      height={13}
                      className="mt-0.5 flex-none text-[var(--accent)]"
                    />
                    <p className="serif text-[13.5px] leading-[1.9] text-ink">
                      {a.reply}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </article>

      {/* 选区浮出的批注按钮 */}
      {sel && (
        <button
          onClick={() => setPending({ paraIndex: sel.paraIndex, quote: sel.quote })}
          style={{
            position: "fixed",
            top: Math.max(8, sel.top - 46),
            left: sel.left,
            transform: "translateX(-50%)",
            zIndex: 60,
          }}
          className="press rounded-full bg-[var(--accent)] px-3.5 py-1.5 text-[12px] text-[var(--accent-ink)] shadow-2xl"
        >
          批注
        </button>
      )}

      <Sheet
        open={Boolean(pending)}
        onClose={() => {
          setPending(null);
          setNote("");
        }}
        title="写一句批注"
      >
        {pending && (
          <div>
            <p className="serif border-l-2 border-[var(--accent)] pl-2.5 text-[13.5px] leading-[1.85] text-ink-soft">
              “{pending.quote}”
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="你为什么划这一句？（可留空）"
              className="serif mt-3 w-full resize-none bg-transparent text-[14.5px] leading-[1.9] text-ink"
            />
            <button
              onClick={confirm}
              className="press mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] py-2.5 text-[13px] text-[var(--accent-ink)]"
            >
              <IconSpark width={14} height={14} />
              让它在下面回一句
            </button>
            <button
              onClick={() => {
                setPending(null);
                setNote("");
              }}
              className="mt-2 flex w-full items-center justify-center gap-1.5 text-[12px] text-ink-faint"
            >
              <IconClose width={12} height={12} />
              取消
            </button>
          </div>
        )}
      </Sheet>
    </div>
  );
}
