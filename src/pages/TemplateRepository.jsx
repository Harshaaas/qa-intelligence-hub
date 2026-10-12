import { useMemo, useState } from "react";
import { useUser } from "../context/UserContext.jsx";
import { useTemplates } from "../context/TemplatesContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";
import { TEMPLATE_TYPES, syncStatus } from "../lib/templateStore.js";
import { canUploadTemplates } from "../utils/roles.js";
import { timeAgo } from "../lib/time.js";
import TemplateCard from "../components/templates/TemplateCard.jsx";
import UploadTemplateModal from "../components/templates/UploadTemplateModal.jsx";
import Icon from "../components/Icon.jsx";

export default function TemplateRepository() {
  const { user } = useUser();
  const { templates, reset } = useTemplates();
  const { settings } = useSettings();
  const [uploading, setUploading] = useState(false);
  const canUpload = canUploadTemplates(user.role);
  const autoSync = settings.templates.autoSyncOneDrive;

  const latestId = useMemo(() => {
    let best = null;
    for (const t of TEMPLATE_TYPES) {
      const v = templates[t.id].versions[0];
      if (!best || v.uploadedAt > best.at) best = { id: t.id, at: v.uploadedAt };
    }
    return best?.id;
  }, [templates]);

  const latestVersions = TEMPLATE_TYPES.map((t) => templates[t.id].versions[0]);
  const synced = latestVersions.filter((v) => syncStatus(v, autoSync) === "synced").length;
  const lastSync = latestVersions.map((v) => v.uploadedAt).sort().pop();

  return (
    <main className="content">
      <div className="page-head">
        <div>
          <h1>Template Repository</h1>
          <p className="sub">CMMI-compliant document templates</p>
        </div>
        {canUpload && (
          <button className="btn primary lg" onClick={() => setUploading(true)}>
            <Icon name="upload" size={20} /> Upload Template
          </button>
        )}
      </div>

      <div className="grid-3" style={{ rowGap: 32, paddingTop: 12 }}>
        {TEMPLATE_TYPES.map((type) => (
          <TemplateCard key={type.id} type={type} versions={templates[type.id].versions}
            isLatest={type.id === latestId} autoSync={autoSync} />
        ))}
      </div>

      <div className="grid-3 mt" style={{ marginTop: 40 }}>
        <div className="card stat-card"><div className="label">Total Templates</div><div className="value">{TEMPLATE_TYPES.length}</div></div>
        <div className="card stat-card"><div className="label">Synced to OneDrive</div><div className="value green">{synced}</div></div>
        <div className="card stat-card"><div className="label">Last Sync</div><div className="value">{autoSync ? timeAgo(lastSync) : "Paused"}</div></div>
      </div>

      <p className="muted small" style={{ marginTop: 28, maxWidth: "85ch" }}>
        Demo mode: uploaded templates are stored in this browser only, and OneDrive sync status is simulated.
        {canUpload && <> <button className="link small" onClick={() => (!settings.security.confirmDeletes || window.confirm("Remove all uploaded versions and notifications?")) && reset()}>Reset templates</button></>}
      </p>

      {uploading && <UploadTemplateModal initialTypeId="" onClose={() => setUploading(false)} />}
    </main>
  );
}
