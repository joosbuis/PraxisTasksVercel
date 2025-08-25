import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

/**
 * Minimal types – pas gerust aan jouw schema aan.
 */
export type TaskStatus = 'todo' | 'pickup' | 'inprogress' | 'done'
export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority?: 'low' | 'medium' | 'high'
  created_at?: string
  updated_at?: string
  created_by?: string
  assignee_id?: string | null
  // optioneel log, als je die in DB hebt
  log?: string[]
}

type Theme = 'light' | 'dark' | 'system'
type Language = 'nl' | 'en'

/**
 * Vertalingen – breid gerust uit.
 */
const i18n: Record<Language, Record<string, string>> = {
  nl: {
    appTitle: 'Praxis Tasks',
    statusTodo: 'Taken',
    statusPickup: 'Oppakken',
    statusInProgress: 'Mee bezig',
    statusDone: 'Afgerond',
    start: 'Start',
    resume: 'Hervatten',
    pause: 'Pauzeren',
    complete: 'Afronden',
    remove: 'Verwijderen',
    confirmComplete: 'Weet je zeker dat je deze taak wilt afronden?',
    confirmDelete: 'Weet je zeker dat je deze taak wilt verwijderen?',
    settings: 'Instellingen',
    language: 'Taal',
    theme: 'Thema',
    autoLogout: 'Automatisch uitloggen',
    minutes: 'minuten',
    never: 'Nooit',
    saved: 'Opgeslagen',
    logout: 'Uitloggen',
  },
  en: {
    appTitle: 'Praxis Tasks',
    statusTodo: 'To do',
    statusPickup: 'Pick up',
    statusInProgress: 'In progress',
    statusDone: 'Done',
    start: 'Start',
    resume: 'Resume',
    pause: 'Pause',
    complete: 'Complete',
    remove: 'Delete',
    confirmComplete: 'Are you sure you want to complete this task?',
    confirmDelete: 'Are you sure you want to delete this task?',
    settings: 'Settings',
    language: 'Language',
    theme: 'Theme',
    autoLogout: 'Auto logout',
    minutes: 'minutes',
    never: 'Never',
    saved: 'Saved',
    logout: 'Logout',
  },
}

interface AppContextShape {
  // Auth
  session: Session | null
  currentUser: User | null
  loginWithOtp: (email: string) => Promise<void>
  logout: () => Promise<void>

  // Tasks
  tasks: Task[]
  refreshTasks: () => Promise<void>
  createTask: (payload: Partial<Task>) => Promise<Task | null>
  updateTask: (id: string, patch: Partial<Task>) => Promise<Task | null>
  deleteTask: (id: string, reason?: string) => Promise<boolean>

  // UI prefs
  theme: Theme
  setTheme: (t: Theme) => void
  language: Language
  setLanguage: (l: Language) => void
  t: Record<string, string>

  // Auto logout
  autoLogoutMinutes: number // 0 = disabled
  setAutoLogoutMinutes: (m: number) => void
  recordUserActivity: () => void
}

