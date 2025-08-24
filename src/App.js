import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import LoginForm from './components/LoginForm';
import Header from './components/Header';
import StatusView from './components/StatusView';
import Settings from './components/Settings';
import WelcomeScreen from './components/WelcomeScreen';
function AppContent() {
    const { currentUser, t } = useApp();
    const [currentStatus, setCurrentStatus] = useState('todo');
    const [showSettings, setShowSettings] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);
    if (!currentUser) {
        return _jsx(LoginForm, { onLoginSuccess: () => setShowWelcome(true) });
    }
    if (showWelcome) {
        return _jsx(WelcomeScreen, { onComplete: () => setShowWelcome(false) });
    }
    if (showSettings) {
        return (_jsxs("div", { className: "min-h-screen bg-gray-50 flex flex-col", children: [_jsx(Header, { currentStatus: currentStatus, onStatusChange: setCurrentStatus, onSettingsClick: () => setShowSettings(false) }), _jsx(Settings, { isPersonalOnly: currentUser.role !== 'manager' })] }));
    }
    const getStatusTitle = (status) => {
        switch (status) {
            case 'todo': return t.statusTodo ?? 'Te Doen';
            case 'needs-pickup': return t.statusNeedsPickup ?? 'Taak oppakken';
            case 'in-progress': return t.statusInProgress ?? 'Mee Bezig';
            case 'completed': return t.statusCompleted ?? 'Afgerond';
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 flex flex-col", children: [_jsx(Header, { currentStatus: currentStatus, onStatusChange: setCurrentStatus, onSettingsClick: () => setShowSettings(true) }), _jsx(StatusView, { status: currentStatus, title: getStatusTitle(currentStatus) })] }));
}
export default function App() {
    return (_jsx(AppProvider, { children: _jsx(AppContent, {}) }));
}
