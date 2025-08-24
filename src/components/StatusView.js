import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
const uuid = () => crypto.randomUUID();
const nowISO = () => new Date().toISOString();
export default function StatusView({ status, title }) {
    const { tasks, currentBoard, addTask, updateTask, deleteTask, t, currentUser } = useApp();
    const [selectedTask, setSelectedTask] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [taskToComplete, setTaskToComplete] = useState(null);
    const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
    // Append an activity entry to a task (3-4 args)
    const addActivity = (task, type, userId, userName) => ({
        ...task,
        activities: [
            ...(Array.isArray(task.activities) ? task.activities : []),
            {
                id: uuid(),
                type,
                description: '', // optional free text
                timestamp: nowISO(),
                userId,
                userName: userName ?? ''
            }
        ]
    });
    const actorId = currentUser?.id ?? '';
    const actorName = currentUser?.name ?? currentUser?.username ?? '';
    const statusTasks = tasks.filter((task) => (task.board ?? 'voorwinkel') === currentBoard && task.status === status);
    const handleCreateTask = () => {
        setSelectedTask(null);
        setIsModalOpen(true);
    };
    const handleEditTask = (task) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };
    // Slaat taken op via context: updateTask(task) of addTask(task)
    const handleSaveTask = async (taskData) => {
        const nowIso = nowISO();
        if (selectedTask) {
            const updated = {
                ...selectedTask,
                ...taskData,
                updatedAt: nowIso,
            };
            await updateTask(updated);
        }
        else {
            const newTask = {
                activities: [
                    {
                        id: uuid(),
                        type: 'created',
                        description: 'Taak aangemaakt',
                        timestamp: nowISO(),
                        userId: currentUser?.id ?? '',
                        userName: currentUser?.name ?? currentUser?.username ?? ''
                    }
                ],
                id: uuid(),
                title: String(taskData.title ?? '').trim() || 'Nieuwe taak',
                status: (taskData.status ?? status ?? 'todo'),
                description: String(taskData.description ?? ''),
                assignedTo: String(taskData.assignedTo ?? ''),
                assignedToName: String(taskData.assignedToName ?? ''),
                priority: taskData.priority ?? 'medium',
                deadline: taskData.deadline,
                board: taskData.board ?? currentBoard,
                // verplichte timestamps voor Task type
                createdAt: nowIso,
                updatedAt: nowIso,
                // optionele velden blijven undefined tenzij aanwezig in taskData
                startedBy: taskData?.startedBy,
                startedByName: taskData?.startedByName,
                startedAt: taskData?.startedAt,
                pickedUpBy: taskData?.pickedUpBy,
                pickedUpByName: taskData?.pickedUpByName,
                pickedUpAt: taskData?.pickedUpAt,
                completedBy: taskData?.completedBy,
                completedByName: taskData?.completedByName,
                completedAt: taskData?.completedAt,
            };
            await addTask(newTask);
        }
        setIsModalOpen(false);
        setSelectedTask(null);
    };
    const handleCompleteTask = (task) => {
        setTaskToComplete(task);
        setShowCompleteConfirm(true);
    };
    const confirmCompleteTask = async () => {
        if (taskToComplete) {
            const updated0 = { ...taskToComplete, status: 'completed', updatedAt: nowISO() };
            // gebruik exact 3-4 parameters (geen 5e description-parameter)
            const updated = addActivity(updated0, 'completed', actorId, actorName);
            updated.completedBy = actorId;
            updated.completedByName = actorName;
            updated.completedAt = nowISO();
            await updateTask(updated);
            setTaskToComplete(null);
            setShowCompleteConfirm(false);
        }
    };
    const cancelCompleteTask = () => {
        setTaskToComplete(null);
        setShowCompleteConfirm(false);
    };
    const getStatusColor = (s) => {
        switch (s) {
            case 'todo': return 'from-blue-500 to-blue-600';
            case 'needs-pickup': return 'from-orange-500 to-orange-600';
            case 'in-progress': return 'from-praxis-yellow to-praxis-yellow-dark';
            case 'completed': return 'from-green-500 to-green-600';
        }
    };
    return (_jsx("div", { className: "flex-1 p-4 md:p-6", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsx("div", { className: `bg-gradient-to-r ${getStatusColor(status)} text-white rounded-lg p-6 mb-6`, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold mb-2", children: title }), _jsxs("p", { className: "text-white/90", children: [statusTasks.length, " ", t.tasks] })] }), status === 'todo' && (_jsxs("button", { onClick: handleCreateTask, className: "bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2", children: [_jsx(Plus, { className: "w-5 h-5" }), t.newTask ?? 'Nieuwe taak'] }))] }) }), statusTasks.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [status === 'todo' && (_jsx("div", { className: "text-gray-400 mb-4", children: _jsx("div", { className: "w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center", children: _jsx(Plus, { className: "w-8 h-8" }) }) })), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "Geen taken gevonden" }), _jsx("p", { className: "text-gray-600 mb-4" }), status === 'todo' && (_jsx("button", { onClick: handleCreateTask, className: "btn-primary", children: "Cre\u00EBer een taak" }))] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: statusTasks.map((task) => (_jsx(TaskCard, { task: task, onEdit: handleEditTask, showActions: true, onComplete: status === 'in-progress' ? handleCompleteTask : undefined, onDelete: (id) => deleteTask(id) }, task.id))) })), showCompleteConfirm && taskToComplete && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50", children: _jsxs("div", { className: "bg-white rounded-lg shadow-xl max-w-md w-full p-6", children: [_jsxs("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: [(t.complete ?? 'Afronden'), " ", t.tasks] }), _jsxs("p", { className: "text-gray-600 mb-6", children: [(t.complete ?? 'Afronden'), " ", _jsxs("strong", { children: ["\"", taskToComplete.title, "\""] }), "?"] }), _jsxs("div", { className: "flex gap-3 justify-end", children: [_jsx("button", { onClick: cancelCompleteTask, className: "btn-secondary", children: t.cancel ?? 'Annuleren' }), _jsxs("button", { onClick: confirmCompleteTask, className: "bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200", children: [(t.yes ?? 'Ja'), ", ", (t.complete ?? 'Afronden')] })] })] }) })), _jsx(TaskModal, { task: selectedTask, isOpen: isModalOpen, onClose: () => {
                        setIsModalOpen(false);
                        setSelectedTask(null);
                    }, onSave: handleSaveTask, onDelete: (id) => deleteTask(id) })] }) }));
}
