import { FIELDS } from "../lib/columns.js";

export default function ColumnsModal({ dataset, mapping, onMappingChange, bugsOnly, onBugsOnlyChange, onClose }) {
  const headers = [...new Set(dataset.headers.filter(Boolean))];
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal wide" role="dialog" aria-labelledby="cols-title">
        <h2 id="cols-title">Column mapping</h2>
        <p className="muted small">The engine matched these Jira columns automatically. Change any that are wrong.</p>
        <div className="mapping">
          {FIELDS.map((f) => (
            <label key={f.id}>
              <span>{f.label} <span className="muted small-inline">({f.usedFor})</span></span>
              <select className="select" value={mapping[f.id]} onChange={(e) => onMappingChange({ ...mapping, [f.id]: e.target.value })}>
                <option value="">Not in file</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </label>
          ))}
        </div>
        {mapping.issueType && (
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={bugsOnly} onChange={(e) => onBugsOnlyChange(e.target.checked)} />
            Analyse bugs only (ignore stories and tasks)
          </label>
        )}
        <div className="modal-actions"><button className="btn primary" onClick={onClose}>Done</button></div>
      </div>
    </div>
  );
}
