import React from 'react';
import Icon from '@/components/ui/icon';
import { User } from './types';
import { avgPerShift, promoterStatus, STATUS_STYLES } from './seniors-utils';

interface Props {
  promoters: User[];
  totalShifts: number;
  totalContacts: number;
  seniorAvg: number;
  isLoading: boolean;
  unassignedUsers: User[];
  seniorId: number;
  onDetach: (userId: number) => void;
  onAddPromoter: (userId: number, seniorId: number) => void;
}

export default function SeniorTeamSection({
  promoters, totalShifts, totalContacts, seniorAvg,
  isLoading, unassignedUsers, seniorId, onDetach, onAddPromoter,
}: Props) {
  const count = promoters.length;

  return (
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
                <button onClick={() => onDetach(u.id)} className="text-slate-200 hover:text-red-400 transition-colors flex justify-center">
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
            onChange={e => { if (e.target.value) { onAddPromoter(Number(e.target.value), seniorId); e.target.value = ''; } }}
          >
            <option value="" disabled>+ Добавить промоутера</option>
            {unassignedUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}
