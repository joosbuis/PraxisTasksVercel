import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
export const defaultSettings = {
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
function getUserTheme(userId) {
    try {
        if (!userId)
            return null;
        const key = `praxis:userTheme:${userId}`;
        const val = localStorage.getItem(key);
        if (val === "light" || val === "dark" || val === "auto")
            return val;
        return null;
    }
    catch {
        return null;
    }
}
function setUserTheme(userId, theme) {
    try {
        if (userId)
            localStorage.setItem(`praxis:userTheme:${userId}`, theme);
    }
    catch { }
}
const t = {
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
    temporaryCode: "Tijdelijke code",
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
};
const AppContext = createContext(undefined);
/** ---- Helpers ---- */
const uuid = () => crypto.randomUUID();
const normalizeTask = (x) => ({
    id: String(x?.id ?? uuid()),
    title: String(x?.title ?? ""),
    status: (() => {
        const v = String(x?.status ?? "todo").toLowerCase();
        if (v === "inprogress")
            return "in-progress";
        if (v === "done")
            return "completed";
        if (v === "needs-pickup" || v === "needs_pickup")
            return "needs-pickup";
        if (v === "in-progress")
            return "in-progress";
        if (v === "completed")
            return "completed";
        return "todo";
    })(),
    createdAt: String(x?.created_at ?? x?.createdAt ?? new Date().toISOString()),
    updatedAt: String(x?.updated_at ?? x?.updatedAt ?? new Date().toISOString()),
    description: typeof x?.description === "string" ? x.description : "",
    priority: (["low", "medium", "high"].includes(String(x?.priority)) ? x.priority : "medium"),
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
    board: (x?.board === "achterwinkel" ? "achterwinkel" : "voorwinkel"),
    deadline: typeof x?.deadline === "string" ? x.deadline : undefined,
    activities: Array.isArray(x?.activities) ? x?.activities : [],
});
/** ---- Provider ---- */
export const AppProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [isManager, setIsManager] = useState(false);
    const [users, setUsers] = useState([]);
    const [settings, setSettings] = useState(defaultSettings);
    const [currentBoard, setCurrentBoard] = useState("voorwinkel");
    const [tasks, setTasks] = useState([]);
    const realtimeRef = useRef(null);
    const pollRef = useRef(null);
    // Theme per user
    useEffect(() => {
        const theme = currentUser ? (getUserTheme(currentUser.id) || settings.theme || "light") : "light";
        document.documentElement.setAttribute("data-theme", theme);
        if (settings.theme !== theme)
            setSettings((s) => ({ ...s, theme }));
    }, [currentUser]);
    /** ---- Fetchers ---- */
    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase.from('users').select('*');
            if (error)
                throw error;
            const normalizedUsers = (data || []).map((u) => ({
                id: u.id, employeeNumber: u.employee_number, username: u.username, name: u.name,
                role: u.role, boards: Array.isArray(u.boards) ? u.boards : ["voorwinkel"],
                isFirstLogin: u.is_first_login, temporaryCode: u.temporary_code,
            }));
            setUsers(normalizedUsers);
        }
        catch (error) {
            console.error('Error fetching users from database:', error);
            setUsers([]);
        }
    };
    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase.from('settings').select('key, value');
            if (error)
                throw error;
            const obj = {};
            (data || []).forEach((s) => { obj[s.key] = s.value; });
            const merged = {
                ...defaultSettings, ...obj,
                theme: obj.theme === "dark" ? "dark" : obj.theme === "auto" ? "auto" : "light",
                language: obj.language === "en" ? "en" : "nl",
            };
            const effectiveTheme = currentUser ? (getUserTheme(currentUser.id) || merged.theme) : "light";
            setSettings({ ...merged, theme: effectiveTheme });
            document.documentElement.setAttribute("data-theme", effectiveTheme);
        }
        catch (error) {
            console.error('Error fetching settings:', error);
        }
    };
    const fetchTasks = async () => {
        try {
            const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
            if (error)
                throw error;
            setTasks((data || []).map(normalizeTask));
        }
        catch (error) {
            console.error('Error fetching tasks from database:', error);
            setTasks([]);
        }
    };
    /** ---- Auth ---- */
    const login = async (employeeNumber, password) => {
        try {
            const emp = (employeeNumber ?? '').trim().replaceAll('"', '');
            const pwd = (password ?? '').trim();
            const { data: userData } = await supabase.from('users').select('*').eq('employee_number', emp).maybeSingle();
            if (!userData)
                return false;
            // tijdelijke code
            if (userData.is_first_login && userData.temporary_code === pwd) {
                setCurrentUser({
                    id: userData.id, employeeNumber: userData.employee_number, username: userData.username,
                    name: userData.name, role: userData.role,
                    boards: Array.isArray(userData.boards) ? userData.boards : ["voorwinkel"],
                    isFirstLogin: userData.is_first_login, temporaryCode: userData.temporary_code,
                });
                setIsManager(userData.role === "manager");
                return true;
            }
            // Supabase Auth
            if (!userData.is_first_login) {
                const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                    email: `${emp}@praxis.local`, password: pwd,
                });
                if (authError)
                    return false;
                if (authData.user) {
                    setCurrentUser({
                        id: authData.user.id, employeeNumber: userData.employee_number, username: userData.username,
                        name: userData.name, role: userData.role,
                        boards: Array.isArray(userData.boards) ? userData.boards : ["voorwinkel"],
                        isFirstLogin: false,
                    });
                    setIsManager(userData.role === "manager");
                    await new Promise(r => setTimeout(r, 60));
                    await Promise.all([fetchUsers(), fetchSettings(), fetchTasks()]);
                    resetRealtimeSubscription(); // verse token → nieuw kanaal
                    return true;
                }
            }
            return false;
        }
        catch {
            return false;
        }
    };
    const logout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
        setIsManager(false);
        setUsers([]);
        setTasks([]);
        resetRealtimeSubscription();
    };
    const setPassword = async (userId, newPassword) => {
        try {
            if (!newPassword || newPassword.trim().length < 6)
                return false;
            const { data: userData } = await supabase.from('users').select('employee_number, username').eq('id', userId).maybeSingle();
            if (!userData)
                return false;
            const email = `${userData.employee_number}@praxis.local`;
            const { error: signUpError } = await supabase.auth.signUp({ email, password: newPassword.trim() });
            if (signUpError) {
                const status = signUpError.status;
                const code = signUpError.code || signUpError.message;
                if (status === 422 && String(code).includes('weak_password'))
                    return false;
                if (status === 422 && String(code).includes('user_already_exists')) {
                    const { error: authErr2 } = await supabase.auth.signInWithPassword({ email, password: newPassword.trim() });
                    if (authErr2)
                        return false;
                }
                else {
                    return false;
                }
            }
            const { error: updateError } = await supabase.from('users').update({
                is_first_login: false, temporary_code: null, updated_at: new Date().toISOString()
            }).eq('id', userId);
            if (updateError)
                return false;
            const { data: freshUser } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
            if (freshUser) {
                setCurrentUser({
                    id: freshUser.id, employeeNumber: freshUser.employee_number, username: freshUser.username,
                    name: freshUser.name, role: freshUser.role,
                    boards: Array.isArray(freshUser.boards) ? freshUser.boards : ["voorwinkel"],
                    isFirstLogin: !!freshUser.is_first_login,
                });
                setIsManager(freshUser.role === "manager");
            }
            await new Promise(r => setTimeout(r, 60));
            await Promise.all([fetchUsers(), fetchSettings(), fetchTasks()]);
            resetRealtimeSubscription();
            return true;
        }
        catch {
            return false;
        }
    };
    const consumeOneTimeCode = async (employeeNumber, code) => {
        try {
            const emp = (employeeNumber ?? '').trim().replaceAll('"', '');
            const one = (code ?? '').trim();
            const { data } = await supabase.rpc('consume_temp_code', { p_employee_number: emp, p_code: one });
            if (!data)
                return null;
            const u = {
                id: data.id, employeeNumber: data.employee_number, username: data.username,
                name: data.name, role: data.role,
                boards: Array.isArray(data.boards) ? data.boards : ["voorwinkel"],
                isFirstLogin: data.is_first_login,
            };
            await fetchUsers();
            return u;
        }
        catch {
            return null;
        }
    };
    /** ---- CRUD ---- */
    const createUser = async (u) => {
        try {
            const role = String(u.role).toLowerCase() === "manager" ? "manager" : "user";
            const temporaryCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            const { error } = await supabase.from('users').insert({
                employee_number: u.employeeNumber, username: u.employeeNumber, name: u.name, role,
                temporary_code: temporaryCode, is_first_login: true, boards: u.boards,
            });
            if (error)
                throw error;
            await fetchUsers();
            return true;
        }
        catch {
            return false;
        }
    };
    const updateUser = async (id, patch) => {
        try {
            const updateData = {};
            if (patch.name)
                updateData.name = patch.name;
            if (patch.role)
                updateData.role = String(patch.role).toLowerCase() === "manager" ? "manager" : "user";
            if (patch.boards)
                updateData.boards = patch.boards;
            updateData.updated_at = new Date().toISOString();
            const { error } = await supabase.from('users').update(updateData).eq('id', id);
            if (error)
                throw error;
            await fetchUsers();
            return true;
        }
        catch {
            return false;
        }
    };
    const deleteUser = async (id) => {
        try {
            const { error } = await supabase.functions.invoke('delete-user', { body: { id } });
            if (!error) {
                await fetchUsers();
                return true;
            }
        }
        catch { }
        try {
            const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
            const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            if (functionsUrl) {
                const res = await fetch(`${functionsUrl}/delete-user`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...(anonKey ? { 'Authorization': `Bearer ${anonKey}`, 'apikey': anonKey } : {}) },
                    mode: 'cors', body: JSON.stringify({ id }),
                });
                if (res.ok) {
                    await fetchUsers();
                    return true;
                }
            }
        }
        catch { }
        try {
            const { error: dbErr } = await supabase.from('users').delete().eq('id', id);
            if (dbErr)
                throw dbErr;
            await fetchUsers();
            return true;
        }
        catch {
            return false;
        }
    };
    const updateSettings = async (next) => {
        const merged = { ...settings, ...next };
        const { theme: nextTheme, ...serverPayload } = merged;
        setSettings(merged);
        try {
            for (const [key, value] of Object.entries(serverPayload)) {
                await supabase.from('settings').upsert({ key, value: value, updated_at: new Date().toISOString() });
            }
        }
        catch (error) {
            console.error('Error updating settings:', error);
        }
        if (typeof nextTheme !== "undefined") {
            try {
                setUserTheme(currentUser?.id, nextTheme);
            }
            catch { }
            document.documentElement.setAttribute("data-theme", String(nextTheme));
        }
    };
    const addTask = async (task) => {
        try {
            const safe = normalizeTask(task);
            const { error } = await supabase.from('tasks').insert({
                id: safe.id, title: safe.title, description: safe.description, status: safe.status, priority: safe.priority,
                assigned_to: safe.assignedTo || null, assigned_to_name: safe.assignedToName, board: safe.board,
                deadline: safe.deadline || null, activities: safe.activities, started_by: safe.startedBy || null,
                started_by_name: safe.startedByName || null, started_at: safe.startedAt || null, picked_up_by: safe.pickedUpBy || null,
                picked_up_by_name: safe.pickedUpByName || null, picked_up_at: safe.pickedUpAt || null, completed_by: safe.completedBy || null,
                completed_by_name: safe.completedByName || null, completed_at: safe.completedAt || null,
            });
            if (error)
                throw error;
            await fetchTasks();
        }
        catch (error) {
            console.error('Error adding task to database:', error);
        }
    };
    const updateTask = async (task) => {
        try {
            const safe = normalizeTask({ ...task, updatedAt: new Date().toISOString() });
            const { error } = await supabase.from('tasks').update({
                title: safe.title, description: safe.description, status: safe.status, priority: safe.priority,
                assigned_to: safe.assignedTo || null, assigned_to_name: safe.assignedToName, board: safe.board,
                deadline: safe.deadline || null, activities: safe.activities, started_by: safe.startedBy || null,
                started_by_name: safe.startedByName || null, started_at: safe.startedAt || null, picked_up_by: safe.pickedUpBy || null,
                picked_up_by_name: safe.pickedUpByName || null, picked_up_at: safe.pickedUpAt || null, completed_by: safe.completedBy || null,
                completed_by_name: safe.completedByName || null, completed_at: safe.completedAt || null, updated_at: new Date().toISOString(),
            }).eq('id', safe.id);
            if (error)
                throw error;
            await fetchTasks();
        }
        catch (error) {
            console.error('Error updating task in database:', error);
        }
    };
    const deleteTask = async (id) => {
        try {
            const { error } = await supabase.from('tasks').delete().eq('id', id);
            if (error)
                throw error;
            await fetchTasks();
        }
        catch (error) {
            console.error('Error deleting task from database:', error);
        }
    };
    /** ---- Realtime management ---- */
    const resetRealtimeSubscription = () => {
        if (realtimeRef.current) {
            supabase.removeChannel(realtimeRef.current);
            realtimeRef.current = null;
        }
        const channel = supabase
            .channel('praxis-tasks')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchTasks())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => fetchUsers())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => fetchSettings())
            .subscribe();
        realtimeRef.current = channel;
    };
    // Init: wacht op sessie, fetch, subscribe realtime en start polling fallback
    useEffect(() => {
        let unsub = null;
        (async () => {
            const { data } = await supabase.auth.getSession();
            if (data?.session) {
                await Promise.all([fetchUsers(), fetchSettings(), fetchTasks()]);
            }
            else {
                await fetchSettings();
            }
            resetRealtimeSubscription();
            const sub = supabase.auth.onAuthStateChange(async (event) => {
                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    await new Promise(r => setTimeout(r, 60));
                    await Promise.all([fetchUsers(), fetchSettings(), fetchTasks()]);
                    resetRealtimeSubscription(); // opnieuw subscriben met verse token
                }
                if (event === 'SIGNED_OUT') {
                    setCurrentUser(null);
                    setIsManager(false);
                    setUsers([]);
                    setTasks([]);
                    resetRealtimeSubscription();
                }
            });
            unsub = () => sub.data.subscription.unsubscribe();
        })();
        // Polling fallback elke 15s (voor het geval Realtime niet vuurt)
        pollRef.current = window.setInterval(() => { fetchTasks(); }, 15000);
        return () => {
            if (unsub)
                unsub();
            if (realtimeRef.current) {
                supabase.removeChannel(realtimeRef.current);
                realtimeRef.current = null;
            }
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        };
    }, []);
    // Extra zekerheid: als currentUser wisselt, even refreshen
    useEffect(() => {
        if (currentUser) {
            (async () => {
                await new Promise(r => setTimeout(r, 60));
                await Promise.all([fetchUsers(), fetchSettings(), fetchTasks()]);
            })();
        }
    }, [currentUser?.id]);
    const value = {
        currentUser, isManager, login, logout, setPassword, consumeOneTimeCode,
        users, createUser, updateUser, deleteUser,
        settings, updateSettings,
        currentBoard, setCurrentBoard,
        tasks, fetchTasks, addTask, updateTask, deleteTask,
        t,
    };
    return _jsx(AppContext.Provider, { value: value, children: children });
};
/** ---- Hook ---- */
export const useAppContext = () => {
    const ctx = useContext(AppContext);
    if (!ctx)
        throw new Error("useAppContext must be used within AppProvider");
    return ctx;
};
export const useApp = useAppContext;
