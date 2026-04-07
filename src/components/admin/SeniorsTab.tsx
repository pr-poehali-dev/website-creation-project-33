import React, { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { useUsers } from '@/hooks/useAdminData';
import { User } from './types';

const TRAINING_API = 'https://functions.poehali.dev/1401561e-4d80-430c-87e9-7e8252e0a9b9';
const SENIORS_MAP_KEY = 'promoter_seniors_map';

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-Session-Token': localStorage.getItem('session_token') || '',
  };
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

  const fetchSeniors = useCallback(async () => {
    const res = await fetch(`${TRAINING_API}?action=get_seniors`, { headers: authHeaders() });
    const data = await res.json();
    if (data.seniors) setSeniors(data.seniors.map((s: { name: string }) => s.name));
  }, []);

  useEffect(() => {
    fetchSeniors();
    setSeniorsMap(loadSeniorsMap());
  }, []);

  const getPromoters = (seniorName: string): User[] => {
    return allUsers
      .filter(u => seniorsMap[u.id] === seniorName)
      .sort((a, b) => avgPerShift(a) - avgPerShift(b));
  };

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    if (seniors.includes(name)) { setError('Такой старший уже есть в списке'); return; }
    await fetch(TRAINING_API, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ action: 'add_senior', name }),
    });
    setSeniors(prev => [...prev, name].sort());
    setNewName('');
    setError('');
  };

  const handleRename = async (oldName: string) => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === oldName) { setEditingSenior(null); return; }
    if (seniors.includes(trimmed)) { setError('Такое имя уже есть'); return; }
    await fetch(TRAINING_API, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ action: 'rename_senior', old_name: oldName, new_name: trimmed }),
    });
    setSeniors(prev => prev.map(s => s === oldName ? trimmed : s));
    const map = loadSeniorsMap();
    Object.keys(map).forEach(k => { if (map[+k] === oldName) map[+k] = trimmed; });
    localStorage.setItem(SENIORS_MAP_KEY, JSON.stringify(map));
    setSeniorsMap(map);
    setEditingSenior(null);
    setEditName('');
    setError('');
  };

  const handleDelete = async (name: string) => {
    await fetch(TRAINING_API, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ action: 'delete_senior', name }),
    });
    setSeniors(prev => prev.filter(s => s !== name));
    if (expandedSenior === name) setExpandedSenior(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  const toggleExpand = (name: string) => {
    setExpandedSenior(prev => prev === name ? null : name);
  };

  const [migrating, setMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState<string | null>(null);

  const handleMigrateFromLocalStorage = async () => {
    setMigrating(true);
    setMigrateResult(null);
    try {
      // 1. Мигрируем старших
      const localSeniors: string[] = (() => {
        try { return JSON.parse(localStorage.getItem('training_seniors_list') || '[]'); } catch { return []; }
      })();
      let seniorsAdded = 0;
      for (const name of localSeniors) {
        if (name && !seniors.includes(name)) {
          await fetch(TRAINING_API, {
            method: 'POST', headers: authHeaders(),
            body: JSON.stringify({ action: 'add_senior', name }),
          });
          seniorsAdded++;
        }
      }

      // 2. Мигрируем записи обучения (ищем все ключи training_YYYY-MM-DD)
      const keys = Object.keys(localStorage).filter(k => /^training_\d{4}-\d{2}-\d{2}$/.test(k));
      let entriesAdded = 0;
      for (const key of keys) {
        const date = key.replace('training_', '');
        let localEntries: Array<{seniorName: string; promoterName: string; promoterPhone?: string; organization?: string; time?: string; comment?: string}> = [];
        try { localEntries = JSON.parse(localStorage.getItem(key) || '[]'); } catch { continue; }
        for (const entry of localEntries) {
          if (!entry.seniorName || !entry.promoterName) continue;
          await fetch(TRAINING_API, {
            method: 'POST', headers: authHeaders(),
            body: JSON.stringify({
              action: 'add_entry',
              date,
              seniorName: entry.seniorName,
              promoterName: entry.promoterName,
              promoterPhone: entry.promoterPhone || '',
              organization: entry.organization || '',
              time: entry.time || '',
              comment: entry.comment || '',
            }),
          });
          entriesAdded++;
        }
      }

      await fetchSeniors();
      setMigrateResult(`Готово! Перенесено: ${seniorsAdded} старших, ${entriesAdded} записей обучения.`);
    } catch {
      setMigrateResult('Ошибка при переносе. Попробуйте ещё раз.');
    }
    setMigrating(false);
  };

  // Проверяем, есть ли данные в localStorage для миграции
  const hasLocalData = (() => {
    const hasSeniors = (() => { try { return JSON.parse(localStorage.getItem('training_seniors_list') || '[]').length > 0; } catch { return false; } })();
    const hasEntries = Object.keys(localStorage).some(k => /^training_\d{4}-\d{2}-\d{2}$/.test(k));
    return hasSeniors || hasEntries;
  })();

  return (
    <div className="space-y-6">
      {hasLocalData && !migrateResult && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <Icon name="AlertTriangle" size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800 mb-1">Найдены локальные данные обучения</p>
            <p className="text-xs text-amber-600 mb-3">Старые записи хранятся только в этом браузере. Перенесите их в общую базу, чтобы все администраторы их видели.</p>
            <button onClick={handleMigrateFromLocalStorage} disabled={migrating}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              {migrating ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Upload" size={14} />}
              {migrating ? 'Переношу...' : 'Перенести в базу данных'}
            </button>
          </div>
        </div>
      )}
      {migrateResult && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <Icon name="CheckCircle" size={18} className="text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-800">{migrateResult}</p>
        </div>
      )}
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