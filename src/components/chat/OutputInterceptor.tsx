import { useMemo } from "react";
import { calibrate } from "../../lib/boundary/interceptor";
import { useChatStore } from "../../stores/chatStore";
import { BOUNDARY_RULE_LABEL, type ChatMessage } from "../../types";

/** 边界中间件的 React 落点：所有 assistant 文本都先过这里再渲染。 */
export function useCalibration(message: ChatMessage) {
  const messages = useChatStore((s) => s.messages);
  return useMemo(() => calibrate(message, messages), [message, messages]);
}

export function BoundaryTrace({ message }: { message: ChatMessage }) {
  const { hits } = useCalibration(message);
  if (!hits.length) return null;

  const rules = Array.from(new Set(hits.map((h) => h.rule)));

  return (
    <div className="mt-2.5 pl-px">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[11.5px] tracking-[0.2em] text-ink-faint uppercase">
          已校准
        </span>
        <span className="h-px w-3 bg-[var(--line-strong)]" />
        {rules.map((r) => (
          <span key={r} className="text-[12.5px] text-ink-faint">
            {BOUNDARY_RULE_LABEL[r]}
          </span>
        ))}
      </div>
      <details className="mt-1">
        <summary className="cursor-pointer list-none text-[12px] text-ink-faint/75 hover:text-ink-faint">
          看改了什么
        </summary>
        <div className="mt-2 space-y-2 border-l border-[var(--line)] pl-3">
          {hits.map((h, i) => (
            <div key={`${h.rule}-${i}`} className="space-y-0.5">
              <p className="text-[12.5px] leading-relaxed text-ink-faint line-through decoration-ink-faint/40">
                {h.original}
              </p>
              <p className="text-[12.5px] leading-relaxed text-ink-soft/85">
                → {h.replacement}
              </p>
            </div>
          ))}
          <p className="pt-0.5 text-[11.5px] leading-relaxed text-ink-faint/70">
            原句完整保存在本地，这里只改变显示。
          </p>
        </div>
      </details>
    </div>
  );
}
