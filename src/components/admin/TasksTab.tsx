import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { TASKS_API, STATUS_CONFIG, Task, Category, TaskStatus } from './tasks/tasksTypes';
import TaskStatusCounters from './tasks/TaskStatusCounters';
import TaskForm from './tasks/TaskForm';
import TaskFilters from './tasks/TaskFilters';
import TaskCard from './tasks/TaskCard';

export default function TasksTab() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [filterResponsible, setFilterResponsible] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [tasksRes, catsRes] = await Promise.all([
        fetch(TASKS_API),
        fetch(`${TASKS_API}?action=categories`)
      ]);
      setTasks((await tasksRes.json()).tasks || []);
      setCategories((await catsRes.json()).categories || []);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    const data = await (await fetch(TASKS_API)).json();
    setTasks(data.tasks || []);
  };

  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    setUpdatingId(taskId);
    try {
      await fetch(TASKS_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status: newStatus })
      });
      setTasks(prev =>
        prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
          .sort((a, b) => STATUS_CONFIG[a.status].order - STATUS_CONFIG[b.status].order)
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filterResponsible && t.responsible !== filterResponsible) return false;
    if (filterCategory && String(t.category_id) !== filterCategory) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    return true;
  });

  const counts = {
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">

      {/* ── Шапка ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Icon name="ClipboardList" size={20} className="text-cyan-400" />
            Задачи
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {filteredTasks.length !== tasks.length
              ? `${filteredTasks.length} из ${tasks.length}`
              : `${tasks.length} задач`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
            showForm
              ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105'
          }`}
        >
          <Icon name={showForm ? 'X' : 'Plus'} size={16} className={`transition-transform duration-300 ${showForm ? 'rotate-90' : ''}`} />
          {showForm ? 'Отмена' : 'Новая задача'}
        </button>
      </div>

      {/* ── Счётчики статусов ── */}
      <TaskStatusCounters
        counts={counts}
        filterStatus={filterStatus}
        onToggle={s => setFilterStatus(filterStatus === s ? '' : s)}
      />

      {/* ── Форма добавления ── */}
      <TaskForm
        visible={showForm}
        categories={categories}
        onCategoryAdded={cat => setCategories(prev => [...prev, cat])}
        onTaskCreated={loadTasks}
        onClose={() => setShowForm(false)}
      />

      {/* ── Фильтры ── */}
      <TaskFilters
        categories={categories}
        filterResponsible={filterResponsible}
        filterCategory={filterCategory}
        filterStatus={filterStatus}
        onResponsibleChange={setFilterResponsible}
        onCategoryChange={setFilterCategory}
        onStatusChange={setFilterStatus}
        onReset={() => { setFilterResponsible(''); setFilterCategory(''); setFilterStatus(''); }}
      />

      {/* ── Список задач ── */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Icon name="Loader2" size={28} className="animate-spin text-cyan-400" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Icon name="ClipboardList" size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Задач не найдено</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task, idx) => (
            <TaskCard
              key={task.id}
              task={task}
              index={idx}
              isUpdating={updatingId === task.id}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}