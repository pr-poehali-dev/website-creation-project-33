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
    <div className="space-y-5">

      {/* ── Шапка ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Задачи</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {filteredTasks.length !== tasks.length
              ? `${filteredTasks.length} из ${tasks.length}`
              : `${tasks.length} задач`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold shadow-sm transition-all duration-200 ${
            showForm
              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              : 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-md'
          }`}
        >
          <Icon
            name={showForm ? 'X' : 'Plus'}
            size={16}
            className={`transition-transform duration-200 ${showForm ? 'rotate-90' : ''}`}
          />
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
        onReset={() => { setFilterResponsible(''); setFilterCategory(''); setFilterStatus(''); }}
      />

      {/* ── Список задач ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Загрузка...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
            <Icon name="ClipboardList" size={24} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-400">Задач не найдено</p>
          <p className="text-xs text-gray-300">Попробуйте изменить фильтры</p>
        </div>
      ) : (
        <div className="space-y-2">
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
