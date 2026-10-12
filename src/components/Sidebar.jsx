import { useUser } from "../context/UserContext.jsx";
import { ROLE_LABELS, ROLE_SHORT, canAccessAdmin } from "../utils/roles.js";
import BrandLogo from "./BrandLogo.jsx";
import Icon from "./Icon.jsx";

export const TABS = [
  { id: "engine", label: "CMMI Statistical Engine", icon: "chart" },
  { id: "templates", label: "Template Repository", icon: "file" },
  { id: "environments", label: "Environment Directory", icon: "globe" },
  { id: "admin", label: "Admin Settings", icon: "settings", adminOnly: true },
];

const initials = (name) => name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();

export default function Sidebar({ tab, onTabChange }) {
  const { user, users, switchUser } = useUser();
  const admin = canAccessAdmin(user.role);

  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <BrandLogo />
        <div className="sb-title">QA Intelligence Hub</div>
        <div className="sb-sub">CMMI Compliance Portal</div>
      </div>

      <nav className="sb-nav" aria-label="Sections">
        {TABS.filter((t) => !t.adminOnly || admin).map((t) => (
          <button
            key={t.id}
            className={`sb-link ${tab === t.id ? "active" : ""}`}
            aria-current={tab === t.id ? "page" : undefined}
            onClick={() => onTabChange(t.id)}
          >
            <Icon name={t.icon} />
            <span>{t.label}</span>
            {t.adminOnly && <Icon name="lock" size={16} className="sb-lock" />}
          </button>
        ))}
      </nav>

      <div className="sb-access">
        <div className="sb-label">Access level</div>
        <div className="sb-role">
          <span className="dot-green" />
          <span>{ROLE_SHORT[user.role]}</span>
          <span className={`sb-badge ${admin ? "" : "viewer"}`}>{admin ? "Admin" : "Viewer"}</span>
        </div>
      </div>

      <div className="sb-user">
        <span className="avatar">{initials(user.name)}</span>
        <div className="sb-user-info">
          <div className="sb-user-name">{user.name}</div>
          <label className="sb-switch">
            <span className="sr-only">Switch demo user</span>
            <select value={user.id} onChange={(e) => switchUser(e.target.value)} title="Switch demo user">
              {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({ROLE_LABELS[u.role]})</option>)}
            </select>
          </label>
        </div>
      </div>
    </aside>
  );
}
