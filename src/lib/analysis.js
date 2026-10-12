import { FIELDS, indicesOf, getValue, parseDate } from "./columns.js";
import { mean, oneWayAnova, independentTTest, cChart } from "./stats.js";

export const ALPHA = 0.05;

const text = (v) => String(v ?? "").trim();
export const sortSprints = (names) =>
  [...new Set(names)].filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

// Convert raw rows into clean records using the column mapping
export function buildRecords(dataset, mapping, bugsOnly) {
  const idx = Object.fromEntries(FIELDS.map((f) => [f.id, indicesOf(dataset.headers, mapping[f.id])]));

  let records = dataset.rows.map((row) => {
    const get = (id) => getValue(row, idx[id]);
    const created = parseDate(get("created"));
    const resolved = parseDate(get("resolved"));
    const pts = text(get("points")) === "" ? NaN : Number(get("points"));
    return {
      row,
      sprint: text(get("sprint")),
      team: text(get("team")),
      issueType: text(get("issueType")),
      project: text(get("project")),
      created,
      points: Number.isFinite(pts) ? pts : null,
      resolutionDays: created && resolved ? Math.max(0, (resolved - created) / 86400000) : null,
    };
  });

  if (bugsOnly && mapping.issueType) {
    records = records.filter((r) => /bug|defect/i.test(r.issueType));
  }
  return records;
}

// Project name + period for report titles, e.g. "Project Alpha", "December 2024"
export function reportContext(records, fileName) {
  const counts = {};
  records.forEach((r) => r.project && (counts[r.project] = (counts[r.project] ?? 0) + 1));
  const project =
    Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? fileName.replace(/\.[^.]+$/, "");

  const dates = records.map((r) => r.created).filter(Boolean).sort((a, b) => a - b);
  let period = "";
  if (dates.length) {
    const fmt = (d) => d.toLocaleString("en-US", { month: "long", year: "numeric" });
    const short = (d) => d.toLocaleString("en-US", { month: "short", year: "numeric" });
    const first = dates[0], last = dates[dates.length - 1];
    period = fmt(first) === fmt(last) ? fmt(first) : `${short(first)} – ${short(last)}`;
  }
  return { project, period };
}

// ---------- Pareto ----------
export function pareto(records, headers, header, maxBars = 12) {
  const idx = indicesOf(headers, header);
  const counts = {};
  records.forEach((r) => {
    const key = text(getValue(r.row, idx)) || "Not specified";
    counts[key] = (counts[key] ?? 0) + 1;
  });

  let items = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  const totalCategories = items.length;

  if (items.length > maxBars) {
    const rest = items.slice(maxBars - 1);
    items = [...items.slice(0, maxBars - 1), {
      name: "Others",
      count: rest.reduce((s, x) => s + x.count, 0),
    }];
  }

  const total = records.length;
  let running = 0;
  let reached80 = false;
  items = items.map((it) => {
    running += it.count;
    const vital = !reached80;
    const cumulativePct = (running / total) * 100;
    if (cumulativePct >= 80) reached80 = true;
    return { ...it, pct: (it.count / total) * 100, cumulativePct, vital };
  });

  const vital = items.filter((i) => i.vital);
  return {
    items,
    total,
    totalCategories,
    vital,
    vitalShare: vital.length ? vital[vital.length - 1].cumulativePct : 0,
  };
}

// ---------- SPC ----------
export function defectsPerSprint(records) {
  const sprints = sortSprints(records.map((r) => r.sprint));
  const counts = sprints.map((s) => records.filter((r) => r.sprint === s).length);
  if (sprints.length < 2) return null;
  const chart = cChart(counts);
  return {
    ...chart,
    points: sprints.map((sprint, i) => ({ sprint, defects: counts[i], flag: chart.flags[i] })),
    unassigned: records.filter((r) => !r.sprint).length,
  };
}

