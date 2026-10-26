/**
 * 工具调用徽标。
 * 单独一个组件，是因为它和"思考了多久"是两件事：
 * 一个是内心活动，一个是外部动作，混在一张卡里会看不清。
 */
export function ToolCallBadge({ tools }: { tools: string[] }) {
  if (!tools.length) return null;

  return (
    <div className="mb-2 flex flex-wrap gap-1.5">
      {tools.map((tool) => (
        <span
          key={tool}
          className="glass-flat inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] text-ink-faint"
        >
          <span className="h-[4px] w-[4px] rounded-full bg-[var(--accent)]" />
          调用工具
          <span className="text-ink-soft">{tool}</span>
        </span>
      ))}
    </div>
  );
}
