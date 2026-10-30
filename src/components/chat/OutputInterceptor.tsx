import { BOUNDARY_RULE_LABEL, type BoundaryHit } from "../../types";

/**
 * 边界痕迹：拦截层在渲染前改写了什么，这里留痕。
 * 只接收 hits，不关心消息从哪来——它是 convertMessage 的产物，不是 render 的副作用。
 */
export function BoundaryTraceCard({ hits }: { hits: BoundaryHit[] }) {
  if (!hits.length) return null;

  const rules = Array.from(new Set(hits.map((h) => h.rule)));

  return (
    <div className="chat-boundary-card mt-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[10px] tracking-[0.2em] text-ink-faint uppercase">
          已校准
        </span>
        <span className="h-px w-3 bg-[var(--line-strong)]" />
        {rules.map((r) => (
          <span key={r} className="text-[11px] text-ink-faint">
            {BOUNDARY_RULE_LABEL[r]}
          </span>
        ))}
      </div>
      <details className="chat-boundary-details mt-1">
        <summary className="cursor-pointer list-none text-[10.5px] text-ink-faint/75 hover:text-ink-faint">
          看改了什么
        </summary>
        <div className="mt-2 space-y-2 border-l border-[var(--line)] pl-3">
          {hits.map((h, i) => (
            <div key={`${h.rule}-${i}`} className="space-y-0.5">
              <p className="text-[11px] leading-relaxed text-ink-faint line-through decoration-ink-faint/40">
                {h.original}
              </p>
              <p className="text-[11px] leading-relaxed text-ink-soft/85">
                → {h.replacement}
              </p>
            </div>
          ))}
          <p className="pt-0.5 text-[10px] leading-relaxed text-ink-faint/70">
            原句完整保存在本地，这里只改变显示。
          </p>
        </div>
      </details>
    </div>
  );
}
