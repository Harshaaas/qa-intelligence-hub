import { useState } from "react";
import { FORMATS, downloadVersion, syncStatus } from "../../lib/templateStore.js";
import { timeAgo, fullDate, fileSize } from "../../lib/time.js";
import Icon from "../Icon.jsx";

const SYNC = {
  synced: { icon: "checkCircle", text: "Synced to OneDrive" },
  pending: { icon: "clock", text: "Sync Pending" },
  failed: { icon: "alert", text: "Sync Failed" },
  off: { icon: "clock", text: "Auto-sync is off" },
};

export default function TemplateCard({ type, versions, isLatest, autoSync }) {
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState("");
  const latest = versions[0];
  const sync = SYNC[syncStatus(latest, autoSync)];
  const syncKey = syncStatus(latest, autoSync);

  const download = async (v) => {
    setError("");
    try { await downloadVersion(type, v); } catch (e) { setError(e.message); }
  };

  return (
    <article className="card tpl-card">
      {isLatest && <span className="latest-pill">Latest Update</span>}
      <div className="tpl-top">
        <span className="icon-tile blue lg"><Icon name="file" size={26} /></span>
        <span className="format-chip">{FORMATS[type.format].badge}</span>
      </div>
      <h3>{type.name}</h3>
      <p className="desc">{type.description}</p>
      <div className="kv"><span className="k">Version</span><span className="v">{latest.version}</span></div>
      <div className="kv"><span className="k">Updated</span><span className="v" title={fullDate(latest.uploadedAt)}>{timeAgo(latest.uploadedAt)}</span></div>
      {latest.note && latest.note !== "Baseline template" && (
        <p className="muted small">{latest.uploadedBy.name}: {latest.note}</p>
      )}
      <div className={`sync-box ${syncKey}`}><Icon name={sync.icon} size={18} /> {sync.text}</div>
      <button className="btn soft" onClick={() => download(latest)}><Icon name="download" size={20} /> Download</button>
      {error && <p className="error small">{error}</p>}

      {versions.length > 1 && (
        <>
          <button className="link history-link" onClick={() => setShowHistory(!showHistory)} aria-expanded={showHistory}>
            {showHistory ? "Hide" : "Show"} version history ({versions.length})
          </button>
          {showHistory && (
            <div className="history">
              {versions.map((v, i) => (
                <div key={v.id} className="history-item">
                  <span>
                    <strong>{v.version}</strong>{i === 0 && " (current)"}{" "}
                    <span className="muted">{fullDate(v.uploadedAt)}, {v.uploadedBy.name}{v.size ? `, ${fileSize(v.size)}` : ""}</span>
                  </span>
                  <button className="link" onClick={() => download(v)}>Download</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </article>
  );
}
