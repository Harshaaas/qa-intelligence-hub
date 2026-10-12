// System settings, saved in the browser for the demo.
const KEY = "qahub-settings-v1";

export const DEFAULT_SETTINGS = {
  templates: {
    recipients: "all-qa-team@company.com",
    autoSyncOneDrive: true,      // simulated until Microsoft 365 is connected
    versionControl: true,        // keep version history and suggest next version
    oneDriveFolder: "/QA-Templates",
  },
  notifications: {
    popups: true,                // pop-up when someone uploads a template
    bellBadge: true,             // unread count on the bell
    envDownAlerts: true,         // pop-up when an environment goes from Live to Down
  },
  quality: {
    maxDefectsPerSprint: 40,     // upper spec limit used for Process Capability
    testCasesPerSprint: 300,     // opportunities used for Defect Rate
  },
  security: {
    allowedOneDriveDomain: "",   // e.g. company-my.sharepoint.com (empty = any OneDrive/SharePoint link)
    maxUploadMb: 25,
    confirmDeletes: true,
  },
};

const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("qa-hub-settings") : null;

const merge = (saved) => ({
  templates: { ...DEFAULT_SETTINGS.templates, ...saved?.templates },
  notifications: { ...DEFAULT_SETTINGS.notifications, ...saved?.notifications },
  quality: { ...DEFAULT_SETTINGS.quality, ...saved?.quality },
  security: { ...DEFAULT_SETTINGS.security, ...saved?.security },
});

export function loadSettings() {
  try {
    return merge(JSON.parse(localStorage.getItem(KEY)));
  } catch {
    return merge(null);
  }
}

export function saveSettings(settings) {
  localStorage.setItem(KEY, JSON.stringify(settings));
  channel?.postMessage("changed");
}

export function subscribeSettings(handler) {
  if (!channel) return () => {};
  const listener = () => handler(loadSettings());
  channel.addEventListener("message", listener);
  return () => channel.removeEventListener("message", listener);
}

export const parseRecipients = (text) =>
  text.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);

// Read-only snapshot for non-React code (validation helpers)
export const currentSettings = () => loadSettings();
