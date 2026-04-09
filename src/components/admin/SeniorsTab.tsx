import React, { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { useUsers } from '@/hooks/useAdminData';
import { User, ADMIN_API } from './types';

const TRAINING_API = 'https://functions.poehali.dev/1401561e-4d80-430c-87e9-7e8252e0a9b9';

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-Session-Token': localStorage.getItem('session_token') || '',
  };
}

function avgPerShift(u: User): number {
  const shifts = u.shifts_count || 0;
  const contacts = u.lead_count || 0;
  return shifts > 0 ? Math.round((contacts / shifts) * 10) / 10 : 0;
}

function promoterStatus(u: User): 'red' | 'yellow' | 'green' {
  const shifts = u.shifts_count || 0;
  const contacts = u.lead_count || 0;
  if (shifts < 3) return 'red';
  if (contacts < 10) return 'yellow';
  return 'green';
}

const STATUS_STYLES = {
  red:    { row: 'bg-red-50/60 border border-red-100',    dot: 'bg-red-400',    badge: 'bg-red-100 text-red-600' },
  yellow: { row: 'bg-amber-50/60 border border-amber-100', dot: 'bg-amber-400', badge: 'bg-amber-100 text-amber-600' },
  green:  { row: 'bg-emerald-50/60 border border-emerald-100', dot: 'bg-emerald-400', badge: 'bg-emerald-100 text-emerald-700' },
};

interface KpdData {
  by_day:   { date: string; count: number }[];
  by_week:  { week_start: string; count: number }[];
  by_month: { month_start: string; count: number }[];
  trainees: { id: number; name: string; registered_at: string; is_active: boolean; lead_count: number; shifts_count: number }[];
}

function fmtDay(s: string) {
  return new Date(s).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}
function fmtWeek(s: string) {
  const d = new Date(s), e = new Date(s);
  e.setDate(e.getDate() + 6);
  return `${d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })} – ${e.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}`;
}
function fmtMonth(s: string) {
  return new Date(s).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
}

