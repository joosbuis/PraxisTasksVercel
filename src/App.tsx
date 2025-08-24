import React, { useState } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import LoginForm from './components/LoginForm';
import Header from './components/Header';
import StatusView from './components/StatusView';
import Settings from './components/Settings';
import WelcomeScreen from './components/WelcomeScreen';
import { TaskStatus } from './types';

function AppContent() {
  const { currentUser, t } = useApp();
  const [currentStatus, setCurrentStatus] = useState<TaskStatus>('todo');
  const [showSettings, setShowSettings] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  if (!currentUser) {
    return <LoginForm onLoginSuccess={() => setShowWelcome(true)} />;
  }

  if (showWelcome) {
    return <WelcomeScreen onComplete={() => setShowWelcome(false)} />;
  }

  if (showSettings) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header
          currentStatus={currentStatus}
          onStatusChange={setCurrentStatus}
          onSettingsClick={() => setShowSettings(false)}
        />
        <Settings isPersonalOnly={currentUser.role !== 'manager'} />
      </div>
    );
  }

  const getStatusTitle = (status: TaskStatus) => {
    switch (status) {
      case 'todo': return t.statusTodo ?? 'Te Doen';
      case 'needs-pickup': return t.statusNeedsPickup ?? 'Taak oppakken';
      case 'in-progress': return t.statusInProgress ?? 'Mee Bezig';
      case 'completed': return t.statusCompleted ?? 'Afgerond';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        currentStatus={currentStatus}
        onStatusChange={setCurrentStatus}
        onSettingsClick={() => setShowSettings(true)}
      />
      <StatusView
        status={currentStatus}
        title={getStatusTitle(currentStatus)!}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
