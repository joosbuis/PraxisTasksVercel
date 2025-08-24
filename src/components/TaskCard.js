import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { User, Clock, CheckCircle2, Play, Pause, UserCheck, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
export default function TaskCard({ task, onEdit, showActions = false, onComplete, onDelete }) {
    const { updateTask, currentUser, t } = useApp();
    const nowISO = () => new Date().toISOString();
    const uuid = () => crypto.randomUUID();
    const addActivity = (task, type, userId, userName, description = '') => ({
        ...task,
        activities: [
            ...(Array.isArray(task.activities) ? task.activities : []),
            { id: uuid(), type, description, timestamp: nowISO(), userId, userName: userName ?? '' }
        ]
    });
    const actorId = currentUser?.id ?? '';
    const actorName = currentUser?.name ?? currentUser?.username ?? '';
    // veilige prioriteit
    const prio = (task.priority ?? 'medium');
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'text-red-600 bg-red-50';
            case 'medium': return 'text-yellow-600 bg-yellow-50';
            case 'low': return 'text-green-600 bg-green-50';
            default: return 'text-gray-600 bg-gray-100';
        }
    };
    const getPriorityLabel = (priority) => {
        switch (priority) {
            case 'high': return t.high ?? 'Hoog';
            case 'medium': return t.medium ?? 'Gemiddeld';
            case 'low': return t.low ?? 'Laag';
            default: return t.medium ?? 'Gemiddeld';
        }
    };
    const isOverdue = !!task.deadline &&
        new Date(task.deadline) < new Date() &&
        task.status !== 'completed';
    const activities = Array.isArray(task.activities) ? task.activities : [];
    const handleStart = async (e) => {
        e.stopPropagation();
        let next = addActivity({ ...task, status: 'in-progress', updatedAt: nowISO() }, 'updated', actorId, actorName, 'status: in-progress');
        if (task.status === 'needs-pickup') {
            next.pickedUpBy = actorId;
            next.pickedUpByName = actorName;
            next.pickedUpAt = nowISO();
        }
        else {
            if (!task.startedBy) {
                next.startedBy = actorId;
                next.startedByName = actorName;
                next.startedAt = nowISO();
            }
        }
        await updateTask(next);
    };
    const handlePause = async (e) => {
        e.stopPropagation();
        const next = addActivity({ ...task, status: 'needs-pickup', updatedAt: nowISO() }, 'updated', actorId, actorName, 'status: needs-pickup');
        await updateTask(next);
    };
    const handleComplete = (e) => {
        e.stopPropagation();
        onComplete?.(task);
    };
    const handleDelete = (e) => {
        e.stopPropagation();
        if (onDelete && window.confirm(`Weet je zeker dat je de taak '${task.title}' wilt verwijderen?`)) {
            onDelete(task.id);
        }
    };
    // ------- Helpers to compute display fallbacks from activities -------
    function computeStartedNameFromActivities(acts) {
        // earliest 'status: in-progress' update is the real starter
        const firstStart = acts.find(a => a?.type === 'updated' && (a?.description || '').includes('status: in-progress'));
        return firstStart?.userName || '';
    }
    function computePickedUpNameFromActivities(acts) {
        // find a needs-pickup -> in-progress transition, take the picker (in-progress user)
        for (let i = 0; i < acts.length - 1; i++) {
            const a = acts[i];
            const b = acts[i + 1];
            const aNeeds = a?.type === 'updated' && (a?.description || '').includes('status: needs-pickup');
            const bStart = b?.type === 'updated' && (b?.description || '').includes('status: in-progress');
            if (aNeeds && bStart)
                return b?.userName || '';
        }
        return '';
    }
    return (_jsxs("div", { className: "card p-4 cursor-pointer hover:shadow-md transition-all duration-200", onClick: () => onEdit(task), children: [task.status === 'completed' && onDelete && (_jsx("div", { className: "flex justify-end mb-2", children: _jsx("button", { onClick: handleDelete, className: "text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors", title: "Taak verwijderen", children: _jsx(X, { className: "w-4 h-4" }) }) })), _jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsx("h3", { className: "font-medium text-gray-900 line-clamp-2 flex-1", children: task.title }), _jsx("span", { className: `px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(prio)}`, children: getPriorityLabel(prio) })] }), task.description && (_jsx("p", { className: "text-sm text-gray-600 mb-1 line-clamp-2", children: task.description })), _jsxs("div", { className: "space-y-2", children: [task.assignedToName && (_jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-600", children: [_jsx(User, { className: "w-4 h-4" }), _jsx("span", { children: task.assignedToName })] })), (() => {
                        const createdByNameStored = task.createdByName || '';
                        const createdAct = activities.find((a) => a?.type === 'created');
                        const createdNameDisplay = createdByNameStored || createdAct?.userName || '';
                        return createdNameDisplay ? (_jsxs("div", { className: "flex items-center gap-1 text-xs text-gray-500", children: [_jsx(User, { className: "w-3 h-3" }), _jsxs("span", { children: ["Aangemaakt door ", createdNameDisplay] })] })) : null;
                    })(), (() => {
                        // 'Gestart door' (immutable display): prefer stored field; fallback to activities for visibility on legacy tasks
                        const startedNameStored = task.startedByName || '';
                        const startedNameDisplay = startedNameStored || computeStartedNameFromActivities(activities);
                        // 'Opgepakt door': prefer stored; fallback for legacy visibility
                        const pickedNameStored = task.pickedUpByName || '';
                        const pickedNameDisplay = pickedNameStored || computePickedUpNameFromActivities(activities);
                        // 'Afgerond door'
                        const completedAct = activities.slice().reverse().find((a) => a?.type === 'completed');
                        const completedName = task.completedByName || completedAct?.userName || '';
                        return (_jsxs("div", { className: "mt-1 flex flex-wrap items-center gap-2 text-xs", children: [startedNameDisplay && (_jsxs("span", { className: "inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200", children: [_jsx(Play, { className: "w-3 h-3" }), _jsxs("span", { children: ["Gestart door ", startedNameDisplay] })] })), pickedNameDisplay && (_jsxs("span", { className: "inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 ring-1 ring-blue-200", children: [_jsx(UserCheck, { className: "w-3 h-3" }), _jsxs("span", { children: ["Opgepakt door ", pickedNameDisplay] })] })), task.status === 'completed' && completedName && (_jsxs("span", { className: "inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-800 ring-1 ring-green-200", children: [_jsx(CheckCircle2, { className: "w-3 h-3" }), _jsxs("span", { children: ["Afgerond door ", completedName] })] }))] }));
                    })()] }), _jsxs("div", { className: "flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100 mt-3", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Clock, { className: "w-3 h-3" }), _jsx("span", { children: new Date(task.updatedAt).toLocaleDateString('nl-NL', {
                                    day: 'numeric',
                                    month: 'short',
                                }) })] }), activities.length > 1 && (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(CheckCircle2, { className: "w-3 h-3" }), _jsxs("span", { children: [activities.length, " activiteiten"] })] }))] }), showActions && (_jsxs("div", { className: "flex gap-2 pt-3 border-t border-gray-100 mt-3", children: [(task.status === 'todo' || task.status === 'needs-pickup') && (_jsxs("button", { onClick: handleStart, className: "flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors", children: [_jsx(Play, { className: "w-3 h-3" }), task.status === 'needs-pickup' ? (t.pickup ?? 'Oppakken') : (t.start ?? 'Starten')] })), task.status === 'in-progress' && (_jsxs(_Fragment, { children: [_jsxs("button", { onClick: handlePause, className: "flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 transition-colors", children: [_jsx(Pause, { className: "w-3 h-3" }), t.pause ?? 'Pauzeren'] }), onComplete && (_jsxs("button", { onClick: handleComplete, className: "flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors", children: [_jsx(CheckCircle2, { className: "w-3 h-3" }), t.complete ?? 'Afronden'] }))] }))] }))] }));
}
