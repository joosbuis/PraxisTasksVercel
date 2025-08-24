import React from 'react';
import {
  LogOut,
  Building2,
  Users,
  BarChart3,
  CheckSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  Settings
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { TaskStatus } from '../types';
import { APP_VERSION } from '../version'; // pad evt. aanpassen

interface HeaderProps {
  currentStatus: TaskStatus;
  onStatusChange: (status: TaskStatus) => void;
  onSettingsClick?: () => void;
}

export default function Header({ currentStatus, onStatusChange, onSettingsClick }: HeaderProps) {
  const { currentUser, currentBoard, setCurrentBoard, logout, tasks, t } = useApp();

  if (!currentUser) return null;

  // Tekst-fallbacks zodat het werkt met zowel t.todo/t.inProgress
  // als met t.statusTodo/t.statusInProgress
  const labels = {
    todo: t.statusTodo ?? (t as any).todo ?? 'Te Doen',
    needsPickup: t.statusNeedsPickup ?? (t as any).needsPickup ?? 'Taak oppakken',
    inProgress: t.statusInProgress ?? (t as any).inProgress ?? 'Mee Bezig',
    completed: t.statusCompleted ?? (t as any).completed ?? 'Afgerond',
    settings: t.settings ?? 'Instellingen',
    logout: (t as any).logout ?? 'Uitloggen',
    voorwinkel: t.voorwinkel ?? 'Voorwinkel',
    achterwinkel: t.achterwinkel ?? 'Achterwinkel',
  };

  // Toon naam of anders username
  const displayName = (currentUser as any).name ?? currentUser.username;

  const boardTasks = tasks.filter(task => (task.board ?? 'voorwinkel') === currentBoard);
  const getTaskCount = (status: TaskStatus) => boardTasks.filter(task => task.status === status).length;

  const statusTabs = [
    { status: 'todo' as TaskStatus, label: labels.todo, icon: CheckSquare, count: getTaskCount('todo') },
    { status: 'needs-pickup' as TaskStatus, label: labels.needsPickup, icon: AlertCircle, count: getTaskCount('needs-pickup') },
    { status: 'in-progress' as TaskStatus, label: labels.inProgress, icon: Clock, count: getTaskCount('in-progress') },
    { status: 'completed' as TaskStatus, label: labels.completed, icon: CheckCircle2, count: getTaskCount('completed') }
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <img
                src="https://play-lh.googleusercontent.com/Gg4iUcjk0kYsRxbKrSGIjAOojuh3ch68QNrkdv64Sp2iPgKbO2L72kEDvpW07idtDA"
                alt="Praxis Tasks Logo"
                className="w-8 h-8 rounded-lg"
              />
              <div className="flex items-baseline gap-2">
               <h1 className="text-xl font-bold text-praxis-grey">Praxis Tasks</h1>
               <span className="text-xs text-gray-500">v{APP_VERSION}</span>
           </div>
         </div>
            {/* Board switch (desktop) */}
            <div className="hidden sm:flex items-center gap-2 ml-8">
              <button
                onClick={() => setCurrentBoard('voorwinkel')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentBoard === 'voorwinkel'
                    ? 'bg-praxis-yellow text-praxis-grey'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {labels.voorwinkel}
              </button>
              <button
                onClick={() => setCurrentBoard('achterwinkel')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentBoard === 'achterwinkel'
                    ? 'bg-praxis-yellow text-praxis-grey'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {labels.achterwinkel}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
              {currentUser.role === 'manager' && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{t.manager ?? 'Manager'}</span>
                </div>
              )}
              <span className="font-medium text-gray-900">{displayName}</span>
            </div>

            {onSettingsClick && (
              <button
                onClick={onSettingsClick}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                title={labels.settings}
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">{labels.settings}</span>
              </button>
            )}

            <button
              onClick={logout}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{labels.logout}</span>
            </button>
          </div>
        </div>

        {/* Mobile board switcher */}
        <div className="sm:hidden pb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentBoard('voorwinkel')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentBoard === 'voorwinkel'
                  ? 'bg-praxis-yellow text-praxis-grey'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {labels.voorwinkel}
            </button>
            <button
              onClick={() => setCurrentBoard('achterwinkel')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentBoard === 'achterwinkel'
                  ? 'bg-praxis-yellow text-praxis-grey'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {labels.achterwinkel}
            </button>
          </div>
        </div>

        {/* Status Navigation Tabs */}
        <div className="border-t border-gray-200">
          <div className="flex overflow-x-auto">
            {statusTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.status}
                  onClick={() => onStatusChange(tab.status)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    currentStatus === tab.status
                      ? 'border-praxis-yellow text-praxis-grey bg-praxis-yellow-light'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      currentStatus === tab.status
                        ? 'bg-praxis-yellow text-praxis-grey'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
