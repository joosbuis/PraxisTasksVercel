import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import type { RealtimeChannel, Session } from "@supabase/supabase-js";
import { Task, TaskStatus, User, UserRole, BoardType } from "../types";

/* ---------------- Settings ---------------- */
export interface AppSettings {
  theme: "light" | "dark" | "auto";
  language: "nl" | "en";
  autoLogout: boolean;
  autoLogoutTime: number;
  pushNotifications: boolean;
  deadlineWarnings: boolean;
  deadlineWarningDays: number;
  taskReminders: boolean;
  dailyReports: boolean;
  weeklyReports: boolean;
  autoArchive: boolean;
  archiveDays: number;
  allowTaskDeletion: boolean;
  requireTaskApproval: boolean;
  maxTasksPerUser: number;
}
export const defaultSettings: AppSettings = {
  theme: "light",
  language: "nl",
  autoLogout: false,
  autoLogoutTime: 15,
  pushNotifications: false,
  deadlineWarnings: false,
  deadlineWarningDays: 3,
  taskReminders: false,
  dailyReports: false,
  weeklyReports: false,
  autoArchive: false,
  archiveDays: 30,
  allowTaskDeletion: true,
  requireTaskApproval: false,
  maxTasksPerUser: 10,
};

/* ---------------- i18n ---------------- */
const I18N_NL = {
  loginToAccount: "Log in op je account",
  employeeNumber: "Personeelsnummer",
  password: "Wachtwoord",
  login: "Inloggen",
  loading: "Bezig...",
  loginError: "Er ging iets mis bij het inloggen",
  passwordsNotMatch: "Wachtwoorden komen niet overeen",
  passwordTooShort: "Wachtwoord is te kort",
  settings: "Instellingen",
  userManagement: "Gebruikersbeheer",
  personalSettings: "Persoonlijke instellingen",
  systemSettings: "Systeeminstellingen",
  tasks: "Taken",
  users: "Gebruikers",
  newTask: "Nieuwe taak",
  create: "Aanmaken",
  save: "Opslaan",
  cancel: "Annuleren",
  close: "Sluiten",
  confirm: "Bevestigen",
  yes: "Ja",
  delete: "Verwijderen",
  edit: "Bewerken",
  title: "Titel",
  description: "Beschrijving",
  priority: "Prioriteit",
  assignedTo: "Toewijzen aan",
  deadline: "Deadline",
  statusTodo: "Te Doen",
  statusNeedsPickup: "Taak oppakken",
  statusInProgress: "Mee Bezig",
  statusCompleted: "Afgerond",
  manager: "Manager",
  employee: "Medewerker",
  role: "Rol",
  name: "Naam",
  departments: "Afdeling",
  voorwinkel: "Voorwinkel",
  achterwinkel: "Achterwinkel",
  newUser: "Nieuwe gebruiker",
  userCreated: "Gebruiker aangemaakt",
  temporaryCode: "Eenmalige inlogcode",
  firstLogin: "Eerste login",
  low: "Laag",
  medium: "Gemiddeld",
  high: "Hoog",
  theme: "Thema",
  language: "Taal",
  sound: "Geluid",
  light: "Licht",
  dark: "Donker",
  auto: "Auto",
  autoLogout: "Automatisch uitloggen",
  autoLogoutTime: "Tijd tot automatisch uitloggen (min.)",
  pushNotifications: "Push notificaties",
  deadlineWarnings: "Deadline waarschuwingen",
  days: "dagen",
  taskReminders: "Taakherinneringen",
  dailyReport: "Dagrapport",
  weeklyReport: "Weekrapport",
  totalTasks: "Totaal taken",
  completed: "Afgerond",
  overdueTasks: "Verlopen taken",
  activeUsers: "Actieve gebruikers",
  start: "Starten",
  pause: "Pauzeren",
  pickup: "Oppakken",
  complete: "Afronden",
  welcome: "Welkom",
  loginSuccess: "Succesvol ingelogd",
  copyCode: "Kopieer code",
  copied: "Gekopieerd!",
} as const;

