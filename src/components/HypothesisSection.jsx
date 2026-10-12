import { useEffect, useMemo, useState } from "react";
import { anovaAcrossTeams, sprintTTest, sortSprints, availableMetrics, METRICS, ALPHA, fmtP, fmtStat } from "../lib/analysis.js";
import TestCard from "./TestCard.jsx";

export default function HypothesisSection({ records, title, mapping }) {
  const sprints = useMemo(() => sortSprints(records.map((r) => r.sprint)), [records]);
  const metrics = useMemo(() => availableMetrics(records), [records]);
  const [sprintA, setSprintA] = useState("");
  const [sprintB, setSprintB] = useState("");
  const [metric, setMetric] = useState("");

  useEffect(() => {
    setSprintA(sprints[sprints.length - 2] ?? "");
    setSprintB(sprints[sprints.length - 1] ?? "");
  }, [sprints]);
  useEffect(() => { if (!metrics.includes(metric)) setMetric(metrics[0] ?? ""); }, [metrics, metric]);

  const anova = useMemo(() => (mapping.team && mapping.sprint ? anovaAcrossTeams(records) : null), [records, mapping]);
  const ttest = useMemo(
    () => (sprintA && sprintB && metric && sprintA !== sprintB ? sprintTTest(records, sprintA, sprintB, metric) : null),
    [records, sprintA, sprintB, metric]
  );
  const sign = (r) => (r.significant ? "<" : ">");

  return (
    <section className="card hyp-card">
      <h2>Hypothesis Testing Results</h2>
      <p className="muted">Statistical tests from Jira data for {title}</p>
      <div className="grid-2">
        <TestCard
          title="ANOVA Test"
          result={anova ?? { error: mapping.team ? "Needs at least 2 teams and 2 sprints." : "Map the Team column to run this test." }}
          rows={anova ? [
            { label: "F-Statistic", value: fmtStat(anova.f) },
            { label: "P-Value", value: fmtP(anova.p), good: anova.significant },
            { label: "Degrees of Freedom", value: `${anova.dfBetween}, ${anova.dfWithin}` },
          ] : []}
          conclusion={anova && `${anova.significant ? "Significant" : "No significant"} difference in defect rates across teams (p ${sign(anova)} ${ALPHA})`}
          footer={anova && (
            <p className="muted small" style={{ marginTop: 10 }}>
              Avg defects per sprint: {[...anova.groups].sort((a, b) => b.mean - a.mean).map((g) => `${g.team} ${g.mean.toFixed(1)}`).join(", ")}.
            </p>
          )}
        />
        <TestCard
          title="Independent T-Test"
          result={!metrics.length ? { error: "Needs a Story points column, or Created and Resolved dates." }
            : sprintA === sprintB ? { error: "Pick two different sprints." } : ttest}
          rows={ttest && !ttest.error ? [
            { label: "T-Statistic", value: fmtStat(ttest.t) },
            { label: "P-Value", value: fmtP(ttest.p), good: ttest.significant },
            { label: "Degrees of Freedom", value: ttest.df },
          ] : []}
          conclusion={ttest && !ttest.error &&
            `${ttest.significant ? "Significant" : "No significant"} difference between ${sprintA} and ${sprintB} ${METRICS[metric].short} (p ${sign(ttest)} ${ALPHA})`}
          footer={ttest && !ttest.error && (
            <p className="muted small" style={{ marginTop: 10 }}>
              Means: {ttest.a.mean.toFixed(2)} ({ttest.a.n} issues) vs {ttest.b.mean.toFixed(2)} ({ttest.b.n} issues).
            </p>
          )}
        >
          {sprints.length >= 2 && metrics.length > 0 && (
            <div className="test-controls">
              <label>Sprint A
                <select className="select" value={sprintA} onChange={(e) => setSprintA(e.target.value)}>
                  {sprints.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label>Sprint B
                <select className="select" value={sprintB} onChange={(e) => setSprintB(e.target.value)}>
                  {sprints.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label>Compare
                <select className="select" value={metric} onChange={(e) => setMetric(e.target.value)}>
                  {metrics.map((m) => <option key={m} value={m}>{METRICS[m].label}</option>)}
                </select>
              </label>
            </div>
          )}
        </TestCard>
      </div>
    </section>
  );
}
