import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "./UserContext.jsx";
import { loadSettings } from "../lib/settingsStore.js";
import {
  loadTemplates, loadNotifications, loadSeenAt, markSeen,
  uploadTemplate, resetTemplates, subscribe,
} from "../lib/templateStore.js";

const TemplatesContext = createContext(null);

export function TemplatesProvider({ children }) {
  const { user } = useUser();
  const [templates, setTemplates] = useState(loadTemplates);
  const [notifications, setNotifications] = useState(loadNotifications);
  const [seenAt, setSeenAt] = useState(() => loadSeenAt(user.id));
  const [toast, setToast] = useState(null);
  const [, setTick] = useState(0);

  const userRef = useRef(user);
  userRef.current = user;

  // Switching user loads that user's "last seen" time
  useEffect(() => { setSeenAt(loadSeenAt(user.id)); setToast(null); }, [user.id]);

  // Uploads made in another window appear here instantly
  useEffect(() =>
    subscribe((msg) => {
      setTemplates(loadTemplates());
      setNotifications(loadNotifications());
      if (msg.type === "template-uploaded" && msg.notification.uploadedBy.id !== userRef.current.id && loadSettings().notifications.popups) {
        setToast({ kind: "update", notification: msg.notification });
      }
    }), []);

  // Refresh "x minutes ago" labels every minute
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(id);
  }, []);

  const unread = useMemo(
    () => notifications.filter((n) => n.at > seenAt && n.uploadedBy.id !== user.id),
    [notifications, seenAt, user.id]
  );

  const value = {
    templates,
    notifications,
    unread,
    isUnread: (n) => n.at > seenAt && n.uploadedBy.id !== user.id,
    markAllRead: () => setSeenAt(markSeen(user.id)),
    upload: async (args) => {
      const r = await uploadTemplate({ ...args, user });
      setTemplates(r.templates);
      setNotifications(r.notifications);
      setToast({ kind: "uploaded", notification: r.notification });
    },
    reset: async () => {
      await resetTemplates();
      setTemplates(loadTemplates());
      setNotifications([]);
    },
    toast,
    dismissToast: () => setToast(null),
  };

  return <TemplatesContext.Provider value={value}>{children}</TemplatesContext.Provider>;
}

export const useTemplates = () => useContext(TemplatesContext);
