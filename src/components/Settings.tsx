import React, { useState, useEffect } from 'react'
import { useApp } from '@/contexts/AppContext'

export default function Settings() {
  const {
    t,
    language,
    setLanguage,
    theme,
    setTheme,
    autoLogoutMinutes,
    setAutoLogoutMinutes,
  } = useApp()

  // lokale state om "apply" te simuleren (voorkomt direct vliegen van timers)
  const [langLocal, setLangLocal] = useState(language)
  const [themeLocal, setThemeLocal] = useState(theme)
  const [logoutLocal, setLogoutLocal] = useState<number>(autoLogoutMinutes)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setLangLocal(language)
  }, [language])
  useEffect(() => {
    setThemeLocal(theme)
  }, [theme])
  useEffect(() => {
    setLogoutLocal(autoLogoutMinutes)
  }, [autoLogoutMinutes])

  function onSave(e?: React.FormEvent) {
    e?.preventDefault()
    setLanguage(langLocal)
    setTheme(themeLocal)
    setAutoLogoutMinutes(Number(logoutLocal) || 0)
    setSaved(true)
    const to = setTimeout(() => setSaved(false), 1500)
    return () => clearTimeout(to)
  }

  return (
    <form onSubmit={onSave} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">{t.language}</label>
        <select
          className="border rounded px-2 py-1 w-full"
          value={langLocal}
          onChange={(e) => setLangLocal(e.target.value as any)}
        >
          <option value="nl">Nederlands</option>
          <option value="en">English</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{t.theme}</label>
        <select
          className="border rounded px-2 py-1 w-full"
          value={themeLocal}
          onChange={(e) => setThemeLocal(e.target.value as any)}
        >
          <option value="system">Systeem</option>
          <option value="light">Licht</option>
          <option value="dark">Donker</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {t.autoLogout} ({t.minutes})
        </label>
        <input
          type="number"
          min={0}
          className="border rounded px-2 py-1 w-full"
          value={logoutLocal}
          onChange={(e) => setLogoutLocal(parseInt(e.target.value || '0', 10))}
          placeholder={`0 = ${t.never}`}
        />
        <p className="text-xs text-gray-500 mt-1">
          {logoutLocal === 0 ? t.never : `${logoutLocal} ${t.minutes}`}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="px-3 py-1 rounded bg-black text-white"
        >
          {t.settings}
        </button>
        {saved && <span className="text-green-600 text-sm">{t.saved}</span>}
      </div>
    </form>
  )
}
