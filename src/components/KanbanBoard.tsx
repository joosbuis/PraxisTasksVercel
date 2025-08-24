import React, { useState } from 'react';
import { Task, TaskStatus } from '../types';
import { useApp } from '../contexts/AppContext';
import TaskColumn from './TaskColumn';
import TaskModal from './TaskModal';

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: 'todo', title: 'Te Doen' },
  { status: 'in-progress', title: 'Mee Bezig' },
  { status: 'needs-pickup', title: 'Taak oppakken' },
  { status: 'completed', title: 'Afgerond' }
];

export default function KanbanBoard() {
  const { tasks, currentBoard, addTask, updateTask, deleteTask } = useApp();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const boardTasks = tasks.filter(task => task.board === currentBoard);

  const getTasksByStatus = (status: TaskStatus) => {
    return boardTasks.filter(task => task.status === status);
  };

  const handleCreateTask = (status: TaskStatus) => {
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (selectedTask) {
      const updatedTask = { ...selectedTask, ...taskData } as Task;
      await updateTask(updatedTask);
    } else {
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: taskData.title || '',
        description: taskData.description || '',
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        board: taskData.board || currentBoard,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        activities: []
      } as Task;
      await addTask(newTask);
    }
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 capitalize">
          {currentBoard === 'voorwinkel' ? 'Voorwinkel' : 'Achterwinkel'}
        </h2>
        <p className="text-gray-600 mt-1">
          Beheer taken voor de {currentBoard === 'voorwinkel' ? 'voorwinkel' : 'achterwinkel'} afdeling
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {COLUMNS.map((column) => (
          <TaskColumn
            key={column.status}
            status={column.status}
            title={column.title}
            tasks={getTasksByStatus(column.status)}
            onCreateTask={handleCreateTask}
            onEditTask={handleEditTask}
          />
        ))}
      </div>

      <TaskModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
        onSave={handleSaveTask}
        onDelete={async (id: string) => {
          await deleteTask(id);
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
      />
    </div>
  );
}