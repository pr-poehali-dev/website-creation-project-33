import React from 'react';
import Icon from '@/components/ui/icon';
import { UserStats } from '../types';
import UserOrgDetails, { type OrgStats } from './UserOrgDetails';
import UserShiftDetails, { type ShiftDetail } from './UserShiftDetails';
import type { RankingType } from './RankingFilters';

interface UserRankingCardProps {
  user: UserStats;
  index: number;
  rankingType: RankingType;
  isExpanded: boolean;
  orgStats: OrgStats[];
  shifts: ShiftDetail[];
  onUserClick: (email: string) => void;
}

const medals = ['🥇', '🥈', '🥉'];

export default function UserRankingCard({
  user,
  index,
  rankingType,
  isExpanded,
  orgStats,
  shifts,
  onUserClick
}: UserRankingCardProps) {
  const isTop3 = index < 3;
  const isClickable = ['avg_per_shift', 'shifts', 'max_contacts_per_shift', 'revenue'].includes(rankingType);

  return (
    <div className={`rounded-xl border transition-all overflow-hidden ${
      user.duplicates > 0
        ? 'border-red-200 bg-red-50'
        : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
    }`}>
      <div
        className={`px-4 py-3 flex items-center justify-between gap-3 ${isClickable ? 'cursor-pointer' : ''}`}
        onClick={() => onUserClick(user.email)}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 text-xl">
            {isTop3 ? medals[index] : (
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs">
                {index + 1}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-gray-800 text-sm truncate">{user.name || 'Без имени'}</div>
            <div className="text-xs text-gray-400 truncate">{user.email}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {rankingType === 'contacts' && (
            <div className="text-right">
              <div className="text-base font-bold text-emerald-500">{user.contacts}</div>
              <div className="text-[10px] text-gray-400">контактов</div>
            </div>
          )}
          {rankingType === 'shifts' && (
            <div className="flex items-center gap-1.5">
              <div className="text-right">
                <div className="text-base font-bold text-emerald-500">{user.shifts_count || 0}</div>
                <div className="text-[10px] text-gray-400">смен</div>
              </div>
              <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={14} className="text-gray-400" />
            </div>
          )}
          {rankingType === 'avg_per_shift' && (
            <div className="flex items-center gap-1.5">
              <div className="text-right">
                <div className="text-base font-bold text-emerald-500">~{user.avg_per_shift || 0}</div>
                <div className="text-[10px] text-gray-400">за смену</div>
              </div>
              <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={14} className="text-gray-400" />
            </div>
          )}
          {rankingType === 'max_contacts_per_shift' && (
            <div className="flex items-center gap-1.5">
              <div className="text-right">
                <div className="text-base font-bold text-emerald-500">{user.max_contacts_per_shift || 0}</div>
                <div className="text-[10px] text-gray-400">рекорд</div>
              </div>
              <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={14} className="text-gray-400" />
            </div>
          )}
          {rankingType === 'revenue' && (
            <div className="flex items-center gap-1.5">
              <div className="text-right">
                <div className="text-base font-bold text-emerald-500">{user.revenue || 0}₽</div>
                <div className="text-[10px] text-gray-400">доход</div>
              </div>
              <Icon name="Eye" size={14} className="text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {rankingType === 'avg_per_shift' && isExpanded && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
          <div className="text-xs font-semibold text-gray-500 mb-2">Статистика по организациям:</div>
          <UserOrgDetails orgStats={orgStats} />
        </div>
      )}

      {(rankingType === 'shifts' || rankingType === 'max_contacts_per_shift') && isExpanded && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
          <div className="text-xs font-semibold text-gray-500 mb-2">
            {rankingType === 'max_contacts_per_shift' ? 'Топ-3 смены по контактам:' : 'Все смены:'}
          </div>
          {!shifts ? (
            <div className="text-xs text-gray-400 italic">Загрузка...</div>
          ) : (
            <UserShiftDetails shifts={shifts} rankingType={rankingType} />
          )}
        </div>
      )}
    </div>
  );
}
