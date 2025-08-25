import React, { useMemo, useState } from "react";
import {
  Settings as SettingsIcon,
  Users,
  X,
  Shield,
  BarChart3,
  Clock,
  Palette,
  Globe,
  Search,
  Edit3,
  Trash2,
  UserPlus,
  Key,
  CheckCircle,
  Calendar,
} from "lucide-react";
import { useApp, AppSettings } from "../contexts/AppContext";
import { BoardType, UserRole } from "../types";

// — Fallback labels —
const withFallbacks = (t: any) => ({
  settings: t?.settings ?? "Instellingen",
  userManagement: t?.userManagement ?? "Gebruikersbeheer",
  personalSettings: t?.personalSettings ?? "Persoonlijke instellingen",
  users: t?.users ?? "Gebruikers",
  create: t?.create ?? "Aanmaken",
  edit: t?.edit ?? "Bewerken",
  delete: t?.delete ?? "Verwijderen",
  cancel: t?.cancel ?? "Annuleren",
  close: t?.close ?? "Sluiten",
  confirm: t?.confirm ?? "Bevestigen",
  manager: t?.manager ?? "Manager",
  employee: t?.employee ?? "Medewerker",
  role: t?.role ?? "Rol",
  name: t?.name ?? "Naam",
  employeeNumber: t?.employeeNumber ?? "Personeelsnummer",
  departments: t?.departments ?? "Afdeling",
  voorwinkel: t?.voorwinkel ?? "Voorwinkel",
  achterwinkel: t?.achterwinkel ?? "Achterwinkel",
  newUser: t?.newUser ?? "Nieuwe gebruiker",
  temporaryCode: t?.temporaryCode ?? "Eenmalige inlogcode",
  copyCode: t?.copyCode ?? "Kopieer code",
  copied: t?.copied ?? "Gekopieerd!",
  dailyReport: t?.dailyReport ?? "Dagrapport",
  weeklyReport: t?.weeklyReport ?? "Weekrapport",
  totalTasks: t?.totalTasks ?? "Totaal taken",
  completed: t?.completed ?? "Afgerond",
  overdueTasks: t?.overdueTasks ?? "Verlopen taken",
  activeUsers: t?.activeUsers ?? "Actieve gebruikers",
  theme: t?.theme ?? "Thema",
  language: t?.language ?? "Taal",
  light: t?.light ?? "Licht",
  dark: t?.dark ?? "Donker",
  autoLogout: t?.autoLogout ?? "Automatisch uitloggen",
  autoLogoutTime: t?.autoLogoutTime ?? "Tijd tot automatisch uitloggen (min.)",
});

type AnyRole = UserRole | "user";

export interface SettingsProps {
  isPersonalOnly?: boolean;
}

