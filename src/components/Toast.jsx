import { useEffect } from "react";
import { useTemplates } from "../context/TemplatesContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";
import { parseRecipients } from "../lib/settingsStore.js";

export default function Toast({ onOpenTemplates }) {
  const { toast, dismissToast } = useTemplates();
  const { settings } = useSettings();

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(dismissToast, toast.kind === "uploaded" ? 15000 : 8000);
    return () => clearTimeout(id);
  }, [toast]);

  if (!toast) return null;
  const n = toast.notification;
  const recipients = parseRecipients(settings.templates.recipients);
  const mailto = recipients.length
    ? `mailto:${recipients.join(",")}?subject=${encodeURIComponent(`Template updated: ${n.templateName} ${n.version}`)}&body=${encodeURIComponent(
        `Hi team,\n\n${n.templateName} has been updated to ${n.version}.\n\nWhat changed: ${n.note}\n\nPlease download the latest version from the QA Intelligence Hub Template Repository.\n\nThanks,\n${n.uploadedBy.name}`
      )}`
    : null;

  return (
    <div className="toast" role="status">
      <p>
        {toast.kind === "uploaded" ? (
          <><strong>{n.templateName} {n.version} uploaded.</strong> Team members have been notified.</>
        ) : (
          <><strong>New template:</strong> {n.uploadedBy.name} uploaded {n.templateName} {n.version}.</>
        )}
      </p>
      <div className="toast-actions">
        {toast.kind === "uploaded" && mailto && (
          <a className="link" href={mailto} onClick={dismissToast}>Email the team</a>
        )}
        {toast.kind === "update" && (
          <button className="link" onClick={() => { onOpenTemplates(); dismissToast(); }}>View</button>
        )}
        <button className="link muted" onClick={dismissToast} aria-label="Dismiss">Dismiss</button>
      </div>
    </div>
  );
}
