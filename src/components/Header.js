import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { LogOut, Users, CheckSquare, Clock, AlertCircle, CheckCircle2, Settings } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { APP_VERSION } from '../version'; // pad evt. aanpassen
export default function Header({ currentStatus, onStatusChange, onSettingsClick }) {
    const { currentUser, currentBoard, setCurrentBoard, logout, tasks, t } = useApp();
    if (!currentUser)
        return null;
    // Tekst-fallbacks zodat het werkt met zowel t.todo/t.inProgress
    // als met t.statusTodo/t.statusInProgress
    const labels = {
        todo: t.statusTodo ?? t.todo ?? 'Te Doen',
        needsPickup: t.statusNeedsPickup ?? t.needsPickup ?? 'Taak oppakken',
        inProgress: t.statusInProgress ?? t.inProgress ?? 'Mee Bezig',
        completed: t.statusCompleted ?? t.completed ?? 'Afgerond',
        settings: t.settings ?? 'Instellingen',
        logout: t.logout ?? 'Uitloggen',
        voorwinkel: t.voorwinkel ?? 'Voorwinkel',
        achterwinkel: t.achterwinkel ?? 'Achterwinkel',
    };
    // Toon naam of anders username
    const displayName = currentUser.name ?? currentUser.username;
    const boardTasks = tasks.filter(task => (task.board ?? 'voorwinkel') === currentBoard);
    const getTaskCount = (status) => boardTasks.filter(task => task.status === status).length;
    const statusTabs = [
        { status: 'todo', label: labels.todo, icon: CheckSquare, count: getTaskCount('todo') },
        { status: 'needs-pickup', label: labels.needsPickup, icon: AlertCircle, count: getTaskCount('needs-pickup') },
        { status: 'in-progress', label: labels.inProgress, icon: Clock, count: getTaskCount('in-progress') },
        { status: 'completed', label: labels.completed, icon: CheckCircle2, count: getTaskCount('completed') }
    ];
    return (_jsx("header", { className: "bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "flex justify-between items-center h-16", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("img", { src: "https://play-lh.googleusercontent.com/Gg4iUcjk0kYsRxbKrSGIjAOojuh3ch68QNrkdv64Sp2iPgKbO2L72kEDvpW07idtDA", alt: "Praxis Tasks Logo", className: "w-8 h-8 rounded-lg" }), _jsxs("div", { className: "flex items-baseline gap-2", children: [_jsx("h1", { className: "text-xl font-bold text-praxis-grey", children: "Praxis Tasks" }), _jsxs("span", { className: "text-xs text-gray-500", children: ["v", APP_VERSION] })] })] }), _jsxs("div", { className: "hidden sm:flex items-center gap-2 ml-8", children: [_jsx("button", { onClick: () => setCurrentBoard('voorwinkel'), className: `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentBoard === 'voorwinkel'
                                                ? 'bg-praxis-yellow text-praxis-grey'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`, children: labels.voorwinkel }), _jsx("button", { onClick: () => setCurrentBoard('achterwinkel'), className: `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentBoard === 'achterwinkel'
                                                ? 'bg-praxis-yellow text-praxis-grey'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`, children: labels.achterwinkel })] })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "hidden sm:flex items-center gap-2 text-sm text-gray-600", children: [currentUser.role === 'manager' && (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Users, { className: "w-4 h-4" }), _jsx("span", { children: t.manager ?? 'Manager' })] })), _jsx("span", { className: "font-medium text-gray-900", children: displayName })] }), onSettingsClick && (_jsxs("button", { onClick: onSettingsClick, className: "flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors", title: labels.settings, children: [_jsx(Settings, { className: "w-4 h-4" }), _jsx("span", { className: "hidden sm:inline", children: labels.settings })] })), _jsxs("button", { onClick: logout, className: "flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors", children: [_jsx(LogOut, { className: "w-4 h-4" }), _jsx("span", { className: "hidden sm:inline", children: labels.logout })] })] })] }), _jsx("div", { className: "sm:hidden pb-4", children: _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => setCurrentBoard('voorwinkel'), className: `flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentBoard === 'voorwinkel'
                                    ? 'bg-praxis-yellow text-praxis-grey'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`, children: labels.voorwinkel }), _jsx("button", { onClick: () => setCurrentBoard('achterwinkel'), className: `flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentBoard === 'achterwinkel'
                                    ? 'bg-praxis-yellow text-praxis-grey'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`, children: labels.achterwinkel })] }) }), _jsx("div", { className: "border-t border-gray-200", children: _jsx("div", { className: "flex overflow-x-auto", children: statusTabs.map((tab) => {
                            const Icon = tab.icon;
                            return (_jsxs("button", { onClick: () => onStatusChange(tab.status), className: `flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${currentStatus === tab.status
                                    ? 'border-praxis-yellow text-praxis-grey bg-praxis-yellow-light'
                                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'}`, children: [_jsx(Icon, { className: "w-4 h-4" }), _jsx("span", { children: tab.label }), _jsx("span", { className: `px-2 py-0.5 rounded-full text-xs ${currentStatus === tab.status
                                            ? 'bg-praxis-yellow text-praxis-grey'
                                            : 'bg-gray-100 text-gray-600'}`, children: tab.count })] }, tab.status));
                        }) }) })] }) }));
}
