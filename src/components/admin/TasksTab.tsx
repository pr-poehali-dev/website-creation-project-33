import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

const TASKS_API = 'https://functions.poehali.dev/65786d7c-38f3-4811-aad3-17cefbab2d6d';

const RESPONSIBLES = ['Корельский Максим', 'Виктор Кобыляцкий'];

const STATUS_CONFIG = {
  pending: { label: 'Не выполнена', color: 'bg-red-500/15 text-red-400 ring-red-500/30', dot: 'bg-red-400', order: 0 },
  in_progress: { label: 'В процессе', color: 'bg-yellow-500/15 text-yellow-400 ring-yellow-500/30', dot: 'bg-yellow-400', order: 1 },
  done: { label: 'Выполнена', color: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30', dot: 'bg-emerald-400', order: 2 },
};

interface Task {
  id: number;
  text: string;
  responsible: string;
  category_id: number | null;
  category_name: string | null;
  status: 'pending' | 'in_progress' | 'done';
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number;
  name: string;
}

export default function TasksTab() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Форма новой задачи
  const [formText, setFormText] = useState('');
  const [formResponsible, setFormResponsible] = useState('');
  const [formCategoryId, setFormCategoryId] = useState<number | ''>('');
  const [newCatInput, setNewCatInput] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const [addingCat, setAddingCat] = useState(false);

  // Фильтры
  const [filterResponsible, setFilterResponsible] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [tasksRes, catsRes] = await Promise.all([
        fetch(TASKS_API),
        fetch(`${TASKS_API}?action=categories`)
      ]);
      const tasksData = await tasksRes.json();
      const catsData = await catsRes.json();
      setTasks(tasksData.tasks || []);
      setCategories(catsData.categories || []);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    const res = await fetch(TASKS_API);
    const data = await res.json();
    setTasks(data.tasks || []);
  };

  const handleAddCategory = async () => {
    const name = newCatInput.trim();
    if (!name) return;
    setAddingCat(true);
    try {
      const res = await fetch(TASKS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_category', name })
      });
      const data = await res.json();
      if (data.category) {
        setCategories(prev => [...prev, data.category]);
        setFormCategoryId(data.category.id);
        setNewCatInput('');
        setShowNewCat(false);
      }
    } finally {
      setAddingCat(false);
    }
  };

  const handleSubmit = async () => {
    if (!formText.trim() || !formResponsible) return;
    setSaving(true);
    try {
      await fetch(TASKS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_task',
          text: formText.trim(),
          responsible: formResponsible,
          category_id: formCategoryId || null
        })
      });
      setFormText('');
      setFormResponsible('');
      setFormCategoryId('');
      setShowForm(false);
      await loadTasks();
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: 'pending' | 'in_progress' | 'done') => {
    setUpdatingId(taskId);
    try {
      await fetch(TASKS_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status: newStatus })
      });
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: newStatus } : t
      ).sort((a, b) => STATUS_CONFIG[a.status].order - STATUS_CONFIG[b.status].order));
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

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return iso; }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Icon name="ClipboardList" size={20} className="text-cyan-400" />
            Задачи
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{filteredTasks.length} из {tasks.length} задач</p>
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

      {/* Форма добавления */}
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showForm ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="bg-slate-900/80 ring-1 ring-slate-700/60 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Icon name="PlusCircle" size={15} className="text-cyan-400" />
            Новая задача
          </h3>

          {/* Ответственный */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Ответственный *</label>
            <select
              value={formResponsible}
              onChange={e => setFormResponsible(e.target.value)}
              className="w-full h-10 px-3 bg-slate-800/60 ring-1 ring-slate-700/50 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-cyan-500/50 focus:ring-2 transition-all"
            >
              <option value="">— выберите —</option>
              {RESPONSIBLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Текст задачи */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Текст задачи *</label>
            <textarea
              value={formText}
              onChange={e => setFormText(e.target.value)}
              placeholder="Описание задачи..."
              rows={3}
              className="w-full px-3 py-2.5 bg-slate-800/60 ring-1 ring-slate-700/50 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all resize-none placeholder:text-slate-600"
            />
          </div>

          {/* Классификация */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Классификация</label>
            <div className="flex gap-2">
              <select
                value={formCategoryId}
                onChange={e => setFormCategoryId(e.target.value ? Number(e.target.value) : '')}
                className="flex-1 h-10 px-3 bg-slate-800/60 ring-1 ring-slate-700/50 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-cyan-500/50 focus:ring-2 transition-all"
              >
                <option value="">— не указана —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button
                onClick={() => setShowNewCat(v => !v)}
                className="h-10 px-3 bg-slate-800/60 ring-1 ring-slate-700/50 text-slate-400 hover:text-cyan-400 rounded-xl text-sm transition-all hover:ring-cyan-500/30"
                title="Создать классификацию"
              >
                <Icon name="Plus" size={15} />
              </button>
            </div>

            {/* Новая классификация */}
            <div className={`overflow-hidden transition-all duration-300 ${showNewCat ? 'max-h-20 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
              <div className="flex gap-2">
                <input
                  value={newCatInput}
                  onChange={e => setNewCatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                  placeholder="Название классификации..."
                  className="flex-1 h-9 px-3 bg-slate-800/60 ring-1 ring-slate-700/50 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
                />
                <button
                  onClick={handleAddCategory}
                  disabled={addingCat || !newCatInput.trim()}
                  className="h-9 px-3 bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/30 rounded-xl text-xs font-semibold hover:bg-cyan-500/30 transition-all disabled:opacity-50"
                >
                  {addingCat ? <Icon name="Loader2" size={13} className="animate-spin" /> : 'Добавить'}
                </button>
              </div>
            </div>
          </div>

          {/* Кнопка сохранить */}
          <button
            onClick={handleSubmit}
            disabled={saving || !formText.trim() || !formResponsible}
            className="w-full h-10 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
          >
            {saving
              ? <><Icon name="Loader2" size={15} className="animate-spin" /> Сохранение...</>
              : <><Icon name="Check" size={15} /> Добавить задачу</>
            }
          </button>
        </div>
      </div>

      {/* Фильтры */}
      <div className="bg-slate-900/60 ring-1 ring-slate-700/40 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="Filter" size={14} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Фильтры</span>
          {(filterResponsible || filterCategory || filterStatus) && (
            <button
              onClick={() => { setFilterResponsible(''); setFilterCategory(''); setFilterStatus(''); }}
              className="ml-auto text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <Icon name="X" size={12} /> Сбросить
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <select
            value={filterResponsible}
            onChange={e => setFilterResponsible(e.target.value)}
            className="h-9 px-3 bg-slate-800/60 ring-1 ring-slate-700/50 text-slate-300 rounded-xl text-xs focus:outline-none focus:ring-cyan-500/50 focus:ring-2 transition-all"
          >
            <option value="">Все ответственные</option>
            {RESPONSIBLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="h-9 px-3 bg-slate-800/60 ring-1 ring-slate-700/50 text-slate-300 rounded-xl text-xs focus:outline-none focus:ring-cyan-500/50 focus:ring-2 transition-all"
          >
            <option value="">Все классификации</option>
            {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="h-9 px-3 bg-slate-800/60 ring-1 ring-slate-700/50 text-slate-300 rounded-xl text-xs focus:outline-none focus:ring-cyan-500/50 focus:ring-2 transition-all"
          >
            <option value="">Все статусы</option>
            <option value="pending">Не выполнена</option>
            <option value="in_progress">В процессе</option>
            <option value="done">Выполнена</option>
          </select>
        </div>
      </div>

      {/* Список задач */}
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
          {filteredTasks.map((task, idx) => {
            const cfg = STATUS_CONFIG[task.status];
            const isUpdating = updatingId === task.id;
            return (
              <div
                key={task.id}
                className="bg-slate-900/70 ring-1 ring-slate-700/40 rounded-2xl p-4 hover:ring-slate-600/60 transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/50 animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="flex items-start gap-3">
                  {/* Цветная полоска статуса */}
                  <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${cfg.dot}`} />

                  <div className="flex-1 min-w-0">
                    {/* Шапка */}
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                      {/* Статус badge */}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ring-1 ${cfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>

                      {/* Классификация */}
                      {task.category_name && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
                          <Icon name="Tag" size={10} />
                          {task.category_name}
                        </span>
                      )}

                      {/* Ответственный */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-800/60 text-slate-400 ring-1 ring-slate-700/50 ml-auto">
                        <Icon name="User" size={10} />
                        {task.responsible}
                      </span>
                    </div>

                    {/* Текст задачи */}
                    <p className={`text-sm leading-relaxed mb-3 ${task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {task.text}
                    </p>

                    {/* Дата и кнопки статуса */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[10px] text-slate-600 flex items-center gap-1">
                        <Icon name="Clock" size={10} />
                        {formatDate(task.created_at)}
                      </span>

                      {/* Смена статуса */}
                      <div className="flex items-center gap-1">
                        {isUpdating ? (
                          <Icon name="Loader2" size={14} className="animate-spin text-slate-400" />
                        ) : (
                          (['pending', 'in_progress', 'done'] as const).map(s => (
                            <button
                              key={s}
                              onClick={() => handleStatusChange(task.id, s)}
                              disabled={task.status === s}
                              className={`h-7 px-2.5 rounded-lg text-[10px] font-semibold transition-all duration-200 ${
                                task.status === s
                                  ? `ring-1 ${STATUS_CONFIG[s].color} opacity-100 cursor-default`
                                  : 'bg-slate-800/50 text-slate-500 hover:bg-slate-700/50 ring-1 ring-slate-700/30 hover:text-slate-300'
                              }`}
                            >
                              {STATUS_CONFIG[s].label}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
