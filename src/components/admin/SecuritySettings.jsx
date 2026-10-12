import { useState } from "react";
import Toggle from "./Toggle.jsx";
import { useDraft, SaveBar } from "./SettingsSection.jsx";

export default function SecuritySettings() {
  const { draft, set, dirty, saved, commit } = useDraft("security");
  const [error, setError] = useState("");

  const save = () => {
    const mb = Number(draft.maxUploadMb);
    const domain = draft.allowedOneDriveDomain.trim().toLowerCase();
    if (!Number.isInteger(mb) || mb < 1 || mb > 100) return setError("Maximum upload size must be a whole number from 1 to 100.");
    if (domain && !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) return setError("Enter a domain like company-my.sharepoint.com, without https://.");
    setError("");
    commit({ ...draft, allowedOneDriveDomain: domain, maxUploadMb: mb });
  };

  return (
    <div>
      <label className="field">
        <span className="field-label">Allowed OneDrive domain</span>
        <input className="input" value={draft.allowedOneDriveDomain} onChange={(e) => set("allowedOneDriveDomain", e.target.value)}
          placeholder="company-my.sharepoint.com" />
        <span className="field-hint">Only OneDrive links on this domain can be added to projects. Leave empty to allow any OneDrive or SharePoint link.</span>
      </label>
      <label className="field narrow">
        <span className="field-label">Maximum template upload size (MB)</span>
        <input className="input" type="number" min="1" max="100" value={draft.maxUploadMb} onChange={(e) => set("maxUploadMb", e.target.value === "" ? "" : Number(e.target.value))} />
      </label>
      <Toggle label="Confirm before deleting" checked={draft.confirmDeletes} onChange={(v) => set("confirmDeletes", v)}
        description="Ask for confirmation before removing projects, users or uploaded templates." />
      <Toggle label="Block credentials in URLs" checked disabled onChange={() => {}} tag="Always on"
        description="Environment URLs containing a username or password are always rejected." />
      <SaveBar dirty={dirty} saved={saved} onSave={save} error={error} />
    </div>
  );
}