// ---------- ANOVA: defects per sprint, compared across teams ----------
export function anovaAcrossTeams(records) {
  const sprints = sortSprints(records.map((r) => r.sprint));
  const teams = sortSprints(records.map((r) => r.team));
  const groups = teams.map((team) => ({
    team,
    values: sprints.map((s) => records.filter((r) => r.team === team && r.sprint === s).length),
  }));
  const result = oneWayAnova(groups.map((g) => g.values));
  if (!result) return null;
  return {
    ...result,
    significant: result.p < ALPHA,
    groups: groups.map((g) => ({ team: g.team, mean: mean(g.values), n: g.values.length })),
    sprintCount: sprints.length,
  };
}

// ---------- Independent t-test: one metric, Sprint A vs Sprint B ----------
export const METRICS = {
  points: { label: "Story points", short: "story points" },
  resolutionDays: { label: "Resolution time (days)", short: "resolution time" },
};

export function availableMetrics(records) {
  return Object.keys(METRICS).filter((m) => records.filter((r) => r[m] != null).length >= 4);
}

export function sprintTTest(records, sprintA, sprintB, metric) {
  const values = (s) => records.filter((r) => r.sprint === s && r[metric] != null).map((r) => r[metric]);
  const a = values(sprintA), b = values(sprintB);
  const result = independentTTest(a, b);
  if (!result) return { error: `Each sprint needs at least 2 issues with ${METRICS[metric].short}. ${sprintA}: ${a.length}, ${sprintB}: ${b.length}.` };
  return {
    ...result,
    significant: result.p < ALPHA,
    a: { n: a.length, mean: mean(a) },
    b: { n: b.length, mean: mean(b) },
  };
}

// Display helpers
export const fmtP = (p) => (p < 0.0001 ? "< 0.0001" : p.toFixed(4));
export const fmtStat = (x) => (Number.isFinite(x) ? x.toFixed(2) : "∞");

// ---------- Filters (Month / Year / Project) ----------
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function filterOptions(records) {
  const years = [...new Set(records.filter((r) => r.created).map((r) => r.created.getFullYear()))].sort((a, b) => b - a);
  const months = [...new Set(records.filter((r) => r.created).map((r) => r.created.getMonth()))].sort((a, b) => a - b);
  const projects = [...new Set(records.map((r) => r.project).filter(Boolean))].sort();
  return { years, months, projects };
}

export function filterRecords(records, { month, year, project }) {
  return records.filter((r) =>
    (project === "all" || r.project === project) &&
    (year === "all" || (r.created && r.created.getFullYear() === Number(year))) &&
    (month === "all" || (r.created && r.created.getMonth() === Number(month)))
  );
}

// ---------- KPI cards ----------
// Process Capability (Cpu): how far average defects per sprint sit below the
// target maximum, in units of 3 standard deviations. Sigma level = 3 x Cpu.
// Defect rate = defects / (test cases executed per sprint x sprints).
export function kpis(spc, quality) {
  if (!spc || spc.points.length < 2) return null;
  const counts = spc.points.map((p) => p.defects);
  const m = mean(counts);
  const sd = Math.sqrt(counts.reduce((s, x) => s + (x - m) ** 2, 0) / (counts.length - 1));
  const usl = Number(quality.maxDefectsPerSprint);
  const cpu = sd === 0 ? (m <= usl ? Infinity : -Infinity) : (usl - m) / (3 * sd);
  const sigma = 3 * cpu;
  const total = counts.reduce((s, x) => s + x, 0);
  const rate = (total / (Number(quality.testCasesPerSprint) * counts.length)) * 100;
  const inControl = spc.points.every((p) => !p.flag);

  return {
    cpu, sigma, rate, inControl, mean: m, sd, usl,
    cpuStatus: cpu >= 1.33 ? ["Capable", "green"] : cpu >= 1 ? ["Marginal", "amber"] : ["Not capable", "red"],
    sigmaStatus: sigma >= 4 ? ["Good", "green"] : sigma >= 3 ? ["Fair", "amber"] : ["Poor", "red"],
    rateStatus: inControl ? ["Controlled", "green"] : ["Out of control", "red"],
  };
}
