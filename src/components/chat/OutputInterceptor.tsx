import { useMemo } from "react";
import { calibrate } from "../../lib/boundary/interceptor";
import { useChatStore } from "../../stores/chatStore";
import { BOUNDARY_RULE_LABEL, type ChatMessage } from "../../types";

/**
 * 边界中间件的 React 落点。
 * 所有 assistant 文本都先过这里，再交给渲染；命中记录随文本一起返回，
 * 让"被改写"这件事在界面上留痕，而不是悄悄发生。
 */
export function useCalibration(message: ChatMessage) {
  const messages = useChatStore((s) => s.messages);
  return useMemo(() => calibrate(message, messages), [message, messages]);
}

export function BoundaryTrace({ message }: { message: ChatMessage }) {
  const { hits } = useCalibration(message);
  if (!hits.length) return null;

  const unique = Array.from(new Set(hits.map((h) => h.rule)));

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[10px] uppercase tracking-[0.22em] text-faint">
          已校准
        </span>
        <span className="h-px w-4 bg-white/10" />
        {unique.map((rule) => (
          <span
            key={rule}
            className="text-[11px] text-muted/70"
            title={hits.find((h) => h.rule === rule)?.replacement}
          >
            {BOUNDARY_RULE_LABEL[rule]}
          </span>
        ))}
      </div>
      <details className="mt-1.5">
        <summary className="cursor-pointer list-none text-[10px] text-faint/70 transition-colors hover:text-muted">
          看改了什么
        </summary>
        <div className="mt-2 space-y-2.5 border-l border-white/10 pl-3">
          {hits.map((h, i) => (
            <div key={`${h.rule}-${i}`} className="space-y-0.5">
              <p className="text-[11px] leading-relaxed text-faint line-through decoration-white/20">
                {h.original}
              </p>
              <p className="text-[11px] leading-relaxed text-muted/85">
                → {h.replacement}
              </p>
            </div>
          ))}
          <p className="pt-0.5 text-[10px] leading-relaxed text-faint/60">
            原句完整保存在本地，这里只改变显示。
          </p>
        </div>
      </details>
    </div>
  );
}
