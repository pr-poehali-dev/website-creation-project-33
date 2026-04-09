import React from 'react';
import Icon from '@/components/ui/icon';
import { User } from './types';
import { avgPerShift } from './seniors-utils';
import SeniorTeamSection from './SeniorTeamSection';
import SeniorKpdSection from './SeniorKpdSection';

interface Senior {
  id: number;
  name: string;
}

interface Props {
  senior: Senior;
  promoters: User[];
  isExpanded: boolean;
  isEditing: boolean;
  editName: string;
  tab: 'team' | 'kpd';
  isLoading: boolean;
  unassignedUsers: User[];
  onToggleExpand: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onEditNameChange: (v: string) => void;
  onRename: () => void;
  onDelete: () => void;
  onSetTab: (t: 'team' | 'kpd') => void;
  onDetach: (userId: number) => void;
  onAddPromoter: (userId: number, seniorId: number) => void;
}

export default function SeniorCard({
  senior, promoters, isExpanded, isEditing, editName, tab,
  isLoading, unassignedUsers,
  onToggleExpand, onStartEdit, onCancelEdit, onEditNameChange,
  onRename, onDelete, onSetTab, onDetach, onAddPromoter,
}: Props) {
  const count = promoters.length;
  const totalShifts = promoters.reduce((s, u) => s + (u.shifts_count || 0), 0);
  const totalContacts = promoters.reduce((s, u) => s + (u.lead_count || 0), 0);
  const seniorAvg = totalShifts > 0 ? Math.round((totalContacts / totalShifts) * 10) / 10 : 0;

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${isExpanded ? 'border-blue-200 shadow-md shadow-blue-50' : 'border-slate-100 shadow-sm hover:border-slate-200'}`}>
      {/* Строка старшего */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer"
        onClick={() => !isEditing && onToggleExpand()}
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
              onChange={e => onEditNameChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') onRename(); if (e.key === 'Escape') onCancelEdit(); }}
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
              <button onClick={onRename} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors">
                <Icon name="Check" size={15} />
              </button>
              <button onClick={onCancelEdit} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors">
                <Icon name="X" size={15} />
              </button>
            </>
          ) : (
            <>
              <button onClick={onStartEdit} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                <Icon name="Pencil" size={14} />
              </button>
              <button onClick={onToggleExpand} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors">
                <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={15} />
              </button>
              <button onClick={onDelete} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
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
                onClick={() => onSetTab(t)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all -mb-px ${tab === t ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                <Icon name={t === 'team' ? 'Users' : 'BarChart2'} size={13} />
                {t === 'team' ? 'Команда' : 'КПД'}
              </button>
            ))}
          </div>

          <div className="p-4">
            {tab === 'team' && (
              <SeniorTeamSection
                promoters={promoters}
                totalShifts={totalShifts}
                totalContacts={totalContacts}
                seniorAvg={seniorAvg}
                isLoading={isLoading}
                unassignedUsers={unassignedUsers}
                seniorId={senior.id}
                onDetach={onDetach}
                onAddPromoter={onAddPromoter}
              />
            )}
            {tab === 'kpd' && (
              <SeniorKpdSection seniorId={senior.id} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}