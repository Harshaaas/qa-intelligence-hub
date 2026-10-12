import { useState } from "react";
import { useUser } from "../../context/UserContext.jsx";
import { useSettings } from "../../context/SettingsContext.jsx";
import { ROLE_LABELS, canAccessAdmin } from "../../utils/roles.js";
import { isEmail } from "../../lib/userStore.js";

export default function UserManagement() {
  const { user: me, users, updateUsers } = useUser();
  const { settings } = useSettings();
  const [form, setForm] = useState({ name: "", email: "", role: "member" });
  const [error, setError] = useState("");

  const admins = users.filter((u) => canAccessAdmin(u.role));
  const isLastAdmin = (u) => canAccessAdmin(u.role) && admins.length === 1;

  const changeRole = (u, role) => {
    if (isLastAdmin(u) && !canAccessAdmin(role)) {
      return setError("At least one Team Lead or Project Manager is needed to manage the hub.");
    }
    setError("");
    updateUsers(users.map((x) => (x.id === u.id ? { ...x, role } : x)));
  };

  const remove = (u) => {
    if (isLastAdmin(u)) return setError("You can't remove the last Team Lead or Project Manager.");
    if (settings.security.confirmDeletes && !window.confirm(`Remove ${u.name}?`)) return;
    setError("");
    updateUsers(users.filter((x) => x.id !== u.id));
  };

  const add = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Enter the person's name.");
    if (!isEmail(form.email)) return setError("Enter a valid email address.");
    if (users.some((u) => u.email.toLowerCase() === form.email.trim().toLowerCase())) {
      return setError("A user with this email already exists.");
    }
    setError("");
    updateUsers([...users, { id: `u${Date.now().toString(36)}`, name: form.name.trim(), email: form.email.trim(), role: form.role }]);
    setForm({ name: "", email: "", role: "member" });
  };

  return (
    <div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th /></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}{u.id === me.id && <span className="muted small"> (you)</span>}</td>
                <td className="muted">{u.email}</td>
                <td>
                  <select
                    className="select"
                    value={u.role}
                    onChange={(e) => changeRole(u, e.target.value)}
                    disabled={u.id === me.id}
                    aria-label={`Role for ${u.name}`}
                    title={u.id === me.id ? "You can't change your own role" : ""}
                  >
                    {Object.entries(ROLE_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                  </select>
                </td>
                <td className="num">
                  {u.id !== me.id && <button className="link danger" onClick={() => remove(u)}>Remove</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form className="add-user" onSubmit={add}>
        <input className="input" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Full name" />
        <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-label="Email" />
        <select className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} aria-label="Role">
          {Object.entries(ROLE_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
        <button className="btn primary">Add user</button>
      </form>
      {error && <p className="error">{error}</p>}

      <p className="muted small" style={{ marginTop: 16 }}>
        Team Leads and Project Managers can upload templates, manage environments and open Admin Settings.
        QA Engineers can view and download. Changes apply immediately.
      </p>
    </div>
  );
}
