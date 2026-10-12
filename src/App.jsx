import { useState } from "react";
import { SettingsProvider } from "./context/SettingsContext.jsx";
import { UserProvider, useUser } from "./context/UserContext.jsx";
import { TemplatesProvider } from "./context/TemplatesContext.jsx";
import { canAccessAdmin } from "./utils/roles.js";
import Sidebar from "./components/Sidebar.jsx";
import UpdateBanner from "./components/UpdateBanner.jsx";
import Toast from "./components/Toast.jsx";
import StatisticalEngine from "./pages/StatisticalEngine.jsx";
import TemplateRepository from "./pages/TemplateRepository.jsx";
import EnvironmentDirectory from "./pages/EnvironmentDirectory.jsx";
import AdminSettings from "./pages/AdminSettings.jsx";

const TAB_KEY = "qahub-tab";

function Shell() {
  const { user } = useUser();
  const [savedTab, setTab] = useState(() => localStorage.getItem(TAB_KEY) || "engine");
  const isAdmin = canAccessAdmin(user.role);
  // QA Engineers can never land on Admin Settings, even if it was the last tab used
  const tab = savedTab === "admin" && !isAdmin ? "engine" : savedTab;

  const changeTab = (t) => {
    setTab(t);
    localStorage.setItem(TAB_KEY, t);
    window.scrollTo(0, 0);
  };

  return (
    <div className="layout">
      <Sidebar tab={tab} onTabChange={changeTab} />
      <div className="main">
        <UpdateBanner onOpenTemplates={() => changeTab("templates")} />
        {/* Pages stay mounted so an uploaded Jira file isn't lost when switching tabs */}
        <div hidden={tab !== "engine"}><StatisticalEngine /></div>
        <div hidden={tab !== "templates"}><TemplateRepository /></div>
        <div hidden={tab !== "environments"}><EnvironmentDirectory active={tab === "environments"} /></div>
        {isAdmin && <div hidden={tab !== "admin"}><AdminSettings /></div>}
      </div>
      <Toast onOpenTemplates={() => changeTab("templates")} />
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <UserProvider>
        <TemplatesProvider>
          <Shell />
        </TemplatesProvider>
      </UserProvider>
    </SettingsProvider>
  );
}
