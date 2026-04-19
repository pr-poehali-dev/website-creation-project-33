import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { TASKS_API, STATUS_CONFIG, Task, Category, TaskAction, TaskStatus } from './tasks/tasksTypes';
import TaskForm from './tasks/TaskForm';
import TaskFilters from './tasks/TaskFilters';
import TaskCard from './tasks/TaskCard';

export default function TasksTab() {
  const [tasks, setTasks]           = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // раскрытые задачи и их действия
  const [expandedId, setExpandedId]               = useState<number | null>(null);
  const [actions, setActions]                     = useState<Record<number, TaskAction[]>>({});
  const [actionsLoading, setActionsLoading]       = useState<number | null>(null);
  const [showActionForm, setShowActionForm]       = useState<number | null>(null);
  const [actionText, setActionText]               = useState('');
  const [savingAction, setSavingAction]           = useState(false);
  const [togglingAction, setTogglingAction]       = useState<number | null>(null);

  // фильтры
  const [fResp2, setFResp2]   = useState('');
  const [fCat2, setFCat2]     = useState('');
  const [fStatus, setFStatus] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [t, c] = await Promise.all([fetch(TASKS_API), fetch(`${TASKS_API}?action=categories`)]);
      setTasks((await t.json()).tasks || []);
      setCategories((await c.json()).categories || []);
    } finally { setLoading(false); }
  };

  const reloadTasks = async () => {
    const d = await (await fetch(TASKS_API)).json();
    setTasks(d.tasks || []);
  };

  const deleteTask = async (id: number) => {
    setDeletingId(id);
    try {
      await fetch(`${TASKS_API}?id=${id}`, { method: 'DELETE' });
      setTasks(p => p.filter(t => t.id !== id));
    } finally { setDeletingId(null); }
  };

  const toggleExpand = async (taskId: number) => {
    if (expandedId === taskId) { setExpandedId(null); return; }
    setExpandedId(taskId);
    if (actions[taskId]) return;
    setActionsLoading(taskId);
    try {
      const d = await (await fetch(`${TASKS_API}?action=actions&task_id=${taskId}`)).json();
      setActions(p => ({ ...p, [taskId]: d.actions || [] }));
    } finally { setActionsLoading(null); }
  };

  const addAction = async (taskId: number) => {
    if (!actionText.trim()) return;
    setSavingAction(true);
    try {
      const d = await (await fetch(TASKS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_action', task_id: taskId, comment: actionText.trim() })
      })).json();
      setActions(p => ({ ...p, [taskId]: [...(p[taskId] || []), { id: d.id, comment: actionText.trim(), is_done: false, done_at: null, created_at: d.created_at }] }));
      setActionText('');
      setShowActionForm(null);
    } finally { setSavingAction(false); }
  };

  const toggleActionDone = async (taskId: number, actionId: number, isDone: boolean) => {
    setTogglingAction(actionId);
    try {
      await fetch(TASKS_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action_id: actionId, is_done: isDone })
      });
      const now = new Date().toISOString();
      setActions(p => ({ ...p, [taskId]: (p[taskId] || []).map(a => a.id === actionId ? { ...a, is_done: isDone, done_at: isDone ? now : null } : a) }));
    } finally { setTogglingAction(null); }
  };

  const changeStatus = async (id: number, s: TaskStatus) => {
    setUpdatingId(id);
    try {
      await fetch(TASKS_API, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: s }) });
      setTasks(p => p.map(t => t.id === id ? { ...t, status: s } : t).sort((a, b) => STATUS_CONFIG[a.status].order - STATUS_CONFIG[b.status].order));
    } finally { setUpdatingId(null); }
  };

  const filtered = tasks.filter(t => {
    if (fResp2 && t.responsible !== fResp2) return false;
    if (fCat2 && String(t.category_id) !== fCat2) return false;
    if (fStatus && t.status !== fStatus) return false;
    return true;
  });

  const counts = {
    pending:     tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done:        tasks.filter(t => t.status === 'done').length,
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 rounded-2xl shadow-2xl">
        <CardContent className="p-8 flex items-center justify-center gap-3 text-slate-300">
          <Icon name="Loader2" size={24} className="animate-spin text-cyan-400" />
          Загрузка задач...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 rounded-2xl shadow-2xl">
      <CardContent className="p-6 space-y-6">

        {/* ── Шапка ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center">
              <Icon name="ClipboardList" size={18} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Задачи</h2>
              <p className="text-xs text-slate-500">
                {filtered.length !== tasks.length ? `${filtered.length} из ${tasks.length}` : `${tasks.length} задач`}
              </p>
            </div>

            {/* счётчики статусов */}
            <div className="hidden md:flex items-center gap-2 ml-4">
              {(['pending', 'in_progress', 'done'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFStatus(fStatus === s ? '' : s)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ring-1 transition-all ${
                    fStatus === s ? STATUS_CONFIG[s].badge + ' ring-1 scale-105' : 'bg-slate-800/50 text-slate-500 ring-slate-700/50 hover:text-slate-300'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[s].dot}`} />
                  {counts[s]}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowForm(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              showForm
                ? 'bg-slate-700/60 text-slate-300 hover:bg-slate-700 ring-1 ring-slate-600/50'
                : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105'
            }`}
          >
            <Icon name={showForm ? 'X' : 'Plus'} size={15} className={`transition-transform duration-200 ${showForm ? 'rotate-90' : ''}`} />
            {showForm ? 'Отмена' : 'Новая задача'}
          </button>
        </div>

        {/* ── Форма добавления ── */}
        <TaskForm
          visible={showForm}
          categories={categories}
          onCategoryAdded={cat => setCategories(p => [...p, cat])}
          onTaskCreated={reloadTasks}
          onClose={() => setShowForm(false)}
        />

        {/* ── Фильтры ── */}
        <TaskFilters
          categories={categories}
          fResp2={fResp2}
          fCat2={fCat2}
          fStatus={fStatus}
          onFResp2Change={setFResp2}
          onFCat2Change={setFCat2}
          onFStatusChange={setFStatus}
          onReset={() => { setFResp2(''); setFCat2(''); setFStatus(''); }}
        />

        {/* ── Список задач ── */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="ClipboardList" size={32} className="mx-auto mb-3 text-slate-700" />
            <p className="text-sm text-slate-600">Задач не найдено</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((task, idx) => (
              <TaskCard
                key={task.id}
                task={task}
                index={idx}
                isUpdating={updatingId === task.id}
                isDel={deletingId === task.id}
                isExpanded={expandedId === task.id}
                taskActions={actions[task.id] || []}
                isLoadingActions={actionsLoading === task.id}
                showActionForm={showActionForm === task.id}
                actionText={actionText}
                savingAction={savingAction}
                togglingActionId={togglingAction}
                onToggleExpand={() => toggleExpand(task.id)}
                onChangeStatus={s => changeStatus(task.id, s)}
                onDelete={() => deleteTask(task.id)}
                onOpenActionForm={() => {
                  setShowActionForm(showActionForm === task.id ? null : task.id);
                  setActionText('');
                  if (expandedId !== task.id) toggleExpand(task.id);
                }}
                onActionTextChange={setActionText}
                onAddAction={() => addAction(task.id)}
                onCloseActionForm={() => setShowActionForm(null)}
                onToggleActionDone={(actionId, isDone) => toggleActionDone(task.id, actionId, isDone)}
              />
            ))}
          </div>
        )}
      </CardContent>

      <style>{`@keyframes fsi { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </Card>
  );
}
