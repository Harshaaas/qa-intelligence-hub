const rtf = new Intl.RelativeTimeFormat("en", { numeric: "always" });
const UNITS = [
  ["year", 365 * 86400], ["month", 30 * 86400], ["week", 7 * 86400],
  ["day", 86400], ["hour", 3600], ["minute", 60],
];

// "just now", "5 minutes ago", "1 week ago"
export function timeAgo(iso) {
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000;
  if (seconds < 45) return "just now";
  for (const [unit, size] of UNITS) {
    if (seconds >= size) return rtf.format(-Math.floor(seconds / size), unit);
  }
  return rtf.format(-1, "minute");
}

export const fullDate = (iso) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

export function fileSize(bytes) {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
