/**
 * 工具调用徽标。
 * 单独一个组件，是因为它和"思考了多久"是两件事：
 * 一个是内心活动，一个是外部动作，混在一张卡里会看不清。
 *
 * 视觉上刻意做"轻"：无底色、无边框，只用一行小灰字，
 * 让主气泡保持参考图那种干净的白胶囊。
 */
export function ToolCallBadge({ tools }: { tools: string[] }) {
  if (!tools.length) return null;

  return (
    <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
      {tools.map((tool) => (
        <span
          key={tool}
          className="inline-flex items-center gap-1 text-[10.5px] tracking-[0.01em] text-ink-ghost"
        >
          <span className="h-[3px] w-[3px] rounded-full bg-[var(--accent)] opacity-60" />
          调用
          <span className="text-ink-faint">{tool}</span>
        </span>
      ))}
    </div>
  );
}
