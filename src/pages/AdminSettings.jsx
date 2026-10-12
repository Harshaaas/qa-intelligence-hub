import { useState } from "react";
import Toggle from "../components/admin/Toggle.jsx";
import { useDraft, SaveBar } from "../components/admin/SettingsSection.jsx";
import UserManagement from "../components/admin/UserManagement.jsx";
import NotificationSettings from "../components/admin/NotificationSettings.jsx";
import SecuritySettings from "../components/admin/SecuritySettings.jsx";
import { useSettings } from "../context/SettingsContext.jsx";
import { parseRecipients } from "../lib/settingsStore.js";
import { isEmail } from "../lib/userStore.js";
import Icon from "../components/Icon.jsx";

const AREAS = [
  { id: "users", title: "User Management", text: "Manage user roles and permissions", icon: "users", tone: "blue", Panel: UserManagement },
  { id: "notifications", title: "Notifications", text: "Configure system alerts and notifications", icon: "bell", tone: "green", Panel: NotificationSettings },
  { id: "security", title: "Security", text: "Manage security and access controls", icon: "shield", tone: "amber", Panel: SecuritySettings },
];

function TemplateUpdateSettings() {
  const { draft, set, dirty, saved, commit } = useDraft("templates");
  const [error, setError] = useState("");

  const save = () => {
    const bad = parseRecipients(draft.recipients).filter((e) => !isEmail(e));
    if (bad.length) return setError(`Check these email addresses: ${bad.join(", ")}`);
    setError("");
    commit();
  };

  return (
    <section className="card">
      <h2 style={{ marginBottom: 28 }}>Template Update Settings</h2>
      <label className="field">
        <span className="field-label">Notification Recipients</span>
        <input className="input" value={draft.recipients} onChange={(e) => set("recipients", e.target.value)} placeholder="all-qa-team@company.com" />
        <span className="field-hint">Email addresses to notify on template updates. Separate several with commas.</span>
      </label>
      <Toggle label="Auto-sync to OneDrive" tag="Simulated" checked={draft.autoSyncOneDrive}
        onChange={(v) => set("autoSyncOneDrive", v)} description="Automatically sync all templates to OneDrive" />
      <Toggle label="Template Version Control" checked={draft.versionControl}
        onChange={(v) => set("versionControl", v)} description="Enable automatic version tracking" />
      <SaveBar dirty={dirty} saved={saved} onSave={save} error={error} />
    </section>
  );
}

function IntegrationSettings() {
  const { settings } = useSettings();
  const t = settings.templates;
  const rows = [
    { name: "Jira Integration", detail: "Data loaded from uploaded Jira exports", pill: ["Connected", "green"], simulated: true },
    { name: "OneDrive Integration", detail: t.autoSyncOneDrive ? `Syncing to ${t.oneDriveFolder}` : "Sync paused",
      pill: t.autoSyncOneDrive ? ["Connected", "green"] : ["Paused", "grey"], simulated: true },
    { name: "Email Notifications", detail: "Opens Outlook with the recipients above after each upload",
      pill: parseRecipients(t.recipients).length ? ["Active", "green"] : ["No recipients", "grey"] },
  ];
  return (
    <section className="card">
      <div className="section-title">
        <span className="icon-tile grey"><Icon name="database" /></span>
        <h2>Integration Settings</h2>
      </div>
      <div className="integrations">
        {rows.map((r) => (
          <div key={r.name} className="integration-row">
            <div>
              <strong>{r.name}</strong> {r.simulated && <span className="tag">Simulated</span>}
              <p className="muted">{r.detail}</p>
            </div>
            <span className={`pill round ${r.pill[1]}`}><span className="pdot" />{r.pill[0]}</span>
          </div>
        ))}
      </div>
      <p className="muted small" style={{ marginTop: 16 }}>
        Simulated items need the hub connected to Jira and Microsoft 365 on a server. Until then they show how the integration will appear.
      </p>
    </section>
  );
}

export default function AdminSettings() {
  const [open, setOpen] = useState(null);
  const area = AREAS.find((a) => a.id === open);

  return (
    <main className="content">
      <div className="page-head">
        <div>
          <div className="title-row">
            <h1>Admin Settings</h1>
            <span className="pill round amber"><Icon name="lock" size={14} /> TL / PM Only</span>
          </div>
          <p className="sub">Manage system configuration and permissions</p>
        </div>
      </div>

      <div className="stack">
        <div className="grid-3">
          {AREAS.map((a) => (
            <article key={a.id} className={`card admin-card ${open === a.id ? "selected" : ""}`}>
              <div className="admin-card-head">
                <span className={`icon-tile ${a.tone}`}><Icon name={a.icon} /></span>
                <h3>{a.title}</h3>
              </div>
              <p className="muted">{a.text}</p>
              <button className="link configure" onClick={() => setOpen(open === a.id ? null : a.id)} aria-expanded={open === a.id}>
                {open === a.id ? "Close" : "Configure →"}
              </button>
            </article>
          ))}
        </div>

        {area && (
          <section className="card config-panel" style={{ borderColor: "var(--primary)" }}>
            <div className="section-title" style={{ justifyContent: "space-between" }}>
              <h2>{area.title}</h2>
              <button className="icon-btn" onClick={() => setOpen(null)} aria-label="Close"><Icon name="x" /></button>
            </div>
            <area.Panel />
          </section>
        )}

        <TemplateUpdateSettings />
        <IntegrationSettings />
      </div>
    </main>
  );
}
