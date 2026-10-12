import { useMemo, useRef, useState } from "react";
import { guessMapping } from "../lib/columns.js";
import {
  buildRecords, reportContext, filterOptions, filterRecords, defectsPerSprint, kpis, MONTHS,
} from "../lib/analysis.js";
import { useSettings } from "../context/SettingsContext.jsx";
import { useUser } from "../context/UserContext.jsx";
import { canAccessAdmin } from "../utils/roles.js";
import FileUpload from "../components/FileUpload.jsx";
import ColumnsModal from "../components/ColumnsModal.jsx";
import TargetsModal from "../components/TargetsModal.jsx";
import KpiCards from "../components/KpiCards.jsx";
import ParetoSection from "../components/ParetoSection.jsx";
import SpcSection from "../components/SpcSection.jsx";
import HypothesisSection from "../components/HypothesisSection.jsx";
import Icon from "../components/Icon.jsx";

export default function StatisticalEngine() {
  const { settings } = useSettings();
  const { user } = useUser();
  const uploadRef = useRef(null);
  const [dataset, setDataset] = useState(null);
  const [mapping, setMapping] = useState({});
  const [bugsOnly, setBugsOnly] = useState(true);
  const [filters, setFilters] = useState({ month: "all", year: "all", project: "all" });
  const [modal, setModal] = useState(null); // "columns" | "targets"

  const loadDataset = (ds) => {
    setDataset(ds);
    setMapping(guessMapping(ds.headers));
    setFilters({ month: "all", year: "all", project: "all" });
  };

  const allRecords = useMemo(() => (dataset ? buildRecords(dataset, mapping, bugsOnly) : []), [dataset, mapping, bugsOnly]);
  const options = useMemo(() => filterOptions(allRecords), [allRecords]);
  const records = useMemo(() => filterRecords(allRecords, filters), [allRecords, filters]);
  const context = useMemo(() => (dataset ? reportContext(records, dataset.fileName) : null), [records, dataset]);
  const spc = useMemo(() => (mapping.sprint ? defectsPerSprint(records) : null), [records, mapping.sprint]);
  const kpi = useMemo(() => kpis(spc, settings.quality), [spc, settings.quality]);

  const project = filters.project !== "all" ? filters.project : context?.project;
  const period = filters.month !== "all" && filters.year !== "all" ? `${MONTHS[filters.month]} ${filters.year}`
    : filters.year !== "all" ? (filters.month !== "all" ? `${MONTHS[filters.month]} ${filters.year}` : String(filters.year))
    : filters.month !== "all" ? `${MONTHS[filters.month]}${options.years.length === 1 ? ` ${options.years[0]}` : " (all years)"}` : context?.period;
  const title = [project, period].filter(Boolean).join(" - ");
  const setFilter = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

  return (
    <main className="content">
      <div className="page-head">
        <div>
          <h1>CMMI Statistical Engine</h1>
          <p className="sub">Advanced analytics from Jira data sources</p>
        </div>
        {dataset && (
          <div className="filters">
            <Icon name="calendar" size={22} />
            <select className="select" value={filters.month} onChange={setFilter("month")} aria-label="Month">
              <option value="all">All months</option>
              {options.months.map((m) => <option key={m} value={m}>{MONTHS[m]}</option>)}
            </select>
            <select className="select" value={filters.year} onChange={setFilter("year")} aria-label="Year">
              <option value="all">All years</option>
              {options.years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <span className="divider" />
            <select className="select" value={filters.project} onChange={setFilter("project")} aria-label="Project">
              <option value="all">{options.projects.length === 1 ? options.projects[0] : "All projects"}</option>
              {options.projects.length > 1 && options.projects.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        )}
      </div>

      <FileUpload ref={uploadRef} onLoad={loadDataset} showCard={!dataset} />

      {dataset && (
        <>
          <div className="info-bar">
            <p>
              <strong>Viewing:</strong> {[project, period].filter(Boolean).join(" • ")} • {records.length} defects from {dataset.fileName}
            </p>
            <div className="row-gap">
              <button className="link" onClick={() => setModal("columns")}>Columns</button>
              {canAccessAdmin(user.role) && <button className="link" onClick={() => setModal("targets")}>Targets</button>}
              <button className="link" onClick={() => uploadRef.current.open()}>Upload new file</button>
            </div>
          </div>

          {records.length === 0 ? (
            <p className="empty">No defects match these filters. Try "All months" or check the column mapping.</p>
          ) : (
            <div className="stack">
              <KpiCards kpi={kpi} quality={settings.quality} />
              <div className="grid-2">
                <ParetoSection records={records} headers={dataset.headers} field={mapping.category || dataset.headers[0]} project={project} />
                <SpcSection spc={spc} hasSprint={!!mapping.sprint} />
              </div>
              <HypothesisSection records={records} title={title} mapping={mapping} />
            </div>
          )}
        </>
      )}

      {modal === "columns" && (
        <ColumnsModal dataset={dataset} mapping={mapping} onMappingChange={setMapping}
          bugsOnly={bugsOnly} onBugsOnlyChange={setBugsOnly} onClose={() => setModal(null)} />
      )}
      {modal === "targets" && <TargetsModal onClose={() => setModal(null)} />}
    </main>
  );
}
