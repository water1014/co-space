import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export type TrendPoint = { label: string; value: number };

/**
 * 七天的柱子。没有坐标轴、没有网格——它要说明的是"趋势"，
 * 不是让人读精确数值（精确值在旁边的数字里）。
 */
export function TrendChart({
  data,
  color,
  unit,
  height = 64,
}: {
  data: TrendPoint[];
  color: string;
  unit?: string;
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const lastIndex = data.length - 1;

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
          barCategoryGap={5}
        >
          <Tooltip
            cursor={false}
            contentStyle={{
              background: "var(--glass-solid)",
              border: "1px solid var(--line)",
              borderRadius: 12,
              fontSize: 11,
              padding: "4px 8px",
              color: "var(--ink)",
              boxShadow: "0 8px 24px -16px rgba(0,0,0,.7)",
            }}
            labelStyle={{ display: "none" }}
            formatter={(v) => `${v}${unit ?? ""}`}
          />
          <Bar
            dataKey="value"
            radius={[3, 3, 3, 3]}
            maxBarSize={26}
            isAnimationActive={false}
          >
            {data.map((d, i) => (
              <Cell
                key={d.label}
                fill={color}
                fillOpacity={
                  i === lastIndex ? 1 : 0.45 + (d.value / max) * 0.4
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
