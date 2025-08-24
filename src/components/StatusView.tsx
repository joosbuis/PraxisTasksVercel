import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Task, TaskStatus, TaskActivity } from '../types';
import { useApp } from '../contexts/AppContext';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';

interface StatusViewProps {
  status: TaskStatus;
  title: string;
}

const uuid = () => crypto.randomUUID();
const nowISO = () => new Date().toISOString();

export default function StatusView({ status, title }: StatusViewProps) {
  const { tasks, currentBoard, addTask, updateTask, deleteTask, t, currentUser } = useApp();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  // Append an activity entry to a task (3-4 args)
  const addActivity = (
    task: Task,
    type: TaskActivity['type'],
    userId: string,
    userName?: string
  ): Task => ({
    ...task,
    activities: [
      ...(Array.isArray((task as any).activities) ? (task as any).activities : []),
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
  const actorName = (currentUser as any)?.name ?? (currentUser as any)?.username ?? '';

  const statusTasks = tasks.filter(
    (task) => (task.board ?? 'voorwinkel') === currentBoard && task.status === status
  );

  const handleCreateTask = () => {
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  // Slaat taken op via context: updateTask(task) of addTask(task)
  const handleSaveTask = async (taskData: Partial<Task>) => {
    const nowIso = nowISO();

    if (selectedTask) {
      const updated: Task = {
        ...selectedTask,
        ...taskData,
        updatedAt: nowIso,
      } as Task;
      await updateTask(updated);
    } else {
      const newTask: Task = {
        activities: [
          {
            id: uuid(),
            type: 'created',
            description: 'Taak aangemaakt',
            timestamp: nowISO(),
            userId: currentUser?.id ?? '',
            userName: (currentUser as any)?.name ?? (currentUser as any)?.username ?? ''
          }
        ],
        id: uuid(),
        title: String(taskData.title ?? '').trim() || 'Nieuwe taak',
        status: ((taskData.status as any) ?? status ?? 'todo') as TaskStatus,
        description: String(taskData.description ?? ''),
        assignedTo: String(taskData.assignedTo ?? ''),
        assignedToName: String(taskData.assignedToName ?? ''),
        priority: (taskData.priority as any) ?? 'medium',
        deadline: taskData.deadline,
        board: (taskData.board as any) ?? currentBoard,
        // verplichte timestamps voor Task type
        createdAt: nowIso,
        updatedAt: nowIso,
        // optionele velden blijven undefined tenzij aanwezig in taskData
        startedBy: (taskData as any)?.startedBy,
        startedByName: (taskData as any)?.startedByName,
        startedAt: (taskData as any)?.startedAt,
        pickedUpBy: (taskData as any)?.pickedUpBy,
        pickedUpByName: (taskData as any)?.pickedUpByName,
        pickedUpAt: (taskData as any)?.pickedUpAt,
        completedBy: (taskData as any)?.completedBy,
        completedByName: (taskData as any)?.completedByName,
        completedAt: (taskData as any)?.completedAt,
      };
      await addTask(newTask);
    }
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const handleCompleteTask = (task: Task) => {
    setTaskToComplete(task);
    setShowCompleteConfirm(true);
  };

  const confirmCompleteTask = async () => {
    if (taskToComplete) {
      const updated0: Task = { ...taskToComplete, status: 'completed', updatedAt: nowISO() };
      // gebruik exact 3-4 parameters (geen 5e description-parameter)
      const updated: Task = addActivity(updated0, 'completed', actorId, actorName);
      (updated as any).completedBy = actorId;
      (updated as any).completedByName = actorName;
      (updated as any).completedAt = nowISO();
      await updateTask(updated);
      setTaskToComplete(null);
      setShowCompleteConfirm(false);
    }
  };

  const cancelCompleteTask = () => {
    setTaskToComplete(null);
    setShowCompleteConfirm(false);
  };

  const getStatusColor = (s: TaskStatus) => {
    switch (s) {
      case 'todo': return 'from-blue-500 to-blue-600';
      case 'needs-pickup': return 'from-orange-500 to-orange-600';
      case 'in-progress': return 'from-praxis-yellow to-praxis-yellow-dark';
      case 'completed': return 'from-green-500 to-green-600';
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className={`bg-gradient-to-r ${getStatusColor(status)} text-white rounded-lg p-6 mb-6`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">{title}</h1>
              <p className="text-white/90">
                {statusTasks.length} {t.tasks}
              </p>
            </div>
            {status === 'todo' && (
              <button
                onClick={handleCreateTask}
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                {t.newTask ?? 'Nieuwe taak'}
              </button>
            )}
          </div>
        </div>

        {statusTasks.length === 0 ? (
          <div className="text-center py-12">
            {status === 'todo' && (
              <div className="text-gray-400 mb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Plus className="w-8 h-8" />
                </div>
              </div>
            )}
            <h3 className="text-lg font-medium text-gray-900 mb-2">Geen taken gevonden</h3>
            <p className="text-gray-600 mb-4"></p>
            {status === 'todo' && (
              <button onClick={handleCreateTask} className="btn-primary">
                Creëer een taak
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statusTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={handleEditTask}
                showActions={true}
                onComplete={status === 'in-progress' ? handleCompleteTask : undefined}
                onDelete={(id: string) => deleteTask(id)}
              />
            ))}
          </div>
        )}

        {/* Bevestigingspopup voor taak afronden */}
        {showCompleteConfirm && taskToComplete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {(t.complete ?? 'Afronden')} {t.tasks}
              </h3>
              <p className="text-gray-600 mb-6">
                {(t.complete ?? 'Afronden')} <strong>"{taskToComplete.title}"</strong>?
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={cancelCompleteTask} className="btn-secondary">
                  {t.cancel ?? 'Annuleren'}
                </button>
                <button
                  onClick={confirmCompleteTask}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  {(t.yes ?? 'Ja')}, {(t.complete ?? 'Afronden')}
                </button>
              </div>
            </div>
          </div>
        )}

        <TaskModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTask(null);
          }}
          onSave={handleSaveTask}
          onDelete={(id: string) => deleteTask(id)}
        />
      </div>
    </div>
  );
}
