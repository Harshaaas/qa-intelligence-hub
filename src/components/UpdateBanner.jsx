import { useTemplates } from "../context/TemplatesContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";
import Icon from "./Icon.jsx";

// Blue bar across the top when a template was updated since the user last looked
export default function UpdateBanner({ onOpenTemplates }) {
  const { unread, markAllRead } = useTemplates();
  const { settings } = useSettings();
  if (!unread.length || !settings.notifications.bellBadge) return null;
  const n = unread[0];
  const more = unread.length - 1;

  return (
    <div className="banner" role="status">
      <Icon name="info" size={22} />
      <p>
        <strong>Template Update:</strong> {n.uploadedBy.name} has updated the {n.templateName} ({n.version}).
        {" "}All team members should sync their local templates.
        {more > 0 && ` ${more} more update${more > 1 ? "s" : ""}.`}{" "}
        <button className="banner-link" onClick={onOpenTemplates}>View templates</button>
      </p>
      <button className="banner-close" onClick={markAllRead} aria-label="Dismiss update">
        <Icon name="x" size={20} />
      </button>
    </div>
  );
}
