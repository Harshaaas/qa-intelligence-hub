import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { pareto } from "../lib/analysis.js";
import { C } from "../lib/theme.js";

export default function ParetoSection({ records, headers, field, project }) {
  const result = useMemo(() => pareto(records, headers, field, 6), [records, headers, field]);

  return (
    <section className="card chart-card">
      <h2>Pareto Analysis (80/20 Rule)</h2>
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={result.items} margin={{ top: 8, right: 8, left: -12, bottom: 4 }}>
          <CartesianGrid strokeDasharray="4 4" stroke={C.grid} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: C.muted }} minTickGap={8} height={30} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: C.muted }} />
          <Tooltip formatter={(v, n, p) => [`${v} defects (${p.payload.pct.toFixed(1)}%)`, "Count"]} />
          <Bar dataKey="count" fill={C.bar} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="note blue">
        <strong>Insight:</strong> Top {result.vital.length} categor{result.vital.length === 1 ? "y accounts" : "ies account"} for{" "}
        {result.vitalShare.toFixed(0)}% of defects in {project}
        {result.vital.length > 0 && <> ({result.vital.map((v) => v.name).join(", ")})</>}.
      </p>
    </section>
  );
}
