import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import TaskColumn from './TaskColumn';
import TaskModal from './TaskModal';
const COLUMNS = [
    { status: 'todo', title: 'Te Doen' },
    { status: 'in-progress', title: 'Mee Bezig' },
    { status: 'needs-pickup', title: 'Taak oppakken' },
    { status: 'completed', title: 'Afgerond' }
];
export default function KanbanBoard() {
    const { tasks, currentBoard, addTask, updateTask, deleteTask } = useApp();
    const [selectedTask, setSelectedTask] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const boardTasks = tasks.filter(task => task.board === currentBoard);
    const getTasksByStatus = (status) => {
        return boardTasks.filter(task => task.status === status);
    };
    const handleCreateTask = (status) => {
        setSelectedTask(null);
        setIsModalOpen(true);
    };
    const handleEditTask = (task) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };
    const handleSaveTask = async (taskData) => {
        if (selectedTask) {
            const updatedTask = { ...selectedTask, ...taskData };
            await updateTask(updatedTask);
        }
        else {
            const newTask = {
                id: crypto.randomUUID(),
                title: taskData.title || '',
                description: taskData.description || '',
                status: taskData.status || 'todo',
                priority: taskData.priority || 'medium',
                board: taskData.board || currentBoard,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                activities: []
            };
            await addTask(newTask);
        }
        setIsModalOpen(false);
        setSelectedTask(null);
    };
    return (_jsxs("div", { className: "flex-1 p-4 md:p-6", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 capitalize", children: currentBoard === 'voorwinkel' ? 'Voorwinkel' : 'Achterwinkel' }), _jsxs("p", { className: "text-gray-600 mt-1", children: ["Beheer taken voor de ", currentBoard === 'voorwinkel' ? 'voorwinkel' : 'achterwinkel', " afdeling"] })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]", children: COLUMNS.map((column) => (_jsx(TaskColumn, { status: column.status, title: column.title, tasks: getTasksByStatus(column.status), onCreateTask: handleCreateTask, onEditTask: handleEditTask }, column.status))) }), _jsx(TaskModal, { task: selectedTask, isOpen: isModalOpen, onClose: () => {
                    setIsModalOpen(false);
                    setSelectedTask(null);
                }, onSave: handleSaveTask, onDelete: async (id) => {
                    await deleteTask(id);
                    setIsModalOpen(false);
                    setSelectedTask(null);
                } })] }));
}
