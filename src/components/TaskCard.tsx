import React from 'react';
import { Calendar, User, AlertCircle, Clock, CheckCircle2, Play, Pause, UserCheck, X } from 'lucide-react';
import { Task, TaskActivity } from '../types';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  showActions?: boolean;
  onComplete?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

export default function TaskCard({ task, onEdit, showActions = false, onComplete, onDelete }: TaskCardProps) {
  const { updateTask, currentUser, t } = useApp();

  const nowISO = () => new Date().toISOString();
  const uuid = () => crypto.randomUUID();
  const addActivity = (task: Task, type: TaskActivity['type'], userId: string, userName?: string, description: string = ''): Task => ({
    ...task,
    activities: [
      ...(Array.isArray((task as any).activities) ? (task as any).activities : []),
      { id: uuid(), type, description, timestamp: nowISO(), userId, userName: userName ?? '' }
    ]
  });
  const actorId = currentUser?.id ?? '';
  const actorName = (currentUser as any)?.name ?? (currentUser as any)?.username ?? '';

  // veilige prioriteit
  const prio = (task.priority ?? 'medium') as NonNullable<Task['priority']>;

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityLabel = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return t.high ?? 'Hoog';
      case 'medium': return t.medium ?? 'Gemiddeld';
      case 'low': return t.low ?? 'Laag';
      default: return t.medium ?? 'Gemiddeld';
    }
  };

  const isOverdue =
    !!task.deadline &&
    new Date(task.deadline) < new Date() &&
    task.status !== 'completed';

  const activities = Array.isArray((task as any).activities) ? (task as any).activities : [];

  const handleStart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    let next = addActivity({ ...task, status: 'in-progress', updatedAt: nowISO() }, 'updated', actorId, actorName, 'status: in-progress');
    if (task.status === 'needs-pickup') {
      (next as any).pickedUpBy = actorId;
      (next as any).pickedUpByName = actorName;
      (next as any).pickedUpAt = nowISO();
    } else {
      if (!(task as any).startedBy) {
        (next as any).startedBy = actorId;
        (next as any).startedByName = actorName;
        (next as any).startedAt = nowISO();
      }
    }
    await updateTask(next);
  };

  const handlePause = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = addActivity({ ...task, status: 'needs-pickup', updatedAt: nowISO() }, 'updated', actorId, actorName, 'status: needs-pickup');
    await updateTask(next);
  };

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComplete?.(task);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && window.confirm(`Weet je zeker dat je de taak '${task.title}' wilt verwijderen?`)) {
      onDelete(task.id);
    }
  };

  // ------- Helpers to compute display fallbacks from activities -------
  function computeStartedNameFromActivities(acts: any[]): string {
    // earliest 'status: in-progress' update is the real starter
    const firstStart = acts.find(a => a?.type === 'updated' && (a?.description || '').includes('status: in-progress'));
    return (firstStart as any)?.userName || '';
  }
  function computePickedUpNameFromActivities(acts: any[]): string {
    // find a needs-pickup -> in-progress transition, take the picker (in-progress user)
    for (let i = 0; i < acts.length - 1; i++) {
      const a = acts[i];
      const b = acts[i + 1];
      const aNeeds = a?.type === 'updated' && (a?.description || '').includes('status: needs-pickup');
      const bStart  = b?.type === 'updated' && (b?.description  || '').includes('status: in-progress');
      if (aNeeds && bStart) return (b as any)?.userName || '';
    }
    return '';
  }

  return (
    <div
      className="card p-4 cursor-pointer hover:shadow-md transition-all duration-200"
      onClick={() => onEdit(task)}
    >
      {/* Delete button for completed tasks */}
      {task.status === 'completed' && onDelete && (
        <div className="flex justify-end mb-2">
          <button
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
            title="Taak verwijderen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <h3 className="font-medium text-gray-900 line-clamp-2 flex-1">{task.title}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(prio)}`}>
          {getPriorityLabel(prio)}
        </span>
      </div>

      {task.description && (
        <p className="text-sm text-gray-600 mb-1 line-clamp-2">{task.description}</p>
      )}

      <div className="space-y-2">
        {(task as any).assignedToName && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>{(task as any).assignedToName}</span>
          </div>
        )}

        {/* Aangemaakt door (subtle, small, grey) */}
        {(() => {
          const createdByNameStored = (task as any).createdByName || '';
          const createdAct = activities.find((a: any) => a?.type === 'created');
          const createdNameDisplay = createdByNameStored || (createdAct as any)?.userName || '';
          return createdNameDisplay ? (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <User className="w-3 h-3" />
              <span>Aangemaakt door {createdNameDisplay}</span>
            </div>
          ) : null;
        })()}

        {/* status badges (colored chips) */}
        {(() => {
          // 'Gestart door' (immutable display): prefer stored field; fallback to activities for visibility on legacy tasks
          const startedNameStored = (task as any).startedByName || '';
          const startedNameDisplay = startedNameStored || computeStartedNameFromActivities(activities);

          // 'Opgepakt door': prefer stored; fallback for legacy visibility
          const pickedNameStored = (task as any).pickedUpByName || '';
          const pickedNameDisplay = pickedNameStored || computePickedUpNameFromActivities(activities);

          // 'Afgerond door'
          const completedAct  = activities.slice().reverse().find((a: any) => a?.type === 'completed');
          const completedName = (task as any).completedByName || (completedAct as any)?.userName || '';

          return (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
              {/* Gestart door */}
              {startedNameDisplay && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200">
                  <Play className="w-3 h-3" />
                  <span>Gestart door {startedNameDisplay}</span>
                </span>
              )}

              {/* Opgepakt door */}
              {pickedNameDisplay && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 ring-1 ring-blue-200">
                  <UserCheck className="w-3 h-3" />
                  <span>Opgepakt door {pickedNameDisplay}</span>
                </span>
              )}

              {/* Afgerond door */}
              {task.status === 'completed' && completedName && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-800 ring-1 ring-green-200">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Afgerond door {completedName}</span>
                </span>
              )}
            </div>
          );
        })()}

      </div>

      {/* Footer meta */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100 mt-3">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>
            {new Date(task.updatedAt).toLocaleDateString('nl-NL', {
              day: 'numeric',
              month: 'short',
            })}
          </span>
        </div>
        {activities.length > 1 && (
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{activities.length} activiteiten</span>
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2 pt-3 border-t border-gray-100 mt-3">
          {(task.status === 'todo' || task.status === 'needs-pickup') && (
            <button
              onClick={handleStart}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
            >
              <Play className="w-3 h-3" />
              {task.status === 'needs-pickup' ? (t.pickup ?? 'Oppakken') : (t.start ?? 'Starten')}
            </button>
          )}

          {task.status === 'in-progress' && (
            <>
              <button
                onClick={handlePause}
                className="flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 transition-colors"
              >
                <Pause className="w-3 h-3" />
                {t.pause ?? 'Pauzeren'}
              </button>

              {onComplete && (
                <button
                  onClick={handleComplete}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {t.complete ?? 'Afronden'}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
