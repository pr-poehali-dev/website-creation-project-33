import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { useUsers } from '@/hooks/useAdminData';
import { User } from './types';

const SENIORS_KEY = 'training_seniors_list';
const SENIORS_MAP_KEY = 'promoter_seniors_map';

function loadSeniors(): string[] {
  try { return JSON.parse(localStorage.getItem(SENIORS_KEY) || '[]'); } catch { return []; }
}
function saveSeniors(list: string[]) {
  localStorage.setItem(SENIORS_KEY, JSON.stringify(list));
}
function loadSeniorsMap(): Record<number, string> {
  try { return JSON.parse(localStorage.getItem(SENIORS_MAP_KEY) || '{}'); } catch { return {}; }
}

function avgPerShift(u: User): number {
  const shifts = u.shifts_count || 0;
  const contacts = u.lead_count || 0;
  return shifts > 0 ? Math.round((contacts / shifts) * 10) / 10 : 0;
}

export default function SeniorsTab() {
  const [seniors, setSeniors] = useState<string[]>([]);
  const [seniorsMap, setSeniorsMap] = useState<Record<number, string>>({});
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [expandedSenior, setExpandedSenior] = useState<string | null>(null);
  const [editingSenior, setEditingSenior] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const { data: usersData, isLoading } = useUsers(true);
  const allUsers: User[] = [...(usersData?.active || []), ...(usersData?.inactive || [])];

  useEffect(() => {
    setSeniors(loadSeniors());
    setSeniorsMap(loadSeniorsMap());
  }, []);

  const getPromoters = (seniorName: string): User[] => {
    return allUsers
      .filter(u => seniorsMap[u.id] === seniorName)
      .sort((a, b) => avgPerShift(a) - avgPerShift(b));
  };

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    if (seniors.includes(name)) { setError('Такой старший уже есть в списке'); return; }
    const updated = [...seniors, name];
    setSeniors(updated);
    saveSeniors(updated);
    setNewName('');
    setError('');
  };

  const handleRename = (oldName: string) => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === oldName) { setEditingSenior(null); return; }
    if (seniors.includes(trimmed)) { setError('Такое имя уже есть'); return; }
    const updated = seniors.map(s => s === oldName ? trimmed : s);
    setSeniors(updated);
    saveSeniors(updated);
    const map = loadSeniorsMap();
    Object.keys(map).forEach(k => { if (map[+k] === oldName) map[+k] = trimmed; });
    localStorage.setItem(SENIORS_MAP_KEY, JSON.stringify(map));
    setSeniorsMap(map);
    setEditingSenior(null);
    setEditName('');
    setError('');
  };

  const handleDelete = (name: string) => {
    const updated = seniors.filter(s => s !== name);
    setSeniors(updated);
    saveSeniors(updated);
    if (expandedSenior === name) setExpandedSenior(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  const toggleExpand = (name: string) => {
    setExpandedSenior(prev => prev === name ? null : name);
  };

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
            {seniors.map((name, idx) => {
              const promoters = getPromoters(name);
              const count = promoters.length;
              const totalShifts = promoters.reduce((sum, u) => sum + (u.shifts_count || 0), 0);
              const totalContacts = promoters.reduce((sum, u) => sum + (u.lead_count || 0), 0);
              const seniorAvg = totalShifts > 0 ? Math.round((totalContacts / totalShifts) * 10) / 10 : 0;
              const isExpanded = expandedSenior === name;
              const isEditing = editingSenior === name;

              return (
                <li key={idx} className="py-3">
                  <div
                    className="flex items-center justify-between hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors"
                    onClick={() => !isEditing && toggleExpand(name)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <input
                            autoFocus
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleRename(name); if (e.key === 'Escape') setEditingSenior(null); }}
                            onClick={e => e.stopPropagation()}
                            className="w-full border border-blue-400 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        ) : (
                          <p className="text-slate-800 text-sm font-medium truncate">{name}</p>
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
                          <button onClick={() => handleRename(name)} className="text-green-500 hover:text-green-600 transition-colors p-1" title="Сохранить">
                            <Icon name="Check" size={16} />
                          </button>
                          <button onClick={() => setEditingSenior(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-1" title="Отмена">
                            <Icon name="X" size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingSenior(name); setEditName(name); setError(''); }} className="text-slate-400 hover:text-blue-500 transition-colors p-1" title="Переименовать">
                            <Icon name="Pencil" size={15} />
                          </button>
                          <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-slate-400 cursor-pointer" onClick={() => toggleExpand(name)} />
                          <button onClick={() => handleDelete(name)} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Удалить">
                            <Icon name="Trash2" size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 space-y-2">
                      {isLoading ? (
                        <div className="flex items-center gap-2 text-slate-400 text-sm py-2 px-2">
                          <Icon name="Loader2" size={14} className="animate-spin" />
                          Загрузка...
                        </div>
                      ) : count === 0 ? (
                        <p className="text-slate-400 text-sm py-2 px-2">Нет назначенных промоутеров</p>
                      ) : (
                        <>
                          {/* Шапка таблицы */}
                          <div className="grid grid-cols-[1fr_48px_48px_52px] gap-2 px-3 pb-1">
                            <span className="text-xs text-slate-400">Промоутер</span>
                            <span className="text-xs text-slate-400 text-center">Смен</span>
                            <span className="text-xs text-slate-400 text-center">Конт.</span>
                            <span className="text-xs text-purple-400 text-center">Ср/см</span>
                          </div>
                          {/* Строки промоутеров */}
                          {promoters.map(u => {
                            const avg = avgPerShift(u);
                            return (
                              <div key={u.id} className="grid grid-cols-[1fr_48px_48px_52px] gap-2 items-center bg-slate-50 rounded-xl px-3 py-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${u.is_online ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                                  <span className="text-sm text-slate-800 truncate">{u.name}</span>
                                </div>
                                <span className="text-sm text-slate-600 text-center">{u.shifts_count || 0}</span>
                                <span className="text-sm text-blue-600 font-medium text-center">{u.lead_count || 0}</span>
                                <span className="text-sm text-purple-600 font-semibold text-center">{avg}</span>
                              </div>
                            );
                          })}
                          {/* Итоговая строка */}
                          <div className="grid grid-cols-[1fr_48px_48px_52px] gap-2 items-center border-t border-slate-200 pt-2 px-3 mt-1">
                            <span className="text-xs font-semibold text-slate-600">Итого</span>
                            <span className="text-sm font-bold text-slate-700 text-center">{totalShifts}</span>
                            <span className="text-sm font-bold text-blue-700 text-center">{totalContacts}</span>
                            <span className="text-sm font-bold text-purple-700 text-center">{seniorAvg}</span>
                          </div>
                        </>
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
