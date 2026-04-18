import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

const TASKS_API = 'https://functions.poehali.dev/65786d7c-38f3-4811-aad3-17cefbab2d6d';
const RESPONSIBLES = ['Корельский Максим', 'Виктор Кобыляцкий'];

const STATUS_CONFIG = {
  pending:     { label: 'Не выполнена', dot: 'bg-red-400',     badge: 'bg-red-400/15 text-red-300 ring-red-400/30',     bar: 'bg-red-400',     btn: 'bg-red-500 text-white',     order: 0 },
  in_progress: { label: 'В процессе',   dot: 'bg-yellow-400',  badge: 'bg-yellow-400/15 text-yellow-300 ring-yellow-400/30', bar: 'bg-yellow-400', btn: 'bg-yellow-500 text-white', order: 1 },
  done:        { label: 'Выполнена',    dot: 'bg-emerald-400', badge: 'bg-emerald-400/15 text-emerald-300 ring-emerald-400/30', bar: 'bg-emerald-400', btn: 'bg-emerald-500 text-white', order: 2 },
} as const;

type TaskStatus = keyof typeof STATUS_CONFIG;

interface Task {
  id: number;
  text: string;
  responsible: string;
  category_id: number | null;
  category_name: string | null;
  status: TaskStatus;
  created_at: string;
}

interface Category { id: number; name: string; }

