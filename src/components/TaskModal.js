import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { X, Calendar, User, Flag, Building2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
// Placeholder-teksten (hint, verdwijnt bij typen)
const PLACEHOLDER_TITLE = "Titel (bijv. Stelling A bijvullen)";
const PLACEHOLDER_DESCRIPTION = "Korte omschrijving (materiaal, locatie, bijzonderheden)...";
// Fallbacks (extra veilig)
const FALLBACK_TITLE = "Nieuwe taak";
const FALLBACK_DESCRIPTION = "Omschrijving ontbreekt.";
export default function TaskModal({ task, isOpen, onClose, onSave, onDelete }) {
    const nowISO = () => new Date().toISOString();
    const uuid = () => crypto.randomUUID();
    const addActivity = (t, type, userId, userName, description = '') => ({
        ...t,
        activities: [...(Array.isArray(t.activities) ? t.activities : []), { id: uuid(), type, description, timestamp: nowISO(), userId, userName: userName ?? '' }]
    });
    const computeDiff = (prev, next) => {
        const fields = ['title', 'description', 'priority', 'assignedTo', 'assignedToName', 'deadline', 'board', 'status'];
        const diff = {};
        for (const f of fields) {
            const a = (prev ?? {})[f];
            const b = (next ?? {})[f];
            if (JSON.stringify(a) !== JSON.stringify(b))
                diff[f] = { from: a, to: b };
        }
        return diff;
    };
    const { users, currentUser, currentBoard, t } = useApp();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        assignedTo: '',
        deadline: '',
        board: currentBoard || 'voorwinkel',
    });
    // 🔎 Zoeken op NAAM voor de toewijslijst
    const [assigneeSearch, setAssigneeSearch] = useState('');
    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title ?? '',
                description: task.description ?? '',
                priority: task.priority ?? 'medium',
                assignedTo: task.assignedTo || '',
                deadline: task.deadline ? String(task.deadline).split('T')[0] : '',
                board: task.board ?? (currentBoard || 'voorwinkel'),
            });
        }
        else {
            setFormData({
                title: '',
                description: '',
                priority: 'medium',
                assignedTo: '',
                deadline: '',
                board: currentBoard || 'voorwinkel',
            });
        }
        // reset lokale zoekterm per open/close of wissel
        setAssigneeSearch('');
    }, [task, currentBoard, isOpen]);
    const handleSubmit = (e) => {
        e.preventDefault();
        const allUsers = Array.isArray(users) ? users : [];
        const assignedUser = allUsers.find((u) => String(u.id) === String(formData.assignedTo));
        const safeTitle = (formData.title ?? '').trim() || FALLBACK_TITLE;
        const safeDescription = (formData.description ?? '').trim() || FALLBACK_DESCRIPTION;
        onSave({
            ...formData,
            title: safeTitle,
            description: safeDescription,
            assignedToName: assignedUser?.name,
            deadline: formData.deadline || undefined,
        });
        onClose();
    };
    const handleDelete = () => {
        if (task && onDelete && window.confirm(`Weet je zeker dat je de taak '${task.title}' wilt verwijderen?`)) {
            onDelete(task.id);
            onClose();
        }
    };
    if (!isOpen)
        return null;
    // 📋 Alle accounts (NIET meer gefilterd op board), ENKEL filter op NAAM
    const allUsers = Array.isArray(users) ? users : [];
    const filteredUsers = allUsers.filter((u) => {
        const name = (u?.name ?? '').toString().toLowerCase();
        const q = assigneeSearch.trim().toLowerCase();
        return name.includes(q);
    });
    // activiteiten veilig lezen
    const activities = Array.isArray(task?.activities) ? task.activities : [];
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50", children: _jsxs("div", { className: "bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b border-gray-200", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: task ? t.edit + ' ' + t.tasks : (t.newTask ?? 'Nieuwe taak aanmaken') }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600 transition-colors", children: _jsx(X, { className: "w-6 h-6" }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-6", children: [_jsxs("div", { children: [_jsxs("label", { htmlFor: "title", className: "block text-sm font-medium text-gray-700 mb-2", children: [t.title ?? "Titel", " *"] }), _jsx("input", { id: "title", type: "text", value: formData.title, onChange: (e) => setFormData({ ...formData, title: e.target.value }), className: "input-field placeholder-gray-400", placeholder: PLACEHOLDER_TITLE, required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "description", className: "block text-sm font-medium text-gray-700 mb-2", children: t.description ?? "Beschrijving" }), _jsx("textarea", { id: "description", value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), className: "input-field min-h-[100px] resize-y placeholder-gray-400", placeholder: PLACEHOLDER_DESCRIPTION, rows: 4 })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsxs("label", { htmlFor: "priority", className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(Flag, { className: "w-4 h-4 inline mr-1" }), t.priority ?? "Prioriteit"] }), _jsxs("select", { id: "priority", value: formData.priority, onChange: (e) => setFormData({ ...formData, priority: e.target.value }), className: "input-field", children: [_jsx("option", { value: "low", children: t.low ?? "Laag" }), _jsx("option", { value: "medium", children: t.medium ?? "Normaal" }), _jsx("option", { value: "high", children: t.high ?? "Hoog" })] })] }), _jsxs("div", { children: [_jsxs("label", { htmlFor: "board", className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(Building2, { className: "w-4 h-4 inline mr-1" }), t.departments ?? "Afdeling"] }), _jsxs("select", { id: "board", value: formData.board, onChange: (e) => setFormData({ ...formData, board: e.target.value }), className: "input-field", children: [_jsx("option", { value: "voorwinkel", children: t.voorwinkel ?? "Voorwinkel" }), _jsx("option", { value: "achterwinkel", children: t.achterwinkel ?? "Achterwinkel" })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(User, { className: "w-4 h-4 inline mr-1" }), t.assignedTo ?? "Toegewezen aan"] }), _jsx("input", { type: "text", value: assigneeSearch, onChange: (e) => setAssigneeSearch(e.target.value), className: "input-field mb-2 placeholder-gray-400", placeholder: "Zoek op naam..." }), _jsxs("select", { id: "assignedTo", value: formData.assignedTo, onChange: (e) => setFormData({ ...formData, assignedTo: e.target.value }), className: "input-field", children: [_jsx("option", { value: "", children: "\u2014 Niet toegewezen \u2014" }), filteredUsers.length === 0 ? (_jsx("option", { disabled: true, value: "", children: "Geen gebruiker gevonden" })) : (filteredUsers.map((user) => (_jsxs("option", { value: user.id, children: [user.name, user.role === 'manager' ? ' (Manager)' : ''] }, user.id))))] })] }), _jsxs("div", { children: [_jsxs("label", { htmlFor: "deadline", className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(Calendar, { className: "w-4 h-4 inline mr-1" }), t.deadline ?? "Deadline"] }), _jsx("input", { id: "deadline", type: "date", value: formData.deadline, onChange: (e) => setFormData({ ...formData, deadline: e.target.value }), className: "input-field", min: new Date().toISOString().split('T')[0] })] })] }), Array.isArray(task?.activities) && task.activities.length > 0 && (_jsxs("div", { className: "mt-2 bg-gray-50 border rounded-lg p-4", children: [_jsx("h4", { className: "text-sm font-semibold mb-3", children: "Logboek" }), (() => {
                                    const raw = task.activities;
                                    const seen = new Set();
                                    const acts = raw
                                        .filter((a) => {
                                        const key = String(a?.id || `${a?.timestamp}|${a?.type}|${a?.userId}|${a?.description}`);
                                        if (seen.has(key))
                                            return false;
                                        seen.add(key);
                                        return true;
                                    })
                                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                                    const chip = (tt) => {
                                        const base = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium";
                                        if (tt === "created")
                                            return _jsx("span", { className: `${base} bg-blue-100 text-blue-800 ring-1 ring-blue-200`, children: "Aangemaakt" });
                                        if (tt === "assigned")
                                            return _jsx("span", { className: `${base} bg-purple-100 text-purple-800 ring-1 ring-purple-200`, children: "Toegewezen" });
                                        if (tt === "moved")
                                            return _jsx("span", { className: `${base} bg-orange-100 text-orange-800 ring-1 ring-orange-200`, children: "Verplaatst" });
                                        if (tt === "completed")
                                            return _jsx("span", { className: `${base} bg-green-100 text-green-800 ring-1 ring-green-200`, children: "Afgerond" });
                                        return _jsx("span", { className: `${base} bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200`, children: "Bijgewerkt" });
                                    };
                                    return (_jsx("ul", { className: "space-y-2 max-h-56 overflow-auto text-sm text-gray-700", children: acts.map((a, i) => (_jsxs("li", { className: "flex flex-col md:flex-row md:items-center md:gap-3", children: [_jsx("div", { className: "text-gray-500 min-w-40", children: new Date(a.timestamp).toLocaleString() }), _jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [chip(String(a.type)), _jsx("span", { className: "font-medium", children: a.userName || "onbekend" }), a.description && _jsxs("span", { className: "text-gray-600 break-all", children: ["\u2014 ", a.description] })] })] }, a.id ?? i))) }));
                                })()] })), _jsxs("div", { className: "flex items-center justify-between pt-6 border-t border-gray-200", children: [_jsx("div", { children: task && onDelete && currentUser?.role === 'manager' && (_jsxs("button", { type: "button", onClick: handleDelete, className: "text-red-600 hover:text-red-700 font-medium", children: [t.delete ?? "Verwijderen", " ", t.tasks ?? "Taken"] })) }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { type: "button", onClick: onClose, className: "btn-secondary", children: t.cancel ?? "Annuleren" }), _jsx("button", { type: "submit", className: "btn-primary", children: task ? (t.save ?? "Opslaan") : (t.create ?? "Aanmaken") })] })] })] })] }) }));
}
