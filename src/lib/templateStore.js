// Template data: metadata in localStorage, uploaded files in IndexedDB.
// When the project goes live, replace this file with calls to SharePoint,
// Firebase Storage or your company's API. The screens don't need to change.
import { putFile, getFile, clearFiles } from "./fileDb.js";
import { currentSettings } from "./settingsStore.js";

export const FORMATS = {
  word: { label: "Word document", badge: "DOCX", extensions: [".docx", ".doc"], accept: ".docx,.doc" },
  excel: { label: "Excel workbook", badge: "XLSX", extensions: [".xlsx", ".xls"], accept: ".xlsx,.xls" },
};

export const TEMPLATE_TYPES = [
  { id: "test-plan", name: "Test Plan Template", format: "word",
    description: "Comprehensive test planning document",
    seed: { file: "Test_Plan_Template.docx", version: "v1.5", daysAgo: 7 } },
  { id: "rtm", name: "Requirements Traceability Matrix", format: "excel",
    description: "RTM for requirement tracking",
    seed: { file: "Requirements_Traceability_Matrix.xlsx", version: "v2.1", daysAgo: 21 } },
  { id: "test-case", name: "Test Case Template", format: "excel",
    description: "Standard test case format",
    seed: { file: "Test_Case_Template.xlsx", version: "v1.8", daysAgo: 10 } },
  { id: "defect-report", name: "Defect Report Template", format: "excel",
    description: "Bug reporting template",
    seed: { file: "Defect_Report_Template.xlsx", version: "v1.3", daysAgo: 30 } },
  { id: "test-summary", name: "Test Summary Report", format: "word",
    description: "Executive summary template",
    seed: { file: "Test_Summary_Report.docx", version: "v1.2", daysAgo: 45 } },
];

export const typeById = (id) => TEMPLATE_TYPES.find((t) => t.id === id);

const META_KEY = "qahub-templates-v1";
const NOTIF_KEY = "qahub-notifications-v1";
const seenKey = (userId) => `qahub-seen-${userId}`;
const DAY = 86400000;

// ---------- live updates between browser windows ----------
const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("qa-hub") : null;
export function subscribe(handler) {
  if (!channel) return () => {};
  const listener = (e) => handler(e.data);
  channel.addEventListener("message", listener);
  return () => channel.removeEventListener("message", listener);
}
const broadcast = (msg) => channel?.postMessage(msg);

// ---------- read ----------
function seedTemplates() {
  const now = Date.now();
  return Object.fromEntries(
    TEMPLATE_TYPES.map((t) => [t.id, {
      versions: [{
        id: `${t.id}-seed`,
        version: t.seed.version,
        fileName: t.seed.file,
        size: null,
        uploadedAt: new Date(now - t.seed.daysAgo * DAY).toISOString(),
        uploadedBy: { id: "u1", name: "Priya Sharma" },
        note: "Baseline template",
        url: `${import.meta.env.BASE_URL}templates/${t.seed.file}`,
      }],
    }])
  );
}

export function loadTemplates() {
  try {
    const saved = JSON.parse(localStorage.getItem(META_KEY));
    if (saved) return saved;
  } catch { /* fall through to seed */ }
  const seeded = seedTemplates();
  localStorage.setItem(META_KEY, JSON.stringify(seeded));
  return seeded;
}

export function loadNotifications() {
  try {
    return JSON.parse(localStorage.getItem(NOTIF_KEY)) ?? [];
  } catch {
    return [];
  }
}

export const loadSeenAt = (userId) => localStorage.getItem(seenKey(userId)) ?? "";
export function markSeen(userId) {
  const now = new Date().toISOString();
  localStorage.setItem(seenKey(userId), now);
  return now;
}

// ---------- helpers ----------
export function nextVersion(current) {
  const m = /^v?(\d+)\.(\d+)$/i.exec(String(current ?? "").trim());
  return m ? `v${m[1]}.${Number(m[2]) + 1}` : "v1.0";
}

export function validateUpload(type, file, version, existingVersions) {
  if (!file) return "Choose a file to upload.";
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  const fmt = FORMATS[type.format];
  if (!fmt.extensions.includes(ext)) return `${type.name} must be a ${fmt.label} (${fmt.extensions.join(" or ")}).`;
  const maxMb = currentSettings().security.maxUploadMb;
  if (file.size > maxMb * 1024 * 1024) return `Files must be ${maxMb} MB or smaller.`;
  if (!/^v\d+\.\d+$/i.test(version.trim())) return "Use a version like v1.6.";
  if (currentSettings().templates.versionControl && existingVersions.some((v) => v.version.toLowerCase() === version.trim().toLowerCase())) {
    return `${version} already exists. Use a new version number.`;
  }
  return "";
}

// ---------- write ----------
export async function uploadTemplate({ typeId, file, version, note, user }) {
  const type = typeById(typeId);
  const templates = loadTemplates();
  const id = `${typeId}-${Date.now()}`;
  await putFile(id, file);

  const entry = {
    id,
    version: version.trim(),
    fileName: file.name,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    uploadedBy: { id: user.id, name: user.name },
    note: note.trim(),
  };
  // With version control off, the new file replaces the old one (no history kept)
  if (currentSettings().templates.versionControl) templates[typeId].versions.unshift(entry);
  else templates[typeId].versions = [entry];
  localStorage.setItem(META_KEY, JSON.stringify(templates));

  const notification = {
    id, typeId, templateName: type.name, version: entry.version,
    note: entry.note, uploadedBy: entry.uploadedBy, at: entry.uploadedAt,
  };
  const notifications = [notification, ...loadNotifications()].slice(0, 50);
  localStorage.setItem(NOTIF_KEY, JSON.stringify(notifications));

  broadcast({ type: "template-uploaded", notification });
  return { templates, notifications, notification };
}

export async function downloadVersion(type, v) {
  const ext = v.fileName.slice(v.fileName.lastIndexOf("."));
  const name = `${type.name.replace(/\s+/g, "_")}_${v.version}${ext}`;
  let href = v.url;
  if (!href) {
    const blob = await getFile(v.id);
    if (!blob) throw new Error("This file is no longer stored in this browser.");
    href = URL.createObjectURL(blob);
  }
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (!v.url) setTimeout(() => URL.revokeObjectURL(href), 2000);
}

export async function resetTemplates() {
  localStorage.removeItem(META_KEY);
  localStorage.removeItem(NOTIF_KEY);
  await clearFiles();
  broadcast({ type: "reset" });
}

// OneDrive sync state shown on each card. Simulated until Microsoft 365 is connected:
// a just-uploaded version shows "pending" for a minute, then "synced".
export function syncStatus(version, autoSync) {
  if (!autoSync) return "off";
  return Date.now() - new Date(version.uploadedAt).getTime() < 60000 ? "pending" : "synced";
}
