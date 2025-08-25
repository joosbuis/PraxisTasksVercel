import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Task, TaskStatus, User, UserRole, BoardType } from "../types";
import { supabase } from "../lib/supabase";
import type { RealtimeChannel, Session } from "@supabase/supabase-js";

/** ---- Settings type ---- */
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

/** ---- i18n ---- */
const i18n: Record<"nl" | "en", Record<string, string>> = {
  nl: {
    loginToAccount: "Log in op je account",
    employeeNumber: "Personeelsnummer",
    password: "Wachtwoord",
    login: "Inloggen",
    loading: "Bezig...",
    loginError: "Er ging iets mis bij het inloggen",
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
    temporaryCode: "Eenmalige inlogcode",
    light: "Licht",
    dark: "Donker",
    auto: "Auto",
    autoLogout: "Automatisch uitloggen",
    autoLogoutTime: "Tijd tot automatisch uitloggen (min.)",
    language: "Taal",
    copyCode: "Kopieer code",
    copied: "Gekopieerd!",
  },
  en: {
    loginToAccount: "Log in to your account",
    employeeNumber: "Employee number",
    password: "Password",
    login: "Log in",
    loading: "Loading...",
    loginError: "Something went wrong",
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
    departments: "Departments",
    voorwinkel: "Front store",
    achterwinkel: "Back store",
    newUser: "New user",
    temporaryCode: "Temporary code",
    light: "Light",
    dark: "Dark",
    auto: "Auto",
    autoLogout: "Auto logout",
    autoLogoutTime: "Auto logout time (min.)",
    language: "Language",
    copyCode: "Copy code",
    copied: "Copied!",
  },
};

/** ---- Helpers ---- */
const uuid = () => crypto.randomUUID();
const normalizeTask = (x: any): Task => ({
  id: String(x?.id ?? uuid()),
  title: String(x?.title ?? ""),
  status: ((): TaskStatus => {
    const v = String(x?.status ?? "todo").toLowerCase();
    if (v.includes("progress")) return "in-progress";
    if (v.includes("completed") || v.includes("done")) return "completed";
    if (v.includes("pickup")) return "needs-pickup";
    return "todo";
  })(),
  createdAt: String(x?.created_at ?? new Date().toISOString()),
  updatedAt: String(x?.updated_at ?? new Date().toISOString()),
  description: x?.description ?? "",
  priority: (["low", "medium", "high"].includes(x?.priority) ? x.priority : "medium") as any,
  assignedTo: x?.assigned_to ?? "",
  assignedToName: x?.assigned_to_name ?? "",
  board: x?.board === "achterwinkel" ? "achterwinkel" : "voorwinkel",
  activities: Array.isArray(x?.activities) ? x.activities : [],
});

/** ---- Context ---- */
interface AppContextType {
  currentUser: User | null;
  isManager: boolean;
  users: User[];
  tasks: Task[];
  settings: AppSettings;
  t: Record<string, string>;
  login: (employeeNumber: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchTasks: () => Promise<void>;
  addTask: (t: Task) => Promise<void>;
  updateTask: (t: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateSettings: (next: Partial<AppSettings>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/** ---- Auth helpers ---- */
async function ensureAuth() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) await supabase.auth.refreshSession();
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isManager, setIsManager] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const realtimeRef = useRef<RealtimeChannel | null>(null);

  const t = useMemo(() => i18n[settings.language] ?? i18n.nl, [settings.language]);

  /** --- Data fetchers --- */
  const fetchUsers = async () => {
    const { data } = await supabase.from("users").select("*");
    setUsers(data || []);
  };
  const fetchSettings = async () => {
    const { data } = await supabase.from("settings").select("key,value");
    const obj: any = {};
    (data || []).forEach((s: any) => (obj[s.key] = s.value));
    setSettings({ ...defaultSettings, ...obj });
  };
  const fetchTasks = async () => {
    const { data } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
    setTasks((data || []).map(normalizeTask));
  };

  /** --- Auth --- */
  const login = async (employeeNumber: string, password: string) => {
    const { data: auth, error } = await supabase.auth.signInWithPassword({
      email: `${employeeNumber}@praxis.local`,
      password,
    });
    if (error || !auth.user) return false;
    setCurrentUser({ id: auth.user.id, employeeNumber, role: "user", name: employeeNumber } as any);
    return true;
  };
  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  /** --- Task mutations --- */
  const addTask = async (task: Task) => {
    await ensureAuth();
    await supabase.from("tasks").insert(task as any);
    await fetchTasks();
  };
  const updateTask = async (task: Task) => {
    await ensureAuth();
    await supabase.from("tasks").update(task as any).eq("id", task.id);
    await fetchTasks();
  };
  const deleteTask = async (id: string) => {
    await ensureAuth();
    await supabase.from("tasks").delete().eq("id", id);
    await fetchTasks();
  };

  /** --- Settings update --- */
  const updateSettings = async (next: Partial<AppSettings>) => {
    const merged = { ...settings, ...next };
    setSettings(merged);
    for (const [k, v] of Object.entries(next)) {
      await supabase.from("settings").upsert({ key: k, value: v });
    }
  };

  /** --- Realtime --- */
  useEffect(() => {
    if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);
    const ch = supabase
      .channel("main")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, fetchTasks)
      .subscribe();
    realtimeRef.current = ch;
    return () => supabase.removeChannel(ch);
  }, []);

  /** --- Init --- */
  useEffect(() => {
    fetchUsers();
    fetchSettings();
    fetchTasks();
  }, []);

  return (
    <AppContext.Provider
      value={{ currentUser, isManager, users, tasks, settings, t, login, logout, fetchTasks, addTask, updateTask, deleteTask, updateSettings }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used in provider");
  return ctx;
};
