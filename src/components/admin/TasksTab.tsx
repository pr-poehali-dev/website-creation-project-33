import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

const TASKS_API = 'https://functions.poehali.dev/65786d7c-38f3-4811-aad3-17cefbab2d6d';

const RESPONSIBLES = ['Корельский Максим', 'Виктор Кобыляцкий'];

const STATUS_CONFIG = {
  pending: {
    label: 'Не выполнена',
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
    dot: 'bg-red-500',
    activeBg: 'bg-red-500 text-white',
    bar: 'bg-red-400',
    order: 0,
  },
  in_progress: {
    label: 'В процессе',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-200',
    dot: 'bg-amber-400',
    activeBg: 'bg-amber-400 text-white',
    bar: 'bg-amber-400',
    order: 1,
  },
  done: {
    label: 'Выполнена',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    activeBg: 'bg-emerald-500 text-white',
    bar: 'bg-emerald-400',
    order: 2,
  },
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

const AVATAR_COLORS: Record<string, string> = {
  'Корельский Максим': 'bg-violet-100 text-violet-700',
  'Виктор Кобыляцкий': 'bg-blue-100 text-blue-700',
};

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('');
}

export default function TasksTab() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [formText, setFormText] = useState('');
  const [formResponsible, setFormResponsible] = useState('');
  const [formCategoryId, setFormCategoryId] = useState<number | ''>('');
  const [newCatInput, setNewCatInput] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const [addingCat, setAddingCat] = useState(false);

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
      setFormText(''); setFormResponsible(''); setFormCategoryId('');
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

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return iso; }
  };

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
      <div className="grid grid-cols-3 gap-3">
        {(['pending', 'in_progress', 'done'] as const).map(s => {
          const cfg = STATUS_CONFIG[s];
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
              className={`rounded-2xl p-4 text-left border transition-all duration-200 hover:shadow-md ${
                filterStatus === s
                  ? `${cfg.bg} ${cfg.border} border shadow-sm`
                  : 'bg-white border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${cfg.bg}`}>
                <span className={`text-lg font-bold ${cfg.text}`}>{counts[s]}</span>
              </div>
              <p className={`text-xs font-semibold ${filterStatus === s ? cfg.text : 'text-gray-500'}`}>
                {cfg.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* ── Форма добавления ── */}
      <div
        className="overflow-hidden transition-all duration-400 ease-in-out"
        style={{ maxHeight: showForm ? '600px' : '0', opacity: showForm ? 1 : 0 }}
      >
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
          <p className="text-sm font-semibold text-gray-800">Новая задача</p>

          {/* Ответственный */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Ответственный *</label>
              <select
                value={formResponsible}
                onChange={e => setFormResponsible(e.target.value)}
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition-all"
              >
                <option value="">— выберите —</option>
                {RESPONSIBLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* Классификация */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Классификация</label>
              <div className="flex gap-2">
                <select
                  value={formCategoryId}
                  onChange={e => setFormCategoryId(e.target.value ? Number(e.target.value) : '')}
                  className="flex-1 h-10 px-3 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition-all"
                >
                  <option value="">— не указана —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button
                  onClick={() => setShowNewCat(v => !v)}
                  className="h-10 px-3 bg-gray-50 border border-gray-200 text-gray-400 hover:text-gray-700 rounded-xl transition-all hover:bg-gray-100"
                  title="Новая классификация"
                >
                  <Icon name="Plus" size={15} />
                </button>
              </div>
              <div className={`overflow-hidden transition-all duration-300 ${showNewCat ? 'max-h-14 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                <div className="flex gap-2">
                  <input
                    value={newCatInput}
                    onChange={e => setNewCatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                    placeholder="Название..."
                    className="flex-1 h-9 px-3 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 placeholder:text-gray-400 transition-all"
                  />
                  <button
                    onClick={handleAddCategory}
                    disabled={addingCat || !newCatInput.trim()}
                    className="h-9 px-3 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 disabled:opacity-40 transition-all"
                  >
                    {addingCat ? <Icon name="Loader2" size={13} className="animate-spin" /> : 'OK'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Текст задачи */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Текст задачи *</label>
            <textarea
              value={formText}
              onChange={e => setFormText(e.target.value)}
              placeholder="Опишите задачу..."
              rows={3}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition-all resize-none placeholder:text-gray-400"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving || !formText.trim() || !formResponsible}
            className="w-full h-11 bg-gray-900 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {saving
              ? <><Icon name="Loader2" size={15} className="animate-spin" /> Сохранение...</>
              : <><Icon name="Plus" size={15} /> Добавить задачу</>
            }
          </button>
        </div>
      </div>

      {/* ── Фильтры ── */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-medium text-gray-400 flex items-center gap-1.5 mr-1">
          <Icon name="SlidersHorizontal" size={13} />
          Фильтр:
        </span>

        {/* Ответственный */}
        <div className="flex gap-1 flex-wrap">
          {['', ...RESPONSIBLES].map(r => (
            <button
              key={r}
              onClick={() => setFilterResponsible(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                filterResponsible === r
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {r || 'Все'}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-gray-200 mx-1 hidden md:block" />

        {/* Классификация */}
        <div className="flex gap-1 flex-wrap">
          {['', ...categories.map(c => c.name)].map((name, i) => {
            const catId = i === 0 ? '' : String(categories[i - 1]?.id);
            return (
              <button
                key={name}
                onClick={() => setFilterCategory(catId)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                  filterCategory === catId
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {name || 'Все категории'}
              </button>
            );
          })}
        </div>

        {(filterResponsible || filterCategory || filterStatus) && (
          <button
            onClick={() => { setFilterResponsible(''); setFilterCategory(''); setFilterStatus(''); }}
            className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            <Icon name="X" size={12} /> Сбросить
          </button>
        )}
      </div>

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
          {filteredTasks.map((task, idx) => {
            const cfg = STATUS_CONFIG[task.status];
            const isUpdating = updatingId === task.id;
            const avatarCls = AVATAR_COLORS[task.responsible] || 'bg-gray-100 text-gray-600';

            return (
              <div
                key={task.id}
                className="group bg-white border border-gray-100 rounded-2xl p-4 hover:border-gray-200 hover:shadow-md transition-all duration-200"
                style={{
                  animationName: 'fadeSlideIn',
                  animationDuration: '300ms',
                  animationDelay: `${idx * 30}ms`,
                  animationFillMode: 'both',
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Цветная полоска */}
                  <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${cfg.bar} opacity-70`} />

                  <div className="flex-1 min-w-0">
                    {/* Строка 1: статус + категория */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                      {task.category_name && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gray-50 text-gray-500 border border-gray-100">
                          <Icon name="Hash" size={10} />
                          {task.category_name}
                        </span>
                      )}
                    </div>

                    {/* Текст */}
                    <p className={`text-sm leading-relaxed font-medium mb-3 ${task.status === 'done' ? 'line-through text-gray-300' : 'text-gray-800'}`}>
                      {task.text}
                    </p>

                    {/* Строка 3: дата + ответственный + кнопки */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-3">
                        {/* Аватар ответственного */}
                        <div className="flex items-center gap-1.5">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${avatarCls}`}>
                            {getInitials(task.responsible)}
                          </div>
                          <span className="text-xs text-gray-400">{task.responsible}</span>
                        </div>
                        <span className="text-[11px] text-gray-300 flex items-center gap-1">
                          <Icon name="Clock" size={10} />
                          {formatDate(task.created_at)}
                        </span>
                      </div>

                      {/* Кнопки смены статуса */}
                      <div className="flex items-center gap-1">
                        {isUpdating ? (
                          <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
                        ) : (
                          (['pending', 'in_progress', 'done'] as const).map(s => (
                            <button
                              key={s}
                              onClick={() => handleStatusChange(task.id, s)}
                              disabled={task.status === s}
                              title={STATUS_CONFIG[s].label}
                              className={`h-7 px-2.5 rounded-lg text-[10px] font-semibold transition-all duration-150 ${
                                task.status === s
                                  ? STATUS_CONFIG[s].activeBg + ' cursor-default shadow-sm'
                                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
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

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
