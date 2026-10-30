import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconChevron, IconStudio, IconSpark } from "../components/ui/icons";

export function Studio() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const generate = () => {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setResult(null);
    window.setTimeout(() => {
      setBusy(false);
      setResult(prompt.trim());
    }, 1400);
  };

  return (
    <div className="px-5 pt-6 pb-10">
      <div className="flex items-start gap-2 pb-2 pt-1">
        <button onClick={() => navigate(-1)} aria-label="返回" className="press mt-2 text-ink-faint">
          <IconChevron width={16} height={16} className="rotate-180" />
        </button>
        <div>
          <h1 className="page-head-title text-[30px] leading-none text-ink">生图室</h1>
          <p className="page-head-sub mt-1 text-[12.5px]">AI 插画 · 情侣配图创作</p>
        </div>
      </div>

      <div className="card mt-5 rounded-3xl p-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="描述你想画的画面，例如：黄昏的海边，两个人牵手散步，水彩风格"
          rows={3}
          className="ghost-input w-full resize-none bg-transparent text-[14.5px] leading-[1.7] text-ink"
        />
        <button
          onClick={generate}
          disabled={!prompt.trim() || busy}
          className="tap mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] py-3 text-[14px] font-medium text-white disabled:opacity-40"
        >
          <IconSpark width={17} height={17} className={busy ? "animate-spin" : ""} />
          {busy ? "生成中…" : "生成插画"}
        </button>
      </div>

      <div className="card mt-4 overflow-hidden rounded-3xl">
        {result ? (
          <>
            <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-[#f3ddd3] via-[#f6e3dc] to-[#e9eef2] text-[#b3a08f]">
              <IconStudio width={40} height={40} />
            </div>
            <p className="border-t border-[var(--line)] px-4 py-2.5 text-[12.5px] leading-[1.6] text-ink-soft">
              {result}
            </p>
          </>
        ) : (
          <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 px-6 text-center text-ink-ghost">
            <IconStudio width={34} height={34} />
            <p className="text-[12.5px]">写下第一句 prompt，生成你们的专属插画</p>
          </div>
        )}
      </div>
    </div>
  );
}
