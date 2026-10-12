import { ENVIRONMENTS } from "../../lib/envStore.js";
import { timeAgo, fullDate } from "../../lib/time.js";
import Icon from "../Icon.jsx";

const LABEL = { live: "Live", down: "Down", unknown: "Can't check", checking: "Checking…" };
const DOT = { live: "green", down: "red", unknown: "amber", checking: "grey" };

export default function EnvironmentTable({ project, results }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr><th>Environment</th><th>URL</th><th>Status</th><th>Response Time</th><th>Last Ping</th></tr>
        </thead>
        <tbody>
          {ENVIRONMENTS.map((env) => {
            const url = project.envs[env.id];
            if (!url) {
              return (
                <tr key={env.id}>
                  <td><span className={`env-pill ${env.id}`}>{env.label}</span></td>
                  <td colSpan={4} className="na">Not configured</td>
                </tr>
              );
            }
            const r = results[url];
            const status = r?.status ?? "checking";
            return (
              <tr key={env.id}>
                <td><span className={`env-pill ${env.id}`}>{env.label}</span></td>
                <td>
                  <a className="env-link" href={url} target="_blank" rel="noopener noreferrer">
                    {url} <Icon name="external" size={16} />
                  </a>
                </td>
                <td>
                  <span className={`status ${status}`} title={r?.reason ?? ""}>
                    <span className={`cdot ${DOT[status]}`} />{LABEL[status]}
                  </span>
                </td>
                <td className={r?.status === "live" ? (r.ms > 1000 ? "slow" : "") : "na"}>
                  {r?.status === "live" ? `${r.ms}ms` : r?.status ? "N/A" : "…"}
                </td>
                <td title={r?.at ? fullDate(r.at) : ""}>
                  {r?.checking ? "Checking now" : r?.at ? timeAgo(r.at) : "Not checked yet"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
