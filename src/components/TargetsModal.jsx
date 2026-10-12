import { useState } from "react";
import { useSettings } from "../context/SettingsContext.jsx";

export default function TargetsModal({ onClose }) {
  const { settings, save } = useSettings();
  const [form, setForm] = useState(settings.quality);
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const max = Number(form.maxDefectsPerSprint), tc = Number(form.testCasesPerSprint);
    if (!(max > 0) || !(tc > 0)) return setError("Both targets must be numbers greater than 0.");
    save({ ...settings, quality: { maxDefectsPerSprint: max, testCasesPerSprint: tc } });
    onClose();
  };

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit} aria-labelledby="targets-title">
        <h2 id="targets-title">Quality targets</h2>
        <label>Maximum acceptable defects per sprint
          <input className="input" type="number" min="1" value={form.maxDefectsPerSprint}
            onChange={(e) => setForm({ ...form, maxDefectsPerSprint: e.target.value })} />
          <span className="muted small-inline">Upper specification limit for Process Capability and Sigma Level.</span>
        </label>
        <label>Test cases executed per sprint
          <input className="input" type="number" min="1" value={form.testCasesPerSprint}
            onChange={(e) => setForm({ ...form, testCasesPerSprint: e.target.value })} />
          <span className="muted small-inline">Used as opportunities for the Defect Rate.</span>
        </label>
        {error && <p className="error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary">Save targets</button>
        </div>
      </form>
    </div>
  );
}