const AppContext = createContext<AppContextShape | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  // ---------- Auth ----------
  const [session, setSession] = useState<Session | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  // ---------- Tasks ----------
  const [tasks, setTasks] = useState<Task[]>([])

  // ---------- UI prefs ----------
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('pt_theme') as Theme | null
    return saved ?? 'system'
  })
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('pt_language') as Language | null
    return saved ?? 'nl'
  })

  // ---------- Auto logout ----------
  const [autoLogoutMinutes, setAutoLogoutMinutesState] = useState<number>(() => {
    const saved = localStorage.getItem('pt_autoLogoutMinutes')
    return saved ? Number(saved) : 0 // 0 = disabled
  })
  const logoutTimerRef = useRef<number | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  // Apply theme
  useEffect(() => {
    localStorage.setItem('pt_theme', theme)
    const root = document.documentElement
    const prefersDark =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches

    const enableDark =
      theme === 'dark' || (theme === 'system' && prefersDark)

    root.classList.toggle('dark', enableDark)
  }, [theme])

  // i18n memo
  const t = useMemo(() => i18n[language], [language])

  // Persist language
  useEffect(() => {
    localStorage.setItem('pt_language', language)
  }, [language])

  // Persist auto-logout minutes
  useEffect(() => {
    localStorage.setItem('pt_autoLogoutMinutes', String(autoLogoutMinutes))
    resetLogoutTimer()
  }, [autoLogoutMinutes, session])

  // Activity listeners for auto-logout
  useEffect(() => {
    const events = ['click', 'keydown', 'mousemove', 'touchstart', 'scroll']
    const onActivity = () => recordUserActivity()
    events.forEach((ev) => window.addEventListener(ev, onActivity))
    return () => events.forEach((ev) => window.removeEventListener(ev, onActivity))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLogoutMinutes, session])

  function recordUserActivity() {
    lastActivityRef.current = Date.now()
    resetLogoutTimer()
  }

  function resetLogoutTimer() {
    if (logoutTimerRef.current) {
      window.clearTimeout(logoutTimerRef.current)
      logoutTimerRef.current = null
    }
    if (!session || autoLogoutMinutes <= 0) return
    const ms = autoLogoutMinutes * 60 * 1000
    logoutTimerRef.current = window.setTimeout(async () => {
      // alleen uitloggen als er echt geen activiteit is geweest
      const idle = Date.now() - lastActivityRef.current
      if (idle >= ms) {
        await logout()
      } else {
        resetLogoutTimer()
      }
    }, ms)
  }

  // ---------- Auth lifecycle ----------
  useEffect(() => {
    let mounted = true

    // initial
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session ?? null)
      setCurrentUser(data.session?.user ?? null)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return
      setSession(newSession ?? null)
      setCurrentUser(newSession?.user ?? null)
      if (newSession) {
        // refresh tasks when logging in
        refreshTasks()
      } else {
        setTasks([])
      }
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  // ---------- Tasks realtime ----------
  useEffect(() => {
    // subscribe only when logged in
    if (!session) return

    const channel = supabase
      .channel('public:tasks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload: any) => {
          setTasks((prev) => {
            const next = [...prev]
            if (payload.eventType === 'INSERT') {
              const row = payload.new as Task
              if (!next.find((t) => t.id === row.id)) next.unshift(row)
            }
            if (payload.eventType === 'UPDATE') {
              const row = payload.new as Task
              const idx = next.findIndex((t) => t.id === row.id)
              if (idx >= 0) next[idx] = { ...next[idx], ...row }
            }
            if (payload.eventType === 'DELETE') {
              const row = payload.old as Task
              const idx = next.findIndex((t) => t.id === row.id)
              if (idx >= 0) next.splice(idx, 1)
            }
            return next
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session])

  // ---------- API helpers ----------
  async function refreshTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('[tasks] load error', error)
      return
    }
    setTasks(data as Task[])
  }

  async function createTask(payload: Partial<Task>) {
    const userId = currentUser?.id
    const insert = {
      title: payload.title ?? 'Nieuwe taak',
      description: payload.description ?? '',
      status: (payload.status ?? 'todo') as TaskStatus,
      priority: payload.priority ?? 'medium',
      created_by: userId,
      assignee_id: payload.assignee_id ?? null,
    }
    const { data, error } = await supabase.from('tasks').insert(insert).select().single()
    if (error) {
      console.error('[tasks] insert error', error)
      return null
    }
    return data as Task
  }

  async function updateTask(id: string, patch: Partial<Task>) {
    const { data, error } = await supabase
      .from('tasks')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) {
      console.error('[tasks] update error', error)
      return null
    }
    return data as Task
  }

  async function deleteTask(id: string, reason?: string) {
    // Als je een prullenbak gebruikt, vervang dit door een "soft delete".
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) {
      console.error('[tasks] delete error', error, { reason })
      return false
    }
    return true
  }

  // ---------- Auth helpers ----------
  async function loginWithOtp(email: string) {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
    if (error) {
      console.error('[auth] OTP error', error)
      throw error
    }
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  // ---------- Setters with persistence ----------
  function setTheme(next: Theme) {
    setThemeState(next)
  }
  function setLanguage(next: Language) {
    setLanguageState(next)
  }
  function setAutoLogoutMinutes(next: number) {
    const safe = Number.isFinite(next) && next >= 0 ? Math.floor(next) : 0
    setAutoLogoutMinutesState(safe)
  }

  const value: AppContextShape = {
    session,
    currentUser,

    tasks,
    refreshTasks,
    createTask,
    updateTask,
    deleteTask,

    theme,
    setTheme,
    language,
    setLanguage,
    t,

    autoLogoutMinutes,
    setAutoLogoutMinutes,
    recordUserActivity,

    loginWithOtp,
    logout,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
