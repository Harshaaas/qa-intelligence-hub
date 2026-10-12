import { useEffect, useRef, useState } from "react";
import { TEMPLATE_TYPES, FORMATS, typeById, nextVersion, validateUpload } from "../../lib/templateStore.js";
import { useTemplates } from "../../context/TemplatesContext.jsx";
import { useSettings } from "../../context/SettingsContext.jsx";

export default function UploadTemplateModal({ initialTypeId, onClose }) {
  const { templates, upload } = useTemplates();
  const { settings } = useSettings();
  const tracking = settings.templates.versionControl;
  const [typeId, setTypeId] = useState(initialTypeId || TEMPLATE_TYPES[0].id);
  const [file, setFile] = useState(null);
  const [version, setVersion] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const type = typeById(typeId);
  const versions = templates[typeId].versions;

  // Suggest the next version number whenever the template changes
  useEffect(() => {
    setVersion(tracking ? nextVersion(versions[0]?.version) : versions[0]?.version ?? "v1.0");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  }, [typeId]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const submit = async (e) => {
    e.preventDefault();
    const problem = validateUpload(type, file, version, versions)
      || (!note.trim() ? "Describe what changed so the team knows why to update." : "");
    if (problem) return setError(problem);

    setBusy(true);
    setError("");
    try {
      await upload({ typeId, file, version, note });
      onClose();
    } catch {
      setError("Upload failed. The browser may be out of storage space.");
      setBusy(false);
    }
  };

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <form className="modal" onSubmit={submit} aria-labelledby="upload-title">
        <h2 id="upload-title">Upload template</h2>

        <label>Template
          <select className="select" value={typeId} onChange={(e) => setTypeId(e.target.value)} disabled={!!initialTypeId}>
            {TEMPLATE_TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.name} ({FORMATS[t.format].label})</option>
            ))}
          </select>
        </label>
        <p className="muted small">
          Current version: {versions[0].version}.{" "}
          {tracking ? "Earlier versions stay available in the history." : "Version tracking is off, so this file replaces the current one."}
        </p>

        <label>File
          <input
            ref={fileRef}
            type="file"
            accept={FORMATS[type.format].accept}
            onChange={(e) => setFile(e.target.files[0] ?? null)}
          />
        </label>

        <label>New version
          <input className="input" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="v1.6" />
        </label>

        <label>What changed
          <textarea
            className="input"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Added performance testing section and updated exit criteria"
          />
        </label>

        {error && <p className="error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn primary" disabled={busy}>{busy ? "Uploading…" : "Upload and notify team"}</button>
        </div>
      </form>
    </div>
  );
}
