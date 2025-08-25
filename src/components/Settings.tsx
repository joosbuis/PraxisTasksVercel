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

// --- Fallback labels (veilig als vertalingen ontbreken) ---
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

// Type die zowel 'user' (backend) als 'employee' (oude types) accepteert
type AnyRole = UserRole | "user";

interface SettingsProps {
  isPersonalOnly?: boolean;
}

export default function Settings({ isPersonalOnly = false }: SettingsProps) {
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Niet ingelogd
            </h2>
            <p className="text-gray-600">
              Log in om toegang te krijgen tot de instellingen.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ====== Helpers ======
  const setTheme = (theme: AppSettings["theme"]) => {
    updateSettings({ theme });
    document.documentElement.setAttribute("data-theme", theme);
  };
  const setLanguage = (language: AppSettings["language"]) => {
    updateSettings({ language });
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
    const employees = users.filter(
      (u) => String(u.role) === "user" || String(u.role) === "employee"
    ).length;
    return { totalUsers, activeUsers, managers, employees };
  }, [users]);

  // ====== Gebruikersbeheer state ======
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<AnyRole | "all">("all");
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showUserEdit, setShowUserEdit] = useState<string | null>(null);

  const [newUser, setNewUser] = useState<{
    employeeNumber: string;
    name: string;
    role: AnyRole;
    boards: BoardType[];
  }>({
    employeeNumber: "",
    name: "",
    role: "user",
    boards: ["voorwinkel"],
  });

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

  // ====== Acties: gebruikersbeheer ======
  const handleUserDelete = async (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    if (user.id === currentUser.id) {
      alert("Je kunt jezelf niet verwijderen.");
      return;
    }
    if (
      window.confirm(`Weet je zeker dat je ${user.name ?? user.employeeNumber} wilt verwijderen?`)
    ) {
      const ok = await deleteUser(id);
      if (!ok) alert("Verwijderen mislukt (minimaal één manager vereist?).");
    }
  };

  const copyTempCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      // kleine visuele feedback
      alert(tt.copied);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      alert(tt.copied);
    }
  };

  // ====== Render ======
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

        {/* Dashboard statistieken (manager) */}
        {!isPersonalOnly && isManager && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <BarChart3 className="w-4 h-4" />
                <span className="font-medium">{tt.totalTasks}</span>
              </div>
              <div className="text-2xl font-semibold">{taskStats.totalTasks}</div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">{tt.completed}</span>
              </div>
              <div className="text-2xl font-semibold">{taskStats.completedTasks}</div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">{tt.overdueTasks}</span>
              </div>
              <div className="text-2xl font-semibold">{taskStats.overdueTasks}</div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Users className="w-4 h-4" />
                <span className="font-medium">{tt.activeUsers}</span>
              </div>
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
            {/* Thema (zonder 'Auto') */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                <label className="block font-medium">{tt.theme}</label>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`btn ${settings.theme === "light" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setTheme("light")}
                >
                  {tt.light}
                </button>
                <button
                  type="button"
                  className={`btn ${settings.theme === "dark" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setTheme("dark")}
                >
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

        {/* Gebruikersbeheer (manager) */}
        {!isPersonalOnly && isManager && (
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <h2 className="text-lg font-semibold">{tt.userManagement}</h2>
              </div>
              <button type="button" className="btn-primary" onClick={() => setShowCreateUser(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                {tt.newUser}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  className="input-field pl-9"
                  placeholder="Zoeken op naam of personeelsnr."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <select
                  className="input-field"
                  value={filterRole}
                  onChange={(e) => setFilterRole((e.target.value as AnyRole) || "all")}
                >
                  <option value="all">Alle rollen</option>
                  <option value="user">{tt.employee}</option>
                  <option value="manager">{tt.manager}</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="text-gray-600">
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">{tt.name}</th>
                    <th className="py-2 px-3">{tt.employeeNumber}</th>
                    <th className="py-2 px-3">{tt.role}</th>
                    <th className="py-2 px-3">{tt.departments}</th>
                    <th className="py-2 px-3">{tt.temporaryCode}</th>
                    <th className="py-2 px-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const normalizedRole: AnyRole =
                      String(u.role) === "employee" ? "user" : (u.role as AnyRole);
                    const boards = (u.boards ?? []).join(", ");
                    const tempCode = (u as any).temporaryCode as string | undefined;
                    return (
                      <tr key={u.id} className="border-t">
                        <td className="py-2 px-3">{u.id.slice(-4)}</td>
                        <td className="py-2 px-3">{u.name ?? (u as any).username ?? "-"}</td>
                        <td className="py-2 px-3">{u.employeeNumber ?? "-"}</td>
                        <td className="py-2 px-3">{normalizedRole === "manager" ? tt.manager : tt.employee}</td>
                        <td className="py-2 px-3">{boards || "-"}</td>
                        <td className="py-2 px-3">
                          {tempCode ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-2 px-2 py-1 text-xs rounded bg-orange-100 text-orange-700 hover:bg-orange-200"
                              title={tt.copyCode}
                              onClick={() => copyTempCode(tempCode)}
                            >
                              <Key className="w-3 h-3" />
                              <code className="font-mono">{tempCode}</code>
                            </button>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => setShowUserEdit(u.id)}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              className="btn-danger"
                              onClick={() => {
                                if (u.id === currentUser.id) {
                                  alert("Je kunt jezelf niet verwijderen.");
                                  return;
                                }
                                if (confirm(`Verwijder ${u.name ?? u.employeeNumber}?`)) {
                                  handleUserDelete(u.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------- Modals ------- */}

        {/* Nieuwe gebruiker */}
        {isManager && showCreateUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">{tt.newUser}</h2>
                <button
                  type="button"
                  onClick={() => setShowCreateUser(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {tt.employeeNumber} *
                  </label>
                  <input
                    type="text"
                    value={newUser.employeeNumber}
                    onChange={(e) =>
                      setNewUser((p) => ({ ...p, employeeNumber: e.target.value }))
                    }
                    className="input-field"
                    placeholder="Bijv. 3001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {tt.name} *
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser((p) => ({ ...p, name: e.target.value }))}
                    className="input-field"
                    placeholder="Voor- en achternaam"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {tt.role}
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser((p) => ({
                        ...p,
                        role: (e.target.value as AnyRole) || "user",
                      }))
                    }
                    className="input-field"
                  >
                    <option value="user">{tt.employee}</option>
                    <option value="manager">{tt.manager}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {tt.departments}
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newUser.boards.includes("voorwinkel")}
                        onChange={() =>
                          setNewUser((p) => ({
                            ...p,
                            boards: toggleBoardIn(p.boards, "voorwinkel"),
                          }))
                        }
                        className="rounded mr-2"
                      />
                      {tt.voorwinkel}
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newUser.boards.includes("achterwinkel")}
                        onChange={() =>
                          setNewUser((p) => ({
                            ...p,
                            boards: toggleBoardIn(p.boards, "achterwinkel"),
                          }))
                        }
                        className="rounded mr-2"
                      />
                      {tt.achterwinkel}
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateUser(false)}
                  className="btn-secondary"
                >
                  {tt.cancel}
                </button>
                <button onClick={async () => {
                  if (!newUser.employeeNumber || !newUser.name) {
                    alert("Vul alle verplichte velden in");
                    return;
                  }
                  if (!newUser.boards.length) {
                    alert("Selecteer minimaal één afdeling");
                    return;
                  }
                  if (users.find((u) => u.employeeNumber === newUser.employeeNumber)) {
                    alert("Dit personeelsnummer bestaat al");
                    return;
                  }
                  const roleForApi: AnyRole = String(newUser.role) === "manager" ? "manager" : "user";
                  const ok = await createUser({
                    employeeNumber: newUser.employeeNumber.trim(),
                    name: newUser.name.trim(),
                    role: roleForApi as any,
                    boards: newUser.boards,
                  });
                  if (ok) {
                    setShowCreateUser(false);
                    setNewUser({ employeeNumber: "", name: "", role: "user", boards: ["voorwinkel"] });
                  } else {
                    alert("Aanmaken mislukt (bestaat al of serverfout).");
                  }
                }} className="btn-primary" type="button">
                  <UserPlus className="w-4 h-4 mr-2" />
                  {tt.create} {tt.users}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Gebruiker bewerken */}
        {isManager && showUserEdit && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {tt.edit} {tt.users}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowUserEdit(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                {(() => {
                  const user = users.find((u) => u.id === showUserEdit);
                  if (!user) return null;
                  const normalizedRole: AnyRole =
                    String(user.role) === "employee" ? "user" : (user.role as AnyRole);

                  return (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {tt.name}
                        </label>
                        <input
                          type="text"
                          defaultValue={user.name}
                          onBlur={async (e) => {
                            const v = e.currentTarget.value.trim();
                            if (v && v !== user.name) await updateUser(user.id, { name: v });
                          }}
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {tt.role}
                        </label>
                        <select
                          defaultValue={normalizedRole}
                          onChange={async (e) => {
                            const v = (e.target.value as AnyRole) || "user";
                            if (user.id === currentUser.id && v !== "manager") {
                              alert("Je kunt jezelf niet degraderen.");
                              e.currentTarget.value = "manager";
                              return;
                            }
                            const ok = await updateUser(user.id, { role: v as any });
                            if (!ok) alert("Aanpassen mislukt (minimaal één manager vereist?).");
                          }}
                          className="input-field"
                          disabled={user.id === currentUser.id}
                        >
                          <option value="user">{tt.employee}</option>
                          <option value="manager">{tt.manager}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {tt.departments}
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={(user.boards ?? []).includes("voorwinkel")}
                              onChange={async (e) => {
                                const boards = e.target.checked
                                  ? [...(user.boards ?? []), "voorwinkel"]
                                  : (user.boards ?? []).filter((b) => b !== "voorwinkel");
                                await updateUser(user.id, { boards: boards.map(b => (b as unknown as BoardType)) });
                              }}
                              className="rounded mr-2"
                            />
                            {tt.voorwinkel}
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={(user.boards ?? []).includes("achterwinkel")}
                              onChange={async (e) => {
                                const boards = e.target.checked
                                  ? [...(user.boards ?? []), "achterwinkel"]
                                  : (user.boards ?? []).filter((b) => b !== "achterwinkel");
                                await updateUser(user.id, { boards: (boards as unknown as BoardType[]) });
                              }}
                              className="rounded mr-2"
                            />
                            {tt.achterwinkel}
                          </label>
                        </div>
                      </div>

                      {(user as any).temporaryCode && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {tt.temporaryCode}
                          </label>
                          <div className="bg-gray-100 p-3 rounded-lg flex items-center gap-2">
                            <Key className="w-4 h-4 text-orange-600" />
                            <code className="font-mono text-lg">
                              {(user as any).temporaryCode}
                            </code>
                            <button
                              type="button"
                              className="ml-auto btn-secondary text-xs py-1 px-2"
                              onClick={() => copyTempCode((user as any).temporaryCode)}
                            >
                              {tt.copyCode}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowUserEdit(null)}
                  className="btn-secondary"
                >
                  {tt.close}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
