import { useState } from "react";
import { ParticleLayer } from "../components/presence/ParticleLayer";
import { RoomHeader } from "../components/layout/RoomHeader";
import { MemoryTimeline } from "../components/memory/MemoryTimeline";
import { useMemoryStore } from "../stores/memoryStore";
import { useSpaceStore } from "../stores/spaceStore";
import type { MemoryFilter } from "../stores/memoryStore";

const FILTERS: { key: MemoryFilter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "pinned", label: "固定" },
  { key: "sealed", label: "封存" },
];

export function MemoryHall() {
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const create = useMemoryStore((s) => s.create);
  const query = useMemoryStore((s) => s.query);
  const setQuery = useMemoryStore((s) => s.setQuery);
  const filter = useMemoryStore((s) => s.filter);
  const setFilter = useMemoryStore((s) => s.setFilter);
  const setFocus = useSpaceStore((s) => s.setFocus);

  const save = async () => {
    if (!draft.trim()) return;
    await create(draft, "manual");
    setDraft("");
    setComposing(false);
    setFocus(false);
  };

  return (
    <div className="relative h-full overflow-hidden">
      <ParticleLayer intensity={0.42} />
      <div className="vignette pointer-events-none absolute inset-0" />

      <div className="slim-scroll relative z-10 h-full overflow-y-auto">
        <RoomHeader room="记忆回廊" />

        <div className="mx-auto w-full max-w-[46rem] px-6 pb-24 sm:px-10">
          <div className="mt-6 max-w-xl">
            <h1 className="font-serif text-[26px] leading-[1.6] text-paper/90">
              记忆回廊
            </h1>
            <p className="mt-3 font-serif text-[13.5px] leading-[2] text-muted/75">
              这里的每一条都带着来源和时间。你可以改、可以封存、可以删除。
              它不会绕过你决定记住什么。
            </p>
          </div>

          <div className="mt-10 flex items-center justify-between gap-6 border-b border-white/8 pb-3">
            <div className="flex items-center gap-5">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`text-[11px] tracking-[0.14em] transition-colors ${
                    filter === f.key
                      ? "text-paper/85"
                      : "text-faint/60 hover:text-muted"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="找一条"
              className="input-ghost w-28 border-b border-white/8 bg-transparent pb-1 text-right text-[12px] text-paper/85 transition-colors focus:border-white/25 sm:w-40"
            />
          </div>

          {composing ? (
            <div className="fadein mt-8">
              <p className="text-[10px] tracking-[0.2em] text-faint/60 uppercase">
                你写下的
              </p>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onFocus={() => setFocus(true)}
                onBlur={() => setFocus(false)}
                rows={3}
                autoFocus
                placeholder="一句你希望它记住的话。"
                className="textarea-ghost mt-3 w-full resize-none bg-transparent font-serif text-[16px] leading-[2] text-paper/88"
              />
              <div className="mt-2 flex items-center gap-5 text-[11px]">
                <button
                  onClick={() => void save()}
                  disabled={!draft.trim()}
                  className="text-paper/80 hover:text-paper disabled:opacity-30"
                >
                  留下
                </button>
                <button
                  onClick={() => {
                    setComposing(false);
                    setDraft("");
                    setFocus(false);
                  }}
                  className="text-faint hover:text-muted"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setComposing(true)}
              className="mt-8 text-[12px] text-faint transition-colors hover:text-paper/80"
            >
              ＋ 留下一条
            </button>
          )}

          <MemoryTimeline />

          <p className="mt-16 max-w-lg text-[11px] leading-[1.9] text-faint/45">
            记忆存放在这台设备的浏览器里，不会同步到别的设备。
            清除浏览器数据会一起清掉它。
          </p>
        </div>
      </div>
    </div>
  );
}
