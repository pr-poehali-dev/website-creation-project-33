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

function promoterColor(u: User): string {
  const shifts = u.shifts_count || 0;
  const contacts = u.lead_count || 0;
  if (shifts < 3) return 'bg-red-50 border-l-2 border-red-400';
  if (contacts < 10) return 'bg-yellow-50 border-l-2 border-yellow-400';
  return 'bg-green-50 border-l-2 border-green-400';
}

function promoterDot(u: User): string {
  const shifts = u.shifts_count || 0;
  const contacts = u.lead_count || 0;
  if (shifts < 3) return 'bg-red-400';
  if (contacts < 10) return 'bg-yellow-400';
  return 'bg-green-400';
}

interface KpdData {
  by_day: { date: string; count: number }[];
  by_week: { week_start: string; count: number }[];
  by_month: { month_start: string; count: number }[];
  trainees: { id: number; name: string; registered_at: string; lead_count: number; shifts_count: number }[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

function formatWeek(dateStr: string): string {
  const d = new Date(dateStr);
  const end = new Date(d);
  end.setDate(end.getDate() + 6);
  return `${d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })} – ${end.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}`;
}

function formatMonth(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
}

function KpdSection({ seniorId }: { seniorId: number }) {
  const [kpd, setKpd] = useState<KpdData | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');

  useEffect(() => {
    setLoading(true);
    fetch(`${TRAINING_API}?action=get_senior_kpd&senior_id=${seniorId}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => { setKpd(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [seniorId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm py-4 px-2">
        <Icon name="Loader2" size={14} className="animate-spin" />
        Загрузка КПД...
      </div>
    );
  }

  if (!kpd) return null;

  const periodData =
    period === 'day' ? kpd.by_day :
    period === 'week' ? kpd.by_week :
    kpd.by_month;

  const formatLabel = (item: { date?: string; week_start?: string; month_start?: string }) => {
    if (period === 'day') return formatDate(item.date!);
    if (period === 'week') return formatWeek(item.week_start!);
    return formatMonth(item.month_start!);
  };

  const totalTrainings = periodData.reduce((s, i) => s + i.count, 0);

  return (
    <div className="space-y-4">
      {/* Переключатель периода */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
        {(['day', 'week', 'month'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${period === p ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {p === 'day' ? 'День' : p === 'week' ? 'Неделя' : 'Месяц'}
          </button>
        ))}
      </div>

      {/* Обучения за период */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Обучений проведено</span>
          <span className="text-xs text-slate-400">Всего: {totalTrainings}</span>
        </div>
        {periodData.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-3">Нет данных</p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {periodData.map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                <span className="text-sm text-slate-700">{formatLabel(item as { date?: string; week_start?: string; month_start?: string })}</span>
                <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">{item.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Стажёры */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Стажёры</span>
          <span className="text-xs text-slate-400">{kpd.trainees.length} чел.</span>
        </div>
        {kpd.trainees.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-3">Нет стажёров</p>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_48px_52px_56px] gap-2 px-3 pb-1">
              <span className="text-xs text-slate-400">Стажёр</span>
              <span className="text-xs text-slate-400 text-center">Смен</span>
              <span className="text-xs text-slate-400 text-center">Конт.</span>
              <span className="text-xs text-slate-400 text-right">Дата</span>
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {kpd.trainees.map(t => (
                <div key={t.id} className="grid grid-cols-[1fr_48px_52px_56px] gap-2 items-center bg-slate-50 rounded-xl px-3 py-2">
                  <span className="text-sm text-slate-800 truncate">{t.name}</span>
                  <span className="text-sm text-slate-600 text-center">{t.shifts_count}</span>
                  <span className="text-sm text-blue-600 font-medium text-center">{t.lead_count}</span>
                  <span className="text-xs text-slate-400 text-right">{formatDate(t.registered_at)}</span>
                </div>
              ))}
            </div>
          </>
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

  useEffect(() => {
    fetchSeniors();
  }, []);

  const getPromoters = (seniorId: number): User[] => {
    return allUsers
      .filter(u => u.senior_id === seniorId)
      .sort((a, b) => avgPerShift(a) - avgPerShift(b));
  };

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    if (seniors.some(s => s.name === name)) { setError('Такой старший уже есть в списке'); return; }
    const res = await fetch(TRAINING_API, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ action: 'add_senior', name }),
    });
    const data = await res.json();
    if (data.senior) setSeniors(prev => [...prev, data.senior].sort((a, b) => a.name.localeCompare(b.name)));
    setNewName('');
    setError('');
  };

  const handleRename = async (senior: { id: number; name: string }) => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === senior.name) { setEditingSeniorId(null); return; }
    if (seniors.some(s => s.name === trimmed && s.id !== senior.id)) { setError('Такое имя уже есть'); return; }
    await fetch(TRAINING_API, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ action: 'rename_senior', old_name: senior.name, new_name: trimmed }),
    });
    setSeniors(prev => prev.map(s => s.id === senior.id ? { ...s, name: trimmed } : s));
    setEditingSeniorId(null);
    setEditName('');
    setError('');
  };

  const handleDelete = async (senior: { id: number; name: string }) => {
    await fetch(TRAINING_API, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ action: 'delete_senior', name: senior.name }),
    });
    setSeniors(prev => prev.filter(s => s.id !== senior.id));
    if (expandedSeniorId === senior.id) setExpandedSeniorId(null);
  };

  const handleSetSenior = async (userId: number, seniorId: number | null) => {
    await fetch(ADMIN_API, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ action: 'set_senior', user_id: userId, senior_id: seniorId }),
    });
    refetch?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  const toggleExpand = (id: number) => {
    setExpandedSeniorId(prev => prev === id ? null : id);
  };

  const getTab = (id: number) => activeTab[id] || 'team';
  const setTab = (id: number, tab: 'team' | 'kpd') => setActiveTab(prev => ({ ...prev, [id]: tab }));

  const unassignedUsers = allUsers.filter(u => !u.senior_id && !u.is_admin);

  return (
    <div className="space-y-6">
      <div className="admin-card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Список старших</h2>
        </div>

        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newName}
            onChange={e => { setNewName(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            placeholder="Имя старшего"
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Icon name="Plus" size={16} />
            Добавить
          </button>
        </div>

        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

        {seniors.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            Список старших пуст. Добавьте первого старшего.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 mt-4">
            {seniors.map((senior) => {
              const promoters = getPromoters(senior.id);
              const count = promoters.length;
              const totalShifts = promoters.reduce((sum, u) => sum + (u.shifts_count || 0), 0);
              const totalContacts = promoters.reduce((sum, u) => sum + (u.lead_count || 0), 0);
              const seniorAvg = totalShifts > 0 ? Math.round((totalContacts / totalShifts) * 10) / 10 : 0;
              const isExpanded = expandedSeniorId === senior.id;
              const isEditing = editingSeniorId === senior.id;
              const tab = getTab(senior.id);

              return (
                <li key={senior.id} className="py-3">
                  <div
                    className="flex items-center justify-between hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors"
                    onClick={() => !isEditing && toggleExpand(senior.id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">
                        {senior.name.charAt(0).toUpperCase()}
                      </div>
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
                          <p className="text-slate-800 text-sm font-medium truncate">{senior.name}</p>
                        )}
                        {!isEditing && (
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-slate-500 text-xs flex items-center gap-1">
                              <Icon name="Users" size={11} />
                              {count}
                            </span>
                            <span className="text-slate-500 text-xs flex items-center gap-1">
                              <Icon name="Calendar" size={11} />
                              {totalShifts}
                            </span>
                            <span className="text-blue-600 text-xs font-medium flex items-center gap-1">
                              <Icon name="Phone" size={11} />
                              {totalContacts}
                            </span>
                            <span className="text-purple-600 text-xs font-medium flex items-center gap-1">
                              <Icon name="TrendingUp" size={11} />
                              {seniorAvg}/см
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                      {isEditing ? (
                        <>
                          <button onClick={() => handleRename(senior)} className="text-green-500 hover:text-green-600 transition-colors p-1" title="Сохранить">
                            <Icon name="Check" size={16} />
                          </button>
                          <button onClick={() => setEditingSeniorId(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-1" title="Отмена">
                            <Icon name="X" size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingSeniorId(senior.id); setEditName(senior.name); setError(''); }} className="text-slate-400 hover:text-blue-500 transition-colors p-1" title="Переименовать">
                            <Icon name="Pencil" size={15} />
                          </button>
                          <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-slate-400 cursor-pointer" onClick={() => toggleExpand(senior.id)} />
                          <button onClick={() => handleDelete(senior)} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Удалить">
                            <Icon name="Trash2" size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3">
                      {/* Вкладки */}
                      <div className="flex gap-1 border-b border-slate-100 mb-3">
                        <button
                          onClick={() => setTab(senior.id, 'team')}
                          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === 'team' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                          <Icon name="Users" size={14} />
                          Команда
                        </button>
                        <button
                          onClick={() => setTab(senior.id, 'kpd')}
                          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === 'kpd' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                          <Icon name="BarChart2" size={14} />
                          КПД
                        </button>
                      </div>

                      {/* Вкладка: Команда */}
                      {tab === 'team' && (
                        <div className="space-y-2">
                          {isLoading ? (
                            <div className="flex items-center gap-2 text-slate-400 text-sm py-2 px-2">
                              <Icon name="Loader2" size={14} className="animate-spin" />
                              Загрузка...
                            </div>
                          ) : count === 0 ? (
                            <p className="text-slate-400 text-sm py-2 px-2">Нет назначенных промоутеров</p>
                          ) : (
                            <>
                              <div className="grid grid-cols-[1fr_48px_48px_52px_32px] gap-2 px-3 pb-1">
                                <span className="text-xs text-slate-400">Промоутер</span>
                                <span className="text-xs text-slate-400 text-center">Смен</span>
                                <span className="text-xs text-slate-400 text-center">Конт.</span>
                                <span className="text-xs text-purple-400 text-center">Ср/см</span>
                                <span></span>
                              </div>
                              {promoters.map(u => {
                                const avg = avgPerShift(u);
                                return (
                                  <div key={u.id} className={`grid grid-cols-[1fr_48px_48px_52px_32px] gap-2 items-center rounded-xl px-3 py-2 ${promoterColor(u)}`}>
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${promoterDot(u)}`} />
                                      <span className="text-sm text-slate-800 truncate">{u.name}</span>
                                    </div>
                                    <span className="text-sm text-slate-600 text-center">{u.shifts_count || 0}</span>
                                    <span className="text-sm text-blue-600 font-medium text-center">{u.lead_count || 0}</span>
                                    <span className="text-sm text-purple-600 font-semibold text-center">{avg}</span>
                                    <button onClick={() => handleSetSenior(u.id, null)} className="text-slate-300 hover:text-red-400 transition-colors" title="Открепить">
                                      <Icon name="X" size={14} />
                                    </button>
                                  </div>
                                );
                              })}
                              <div className="grid grid-cols-[1fr_48px_48px_52px_32px] gap-2 items-center border-t border-slate-200 pt-2 px-3 mt-1">
                                <span className="text-xs font-semibold text-slate-600">Итого</span>
                                <span className="text-sm font-bold text-slate-700 text-center">{totalShifts}</span>
                                <span className="text-sm font-bold text-blue-700 text-center">{totalContacts}</span>
                                <span className="text-sm font-bold text-purple-700 text-center">{seniorAvg}</span>
                                <span></span>
                              </div>
                            </>
                          )}

                          {unassignedUsers.length > 0 && (
                            <div className="pt-2 px-1">
                              <select
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                                defaultValue=""
                                onChange={e => {
                                  if (e.target.value) {
                                    handleSetSenior(Number(e.target.value), senior.id);
                                    e.target.value = '';
                                  }
                                }}
                              >
                                <option value="" disabled>+ Добавить промоутера</option>
                                {unassignedUsers.map(u => (
                                  <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Вкладка: КПД */}
                      {tab === 'kpd' && (
                        <KpdSection seniorId={senior.id} />
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
