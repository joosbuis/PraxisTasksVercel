import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Plus } from 'lucide-react';
import TaskCard from './TaskCard';
export default function TaskColumn({ status, title, tasks, onCreateTask, onEditTask }) {
    const getColumnColor = (status) => {
        switch (status) {
            case 'todo': return 'border-blue-200 bg-blue-50';
            case 'in-progress': return 'border-praxis-yellow bg-praxis-yellow-light';
            case 'needs-pickup': return 'border-orange-200 bg-orange-50';
            case 'completed': return 'border-green-200 bg-green-50';
        }
    };
    const getHeaderColor = (status) => {
        switch (status) {
            case 'todo': return 'text-blue-700 bg-blue-100';
            case 'in-progress': return 'text-praxis-grey bg-praxis-yellow';
            case 'needs-pickup': return 'text-orange-700 bg-orange-100';
            case 'completed': return 'text-green-700 bg-green-100';
        }
    };
    return (_jsxs("div", { className: `flex flex-col h-full rounded-lg border-2 transition-colors ${getColumnColor(status)}`, children: [_jsxs("div", { className: `flex items-center justify-between p-4 rounded-t-lg ${getHeaderColor(status)}`, children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h2", { className: "font-semibold", children: title }), _jsx("span", { className: "bg-white bg-opacity-70 text-xs font-medium px-2 py-1 rounded-full", children: tasks.length })] }), _jsx("button", { onClick: () => onCreateTask(status), className: "p-1 hover:bg-white hover:bg-opacity-30 rounded transition-colors", title: "Nieuwe taak", children: _jsx(Plus, { className: "w-4 h-4" }) })] }), _jsxs("div", { className: "flex-1 p-4 space-y-3 min-h-[200px] overflow-y-auto", children: [tasks.map((task) => (_jsx(TaskCard, { task: task, onEdit: onEditTask }, task.id))), tasks.length === 0 && (_jsxs("div", { className: "text-center py-8 text-gray-500", children: [_jsx("p", { className: "text-sm", children: "Geen taken" }), _jsx("button", { onClick: () => onCreateTask(status), className: "text-xs text-gray-400 hover:text-gray-600 mt-1", children: "Klik om een taak toe te voegen" })] }))] })] }));
}
