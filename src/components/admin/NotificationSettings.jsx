import Toggle from "./Toggle.jsx";
import { useDraft, SaveBar } from "./SettingsSection.jsx";

export default function NotificationSettings() {
  const { draft, set, dirty, saved, commit } = useDraft("notifications");
  return (
    <div>
      <Toggle label="Template update pop-ups" checked={draft.popups} onChange={(v) => set("popups", v)}
        description="Show a pop-up to team members when a new template version is uploaded." />
      <Toggle label="Unread count on the bell" checked={draft.bellBadge} onChange={(v) => set("bellBadge", v)}
        description="Show the number of unread template updates on the notification bell." />
      <Toggle label="Environment down alerts" checked={draft.envDownAlerts} onChange={(v) => set("envDownAlerts", v)}
        description="Show an alert in the Environment Directory when an environment changes from Live to Down." />
      <SaveBar dirty={dirty} saved={saved} onSave={commit} />
    </div>
  );
}
