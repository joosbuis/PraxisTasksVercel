import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Flag, Building2, Clock, MessageSquare } from 'lucide-react';
import { Task, TaskPriority, TaskActivity } from '../types';
import { useApp } from '../contexts/AppContext';

// Placeholder-teksten (hint, verdwijnt bij typen)
const PLACEHOLDER_TITLE = "Titel (bijv. Stelling A bijvullen)";
const PLACEHOLDER_DESCRIPTION = "Korte omschrijving (materiaal, locatie, bijzonderheden)...";

// Fallbacks (extra veilig)
const FALLBACK_TITLE = "Nieuwe taak";
const FALLBACK_DESCRIPTION = "Omschrijving ontbreekt.";

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  onDelete?: (taskId: string) => void;
}

export default function TaskModal({ task, isOpen, onClose, onSave, onDelete }: TaskModalProps) {
  const nowISO = () => new Date().toISOString();
  const uuid = () => crypto.randomUUID();
  const addActivity = (t: Task, type: TaskActivity['type'], userId: string, userName?: string, description: string = ''): Task => ({
    ...t,
    activities: [ ...(Array.isArray((t as any).activities) ? (t as any).activities : []), { id: uuid(), type, description, timestamp: nowISO(), userId, userName: userName ?? '' } ]
  });
  const computeDiff = (prev: any, next: any) => {
    const fields = ['title','description','priority','assignedTo','assignedToName','deadline','board','status'];
    const diff: Record<string,{from:any,to:any}> = {};
    for (const f of fields) {
      const a = (prev ?? {})[f];
      const b = (next ?? {})[f];
      if (JSON.stringify(a) !== JSON.stringify(b)) diff[f] = { from: a, to: b };
    }
    return diff;
  };
  const { users, currentUser, currentBoard, t } = useApp();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    assignedTo: '',
    deadline: '',
    board: (currentBoard as any) || 'voorwinkel',
  });

  // 🔎 Zoeken op NAAM voor de toewijslijst
  const [assigneeSearch, setAssigneeSearch] = useState('');

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title ?? '',
        description: (task as any).description ?? '',
        priority: (task as any).priority ?? ('medium' as TaskPriority),
        assignedTo: (task as any).assignedTo || '',
        deadline: (task as any).deadline ? String((task as any).deadline).split('T')[0] : '',
        board: (task as any).board ?? ((currentBoard as any) || 'voorwinkel'),
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        assignedTo: '',
        deadline: '',
        board: (currentBoard as any) || 'voorwinkel',
      });
    }
    // reset lokale zoekterm per open/close of wissel
    setAssigneeSearch('');
  }, [task, currentBoard, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const allUsers = Array.isArray(users) ? users : [];
    const assignedUser = allUsers.find(
      (u: any) => String(u.id) === String(formData.assignedTo)
    );

    const safeTitle = (formData.title ?? '').trim() || FALLBACK_TITLE;
    const safeDescription = (formData.description ?? '').trim() || FALLBACK_DESCRIPTION;

    onSave({
      ...formData,
      title: safeTitle,
      description: safeDescription,
      assignedToName: assignedUser?.name,
      deadline: formData.deadline || undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    if (task && onDelete && window.confirm(`Weet je zeker dat je de taak '${task.title}' wilt verwijderen?`)) {
      onDelete((task as any).id);
      onClose();
    }
  };

  if (!isOpen) return null;

  // 📋 Alle accounts (NIET meer gefilterd op board), ENKEL filter op NAAM
  const allUsers = Array.isArray(users) ? users : [];
  const filteredUsers = allUsers.filter((u: any) => {
    const name = (u?.name ?? '').toString().toLowerCase();
    const q = assigneeSearch.trim().toLowerCase();
    return name.includes(q);
  });

  // activiteiten veilig lezen
  const activities = Array.isArray((task as any)?.activities) ? (task as any).activities : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {task ? t.edit + ' ' + t.tasks : (t.newTask ?? 'Nieuwe taak aanmaken')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Titel */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              {t.title ?? "Titel"} *
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field placeholder-gray-400"
              placeholder={PLACEHOLDER_TITLE}
              required
            />
          </div>

          {/* Beschrijving */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              {t.description ?? "Beschrijving"}
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field min-h-[100px] resize-y placeholder-gray-400"
              placeholder={PLACEHOLDER_DESCRIPTION}
              rows={4}
            />
          </div>

          {/* Prioriteit + Afdeling */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                <Flag className="w-4 h-4 inline mr-1" />
                {t.priority ?? "Prioriteit"}
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                className="input-field"
              >
                <option value="low">{t.low ?? "Laag"}</option>
                <option value="medium">{t.medium ?? "Normaal"}</option>
                <option value="high">{t.high ?? "Hoog"}</option>
              </select>
            </div>

            <div>
              <label htmlFor="board" className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="w-4 h-4 inline mr-1" />
                {t.departments ?? "Afdeling"}
              </label>
              <select
                id="board"
                value={formData.board}
                onChange={(e) => setFormData({ ...formData, board: e.target.value as any })}
                className="input-field"
              >
                <option value="voorwinkel">{t.voorwinkel ?? "Voorwinkel"}</option>
                <option value="achterwinkel">{t.achterwinkel ?? "Achterwinkel"}</option>
              </select>
            </div>
          </div>

          {/* Toegewezen aan + Deadline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 🔎 Zoeken + lijst met ALLE gebruikers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                {t.assignedTo ?? "Toegewezen aan"}
              </label>

              {/* Zoekveld op NAAM */}
              <input
                type="text"
                value={assigneeSearch}
                onChange={(e) => setAssigneeSearch(e.target.value)}
                className="input-field mb-2 placeholder-gray-400"
                placeholder="Zoek op naam..."
              />

              {/* Lijst met resultaten op basis van naam-filter */}
              <select
                id="assignedTo"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="input-field"
              >
                <option value="">— Niet toegewezen —</option>
                {filteredUsers.length === 0 ? (
                  <option disabled value="">
                    Geen gebruiker gevonden
                  </option>
                ) : (
                  filteredUsers.map((user: any) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                      {/* rol tonen mag blijven, maar niet filteren erop */}
                      {user.role === 'manager' ? ' (Manager)' : ''}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                {t.deadline ?? "Deadline"}
              </label>
              <input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="input-field"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* ✅ Logboek (één blok, netjes gestyled) */}
          {Array.isArray((task as any)?.activities) && (task as any).activities.length > 0 && (
            <div className="mt-2 bg-gray-50 border rounded-lg p-4">
              <h4 className="text-sm font-semibold mb-3">Logboek</h4>
              {(() => {
                const raw = (task as any).activities as any[];
                const seen = new Set<string>();
                const acts = raw
                  .filter((a) => {
                    const key = String(a?.id || `${a?.timestamp}|${a?.type}|${a?.userId}|${a?.description}`);
                    if (seen.has(key)) return false; seen.add(key); return true;
                  })
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                const chip = (tt: string) => {
                  const base = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium";
                  if (tt === "created")   return <span className={`${base} bg-blue-100 text-blue-800 ring-1 ring-blue-200`}>Aangemaakt</span>;
                  if (tt === "assigned")  return <span className={`${base} bg-purple-100 text-purple-800 ring-1 ring-purple-200`}>Toegewezen</span>;
                  if (tt === "moved")     return <span className={`${base} bg-orange-100 text-orange-800 ring-1 ring-orange-200`}>Verplaatst</span>;
                  if (tt === "completed") return <span className={`${base} bg-green-100 text-green-800 ring-1 ring-green-200`}>Afgerond</span>;
                  return <span className={`${base} bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200`}>Bijgewerkt</span>;
                };
                return (
                  <ul className="space-y-2 max-h-56 overflow-auto text-sm text-gray-700">
                    {acts.map((a, i) => (
                      <li key={a.id ?? i} className="flex flex-col md:flex-row md:items-center md:gap-3">
                        <div className="text-gray-500 min-w-40">{new Date(a.timestamp).toLocaleString()}</div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {chip(String(a.type))}
                          <span className="font-medium">{a.userName || "onbekend"}</span>
                          {a.description && <span className="text-gray-600 break-all">— {a.description}</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div>
              {task && onDelete && currentUser?.role === 'manager' && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  {t.delete ?? "Verwijderen"} {t.tasks ?? "Taken"}
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                {t.cancel ?? "Annuleren"}
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                {task ? (t.save ?? "Opslaan") : (t.create ?? "Aanmaken")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
