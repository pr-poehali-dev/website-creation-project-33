import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

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

export default function SeniorsTab() {
  const [seniors, setSeniors] = useState<string[]>([]);
  const [seniorsMap, setSeniorsMap] = useState<Record<number, string>>({});
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setSeniors(loadSeniors());
    setSeniorsMap(loadSeniorsMap());
  }, []);

  const getPromoterCount = (seniorName: string): number => {
    return Object.values(seniorsMap).filter(s => s === seniorName).length;
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

  const handleDelete = (name: string) => {
    const updated = seniors.filter(s => s !== name);
    setSeniors(updated);
    saveSeniors(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  const totalAssigned = Object.keys(seniorsMap).length;

  return (
    <div className="space-y-6">
      <div className="admin-card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Список старших</h2>
          {totalAssigned > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
              Назначено промоутеров: {totalAssigned}
            </span>
          )}
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
              const count = getPromoterCount(name);
              return (
                <li key={idx} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-slate-800 text-sm font-medium">{name}</p>
                      <p className="text-slate-400 text-xs">
                        {count > 0 ? `Промоутеров: ${count}` : 'Нет промоутеров'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {count > 0 && (
                      <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {count}
                      </span>
                    )}
                    <button
                      onClick={() => handleDelete(name)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                      title="Удалить"
                    >
                      <Icon name="Trash2" size={16} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
