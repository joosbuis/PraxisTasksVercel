import React, { useMemo, useState } from "react";
import { Settings as SettingsIcon, Users, Palette, Globe, Clock } from "lucide-react";
import { useApp, AppSettings } from "../contexts/AppContext";

export default function Settings() {
  const { currentUser, settings, updateSettings, t } = useApp();
  const [lang, setLang] = useState(settings.language);

  if (!currentUser) return <div>{t.loginToAccount}</div>;

  const setTheme = (theme: AppSettings["theme"]) => updateSettings({ theme });
  const setLanguage = (language: AppSettings["language"]) => {
    setLang(language);
    updateSettings({ language });
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <SettingsIcon />
        <h1 className="font-bold">{t.settings}</h1>
      </div>

      {/* Theme */}
      <div className="mb-4 flex gap-2">
        <button type="button" onClick={() => setTheme("light")} className={settings.theme === "light" ? "btn-primary" : "btn"}>
          {t.light}
        </button>
        <button type="button" onClick={() => setTheme("dark")} className={settings.theme === "dark" ? "btn-primary" : "btn"}>
          {t.dark}
        </button>
      </div>

      {/* Language */}
      <div className="mb-4">
        <label>{t.language}</label>
        <select value={lang} onChange={(e) => setLanguage(e.target.value as AppSettings["language"])} className="ml-2">
          <option value="nl">Nederlands</option>
          <option value="en">English</option>
        </select>
      </div>

      {/* Auto logout */}
      <div className="mb-4 flex items-center gap-2">
        <Clock />
        <label>{t.autoLogout}</label>
        <input
          type="checkbox"
          checked={settings.autoLogout}
          onChange={(e) => updateSettings({ autoLogout: e.target.checked })}
        />
        {settings.autoLogout && (
          <input
            type="number"
            value={settings.autoLogoutTime}
            onChange={(e) => updateSettings({ autoLogoutTime: parseInt(e.target.value, 10) })}
            className="ml-2 w-16"
          />
        )}
      </div>
    </div>
  );
}