function fmt(iso: string) {
  try { return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}

export default function TasksTab() {
  const [tasks, setTasks]           = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // форма
  const [fText, setFText]       = useState('');
  const [fResp, setFResp]       = useState('');
  const [fCat, setFCat]         = useState<number | ''>('');
  const [newCat, setNewCat]     = useState('');
  const [showCat, setShowCat]   = useState(false);
  const [addingCat, setAddingCat] = useState(false);

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

  const addCategory = async () => {
    if (!newCat.trim()) return;
    setAddingCat(true);
    try {
      const d = await (await fetch(TASKS_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create_category', name: newCat.trim() }) })).json();
      if (d.category) { setCategories(p => [...p, d.category]); setFCat(d.category.id); setNewCat(''); setShowCat(false); }
    } finally { setAddingCat(false); }
  };

  const submit = async () => {
    if (!fText.trim() || !fResp) return;
    setSaving(true);
    try {
      await fetch(TASKS_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create_task', text: fText.trim(), responsible: fResp, category_id: fCat || null }) });
      setFText(''); setFResp(''); setFCat(''); setShowForm(false);
      await reloadTasks();
    } finally { setSaving(false); }
  };

  const deleteTask = async (id: number) => {
    setDeletingId(id);
    try {
      await fetch(`${TASKS_API}?id=${id}`, { method: 'DELETE' });
      setTasks(p => p.filter(t => t.id !== id));
    } finally { setDeletingId(null); }
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

  const counts = { pending: tasks.filter(t => t.status === 'pending').length, in_progress: tasks.filter(t => t.status === 'in_progress').length, done: tasks.filter(t => t.status === 'done').length };

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
        <div className={`overflow-hidden transition-all duration-500 ${showForm ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="bg-slate-800/50 ring-1 ring-slate-700/50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Новая задача</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Ответственный *</label>
                <Select value={fResp} onValueChange={setFResp}>
                  <SelectTrigger className="h-9 bg-slate-900/60 ring-1 ring-slate-700/60 border-0 text-slate-200 rounded-lg text-sm focus:ring-cyan-500/50 focus:ring-2">
                    <SelectValue placeholder="— выберите —" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {RESPONSIBLES.map(r => <SelectItem key={r} value={r} className="text-slate-200 focus:bg-slate-700 focus:text-white">{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">Классификация</label>
                <div className="flex gap-2">
                  <Select value={fCat === '' ? '_none' : String(fCat)} onValueChange={v => setFCat(v === '_none' ? '' : Number(v))}>
                    <SelectTrigger className="flex-1 h-9 bg-slate-900/60 ring-1 ring-slate-700/60 border-0 text-slate-200 rounded-lg text-sm focus:ring-cyan-500/50 focus:ring-2">
                      <SelectValue placeholder="— не указана —" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="_none" className="text-slate-400 focus:bg-slate-700">— не указана —</SelectItem>
                      {categories.map(c => <SelectItem key={c.id} value={String(c.id)} className="text-slate-200 focus:bg-slate-700 focus:text-white">{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <button onClick={() => setShowCat(v => !v)}
                    className="h-9 px-3 bg-slate-900/60 ring-1 ring-slate-700/60 text-slate-500 hover:text-cyan-400 rounded-lg transition-all">
                    <Icon name="Plus" size={14} />
                  </button>
                </div>
                <div className={`overflow-hidden transition-all duration-300 ${showCat ? 'max-h-12 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                  <div className="flex gap-2">
                    <input value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCategory()}
                      placeholder="Название..." className="flex-1 h-8 px-3 bg-slate-900/60 ring-1 ring-slate-700/60 text-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-slate-600 transition-all" />
                    <button onClick={addCategory} disabled={addingCat || !newCat.trim()}
                      className="h-8 px-3 bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/30 rounded-lg text-xs font-semibold hover:bg-cyan-500/30 disabled:opacity-40 transition-all">
                      {addingCat ? <Icon name="Loader2" size={12} className="animate-spin" /> : 'OK'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Текст задачи *</label>
              <textarea value={fText} onChange={e => setFText(e.target.value)} placeholder="Описание задачи..." rows={3}
                className="w-full px-3 py-2 bg-slate-900/60 ring-1 ring-slate-700/60 text-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all resize-none placeholder:text-slate-600" />
            </div>

            <button onClick={submit} disabled={saving || !fText.trim() || !fResp}
              className="w-full h-9 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20">
              {saving ? <><Icon name="Loader2" size={14} className="animate-spin" /> Сохранение...</> : <><Icon name="Check" size={14} /> Добавить задачу</>}
            </button>
          </div>
        </div>

        {/* ── Фильтры ── */}
        <div className="p-3 bg-slate-800/30 ring-1 ring-slate-700/30 rounded-xl">
          <div className="flex items-center gap-1.5 mb-3">
            <Icon name="Filter" size={12} className="text-slate-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Фильтры</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-medium text-slate-500 mb-1 block uppercase tracking-wider">Ответственный</label>
              <Select value={fResp2 || '_all'} onValueChange={v => setFResp2(v === '_all' ? '' : v)}>
                <SelectTrigger className="h-8 bg-slate-800/60 ring-1 ring-slate-700/50 border-0 text-slate-300 rounded-lg text-xs">
                  <SelectValue placeholder="Все" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="_all" className="text-slate-400 focus:bg-slate-700 text-xs">Все</SelectItem>
                  {RESPONSIBLES.map(r => <SelectItem key={r} value={r} className="text-slate-200 focus:bg-slate-700 focus:text-white text-xs">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-medium text-slate-500 mb-1 block uppercase tracking-wider">Классификация</label>
              <Select value={fCat2 || '_all'} onValueChange={v => setFCat2(v === '_all' ? '' : v)}>
                <SelectTrigger className="h-8 bg-slate-800/60 ring-1 ring-slate-700/50 border-0 text-slate-300 rounded-lg text-xs">
                  <SelectValue placeholder="Все" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="_all" className="text-slate-400 focus:bg-slate-700 text-xs">Все</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={String(c.id)} className="text-slate-200 focus:bg-slate-700 focus:text-white text-xs">{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-medium text-slate-500 mb-1 block uppercase tracking-wider">Статус</label>
              <Select value={fStatus || '_all'} onValueChange={v => setFStatus(v === '_all' ? '' : v)}>
                <SelectTrigger className="h-8 bg-slate-800/60 ring-1 ring-slate-700/50 border-0 text-slate-300 rounded-lg text-xs">
                  <SelectValue placeholder="Все" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="_all" className="text-slate-400 focus:bg-slate-700 text-xs">Все</SelectItem>
                  <SelectItem value="pending" className="text-red-300 focus:bg-slate-700 text-xs">Не выполнена</SelectItem>
                  <SelectItem value="in_progress" className="text-yellow-300 focus:bg-slate-700 text-xs">В процессе</SelectItem>
                  <SelectItem value="done" className="text-emerald-300 focus:bg-slate-700 text-xs">Выполнена</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {(fResp2 || fCat2 || fStatus) && (
            <button onClick={() => { setFResp2(''); setFCat2(''); setFStatus(''); }}
              className="mt-2 flex items-center gap-1 text-xs text-slate-600 hover:text-red-400 transition-colors">
              <Icon name="X" size={11} /> Сбросить фильтры
            </button>
          )}
        </div>

        {/* ── Список задач ── */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="ClipboardList" size={32} className="mx-auto mb-3 text-slate-700" />
            <p className="text-sm text-slate-600">Задач не найдено</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((task, idx) => {
              const cfg = STATUS_CONFIG[task.status];
              const isUpd = updatingId === task.id;
              const isDel = deletingId === task.id;
              return (
                <div key={task.id}
                  className="group flex items-start gap-3 p-4 bg-slate-800/40 ring-1 ring-slate-700/40 rounded-xl hover:ring-slate-600/60 hover:bg-slate-800/60 transition-all duration-200"
                  style={{ animationName: 'fsi', animationDuration: '250ms', animationDelay: `${idx * 30}ms`, animationFillMode: 'both' }}>

                  {/* цветная полоска */}
                  <div className={`w-0.5 self-stretch rounded-full flex-shrink-0 ${cfg.bar}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ring-1 ${cfg.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                      {task.category_name && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
                          <Icon name="Tag" size={9} />{task.category_name}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-600 flex items-center gap-1">
                        <Icon name="User" size={10} />{task.responsible}
                      </span>
                      <button
                        onClick={() => deleteTask(task.id)}
                        disabled={isDel}
                        className="ml-auto opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-md text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
                        title="Удалить задачу"
                      >
                        {isDel
                          ? <Icon name="Loader2" size={12} className="animate-spin text-red-400" />
                          : <Icon name="Trash2" size={12} />
                        }
                      </button>
                    </div>

                    <p className={`text-sm leading-relaxed mb-2.5 ${task.status === 'done' ? 'line-through text-slate-600' : 'text-slate-200'}`}>
                      {task.text}
                    </p>

                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[10px] text-slate-700 flex items-center gap-1">
                        <Icon name="Clock" size={9} />{fmt(task.created_at)}
                      </span>
                      <div className="flex items-center gap-1">
                        {isUpd ? (
                          <Icon name="Loader2" size={13} className="animate-spin text-slate-500" />
                        ) : (
                          (['pending', 'in_progress', 'done'] as const).map(s => (
                            <button key={s} onClick={() => changeStatus(task.id, s)} disabled={task.status === s}
                              className={`h-6 px-2 rounded-md text-[10px] font-semibold transition-all duration-150 ${
                                task.status === s
                                  ? STATUS_CONFIG[s].badge + ' ring-1 cursor-default'
                                  : 'bg-slate-700/50 text-slate-500 ring-1 ring-slate-700/30 hover:bg-slate-700 hover:text-slate-300'
                              }`}>
                              {STATUS_CONFIG[s].label}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <style>{`@keyframes fsi { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </Card>
  );
}