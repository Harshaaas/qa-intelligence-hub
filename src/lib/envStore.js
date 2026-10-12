import { currentSettings } from "./settingsStore.js";

// Projects and their environment URLs, saved in the browser for the demo.
// When the project goes live, replace this file with calls to a shared database.

export const ENVIRONMENTS = [
  { id: "dev", label: "Development" },
  { id: "qa", label: "QA" },
  { id: "uat", label: "UAT" },
];

const KEY = "qahub-projects-v2";
const SELECTED_KEY = "qahub-selected-project";

// Sample URLs are real public sites standing in for your environments,
// plus one ".invalid" address that can never resolve, to show a "Down" state.
const SEED = [
  { id: "alpha", name: "Project Alpha", oneDriveUrl: "https://onedrive.live.com/",
    envs: { dev: "https://example.com", qa: "https://example.org", uat: "https://www.iana.org" } },
  { id: "beta", name: "Project Beta", oneDriveUrl: "https://onedrive.live.com/",
    envs: { dev: "https://example.net", qa: "https://developer.mozilla.org", uat: "https://uat.beta.qa-hub.invalid" } },
  { id: "gamma", name: "Project Gamma", oneDriveUrl: "https://onedrive.live.com/",
    envs: { dev: "https://www.w3.org", qa: "https://www.wikipedia.org", uat: "https://www.python.org" } },
  { id: "delta", name: "Project Delta", oneDriveUrl: "https://onedrive.live.com/",
    envs: { dev: "https://www.ietf.org", qa: "https://www.rfc-editor.org", uat: "https://nodejs.org" } },
];

const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("qa-hub-env") : null;
export function subscribeProjects(handler) {
  if (!channel) return () => {};
  const listener = () => handler(loadProjects());
  channel.addEventListener("message", listener);
  return () => channel.removeEventListener("message", listener);
}

export function loadProjects() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(saved)) return saved;
  } catch { /* use seed */ }
  localStorage.setItem(KEY, JSON.stringify(SEED));
  return SEED;
}

export function saveProjects(projects) {
  localStorage.setItem(KEY, JSON.stringify(projects));
  channel?.postMessage("changed");
}

export const loadSelectedId = () => localStorage.getItem(SELECTED_KEY) || "";
export const saveSelectedId = (id) => localStorage.setItem(SELECTED_KEY, id);

// ---------- validation ----------
function parseUrl(value) {
  try {
    const u = new URL(value.trim());
    return ["http:", "https:"].includes(u.protocol) ? u : null;
  } catch {
    return null;
  }
}

const ONEDRIVE_HOSTS = (host) =>
  host === "1drv.ms" || host.endsWith("onedrive.live.com") || host === "onedrive.com" || host.endsWith(".sharepoint.com");

export function validateProject(form, projects, editingId) {
  const errors = {};
  const name = form.name.trim();
  if (!name) errors.name = "Enter a project name.";
  else if (projects.some((p) => p.id !== editingId && p.name.toLowerCase() === name.toLowerCase())) {
    errors.name = "A project with this name already exists.";
  }

  if (form.oneDriveUrl.trim()) {
    const u = parseUrl(form.oneDriveUrl);
    if (!u || u.protocol !== "https:" || !ONEDRIVE_HOSTS(u.hostname)) {
      errors.oneDriveUrl = "Paste a OneDrive or SharePoint link (https://…sharepoint.com, onedrive.live.com or 1drv.ms).";
    } else {
      const allowed = currentSettings().security.allowedOneDriveDomain.trim().toLowerCase();
      if (allowed && u.hostname !== allowed && !u.hostname.endsWith(`.${allowed}`)) {
        errors.oneDriveUrl = `Only OneDrive links on ${allowed} are allowed (set in Admin Settings > Security).`;
      }
    }
  }

  let any = false;
  for (const env of ENVIRONMENTS) {
    const value = form.envs[env.id].trim();
    if (!value) continue;
    any = true;
    const u = parseUrl(value);
    if (!u) errors[env.id] = "Enter a full URL starting with https:// or http://.";
    else if (u.username || u.password) errors[env.id] = "Remove the username or password from the URL. Never store credentials here.";
  }
  if (!any) errors.dev = "Add at least one environment URL.";
  return errors;
}

export function toProject(form, existing) {
  const slug = form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return {
    id: existing?.id ?? `${slug || "project"}-${Date.now().toString(36)}`,
    name: form.name.trim(),
    oneDriveUrl: form.oneDriveUrl.trim(),
    envs: Object.fromEntries(ENVIRONMENTS.map((e) => [e.id, form.envs[e.id].trim()])),
  };
}
