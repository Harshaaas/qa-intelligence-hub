import Icon from "./Icon.jsx";

const fmt = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : x > 0 ? "∞" : "−∞");

export default function KpiCards({ kpi, quality }) {
  if (!kpi) return null;
  const cards = [
    { icon: "trend", label: "Process Capability", value: fmt(kpi.cpu), status: kpi.cpuStatus,
      basis: `Cpu vs target of ≤ ${quality.maxDefectsPerSprint} defects per sprint` },
    { icon: "activity", label: "Sigma Level", value: `${fmt(kpi.sigma, 1)}σ`, status: kpi.sigmaStatus,
      basis: "Short-term sigma (3 × Cpu)" },
    { icon: "flask", label: "Defect Rate", value: `${fmt(kpi.rate, 2)}%`, status: kpi.rateStatus,
      basis: `Per test case, at ${quality.testCasesPerSprint} test cases per sprint` },
  ];
  return (
    <div className="grid-3">
      {cards.map((c) => (
        <article key={c.label} className="card">
          <div className="kpi-head">
            <span className="icon-tile blue"><Icon name={c.icon} /></span>
            <span>{c.label}</span>
          </div>
          <div className="kpi-value">{c.value}</div>
          <span className={`pill ${c.status[1]}`}>{c.status[0]}</span>
          <p className="muted small kpi-basis">{c.basis}</p>
        </article>
      ))}
    </div>
  );
}
