import React, { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { useUsers } from '@/hooks/useAdminData';
import { User, ADMIN_API } from './types';
import { TRAINING_API, authHeaders, avgPerShift } from './seniors-utils';
import SeniorCard from './SeniorCard';

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
          {seniors.map(senior => (
            <SeniorCard
              key={senior.id}
              senior={senior}
              promoters={getPromoters(senior.id)}
              isExpanded={expandedSeniorId === senior.id}
              isEditing={editingSeniorId === senior.id}
              editName={editName}
              tab={getTab(senior.id)}
              isLoading={isLoading}
              unassignedUsers={unassignedUsers}
              onToggleExpand={() => toggleExpand(senior.id)}
              onStartEdit={() => { setEditingSeniorId(senior.id); setEditName(senior.name); setError(''); }}
              onCancelEdit={() => setEditingSeniorId(null)}
              onEditNameChange={setEditName}
              onRename={() => handleRename(senior)}
              onDelete={() => handleDelete(senior)}
              onSetTab={tab => setTab(senior.id, tab)}
              onDetach={userId => handleSetSenior(userId, null)}
              onAddPromoter={handleSetSenior}
            />
          ))}
        </div>
      )}
    </div>
  );
}
