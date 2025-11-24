import React from 'react';
import type { RankingType } from './RankingFilters';

export interface ShiftDetail {
  organization_name: string;
  date: string;
  contacts: number;
}

interface UserShiftDetailsProps {
  shifts: ShiftDetail[];
  rankingType: RankingType;
}

export default function UserShiftDetails({ shifts, rankingType }: UserShiftDetailsProps) {
  if (shifts.length === 0) {
    return <div className="text-xs text-slate-400 italic">Нет смен</div>;
  }

  const displayShifts = rankingType === 'max_contacts_per_shift' 
    ? [...shifts].sort((a, b) => b.contacts - a.contacts).slice(0, 3)
    : shifts;

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {displayShifts.map((shift, idx) => (
        <div 
          key={idx}
          className={`flex items-center justify-between rounded-lg p-2 text-xs ${
            rankingType === 'max_contacts_per_shift' && idx === 0
              ? 'bg-orange-900/20 border-2 border-orange-600/50'
              : 'bg-slate-700/50'
          }`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
            {rankingType === 'max_contacts_per_shift' && idx < 3 && (
              <div className="flex-shrink-0 text-lg">
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-slate-200 truncate">
                {shift.organization_name}
              </div>
              <div className="text-slate-400 text-[10px]">
                {new Date(shift.date).toLocaleDateString('ru-RU', { 
                  day: '2-digit', 
                  month: 'short',
                  year: 'numeric'
                })}
              </div>
            </div>
          </div>
          <div className="text-center flex-shrink-0">
            <div className={`font-bold ${
              rankingType === 'max_contacts_per_shift' && idx === 0
                ? 'text-orange-400 text-base'
                : 'text-green-400'
            }`}>
              {shift.contacts}
            </div>
            <div className="text-slate-400 text-[10px]">К</div>
          </div>
        </div>
      ))}
    </div>
  );
}