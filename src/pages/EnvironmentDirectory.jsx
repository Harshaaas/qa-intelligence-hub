import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "../context/UserContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";
import { canManageEnvironments } from "../utils/roles.js";
import { ENVIRONMENTS, loadProjects, saveProjects, subscribeProjects, loadSelectedId, saveSelectedId } from "../lib/envStore.js";
import { useHealthChecks } from "../hooks/useHealthChecks.js";
import { timeAgo } from "../lib/time.js";
import EnvironmentTable from "../components/environments/EnvironmentTable.jsx";
import ProjectModal from "../components/environments/ProjectModal.jsx";
import Icon from "../components/Icon.jsx";

const urlsOf = (p) => ENVIRONMENTS.map((e) => p.envs[e.id]).filter(Boolean);

export default function EnvironmentDirectory({ active }) {
  const { user } = useUser();
  const { settings } = useSettings();
  const canManage = canManageEnvironments(user.role);
  const [projects, setProjects] = useState(loadProjects);
  const [filter, setFilter] = useState(() => loadSelectedId() || "all");
  const [collapsed, setCollapsed] = useState({});
  const [modal, setModal] = useState(null); // { project } for edit, {} for add
  const [alerts, setAlerts] = useState([]);
  const lastStatus = useRef({});

  useEffect(() => subscribeProjects(setProjects), []);

  const sorted = projects; // keep the order projects were added
  const visible = filter === "all" ? sorted : sorted.filter((p) => p.id === filter);
  const urls = useMemo(() => [...new Set(visible.flatMap(urlsOf))], [visible]);
  const { results, checking, checkNow } = useHealthChecks(urls, active && urls.length > 0);

  // Alert when an environment changes from Live to Down
  useEffect(() => {
    const fresh = [];
    for (const p of visible) {
      for (const env of ENVIRONMENTS) {
        const url = p.envs[env.id];
        const r = results[url];
        if (!url || !r?.status || r.checking) continue;
        if (lastStatus.current[url] === "live" && r.status === "down" && settings.notifications.envDownAlerts) {
          fresh.push({ id: `${url}-${r.at}`, text: `${p.name} ${env.label} went down`, at: r.at });
        }
        lastStatus.current[url] = r.status;
      }
    }
    if (fresh.length) setAlerts((a) => [...fresh, ...a].slice(0, 5));
  }, [results]);

  const changeFilter = (id) => { setFilter(id); saveSelectedId(id); };

  const save = (p) => {
    const next = projects.some((x) => x.id === p.id) ? projects.map((x) => (x.id === p.id ? p : x)) : [...projects, p];
    setProjects(next);
    saveProjects(next);
    setModal(null);
  };

  const remove = (project) => {
    if (settings.security.confirmDeletes && !window.confirm(`Delete ${project.name} and its environment links?`)) return;
    const next = projects.filter((p) => p.id !== project.id);
    setProjects(next);
    saveProjects(next);
    if (filter === project.id) changeFilter("all");
  };

  const statusOf = (u) => results[u]?.status;
  const live = urls.filter((u) => statusOf(u) === "live");
  const down = urls.filter((u) => statusOf(u) === "down");
  const avg = live.length ? Math.round(live.reduce((s, u) => s + results[u].ms, 0) / live.length) : null;

  return (
    <main className="content">
      <div className="page-head">
        <div>
          <h1>Environment Directory</h1>
          <p className="sub">Monitor all project environments and their availability</p>
        </div>
        <div className="filters">
          <label htmlFor="env-filter">Filter by Project:</label>
          <select id="env-filter" className="select" value={filter} onChange={(e) => changeFilter(e.target.value)}>
            <option value="all">All Projects</option>
            {sorted.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button className="btn" onClick={checkNow} disabled={checking}><Icon name="refresh" size={16} /> {checking ? "Checking…" : "Check now"}</button>
          {canManage && <button className="btn primary" onClick={() => setModal({})}><Icon name="plus" size={16} /> Add Project</button>}
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="note red env-alert" role="alert">
          <div>{alerts.map((a) => <p key={a.id}><strong>{a.text}</strong> <span className="small">{timeAgo(a.at)}</span></p>)}</div>
          <button className="link danger" onClick={() => setAlerts([])}>Dismiss</button>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="empty">{canManage ? "No projects yet. Add the first project and its environment URLs." : "No projects have been added yet."}</div>
      ) : (
        <div className="stack">
          {visible.map((p) => {
            const pu = urlsOf(p);
            const pl = pu.filter((u) => statusOf(u) === "live").length;
            const pd = pu.filter((u) => statusOf(u) === "down").length;
            const closed = collapsed[p.id];
            return (
              <section key={p.id} className="card env-card">
                <div className="env-card-head">
                  <button className="icon-btn" onClick={() => setCollapsed({ ...collapsed, [p.id]: !closed })}
                    aria-expanded={!closed} aria-label={`${closed ? "Expand" : "Collapse"} ${p.name}`}>
                    <Icon name="chevron" className={`chev ${closed ? "closed" : ""}`} />
                  </button>
                  <div>
                    <div className="env-title">
                      <h2>{p.name}</h2>
                      {p.oneDriveUrl && (
                        <a className="onedrive-chip" href={p.oneDriveUrl} target="_blank" rel="noopener noreferrer">
                          <Icon name="folder" size={18} /> OneDrive <Icon name="external" size={14} />
                        </a>
                      )}
                    </div>
                    <p className="env-summary">{pu.length} environment{pu.length !== 1 ? "s" : ""} • {pl} live • {pd} down</p>
                  </div>
                  <div className="env-counts">
                    <span><span className="cdot green" /> {pl}</span>
                    <span><span className="cdot red" /> {pd}</span>
                    {canManage && (
                      <span className="env-tools">
                        <button className="icon-btn" onClick={() => setModal({ project: p })} aria-label={`Edit ${p.name}`}><Icon name="pencil" size={16} /></button>
                        <button className="icon-btn" onClick={() => remove(p)} aria-label={`Delete ${p.name}`}><Icon name="trash" size={16} /></button>
                      </span>
                    )}
                  </div>
                </div>
                {!closed && <EnvironmentTable project={p} results={results} />}
              </section>
            );
          })}
        </div>
      )}

      <div className="grid-4" style={{ marginTop: 40 }}>
        <div className="card stat-card"><div className="label">Total Environments</div><div className="value">{urls.length}</div></div>
        <div className="card stat-card"><div className="label">Live Environments</div><div className="value green">{live.length}</div></div>
        <div className="card stat-card"><div className="label">Down Environments</div><div className="value red">{down.length}</div></div>
        <div className="card stat-card"><div className="label">Avg Response Time</div><div className="value">{avg != null ? `${avg}ms` : "N/A"}</div></div>
      </div>

      <p className="muted small" style={{ marginTop: 28, maxWidth: "85ch" }}>
        Status is checked from your browser every minute while this page is open. "Live" means the server responded;
        it doesn't confirm the application itself is healthy. Internal URLs need VPN. Sample projects use public
        websites as stand-ins.
      </p>

      {modal && (
        <ProjectModal project={modal.project ?? null} projects={projects} onSave={save} onClose={() => setModal(null)} />
      )}
    </main>
  );
}
