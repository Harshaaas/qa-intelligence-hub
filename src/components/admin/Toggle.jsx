// On/off switch in the design's layout: label above, switch + description below
export default function Toggle({ checked, onChange, label, description, tag, disabled }) {
  const id = `t-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div className="toggle-field">
      <div id={id} className="field-label">{label} {tag && <span className="tag">{tag}</span>}</div>
      <div className="toggle-line">
        <button type="button" role="switch" aria-checked={checked} aria-labelledby={id}
          disabled={disabled} className={`switch ${checked ? "on" : ""}`} onClick={() => onChange(!checked)}>
          <span className="knob" />
        </button>
        {description && <span>{description}</span>}
      </div>
    </div>
  );
}
