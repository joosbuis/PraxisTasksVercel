import React from 'react';
import { Plus } from 'lucide-react';
import { Task, TaskStatus } from '../types';
import TaskCard from './TaskCard';

interface TaskColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onCreateTask: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
}

export default function TaskColumn({ status, title, tasks, onCreateTask, onEditTask }: TaskColumnProps) {
  const getColumnColor = (status: TaskStatus) => {
    switch (status) {
      case 'todo': return 'border-blue-200 bg-blue-50';
      case 'in-progress': return 'border-praxis-yellow bg-praxis-yellow-light';
      case 'needs-pickup': return 'border-orange-200 bg-orange-50';
      case 'completed': return 'border-green-200 bg-green-50';
    }
  };

  const getHeaderColor = (status: TaskStatus) => {
    switch (status) {
      case 'todo': return 'text-blue-700 bg-blue-100';
      case 'in-progress': return 'text-praxis-grey bg-praxis-yellow';
      case 'needs-pickup': return 'text-orange-700 bg-orange-100';
      case 'completed': return 'text-green-700 bg-green-100';
    }
  };

  return (
    <div className={`flex flex-col h-full rounded-lg border-2 transition-colors ${getColumnColor(status)}`}>
      <div className={`flex items-center justify-between p-4 rounded-t-lg ${getHeaderColor(status)}`}>
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">{title}</h2>
          <span className="bg-white bg-opacity-70 text-xs font-medium px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onCreateTask(status)}
          className="p-1 hover:bg-white hover:bg-opacity-30 rounded transition-colors"
          title="Nieuwe taak"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-4 space-y-3 min-h-[200px] overflow-y-auto">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEditTask}
          />
        ))}
        
        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">Geen taken</p>
            <button
              onClick={() => onCreateTask(status)}
              className="text-xs text-gray-400 hover:text-gray-600 mt-1"
            >
              Klik om een taak toe te voegen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}