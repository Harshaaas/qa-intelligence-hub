import { createContext, useContext, useEffect, useState } from "react";
import { loadSettings, saveSettings, subscribeSettings } from "../lib/settingsStore.js";

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings);
  useEffect(() => subscribeSettings(setSettings), []);

  const save = (next) => {
    setSettings(next);
    saveSettings(next);
  };

  return <SettingsContext.Provider value={{ settings, save }}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
