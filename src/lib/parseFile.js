import Papa from "papaparse";
import { readSheet } from "read-excel-file/universal";

// Turns an uploaded file into { fileName, headers, rows }
export async function parseFile(file) {
  const name = file.name.toLowerCase();

  if (name.endsWith(".csv")) {
    return toDataset(parseCsvText(await file.text()), file.name);
  }
  if (name.endsWith(".xlsx")) {
    return toDataset(await readSheet(file), file.name);
  }
  if (name.endsWith(".xls") || name.endsWith(".html") || name.endsWith(".htm")) {
    // Jira's "Export Excel" gives an HTML table saved as .xls
    const text = await file.text();
    if (!/<table/i.test(text)) {
      throw new Error("This .xls file uses the old Excel format. Open it in Excel, save it as .xlsx or .csv, and upload again.");
    }
    return toDataset(parseHtmlTable(text), file.name);
  }
  throw new Error("Upload a .csv, .xlsx or Jira .xls export.");
}

export function parseCsvText(text) {
  return Papa.parse(text.trim(), { skipEmptyLines: true }).data;
}

function parseHtmlTable(text) {
  const doc = new DOMParser().parseFromString(text, "text/html");
  const tables = [...doc.querySelectorAll("table")];
  const biggest = tables.reduce((a, t) => (t.rows.length > (a?.rows.length ?? 0) ? t : a), null);
  return [...biggest.rows].map((tr) =>
    [...tr.cells].map((td) => td.textContent.replace(/\s+/g, " ").trim())
  );
}

export function toDataset(rawRows, fileName) {
  const rows = rawRows.map((r) => r.map((c) => (c == null ? "" : c)));
  const filled = (r) => r.filter((c) => String(c).trim() !== "").length;

  // Header = first row with at least 3 filled cells
  const h = rows.findIndex((r) => filled(r) >= 3);
  if (h === -1 || rows.length - h < 2) {
    throw new Error("No data rows found. Make sure the first row contains column names like Issue key, Sprint and Created.");
  }
  return {
    fileName,
    headers: rows[h].map((x) => String(x).trim()),
    rows: rows.slice(h + 1).filter((r) => filled(r) > 0),
  };
}
