import { useEffect, useState } from "react";
import { useSettings } from "../../context/SettingsContext.jsx";
import Icon from "../Icon.jsx";

// Holds a draft copy of one settings group and saves it on "Save Settings"
export function useDraft(group) {
  const { settings, save } = useSettings();
  const [draft, setDraft] = useState(settings[group]);
  const [saved, setSaved] = useState(false);

  useEffect(() => setDraft(settings[group]), [settings, group]);

  const set = (key, value) => { setDraft({ ...draft, [key]: value }); setSaved(false); };
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings[group]);
  const commit = (override) => { save({ ...settings, [group]: override ?? draft }); setSaved(true); };
  return { draft, set, dirty, saved, commit };
}

export function SaveBar({ dirty, saved, onSave, error }) {
  return (
    <div className="save-row">
      <button className="btn primary lg" onClick={onSave} disabled={!dirty}><Icon name="save" size={20} /> Save Settings</button>
      {error ? <span className="error">{error}</span>
        : saved && !dirty ? <span className="saved">Settings saved</span>
        : dirty ? <span className="muted small">Unsaved changes</span> : null}
    </div>
  );
}
