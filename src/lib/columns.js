// Which Jira columns the engine needs, and how to find them automatically.
export const FIELDS = [
  { id: "sprint", label: "Sprint", usedFor: "SPC, ANOVA, T-test", patterns: [/^sprint$/i, /sprint/i] },
  { id: "team", label: "Team", usedFor: "ANOVA", patterns: [/^team$/i, /\(team\)/i, /team/i, /^components?(\/s)?$/i] },
  { id: "category", label: "Defect category", usedFor: "Pareto", patterns: [/root ?cause/i, /defect (category|type)/i, /category/i, /^components?(\/s)?$/i, /^labels?$/i, /^priority$/i] },
  { id: "issueType", label: "Issue type", usedFor: "Bug filter", patterns: [/^issue ?type$/i] },
  { id: "created", label: "Created date", usedFor: "Report period, resolution time", patterns: [/^created$/i, /^created ?date$/i] },
  { id: "resolved", label: "Resolved date", usedFor: "Resolution time", patterns: [/^resolved$/i, /^resolution ?date$/i, /^resolved ?date$/i] },
  { id: "points", label: "Story points", usedFor: "T-test", patterns: [/story ?points?$/i, /story ?points?\)?$/i, /story point estimate/i] },
  { id: "project", label: "Project", usedFor: "Report title", patterns: [/^project ?name$/i, /^project$/i] },
];

export function guessMapping(headers) {
  const mapping = {};
  for (const f of FIELDS) {
    mapping[f.id] = "";
    for (const p of f.patterns) {
      const match = headers.find((h) => p.test(h));
      if (match) { mapping[f.id] = match; break; }
    }
  }
  return mapping;
}

// Jira repeats some columns (e.g. "Sprint" twice when an issue moved sprints),
// so a header name can point to several column positions.
export const indicesOf = (headers, name) =>
  name ? headers.reduce((acc, h, i) => (h === name ? [...acc, i] : acc), []) : [];

// Value from the LAST non-empty matching column (= the latest sprint)
export function getValue(row, indices) {
  for (let k = indices.length - 1; k >= 0; k--) {
    const v = row[indices[k]];
    if (v !== "" && v != null) return v;
  }
  return "";
}

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

// Handles Jira formats like "03/Dec/24 10:15 AM", ISO dates, Excel dates
export function parseDate(v) {
  if (v instanceof Date) return isNaN(v) ? null : v;
  if (typeof v === "number") {
    return v > 20000 && v < 80000 ? new Date(Math.round((v - 25569) * 86400000)) : null;
  }
  const s = String(v).trim();
  if (!s) return null;

  const jira = s.match(/^(\d{1,2})\/([A-Za-z]{3})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM)?)?/i);
  if (jira) {
    const month = MONTHS[jira[2].toLowerCase()];
    if (month === undefined) return null;
    let year = +jira[3]; if (year < 100) year += 2000;
    let hour = jira[4] ? +jira[4] : 0;
    if (jira[6]) {
      const pm = jira[6].toUpperCase() === "PM";
      if (pm && hour < 12) hour += 12;
      if (!pm && hour === 12) hour = 0;
    }
    return new Date(year, month, +jira[1], hour, jira[5] ? +jira[5] : 0);
  }
  const d = new Date(/^\d{4}-\d{2}-\d{2} /.test(s) ? s.replace(" ", "T") : s);
  return isNaN(d) ? null : d;
}