function KpdSection({ seniorId, traineesFromTeam }: { seniorId: number; traineesFromTeam: User[] }) {
  const [kpd, setKpd] = useState<KpdData | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [openPeriod, setOpenPeriod] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${TRAINING_API}?action=get_senior_kpd&senior_id=${seniorId}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { setKpd(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [seniorId]);

  if (loading) return (
    <div className="flex items-center gap-2 text-slate-400 text-sm py-6 justify-center">
      <Icon name="Loader2" size={15} className="animate-spin" />
      Загружаем данные...
    </div>
  );
  if (!kpd) return null;

  const periodData = period === 'day' ? kpd.by_day : period === 'week' ? kpd.by_week : kpd.by_month;
  const total = periodData.reduce((s, i) => s + i.count, 0);

  const getLabel = (item: { date?: string; week_start?: string; month_start?: string }) => {
    if (period === 'day') return fmtDay(item.date!);
    if (period === 'week') return fmtWeek(item.week_start!);
    return fmtMonth(item.month_start!);
  };

  // Для каждого периода — найти стажёров зарегистрированных в этот период
  const getTraineesForPeriod = (item: { date?: string; week_start?: string; month_start?: string }) => {
    return kpd.trainees.filter(t => {
      const reg = new Date(t.registered_at);
      if (period === 'day') {
        return fmtDay(t.registered_at) === fmtDay(item.date!);
      }
      if (period === 'week') {
        const ws = new Date(item.week_start!);
        const we = new Date(item.week_start!);
        we.setDate(we.getDate() + 6);
        return reg >= ws && reg <= we;
      }
      // month
      const ms = new Date(item.month_start!);
      return reg.getFullYear() === ms.getFullYear() && reg.getMonth() === ms.getMonth();
    });
  };

  const togglePeriod = (key: string) => setOpenPeriod(p => p === key ? null : key);

  return (
    <div className="space-y-5">
      {/* Переключатель периода */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {(['day', 'week', 'month'] as const).map(p => (
          <button
            key={p}
            onClick={() => { setPeriod(p); setOpenPeriod(null); }}
            className={`flex-1 text-xs py-2 rounded-lg font-semibold transition-all duration-200 ${period === p ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {p === 'day' ? 'День' : p === 'week' ? 'Неделя' : 'Месяц'}
          </button>
        ))}
      </div>

      {/* Обучения */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Обучений проведено</span>
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Итого: {total}</span>
        </div>

        {periodData.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">Нет данных за этот период</div>
        ) : (
          <div className="space-y-2">
            {periodData.map((item, i) => {
              const key = item.date || item.week_start || item.month_start || String(i);
              const isOpen = openPeriod === key;
              const trainees = getTraineesForPeriod(item as { date?: string; week_start?: string; month_start?: string });

              return (
                <div key={key} className="rounded-xl overflow-hidden border border-slate-100">
                  <button
                    className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${isOpen ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'}`}
                    onClick={() => togglePeriod(key)}
                  >
                    <div className="flex items-center gap-2">
                      <Icon name={isOpen ? 'ChevronDown' : 'ChevronRight'} size={14} className="text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">
                        {getLabel(item as { date?: string; week_start?: string; month_start?: string })}
                      </span>
                    </div>
                    <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${isOpen ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600'}`}>
                      {item.count}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-100 bg-slate-50/50">
                      {trainees.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-3">Нет стажёров</p>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {trainees.map(t => (
                            <div key={t.id} className={`flex items-center justify-between px-4 py-2.5 ${!t.is_active ? 'opacity-50' : ''}`}>
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.is_active ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                                <span className="text-sm text-slate-700 truncate">{t.name}</span>
                                {!t.is_active && <span className="text-[10px] text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded-full flex-shrink-0">архив</span>}
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <Icon name="Calendar" size={11} />
                                  {t.shifts_count}
                                </span>
                                <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                                  <Icon name="Phone" size={11} />
                                  {t.lead_count}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Все стажёры */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Все стажёры</span>
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{kpd.trainees.length} чел.</span>
        </div>
        {kpd.trainees.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-3">Нет стажёров</p>
        ) : (
          <div className="space-y-1.5">
            {kpd.trainees.map(t => (
              <div key={t.id} className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${t.is_active ? 'bg-white border border-slate-100' : 'bg-slate-50 opacity-55'}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.is_active ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                  <span className="text-sm text-slate-800 truncate">{t.name}</span>
                  {!t.is_active && <span className="text-[10px] text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded-full flex-shrink-0">архив</span>}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                  <span className="text-xs text-slate-500">{fmtDay(t.registered_at)}</span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Icon name="Calendar" size={11} />
                    {t.shifts_count}
                  </span>
                  <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                    <Icon name="Phone" size={11} />
                    {t.lead_count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SeniorsTab() {
  const [seniors, setSeniors] = useState<{ id: number; name: string }[]>([]);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [expandedSeniorId, setExpandedSeniorId] = useState<number | null>(null);
  const [editingSeniorId, setEditingSeniorId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [activeTab, setActiveTab] = useState<Record<number, 'team' | 'kpd'>>({});

  const { data: usersData, isLoading, refetch } = useUsers(true);
  const allUsers: User[] = [...(usersData?.active || []), ...(usersData?.inactive || [])];

  const fetchSeniors = useCallback(async () => {
    const res = await fetch(`${TRAINING_API}?action=get_seniors`, { headers: authHeaders() });
    const data = await res.json();
    if (data.seniors) setSeniors(data.seniors);
  }, []);

  useEffect(() => { fetchSeniors(); }, []);

  const getPromoters = (seniorId: number): User[] =>
    allUsers.filter(u => u.senior_id === seniorId).sort((a, b) => avgPerShift(a) - avgPerShift(b));

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    if (seniors.some(s => s.name === name)) { setError('Такой старший уже есть'); return; }
    const res = await fetch(TRAINING_API, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'add_senior', name }) });
    const data = await res.json();
    if (data.senior) setSeniors(prev => [...prev, data.senior].sort((a, b) => a.name.localeCompare(b.name)));
    setNewName(''); setError('');
  };

  const handleRename = async (senior: { id: number; name: string }) => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === senior.name) { setEditingSeniorId(null); return; }
    if (seniors.some(s => s.name === trimmed && s.id !== senior.id)) { setError('Такое имя уже есть'); return; }
    await fetch(TRAINING_API, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'rename_senior', old_name: senior.name, new_name: trimmed }) });
    setSeniors(prev => prev.map(s => s.id === senior.id ? { ...s, name: trimmed } : s));
    setEditingSeniorId(null); setEditName(''); setError('');
  };

  const handleDelete = async (senior: { id: number; name: string }) => {
    await fetch(TRAINING_API, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'delete_senior', name: senior.name }) });
    setSeniors(prev => prev.filter(s => s.id !== senior.id));
    if (expandedSeniorId === senior.id) setExpandedSeniorId(null);
  };

  const handleSetSenior = async (userId: number, seniorId: number | null) => {
    await fetch(ADMIN_API, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'set_senior', user_id: userId, senior_id: seniorId }) });
    refetch?.();
  };

  const toggleExpand = (id: number) => setExpandedSeniorId(prev => prev === id ? null : id);
  const getTab = (id: number) => activeTab[id] || 'team';
  const setTab = (id: number, tab: 'team' | 'kpd') => setActiveTab(prev => ({ ...prev, [id]: tab }));

  const unassignedUsers = allUsers.filter(u => !u.senior_id && !u.is_admin);

  return (
    <div className="space-y-4">
      {/* Шапка с добавлением */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h2 className="text-base font-bold text-slate-800 mb-4">Список старших</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => { setNewName(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Имя нового старшего"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
          />
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-blue-200"
          >
            <Icon name="Plus" size={16} />
            Добавить
          </button>
        </div>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>

      {/* Список старших */}
      {seniors.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm bg-white rounded-2xl border border-slate-100">
          Список пуст. Добавьте первого старшего.
        </div>
      ) : (
        <div className="space-y-3">
          {seniors.map((senior) => {
            const promoters = getPromoters(senior.id);
            const count = promoters.length;
            const totalShifts = promoters.reduce((s, u) => s + (u.shifts_count || 0), 0);
            const totalContacts = promoters.reduce((s, u) => s + (u.lead_count || 0), 0);
            const seniorAvg = totalShifts > 0 ? Math.round((totalContacts / totalShifts) * 10) / 10 : 0;
            const isExpanded = expandedSeniorId === senior.id;
            const isEditing = editingSeniorId === senior.id;
            const tab = getTab(senior.id);

            return (
              <div key={senior.id} className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${isExpanded ? 'border-blue-200 shadow-md shadow-blue-50' : 'border-slate-100 shadow-sm hover:border-slate-200'}`}>
                {/* Строка старшего */}
                <div
                  className="flex items-center gap-3 px-5 py-4 cursor-pointer"
                  onClick={() => !isEditing && toggleExpand(senior.id)}
                >
                  {/* Аватар */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors ${isExpanded ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-600'}`}>
                    {senior.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Имя + метрики */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleRename(senior); if (e.key === 'Escape') setEditingSeniorId(null); }}
                        onClick={e => e.stopPropagation()}
                        className="w-full border border-blue-400 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-slate-800 truncate">{senior.name}</p>
                    )}
                    {!isEditing && (
                      <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Icon name="Users" size={11} /> {count}
                        </span>
                        <span className="w-px h-3 bg-slate-200" />
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Icon name="Calendar" size={11} /> {totalShifts} см
                        </span>
                        <span className="w-px h-3 bg-slate-200" />
                        <span className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                          <Icon name="Phone" size={11} /> {totalContacts}
                        </span>
                        <span className="w-px h-3 bg-slate-200" />
                        <span className="flex items-center gap-1 text-xs font-semibold text-violet-600">
                          <Icon name="TrendingUp" size={11} /> {seniorAvg}/см
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Действия */}
                  <div className="flex items-center gap-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {isEditing ? (
                      <>
                        <button onClick={() => handleRename(senior)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors">
                          <Icon name="Check" size={15} />
                        </button>
                        <button onClick={() => setEditingSeniorId(null)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors">
                          <Icon name="X" size={15} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditingSeniorId(senior.id); setEditName(senior.name); setError(''); }} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                          <Icon name="Pencil" size={14} />
                        </button>
                        <button onClick={() => toggleExpand(senior.id)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors">
                          <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={15} />
                        </button>
                        <button onClick={() => handleDelete(senior)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Icon name="Trash2" size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Раскрытая панель */}
                {isExpanded && (
                  <div className="border-t border-slate-100">
                    {/* Вкладки */}
                    <div className="flex px-5 pt-1 gap-1 border-b border-slate-100">
                      {(['team', 'kpd'] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => setTab(senior.id, t)}
                          className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all -mb-px ${tab === t ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                        >
                          <Icon name={t === 'team' ? 'Users' : 'BarChart2'} size={13} />
                          {t === 'team' ? 'Команда' : 'КПД'}
                        </button>
                      ))}
                    </div>

                    <div className="p-4">
                      {/* Команда */}
                      {tab === 'team' && (
                        <div className="space-y-2">
                          {isLoading ? (
                            <div className="flex items-center gap-2 text-slate-400 text-sm py-4 justify-center">
                              <Icon name="Loader2" size={14} className="animate-spin" /> Загрузка...
                            </div>
                          ) : count === 0 ? (
                            <p className="text-slate-400 text-sm py-4 text-center">Нет промоутеров в команде</p>
                          ) : (
                            <>
                              <div className="grid grid-cols-[1fr_44px_44px_52px_28px] gap-2 px-3 pb-1">
                                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Промоутер</span>
                                <span className="text-[11px] font-semibold text-slate-400 text-center">Смен</span>
                                <span className="text-[11px] font-semibold text-slate-400 text-center">Конт.</span>
                                <span className="text-[11px] font-semibold text-violet-400 text-center">Ср/см</span>
                                <span />
                              </div>
                              {promoters.map(u => {
                                const st = promoterStatus(u);
                                const s = STATUS_STYLES[st];
                                return (
                                  <div key={u.id} className={`grid grid-cols-[1fr_44px_44px_52px_28px] gap-2 items-center rounded-xl px-3 py-2.5 ${s.row}`}>
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                                      <span className="text-sm text-slate-800 truncate font-medium">{u.name}</span>
                                    </div>
                                    <span className="text-sm text-slate-600 text-center font-medium">{u.shifts_count || 0}</span>
                                    <span className="text-sm text-blue-600 font-bold text-center">{u.lead_count || 0}</span>
                                    <span className="text-sm text-violet-600 font-bold text-center">{avgPerShift(u)}</span>
                                    <button onClick={() => handleSetSenior(u.id, null)} className="text-slate-200 hover:text-red-400 transition-colors flex justify-center">
                                      <Icon name="X" size={13} />
                                    </button>
                                  </div>
                                );
                              })}
                              <div className="grid grid-cols-[1fr_44px_44px_52px_28px] gap-2 items-center bg-slate-50 rounded-xl px-3 py-2.5 mt-1">
                                <span className="text-xs font-bold text-slate-600">Итого</span>
                                <span className="text-sm font-bold text-slate-700 text-center">{totalShifts}</span>
                                <span className="text-sm font-bold text-blue-700 text-center">{totalContacts}</span>
                                <span className="text-sm font-bold text-violet-700 text-center">{seniorAvg}</span>
                                <span />
                              </div>
                            </>
                          )}

                          {/* Легенда */}
                          <div className="flex items-center gap-3 px-1 pt-1">
                            {(['red', 'yellow', 'green'] as const).map(st => (
                              <div key={st} className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${STATUS_STYLES[st].dot}`} />
                                <span className="text-[10px] text-slate-400">
                                  {st === 'red' ? '<3 смен' : st === 'yellow' ? '<10 конт.' : '≥10 конт.'}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Добавить промоутера */}
                          {unassignedUsers.length > 0 && (
                            <div className="pt-1">
                              <select
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
                                defaultValue=""
                                onChange={e => { if (e.target.value) { handleSetSenior(Number(e.target.value), senior.id); e.target.value = ''; } }}
                              >
                                <option value="" disabled>+ Добавить промоутера</option>
                                {unassignedUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                              </select>
                            </div>
                          )}
                        </div>
                      )}

                      {/* КПД */}
                      {tab === 'kpd' && <KpdSection seniorId={senior.id} traineesFromTeam={promoters} />}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
