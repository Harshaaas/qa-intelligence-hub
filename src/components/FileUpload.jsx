import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { parseFile, parseCsvText, toDataset } from "../lib/parseFile.js";
import Icon from "./Icon.jsx";

const SAMPLE_URL = `${import.meta.env.BASE_URL}sample-jira-bugs.csv`;

// Empty-state upload card. Parent can call ref.current.open() to pick a new file.
const FileUpload = forwardRef(function FileUpload({ onLoad, showCard }, ref) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useImperativeHandle(ref, () => ({ open: () => inputRef.current.click() }));

  const handle = async (loader) => {
    setBusy(true);
    setError("");
    try {
      onLoad(await loader());
    } catch (e) {
      setError(e.message || "Could not read this file.");
    } finally {
      setBusy(false);
    }
  };
  const onFiles = (files) => files?.[0] && handle(() => parseFile(files[0]));
  const loadSample = () => handle(async () => {
    const res = await fetch(SAMPLE_URL);
    return toDataset(parseCsvText(await res.text()), "Project Alpha sample.csv");
  });

  const input = (
    <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" hidden
      onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
  );

  if (!showCard) return <>{input}{error && <p className="error mt">{error}</p>}</>;

  return (
    <section className="card upload-card">
      <div
        className={`dropzone ${dragging ? "dragging" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); onFiles(e.dataTransfer.files); }}
      >
        <span className="icon-tile blue lg"><Icon name="upload" size={26} /></span>
        <h2>{busy ? "Reading file…" : "Upload a Jira bug export"}</h2>
        <p className="muted">
          Drop a .csv, .xlsx or Jira .xls export here. Pareto analysis, the SPC chart, ANOVA and the
          t-test run automatically.
        </p>
        <div className="row-gap">
          <button className="btn primary lg" onClick={() => inputRef.current.click()} disabled={busy}>
            <Icon name="upload" size={18} /> Choose file
          </button>
          <button className="btn lg" onClick={loadSample} disabled={busy}>Use sample data</button>
        </div>
        <p className="muted small">
          Export from Jira with <em>Export CSV (all fields)</em>.{" "}
          <a href={SAMPLE_URL} download="sample-jira-bugs.csv">Download the sample file</a> to see the format.
        </p>
      </div>
      {input}
      {error && <p className="error mt">{error}</p>}
    </section>
  );
});

export default FileUpload;