const I18N_EN: typeof I18N_NL = {
  loginToAccount: "Log in to your account",
  employeeNumber: "Employee number",
  password: "Password",
  login: "Log in",
  loading: "Loading...",
  loginError: "Something went wrong while logging in",
  passwordsNotMatch: "Passwords do not match",
  passwordTooShort: "Password is too short",
  settings: "Settings",
  userManagement: "User management",
  personalSettings: "Personal settings",
  systemSettings: "System settings",
  tasks: "Tasks",
  users: "Users",
  newTask: "New task",
  create: "Create",
  save: "Save",
  cancel: "Cancel",
  close: "Close",
  confirm: "Confirm",
  yes: "Yes",
  delete: "Delete",
  edit: "Edit",
  title: "Title",
  description: "Description",
  priority: "Priority",
  assignedTo: "Assign to",
  deadline: "Deadline",
  statusTodo: "To do",
  statusNeedsPickup: "Pick up task",
  statusInProgress: "In progress",
  statusCompleted: "Completed",
  manager: "Manager",
  employee: "Employee",
  role: "Role",
  name: "Name",
  departments: "Department",
  voorwinkel: "Front store",
  achterwinkel: "Back store",
  newUser: "New user",
  userCreated: "User created",
  temporaryCode: "One-time code",
  firstLogin: "First login",
  low: "Low",
  medium: "Medium",
  high: "High",
  theme: "Theme",
  language: "Language",
  sound: "Sound",
  light: "Light",
  dark: "Dark",
  auto: "Auto",
  autoLogout: "Auto logout",
  autoLogoutTime: "Auto logout time (min.)",
  pushNotifications: "Push notifications",
  deadlineWarnings: "Deadline warnings",
  days: "days",
  taskReminders: "Task reminders",
  dailyReport: "Daily report",
  weeklyReport: "Weekly report",
  totalTasks: "Total tasks",
  completed: "Completed",
  overdueTasks: "Overdue tasks",
  activeUsers: "Active users",
  start: "Start",
  pause: "Pause",
  pickup: "Pick up",
  complete: "Complete",
  welcome: "Welcome",
  loginSuccess: "Logged in successfully",
  copyCode: "Copy code",
  copied: "Copied!",
} as const;

/* ---------------- Local theme per user ---------------- */
function getUserTheme(userId?: string): AppSettings["theme"] | null {
  try {
    if (!userId) return null;
    const key = `praxis:userTheme:${userId}`;
    const val = localStorage.getItem(key);
    if (val === "light" || val === "dark" || val === "auto") return val;
    return null;
  } catch { return null; }
}
function setUserTheme(userId: string | undefined, theme: AppSettings["theme"]) {
  try { if (userId) localStorage.setItem(`praxis:userTheme:${userId}`, theme); } catch {}
}

