import { useEffect, useState } from "react";
import { ENVIRONMENTS, validateProject, toProject } from "../../lib/envStore.js";

const EMPTY = { name: "", oneDriveUrl: "", envs: { dev: "", qa: "", uat: "" } };

export default function ProjectModal({ project, projects, onSave, onClose }) {
  const [form, setForm] = useState(
    project ? { name: project.name, oneDriveUrl: project.oneDriveUrl ?? "", envs: { ...EMPTY.envs, ...project.envs } } : EMPTY
  );
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (field, value) => setForm({ ...form, [field]: value });
  const setEnv = (id, value) => setForm({ ...form, envs: { ...form.envs, [id]: value } });

  const submit = (e) => {
    e.preventDefault();
    const problems = validateProject(form, projects, project?.id);
    setErrors(problems);
    if (Object.keys(problems).length === 0) onSave(toProject(form, project));
  };

  const fieldError = (id) => errors[id] && <span className="field-error">{errors[id]}</span>;

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit} aria-labelledby="project-title" noValidate>
        <h2 id="project-title">{project ? `Edit ${project.name}` : "Add project"}</h2>

        <label>Project name
          <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Project Gamma" />
          {fieldError("name")}
        </label>

        <label>OneDrive folder link <span className="muted small-inline">(optional)</span>
          <input className="input" value={form.oneDriveUrl} onChange={(e) => set("oneDriveUrl", e.target.value)}
            placeholder="https://company-my.sharepoint.com/…" />
          {fieldError("oneDriveUrl")}
        </label>

        {ENVIRONMENTS.map((env) => (
          <label key={env.id}>{env.label} URL
            <input className="input" value={form.envs[env.id]} onChange={(e) => setEnv(env.id, e.target.value)}
              placeholder={`https://${env.id}.project.company.com`} />
            {fieldError(env.id)}
          </label>
        ))}
        <p className="muted small">Store URLs only. Never add usernames, passwords or tokens.</p>

        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary">{project ? "Save changes" : "Add project"}</button>
        </div>
      </form>
    </div>
  );
}
