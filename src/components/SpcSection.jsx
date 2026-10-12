import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
import { C } from "../lib/theme.js";

const shortName = (s, i) => {
  const m = s.match(/(\d+)\s*$/);
  return m ? `S${m[1]}` : `S${i + 1}`;
};

function Dot({ cx, cy, payload }) {
  if (cx == null || !payload.flag) return null;
  return <circle cx={cx} cy={cy} r={6} fill={C.red} stroke="#fff" strokeWidth={2} />;
}

export default function SpcSection({ spc, hasSprint }) {
  if (!spc) {
    return (
      <section className="card chart-card">
        <h2>Statistical Process Control (SPC)</h2>
        <p className="muted">{hasSprint ? "At least 2 sprints are needed for a control chart." : "Map the Sprint column to see the control chart."}</p>
      </section>
    );
  }
  const data = spc.points.map((p, i) => ({ ...p, label: shortName(p.sprint, i) }));
  const flagged = spc.points.filter((p) => p.flag);
  const top = Math.ceil(Math.max(spc.ucl, ...data.map((d) => d.defects)) * 1.1);

  return (
    <section className="card chart-card">
      <h2>Statistical Process Control (SPC)</h2>
      <ResponsiveContainer width="100%" height={310}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: -12, bottom: 4 }}>
          <CartesianGrid strokeDasharray="4 4" stroke={C.grid} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: C.muted }} />
          <YAxis allowDecimals={false} domain={[0, top]} tick={{ fontSize: 12, fill: C.muted }} />
          <Tooltip labelFormatter={(l, p) => p?.[0]?.payload.sprint ?? l} />
          <ReferenceLine y={spc.ucl} stroke={C.red} strokeDasharray="4 4" label={{ value: "UCL", fill: C.muted, fontSize: 14 }} />
          <ReferenceLine y={spc.cl} stroke={C.grey} strokeDasharray="4 4" label={{ value: "Mean", fill: C.muted, fontSize: 14 }} />
          {spc.lcl > 0 && <ReferenceLine y={spc.lcl} stroke={C.red} strokeDasharray="4 4" label={{ value: "LCL", fill: C.muted, fontSize: 14 }} />}
          <Line type="monotone" dataKey="defects" name="defects" stroke={C.green} strokeWidth={2.5} dot={<Dot />} activeDot={{ r: 5 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
      <div className="legend-line"><span className="lmark" /> defects</div>
      {flagged.length === 0 ? (
        <p className="note green"><strong>Status:</strong> Process is in control - all points within limits</p>
      ) : (
        <p className="note red">
          <strong>Status:</strong> {flagged.length} sprint{flagged.length > 1 ? "s" : ""} out of control:{" "}
          {flagged.map((p) => `${p.sprint} (${p.defects} defects, ${p.flag.replace(/^A/, "a").replace(/^B/, "b").replace(/^R/, "r")})`).join("; ")}
        </p>
      )}
      <p className="muted small" style={{ marginTop: 10 }}>
        c-chart. Mean {spc.cl.toFixed(1)}, UCL {spc.ucl.toFixed(1)}, LCL {spc.lcl.toFixed(1)} defects per sprint.
        {spc.unassigned > 0 && ` ${spc.unassigned} defects without a sprint are not plotted.`}
      </p>
    </section>
  );
}