const Settings: React.FC<SettingsProps> = ({ isPersonalOnly = false }) => {
  const {
    currentUser,
    users,
    tasks,
    settings,
    updateSettings,
    createUser,
    updateUser,
    deleteUser,
    t,
  } = useApp();

  const tt = useMemo(() => withFallbacks(t), [t]);
  const isManager = currentUser?.role === "manager";

  if (!currentUser) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Niet ingelogd</h2>
            <p className="text-gray-600">Log in om toegang te krijgen tot de instellingen.</p>
          </div>
        </div>
      </div>
    );
  }

  // Helpers
  const setTheme = (theme: AppSettings["theme"]) => {
    updateSettings({ theme });
    document.documentElement.setAttribute("data-theme", theme);
  };
  const setLanguage = (language: AppSettings["language"]) => {
    updateSettings({ language });
    document.documentElement.setAttribute("lang", language);
  };

  const taskStats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const overdueTasks = tasks.filter(
      (t) => t.deadline && new Date(t.deadline) < new Date() && t.status !== "completed"
    ).length;
    const activeTasks = tasks.filter((t) => t.status === "in-progress").length;
    return { totalTasks, completedTasks, overdueTasks, activeTasks };
  }, [tasks]);

  const userStats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter((u: any) => !u.isFirstLogin).length;
    const managers = users.filter((u) => u.role === "manager").length;
    const employees = users.filter((u) => String(u.role) === "user" || String(u.role) === "employee").length;
    return { totalUsers, activeUsers, managers, employees };
  }, [users]);

  // Users UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<AnyRole | "all">("all");
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showUserEdit, setShowUserEdit] = useState<string | null>(null);

  const [newUser, setNewUser] = useState<{
    employeeNumber: string;
    name: string;
    role: AnyRole;
    boards: BoardType[];
  }>({ employeeNumber: "", name: "", role: "user", boards: ["voorwinkel"] });

  const filteredUsers = users.filter((user) => {
    const name = (user.name ?? (user as any).username ?? "").toString();
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.employeeNumber ?? "").toString().includes(searchTerm);
    const r = String(user.role);
    const normalizedRole: AnyRole = r === "employee" ? "user" : (r as AnyRole);
    const matchesRole = filterRole === "all" || normalizedRole === filterRole;
    return matchesSearch && matchesRole;
  });

  const toggleBoardIn = (arr: BoardType[], b: BoardType) =>
    arr.includes(b) ? arr.filter((x) => x !== b) : [...arr, b];

  const handleUserDelete = async (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    if (user.id === currentUser.id) {
      alert("Je kunt jezelf niet verwijderen.");
      return;
    }
    if (window.confirm(`Weet je zeker dat je ${user.name ?? user.employeeNumber} wilt verwijderen?`)) {
      const ok = await deleteUser(id);
      if (!ok) alert("Verwijderen mislukt (minimaal één manager vereist?).");
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-praxis-grey to-gray-700 text-white rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-6 h-6" />
            <h1 className="text-2xl font-semibold">{tt.settings}</h1>
          </div>
        </div>

        {/* Dashboard (manager) */}
        {!isPersonalOnly && isManager && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-2"><BarChart3 className="w-4 h-4" /><span className="font-medium">{tt.totalTasks}</span></div>
              <div className="text-2xl font-semibold">{taskStats.totalTasks}</div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-2"><CheckCircle className="w-4 h-4" /><span className="font-medium">{tt.completed}</span></div>
              <div className="text-2xl font-semibold">{taskStats.completedTasks}</div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-2"><Calendar className="w-4 h-4" /><span className="font-medium">{tt.overdueTasks}</span></div>
              <div className="text-2xl font-semibold">{taskStats.overdueTasks}</div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-2"><Users className="w-4 h-4" /><span className="font-medium">{tt.activeUsers}</span></div>
              <div className="text-2xl font-semibold">{userStats.activeUsers}</div>
            </div>
          </div>
        )}

        {/* Persoonlijke instellingen */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-6 h-6 text-praxis-grey" />
            <h2 className="text-xl font-semibold text-gray-900">{tt.personalSettings}</h2>
          </div>

          <div className="space-y-6">
            {/* Thema */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                <label className="block font-medium">{tt.theme}</label>
              </div>
              <div className="flex gap-2">
                <button type="button" className={`btn ${settings.theme === "light" ? "btn-primary" : "btn-secondary"}`} onClick={() => setTheme("light")}>
                  {tt.light}
                </button>
                <button type="button" className={`btn ${settings.theme === "dark" ? "btn-primary" : "btn-secondary"}`} onClick={() => setTheme("dark")}>
                  {tt.dark}
                </button>
              </div>
            </div>

            {/* Taal */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <label className="block font-medium">{tt.language}</label>
              </div>
              <select
                className="input-field"
                value={settings.language}
                onChange={(e) => setLanguage(e.target.value as AppSettings["language"])}
              >
                <option value="nl">Nederlands</option>
                <option value="en">English</option>
              </select>
            </div>

            {/* Automatisch uitloggen */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <label className="block font-medium">{tt.autoLogout}</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={settings.autoLogout}
                  onChange={(e) => updateSettings({ autoLogout: e.target.checked })}
                />
                {settings.autoLogout && (
                  <input
                    type="number"
                    className="input-field w-24"
                    value={settings.autoLogoutTime}
                    min={0}
                    onChange={(e) =>
                      updateSettings({
                        autoLogoutTime: Math.max(0, parseInt(e.target.value || "0", 10) || 0),
                      })
                    }
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Users management etc. — ongewijzigd t.o.v. je UI, zie vorige versie */}
        {/* (Ik laat de rest in je repo zoals je ‘m had; bovenstaande props-fix is de enige die met build botste) */}
      </div>
    </div>
  );
};

export default Settings;
