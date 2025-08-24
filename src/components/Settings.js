import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { Settings as SettingsIcon, Users, X, Shield, BarChart3, Clock, Palette, Globe, Search, Edit3, Trash2, UserPlus, Key, CheckCircle, Calendar, } from "lucide-react";
import { useApp } from "../contexts/AppContext";
// --- Fallback labels (veilig als vertalingen ontbreken) ---
const withFallbacks = (t) => ({
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
export default function Settings({ isPersonalOnly = false }) {
    const { currentUser, users, tasks, settings, updateSettings, createUser, updateUser, deleteUser, t, } = useApp();
    const tt = useMemo(() => withFallbacks(t), [t]);
    const isManager = currentUser?.role === "manager";
    if (!currentUser) {
        return (_jsx("div", { className: "flex-1 p-6", children: _jsx("div", { className: "max-w-4xl mx-auto", children: _jsxs("div", { className: "text-center py-12", children: [_jsx(Shield, { className: "w-16 h-16 mx-auto text-gray-400 mb-4" }), _jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-2", children: "Niet ingelogd" }), _jsx("p", { className: "text-gray-600", children: "Log in om toegang te krijgen tot de instellingen." })] }) }) }));
    }
    // ====== Helpers ======
    const setTheme = (theme) => {
        updateSettings({ theme });
        document.documentElement.setAttribute("data-theme", theme);
    };
    const setLanguage = (language) => {
        updateSettings({ language });
    };
    const taskStats = useMemo(() => {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => t.status === "completed").length;
        const overdueTasks = tasks.filter((t) => t.deadline && new Date(t.deadline) < new Date() && t.status !== "completed").length;
        const activeTasks = tasks.filter((t) => t.status === "in-progress").length;
        return { totalTasks, completedTasks, overdueTasks, activeTasks };
    }, [tasks]);
    const userStats = useMemo(() => {
        const totalUsers = users.length;
        const activeUsers = users.filter((u) => !u.isFirstLogin).length;
        const managers = users.filter((u) => u.role === "manager").length;
        const employees = users.filter((u) => String(u.role) === "user" || String(u.role) === "employee").length;
        return { totalUsers, activeUsers, managers, employees };
    }, [users]);
    // ====== Gebruikersbeheer state ======
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRole, setFilterRole] = useState("all");
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [showUserEdit, setShowUserEdit] = useState(null);
    const [newUser, setNewUser] = useState({
        employeeNumber: "",
        name: "",
        role: "user",
        boards: ["voorwinkel"],
    });
    const filteredUsers = users.filter((user) => {
        const name = (user.name ?? user.username ?? "").toString();
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.employeeNumber ?? "").toString().includes(searchTerm);
        const r = String(user.role);
        const normalizedRole = r === "employee" ? "user" : r;
        const matchesRole = filterRole === "all" || normalizedRole === filterRole;
        return matchesSearch && matchesRole;
    });
    const toggleBoardIn = (arr, b) => arr.includes(b) ? arr.filter((x) => x !== b) : [...arr, b];
    // ====== Acties: gebruikersbeheer ======
    const handleUserDelete = async (id) => {
        const user = users.find((u) => u.id === id);
        if (!user)
            return;
        if (user.id === currentUser.id) {
            alert("Je kunt jezelf niet verwijderen.");
            return;
        }
        if (window.confirm(`Weet je zeker dat je ${user.name ?? user.employeeNumber} wilt verwijderen?`)) {
            const ok = await deleteUser(id);
            if (!ok)
                alert("Verwijderen mislukt (minimaal één manager vereist?).");
        }
    };
    const copyTempCode = async (code) => {
        try {
            await navigator.clipboard.writeText(code);
            // kleine visuele feedback
            alert(tt.copied);
        }
        catch {
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
    return (_jsx("div", { className: "flex-1 p-4 md:p-6", children: _jsxs("div", { className: "max-w-6xl mx-auto", children: [_jsx("div", { className: "bg-gradient-to-r from-praxis-grey to-gray-700 text-white rounded-lg p-6 mb-6", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(SettingsIcon, { className: "w-6 h-6" }), _jsx("h1", { className: "text-2xl font-semibold", children: tt.settings })] }) }), !isPersonalOnly && isManager && (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 mb-6", children: [_jsxs("div", { className: "card p-4", children: [_jsxs("div", { className: "flex items-center gap-2 text-gray-600 mb-2", children: [_jsx(BarChart3, { className: "w-4 h-4" }), _jsx("span", { className: "font-medium", children: tt.totalTasks })] }), _jsx("div", { className: "text-2xl font-semibold", children: taskStats.totalTasks })] }), _jsxs("div", { className: "card p-4", children: [_jsxs("div", { className: "flex items-center gap-2 text-gray-600 mb-2", children: [_jsx(CheckCircle, { className: "w-4 h-4" }), _jsx("span", { className: "font-medium", children: tt.completed })] }), _jsx("div", { className: "text-2xl font-semibold", children: taskStats.completedTasks })] }), _jsxs("div", { className: "card p-4", children: [_jsxs("div", { className: "flex items-center gap-2 text-gray-600 mb-2", children: [_jsx(Calendar, { className: "w-4 h-4" }), _jsx("span", { className: "font-medium", children: tt.overdueTasks })] }), _jsx("div", { className: "text-2xl font-semibold", children: taskStats.overdueTasks })] }), _jsxs("div", { className: "card p-4", children: [_jsxs("div", { className: "flex items-center gap-2 text-gray-600 mb-2", children: [_jsx(Users, { className: "w-4 h-4" }), _jsx("span", { className: "font-medium", children: tt.activeUsers })] }), _jsx("div", { className: "text-2xl font-semibold", children: userStats.activeUsers })] })] })), _jsxs("div", { className: "card p-6 mb-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsx(Palette, { className: "w-6 h-6 text-praxis-grey" }), _jsx("h2", { className: "text-xl font-semibold text-gray-900", children: tt.personalSettings })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Palette, { className: "w-4 h-4" }), _jsx("label", { className: "block font-medium", children: tt.theme })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { className: `btn ${settings.theme === "light" ? "btn-primary" : "btn-secondary"}`, onClick: () => setTheme("light"), children: tt.light }), _jsx("button", { className: `btn ${settings.theme === "dark" ? "btn-primary" : "btn-secondary"}`, onClick: () => setTheme("dark"), children: tt.dark })] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Globe, { className: "w-4 h-4" }), _jsx("label", { className: "block font-medium", children: tt.language })] }), _jsxs("select", { className: "input-field", value: settings.language, onChange: (e) => setLanguage(e.target.value), children: [_jsx("option", { value: "nl", children: "Nederlands" }), _jsx("option", { value: "en", children: "English" })] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Clock, { className: "w-4 h-4" }), _jsx("label", { className: "block font-medium", children: tt.autoLogout })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", className: "rounded", checked: settings.autoLogout, onChange: (e) => updateSettings({ autoLogout: e.target.checked }) }), settings.autoLogout && (_jsx("input", { type: "number", className: "input-field w-24", value: settings.autoLogoutTime, min: 0, onChange: (e) => updateSettings({
                                                        autoLogoutTime: Math.max(0, parseInt(e.target.value || "0", 10) || 0),
                                                    }) }))] })] })] })] }), !isPersonalOnly && isManager && (_jsxs("div", { className: "card p-6 mb-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Users, { className: "w-5 h-5" }), _jsx("h2", { className: "text-lg font-semibold", children: tt.userManagement })] }), _jsxs("button", { className: "btn-primary", onClick: () => setShowCreateUser(true), children: [_jsx(UserPlus, { className: "w-4 h-4 mr-2" }), tt.newUser] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3 mb-4", children: [_jsxs("div", { className: "relative", children: [_jsx(Search, { className: "w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "text", className: "input-field pl-9", placeholder: "Zoeken op naam of personeelsnr.", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) })] }), _jsx("div", { children: _jsxs("select", { className: "input-field", value: filterRole, onChange: (e) => setFilterRole(e.target.value || "all"), children: [_jsx("option", { value: "all", children: "Alle rollen" }), _jsx("option", { value: "user", children: tt.employee }), _jsx("option", { value: "manager", children: tt.manager })] }) })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full text-left", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-gray-600", children: [_jsx("th", { className: "py-2 px-3", children: "#" }), _jsx("th", { className: "py-2 px-3", children: tt.name }), _jsx("th", { className: "py-2 px-3", children: tt.employeeNumber }), _jsx("th", { className: "py-2 px-3", children: tt.role }), _jsx("th", { className: "py-2 px-3", children: tt.departments }), _jsx("th", { className: "py-2 px-3", children: tt.temporaryCode }), _jsx("th", { className: "py-2 px-3" })] }) }), _jsx("tbody", { children: filteredUsers.map((u) => {
                                            const normalizedRole = String(u.role) === "employee" ? "user" : u.role;
                                            const boards = (u.boards ?? []).join(", ");
                                            const tempCode = u.temporaryCode;
                                            return (_jsxs("tr", { className: "border-t", children: [_jsx("td", { className: "py-2 px-3", children: u.id.slice(-4) }), _jsx("td", { className: "py-2 px-3", children: u.name ?? u.username ?? "-" }), _jsx("td", { className: "py-2 px-3", children: u.employeeNumber ?? "-" }), _jsx("td", { className: "py-2 px-3", children: normalizedRole === "manager" ? tt.manager : tt.employee }), _jsx("td", { className: "py-2 px-3", children: boards || "-" }), _jsx("td", { className: "py-2 px-3", children: tempCode ? (_jsxs("button", { className: "inline-flex items-center gap-2 px-2 py-1 text-xs rounded bg-orange-100 text-orange-700 hover:bg-orange-200", title: tt.copyCode, onClick: () => copyTempCode(tempCode), children: [_jsx(Key, { className: "w-3 h-3" }), _jsx("code", { className: "font-mono", children: tempCode })] })) : (_jsx("span", { className: "text-gray-400", children: "\u2014" })) }), _jsx("td", { className: "py-2 px-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { className: "btn-secondary", onClick: () => setShowUserEdit(u.id), children: _jsx(Edit3, { className: "w-4 h-4" }) }), _jsx("button", { className: "btn-danger", onClick: () => {
                                                                        if (u.id === currentUser.id) {
                                                                            alert("Je kunt jezelf niet verwijderen.");
                                                                            return;
                                                                        }
                                                                        if (confirm(`Verwijder ${u.name ?? u.employeeNumber}?`)) {
                                                                            handleUserDelete(u.id);
                                                                        }
                                                                    }, children: _jsx(Trash2, { className: "w-4 h-4" }) })] }) })] }, u.id));
                                        }) })] }) })] })), isManager && showCreateUser && (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50", children: _jsxs("div", { className: "bg-white rounded-lg shadow-xl max-w-md w-full", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b border-gray-200", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: tt.newUser }), _jsx("button", { onClick: () => setShowCreateUser(false), className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { className: "w-6 h-6" }) })] }), _jsxs("div", { className: "p-6 space-y-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [tt.employeeNumber, " *"] }), _jsx("input", { type: "text", value: newUser.employeeNumber, onChange: (e) => setNewUser((p) => ({ ...p, employeeNumber: e.target.value })), className: "input-field", placeholder: "Bijv. 3001" })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [tt.name, " *"] }), _jsx("input", { type: "text", value: newUser.name, onChange: (e) => setNewUser((p) => ({ ...p, name: e.target.value })), className: "input-field", placeholder: "Voor- en achternaam" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: tt.role }), _jsxs("select", { value: newUser.role, onChange: (e) => setNewUser((p) => ({
                                                    ...p,
                                                    role: e.target.value || "user",
                                                })), className: "input-field", children: [_jsx("option", { value: "user", children: tt.employee }), _jsx("option", { value: "manager", children: tt.manager })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: tt.departments }), _jsxs("div", { className: "space-y-2", children: [_jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", checked: newUser.boards.includes("voorwinkel"), onChange: () => setNewUser((p) => ({
                                                                    ...p,
                                                                    boards: toggleBoardIn(p.boards, "voorwinkel"),
                                                                })), className: "rounded mr-2" }), tt.voorwinkel] }), _jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", checked: newUser.boards.includes("achterwinkel"), onChange: () => setNewUser((p) => ({
                                                                    ...p,
                                                                    boards: toggleBoardIn(p.boards, "achterwinkel"),
                                                                })), className: "rounded mr-2" }), tt.achterwinkel] })] })] })] }), _jsxs("div", { className: "flex justify-end gap-3 p-6 border-t border-gray-200", children: [_jsx("button", { onClick: () => setShowCreateUser(false), className: "btn-secondary", children: tt.cancel }), _jsxs("button", { onClick: async () => {
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
                                            const roleForApi = String(newUser.role) === "manager" ? "manager" : "user";
                                            const ok = await createUser({
                                                employeeNumber: newUser.employeeNumber.trim(),
                                                name: newUser.name.trim(),
                                                role: roleForApi,
                                                boards: newUser.boards,
                                            });
                                            if (ok) {
                                                setShowCreateUser(false);
                                                setNewUser({ employeeNumber: "", name: "", role: "user", boards: ["voorwinkel"] });
                                            }
                                            else {
                                                alert("Aanmaken mislukt (bestaat al of serverfout).");
                                            }
                                        }, className: "btn-primary", children: [_jsx(UserPlus, { className: "w-4 h-4 mr-2" }), tt.create, " ", tt.users] })] })] }) })), isManager && showUserEdit && (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50", children: _jsxs("div", { className: "bg-white rounded-lg shadow-xl max-w-md w-full", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b border-gray-200", children: [_jsxs("h2", { className: "text-xl font-semibold text-gray-900", children: [tt.edit, " ", tt.users] }), _jsx("button", { onClick: () => setShowUserEdit(null), className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { className: "w-6 h-6" }) })] }), _jsx("div", { className: "p-6", children: (() => {
                                    const user = users.find((u) => u.id === showUserEdit);
                                    if (!user)
                                        return null;
                                    const normalizedRole = String(user.role) === "employee" ? "user" : user.role;
                                    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: tt.name }), _jsx("input", { type: "text", defaultValue: user.name, onBlur: async (e) => {
                                                            const v = e.currentTarget.value.trim();
                                                            if (v && v !== user.name)
                                                                await updateUser(user.id, { name: v });
                                                        }, className: "input-field" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: tt.role }), _jsxs("select", { defaultValue: normalizedRole, onChange: async (e) => {
                                                            const v = e.target.value || "user";
                                                            if (user.id === currentUser.id && v !== "manager") {
                                                                alert("Je kunt jezelf niet degraderen.");
                                                                e.currentTarget.value = "manager";
                                                                return;
                                                            }
                                                            const ok = await updateUser(user.id, { role: v });
                                                            if (!ok)
                                                                alert("Aanpassen mislukt (minimaal één manager vereist?).");
                                                        }, className: "input-field", disabled: user.id === currentUser.id, children: [_jsx("option", { value: "user", children: tt.employee }), _jsx("option", { value: "manager", children: tt.manager })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: tt.departments }), _jsxs("div", { className: "space-y-2", children: [_jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", checked: (user.boards ?? []).includes("voorwinkel"), onChange: async (e) => {
                                                                            const boards = e.target.checked
                                                                                ? [...(user.boards ?? []), "voorwinkel"]
                                                                                : (user.boards ?? []).filter((b) => b !== "voorwinkel");
                                                                            await updateUser(user.id, { boards: boards.map(b => b) });
                                                                        }, className: "rounded mr-2" }), tt.voorwinkel] }), _jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", checked: (user.boards ?? []).includes("achterwinkel"), onChange: async (e) => {
                                                                            const boards = e.target.checked
                                                                                ? [...(user.boards ?? []), "achterwinkel"]
                                                                                : (user.boards ?? []).filter((b) => b !== "achterwinkel");
                                                                            await updateUser(user.id, { boards: boards });
                                                                        }, className: "rounded mr-2" }), tt.achterwinkel] })] })] }), user.temporaryCode && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: tt.temporaryCode }), _jsxs("div", { className: "bg-gray-100 p-3 rounded-lg flex items-center gap-2", children: [_jsx(Key, { className: "w-4 h-4 text-orange-600" }), _jsx("code", { className: "font-mono text-lg", children: user.temporaryCode }), _jsx("button", { className: "ml-auto btn-secondary text-xs py-1 px-2", onClick: () => copyTempCode(user.temporaryCode), children: tt.copyCode })] })] }))] }));
                                })() }), _jsx("div", { className: "flex justify-end gap-3 p-6 border-t border-gray-200", children: _jsx("button", { onClick: () => setShowUserEdit(null), className: "btn-secondary", children: tt.close }) })] }) }))] }) }));
}
