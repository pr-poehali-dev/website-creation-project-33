import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

const SENIORS_KEY = 'training_seniors_list';

function loadSeniors(): string[] {
  try {
    const saved = localStorage.getItem(SENIORS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveSeniors(list: string[]) {
  localStorage.setItem(SENIORS_KEY, JSON.stringify(list));
}

export default function SeniorsTab() {
  const [seniors, setSeniors] = useState<string[]>([]);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setSeniors(loadSeniors());
  }, []);

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    if (seniors.includes(name)) {
      setError('Такой старший уже есть в списке');
      return;
    }
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

  return (
    <div className="space-y-6">
      <div className="admin-card p-6 rounded-2xl">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Список старших</h2>

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

        {error && (
          <p className="text-red-500 text-xs mb-3">{error}</p>
        )}

        {seniors.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            Список старших пуст. Добавьте первого старшего.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 mt-4">
            {seniors.map((name, idx) => (
              <li key={idx} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-slate-800 text-sm font-medium">{name}</span>
                </div>
                <button
                  onClick={() => handleDelete(name)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1"
                  title="Удалить"
                >
                  <Icon name="Trash2" size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