/* ---------------- Context shape ---------------- */
export type AppContextType = {
  currentUser: User | null;
  isManager: boolean;
  users: User[];
  tasks: Task[];
  settings: AppSettings;
  t: typeof I18N_NL;
  currentBoard: BoardType;
  setCurrentBoard: (b: BoardType) => void;

  login: (employeeNumber: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setPassword: (userId: string, newPassword: string) => Promise<boolean>;
  consumeOneTimeCode: (employeeNumber: string, code: string) => Promise<User | null>;

  createUser: (u: { employeeNumber: string; name: string; role: UserRole | "employee"; boards: BoardType[] }) => Promise<boolean>;
  updateUser: (id: string, patch: { name?: string; role?: UserRole | "employee"; boards?: BoardType[] }) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;

  fetchTasks: () => Promise<void>;
  addTask: (t: Task) => Promise<void>;
  updateTask: (t: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  updateSettings: (next: Partial<AppSettings> | AppSettings) => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

/* ---------------- Helpers ---------------- */
const uuid = () => crypto.randomUUID();
const normalizeTask = (x: any): Task => ({
  id: String(x?.id ?? uuid()),
  title: String(x?.title ?? ""),
  status: ((): TaskStatus => {
    const v = String(x?.status ?? "todo").toLowerCase();
    if (v === "inprogress" || v === "in-progress") return "in-progress";
    if (v === "done" || v === "completed") return "completed";
    if (v.includes("pickup")) return "needs-pickup";
    return "todo";
  })(),
  createdAt: String(x?.created_at ?? x?.createdAt ?? new Date().toISOString()),
  updatedAt: String(x?.updated_at ?? x?.updatedAt ?? new Date().toISOString()),
  description: typeof x?.description === "string" ? x.description : "",
  priority: (["low","medium","high"].includes(String(x?.priority)) ? x.priority : "medium") as any,
  assignedTo: typeof x?.assigned_to === "string" ? x.assigned_to : "",
  assignedToName: typeof x?.assigned_to_name === "string" ? x.assigned_to_name : "",
  startedBy: typeof x?.started_by === "string" ? x.started_by : undefined,
  startedByName: typeof x?.started_by_name === "string" ? x.started_by_name : undefined,
  startedAt: typeof x?.started_at === "string" ? x.started_at : undefined,
  pickedUpBy: typeof x?.picked_up_by === "string" ? x.picked_up_by : undefined,
  pickedUpByName: typeof x?.picked_up_by_name === "string" ? x.picked_up_by_name : undefined,
  pickedUpAt: typeof x?.picked_up_at === "string" ? x.picked_up_at : undefined,
  completedBy: typeof x?.completed_by === "string" ? x.completed_by : undefined,
  completedByName: typeof x?.completed_by_name === "string" ? x.completed_by_name : undefined,
  completedAt: typeof x?.completed_at === "string" ? x.completed_at : undefined,
  board: (x?.board === "achterwinkel" ? "achterwinkel" : "voorwinkel") as BoardType,
  deadline: typeof x?.deadline === "string" ? x.deadline : undefined,
  activities: Array.isArray(x?.activities) ? x?.activities : [],
});

type Thenable<T> = PromiseLike<T>;
async function withAuthRetry<T = any>(op: () => Thenable<T>): Promise<T> {
  let res: any = await op();
  if (res?.error && (
    res.error.status === 401 ||
    res.error.status === 403 ||
    String(res.error.code || "").toUpperCase().includes("JWT") ||
    String(res.error.message || "").toLowerCase().includes("token") ||
    String(res.error.message || "").toLowerCase().includes("session")
  )) {
    await supabase.auth.refreshSession();
    res = await op();
  }
  return res as T;
}
async function ensureAuth() {
  const { data } = await supabase.auth.getSession();
  const exp = data?.session?.expires_at ? data.session.expires_at * 1000 : 0;
  if (!data?.session || Date.now() > exp - 60_000) {
    const { data: r } = await supabase.auth.refreshSession();
    const token = r?.session?.access_token;
    if (token) supabase.realtime.setAuth(token);
  }
}

/* ---------------- Provider ---------------- */
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isManager, setIsManager] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [settingsHydrated, setSettingsHydrated] = useState(false);
  const [currentBoard, setCurrentBoard] = useState<BoardType>("voorwinkel");
  const [tasks, setTasks] = useState<Task[]>([]);

  const realtimeRef = useRef<RealtimeChannel | null>(null);
  const pollRef = useRef<number | null>(null);

  const t = useMemo(() => (settings.language === "en" ? I18N_EN : I18N_NL), [settings.language]);

  // Thema & taal naar DOM pas na settings-hydrate ⇒ geen flicker
  useEffect(() => {
    if (!settingsHydrated) return;
    const theme = currentUser ? (getUserTheme(currentUser.id) || settings.theme || "light") : (settings.theme || "light");
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("lang", settings.language || "nl");
  }, [settingsHydrated, currentUser?.id, settings.theme, settings.language]);

  /* ---------- Fetchers ---------- */
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from("users").select("*");
      if (error) throw error;
      const normalized: User[] = (data || []).map((u: any) => ({
        id: u.id,
        employeeNumber: u.employee_number,
        username: u.username,
        name: u.name,
        role: u.role as UserRole,
        boards: Array.isArray(u.boards) ? u.boards : ["voorwinkel"],
        isFirstLogin: u.is_first_login,
        temporaryCode: u.temporary_code,
      }));
      setUsers(normalized);
    } catch (e) {
      console.error("[users] fetch error", e);
      setUsers([]);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from("settings").select("key, value");
      if (error) throw error;
      const obj: Record<string, any> = {};
      (data || []).forEach((s: any) => { obj[s.key] = s.value; });
      const merged: AppSettings = {
        ...defaultSettings, ...obj,
        theme: obj.theme === "dark" ? "dark" : obj.theme === "auto" ? "auto" : "light",
        language: obj.language === "en" ? "en" : "nl",
      };
      const effectiveTheme = currentUser ? (getUserTheme(currentUser.id) || merged.theme) : merged.theme;
      setSettings({ ...merged, theme: effectiveTheme });
      setSettingsHydrated(true);
    } catch (e) {
      console.error("[settings] fetch error", e);
      setSettingsHydrated(true);
    }
  };

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setTasks((data || []).map(normalizeTask));
    } catch (e) {
      console.error("[tasks] fetch error", e);
      setTasks([]);
    }
  };

  // Auth→users mapping (eerst via employee_number uit email, fallback op id)
  const loadCurrentUserFromSession = async (session: Session | null) => {
    if (!session?.user) { setCurrentUser(null); setIsManager(false); return; }
    const email = session.user.email || "";
    const emp = email.includes("@") ? email.split("@")[0] : "";
    try {
      let u: any = null;
      if (emp) {
        const { data } = await supabase.from("users").select("*").eq("employee_number", emp).maybeSingle();
        u = data;
      }
      if (!u) {
        const { data } = await supabase.from("users").select("*").eq("id", session.user.id).maybeSingle();
        u = data;
      }
      if (u) {
        const mapped: User = {
          id: session.user.id,
          employeeNumber: u.employee_number,
          username: u.username,
          name: u.name,
          role: u.role as UserRole,
          boards: Array.isArray(u.boards) ? u.boards : ["voorwinkel"],
          isFirstLogin: !!u.is_first_login,
        };
        setCurrentUser(mapped);
        setIsManager(u.role === "manager");
      } else {
        setCurrentUser(null);
        setIsManager(false);
      }
    } catch {/* ignore */}
  };

  /* ---------- Auth ---------- */
  const login = async (employeeNumber: string, password: string) => {
    try {
      const emp = (employeeNumber ?? "").trim().replace(/"/g, "");
      const pwd = (password ?? "").trim();
      const { data: userData } = await supabase.from("users").select("*").eq("employee_number", emp).maybeSingle();
      if (!userData) return false;

      // Tijdelijke code? → UI gaat naar password-setup; hier dus false terug
      if (userData.is_first_login && userData.temporary_code === pwd) return false;

      if (!userData.is_first_login) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: `${emp}@praxis.local`, password: pwd,
        });
        if (authError) return false;
        if (authData.user) {
          await loadCurrentUserFromSession({ user: authData.user } as Session);
          await Promise.all([fetchUsers(), fetchSettings(), fetchTasks()]);
          resetRealtimeSubscription();
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try { await supabase.auth.signOut(); } catch {}
    setCurrentUser(null); setIsManager(false);
    setUsers([]); setTasks([]);
    resetRealtimeSubscription();
  };

  const setPassword = async (userId: string, newPassword: string) => {
    try {
      if (!newPassword || newPassword.trim().length < 6) return false;
      const { data: userData } = await supabase.from("users").select("employee_number").eq("id", userId).maybeSingle();
      if (!userData) return false;
      const email = `${userData.employee_number}@praxis.local`;

      const { error: signUpError } = await supabase.auth.signUp({ email, password: newPassword.trim() });
      if (signUpError) {
        const status = (signUpError as any).status;
        const code = (signUpError as any).code || (signUpError as any).message;
        if (status === 422 && String(code).includes("weak_password")) return false;
        if (status === 422 && String(code).includes("user_already_exists")) {
          const { error: authErr2 } = await supabase.auth.signInWithPassword({ email, password: newPassword.trim() });
          if (authErr2) return false;
        } else { return false; }
      }
      const res: any = await withAuthRetry(() =>
        supabase.from("users").update({
          is_first_login: false, temporary_code: null, updated_at: new Date().toISOString()
        } as any).eq("id", userId)
      );
      if (res?.error) return false;

      await Promise.all([fetchUsers(), fetchSettings(), fetchTasks()]);
      resetRealtimeSubscription();
      return true;
    } catch { return false; }
  };

  const consumeOneTimeCode = async (employeeNumber: string, code: string): Promise<User | null> => {
    try {
      const emp = (employeeNumber ?? "").trim().replace(/"/g, "");
      const one = (code ?? "").trim();
      const { data, error } = await supabase.rpc("consume_temp_code", { p_employee_number: emp, p_code: one });
      if (error || !data) return null;
      const u: User = {
        id: (data as any).id,
        employeeNumber: (data as any).employee_number,
        username: (data as any).username,
        name: (data as any).name,
        role: (data as any).role as UserRole,
        boards: Array.isArray((data as any).boards) ? (data as any).boards : ["voorwinkel"],
        isFirstLogin: (data as any).is_first_login,
      };
      await fetchUsers();
      return u;
    } catch { return null; }
  };

  /* ---------- Users CRUD ---------- */
  const createUser = async (u: { employeeNumber: string; name: string; role: UserRole | "employee"; boards: BoardType[] }) => {
    try {
      const role = String(u.role).toLowerCase() === "manager" ? "manager" : "user";
      const temporaryCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const res: any = await withAuthRetry(() =>
        supabase.from("users").insert({
          employee_number: u.employeeNumber, username: u.employeeNumber, name: u.name, role,
          temporary_code: temporaryCode, is_first_login: true, boards: u.boards,
        } as any)
      );
      if (res?.error) throw res.error;
      await fetchUsers();
      return true;
    } catch { return false; }
  };

  const updateUser = async (id: string, patch: { name?: string; role?: UserRole | "employee"; boards?: BoardType[] }) => {
    try {
      const updateData: any = {};
      if (patch.name) updateData.name = patch.name;
      if (patch.role) updateData.role = String(patch.role).toLowerCase() === "manager" ? "manager" : "user";
      if (patch.boards) updateData.boards = patch.boards;
      updateData.updated_at = new Date().toISOString();

      const res: any = await withAuthRetry(() =>
        supabase.from("users").update(updateData).eq("id", id)
      );
      if (res?.error) throw res.error;
      await fetchUsers();
      return true;
    } catch { return false; }
  };

  const deleteUser = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke("delete-user", { body: { id } });
      if (!error) { await fetchUsers(); return true; }
    } catch {}
    try {
      const res: any = await withAuthRetry(() =>
        supabase.from("users").delete().eq("id", id)
      );
      if (res?.error) throw res.error;
      await fetchUsers();
      return true;
    } catch { return false; }
  };

  /* ---------- Settings update ---------- */
  const updateSettings = async (next: Partial<AppSettings> | AppSettings) => {
    const merged = { ...settings, ...next };
    setSettings(merged);

    // Persist ALLE keys, incl. language & theme
    try {
      for (const [key, value] of Object.entries(merged)) {
        const res: any = await withAuthRetry(() =>
          supabase.from("settings").upsert({ key, value: value as any, updated_at: new Date().toISOString() } as any)
        );
        if (res?.error) throw res.error;
      }
    } catch (e) {
      console.error("[settings] update error", e);
    }

    // Per-user theme override + DOM attribuut direct bijstellen
    if (typeof (merged as AppSettings).theme !== "undefined") {
      try { setUserTheme(currentUser?.id, (merged as AppSettings).theme); } catch {}
      document.documentElement.setAttribute("data-theme", String((merged as AppSettings).theme));
    }
    if (typeof (merged as AppSettings).language !== "undefined") {
      document.documentElement.setAttribute("lang", String((merged as AppSettings).language));
    }
  };

  /* ---------- Tasks CRUD ---------- */
  const addTask = async (task: Task) => {
    try {
      await ensureAuth();
      const safe = normalizeTask(task);
      const res: any = await withAuthRetry(() =>
        supabase.from("tasks").insert({
          id: safe.id, title: safe.title, description: safe.description, status: safe.status, priority: safe.priority,
          assigned_to: safe.assignedTo || null, assigned_to_name: safe.assignedToName, board: safe.board,
          deadline: safe.deadline || null, activities: safe.activities,
          started_by: safe.startedBy || null, started_by_name: safe.startedByName || null, started_at: safe.startedAt || null,
          picked_up_by: safe.pickedUpBy || null, picked_up_by_name: safe.pickedUpByName || null, picked_up_at: safe.pickedUpAt || null,
          completed_by: safe.completedBy || null, completed_by_name: safe.completedByName || null, completed_at: safe.completedAt || null,
        } as any)
      );
      if (res?.error) throw res.error;
      await fetchTasks();
    } catch (e) { console.error("[tasks] insert error", e); }
  };

  const updateTask = async (task: Task) => {
    try {
      await ensureAuth();
      const safe = normalizeTask({ ...task, updatedAt: new Date().toISOString() });
      const res: any = await withAuthRetry(() =>
        supabase.from("tasks").update({
          title: safe.title, description: safe.description, status: safe.status, priority: safe.priority,
          assigned_to: safe.assignedTo || null, assigned_to_name: safe.assignedToName, board: safe.board,
          deadline: safe.deadline || null, activities: safe.activities, updated_at: new Date().toISOString(),
          started_by: safe.startedBy || null, started_by_name: safe.startedByName || null, started_at: safe.startedAt || null,
          picked_up_by: safe.pickedUpBy || null, picked_up_by_name: safe.pickedUpByName || null, picked_up_at: safe.pickedUpAt || null,
          completed_by: safe.completedBy || null, completed_by_name: safe.completedByName || null, completed_at: safe.completedAt || null,
        } as any).eq("id", safe.id)
      );
      if (res?.error) throw res.error;
      await fetchTasks();
    } catch (e) { console.error("[tasks] update error", e); }
  };

  const deleteTask = async (id: string) => {
    try {
      await ensureAuth();
      const res: any = await withAuthRetry(() =>
        supabase.from("tasks").delete().eq("id", id)
      );
      if (res?.error) throw res.error;
      await fetchTasks();
    } catch (e) { console.error("[tasks] delete error", e); }
  };

  /* ---------- Realtime ---------- */
  const resetRealtimeSubscription = () => {
    if (realtimeRef.current) {
      void supabase.removeChannel(realtimeRef.current);
      realtimeRef.current = null;
    }
    const channel = supabase
      .channel("praxis-tasks")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => fetchTasks())
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, () => fetchUsers())
      .on("postgres_changes", { event: "*", schema: "public", table: "settings" }, () => fetchSettings())
      .subscribe();
    realtimeRef.current = channel;
  };

  /* ---------- Auto logout ---------- */
  const inactivityTimerRef = useRef<number | null>(null);
  const activityHandlerRef = useRef<(() => void) | null>(null);
  const clearInactivityTimer = () => { if (inactivityTimerRef.current) { clearTimeout(inactivityTimerRef.current); inactivityTimerRef.current = null; } };
  const startInactivityTimer = () => {
    clearInactivityTimer();
    if (!currentUser || !settings.autoLogout) return;
    const ms = Math.max(1, Number(settings.autoLogoutTime || 15)) * 60 * 1000;
    inactivityTimerRef.current = window.setTimeout(() => { void logout(); }, ms);
  };
  const bindActivity = () => {
    const reset = () => startInactivityTimer();
    activityHandlerRef.current = reset;
    window.addEventListener("mousemove", reset);
    window.addEventListener("keydown", reset);
    window.addEventListener("click", reset);
    window.addEventListener("touchstart", reset);
    window.addEventListener("visibilitychange", reset);
  };
  const unbindActivity = () => {
    if (!activityHandlerRef.current) return;
    const reset = activityHandlerRef.current;
    window.removeEventListener("mousemove", reset);
    window.removeEventListener("keydown", reset);
    window.removeEventListener("click", reset);
    window.removeEventListener("touchstart", reset);
    window.removeEventListener("visibilitychange", reset);
    activityHandlerRef.current = null;
  };
  useEffect(() => {
    if (currentUser && settings.autoLogout) {
      bindActivity(); startInactivityTimer();
      return () => { unbindActivity(); clearInactivityTimer(); };
    } else { unbindActivity(); clearInactivityTimer(); }
  }, [currentUser?.id, settings.autoLogout, settings.autoLogoutTime]);

  /* ---------- Auth events & init ---------- */
  useEffect(() => {
    let unsub: (() => void) | null = null;

    (async () => {
      const { data } = await supabase.auth.getSession();
      await loadCurrentUserFromSession(data?.session ?? null);
      await fetchSettings(); // eerst settings om flicker te voorkomen
      if (data?.session) { await Promise.all([fetchUsers(), fetchTasks()]); }
      resetRealtimeSubscription();

      const sub = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          const token = newSession?.access_token;
          if (token) supabase.realtime.setAuth(token);
          await loadCurrentUserFromSession(newSession ?? null);
          await Promise.all([fetchUsers(), fetchSettings(), fetchTasks()]);
          resetRealtimeSubscription();
        }
        if (event === "SIGNED_OUT") {
          setCurrentUser(null); setIsManager(false); setUsers([]); setTasks([]);
          resetRealtimeSubscription();
        }
      });
      unsub = () => sub.data.subscription.unsubscribe();
    })();

    // Poll fallback (15s) als realtime niet vuurt
    pollRef.current = window.setInterval(() => { void fetchTasks(); }, 15000);

    // Token refresh bij terugkomen / online
    const onFocus = async () => { await ensureAuth(); };
    const onVisible = () => { if (document.visibilityState === "visible") { void onFocus(); } };
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onFocus);
    window.addEventListener("visibilitychange", onVisible);

    return () => {
      if (unsub) unsub();
      if (realtimeRef.current) { void supabase.removeChannel(realtimeRef.current); realtimeRef.current = null; }
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onFocus);
      window.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // refresh data bij user switch
  useEffect(() => {
    if (currentUser) { (async () => { await Promise.all([fetchUsers(), fetchSettings(), fetchTasks()]); })(); }
  }, [currentUser?.id]);

  const value: AppContextType = {
    currentUser,
    isManager,
    users,
    tasks,
    settings,
    t,
    currentBoard,
    setCurrentBoard,
    login,
    logout,
    setPassword,
    consumeOneTimeCode,
    createUser,
    updateUser,
    deleteUser,
    fetchTasks,
    addTask,
    updateTask,
    deleteTask,
    updateSettings,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

/* ---------------- Hook ---------------- */
export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
};
export const useApp = useAppContext;
