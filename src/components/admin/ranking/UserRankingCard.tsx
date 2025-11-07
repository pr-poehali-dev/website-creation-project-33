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
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div 
      className={`border-2 rounded-xl transition-all duration-300 shadow-md hover:shadow-xl ${
        user.duplicates > 0 
          ? 'border-red-500/50 bg-red-50' 
          : 'border-gray-200 bg-white'
      }`}
    >
      <div 
        className={`p-3 md:p-4 flex items-center justify-between gap-2 ${
          (rankingType === 'avg_per_shift' || rankingType === 'shifts' || rankingType === 'max_contacts_per_shift') ? 'cursor-pointer hover:bg-gray-50' : ''
        }`}
        onClick={() => onUserClick(user.email)}
      >
        <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
          <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 md:w-14 md:h-14 text-2xl md:text-3xl">
            {isTop3 ? medals[index] : (
              <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 text-gray-600 font-bold text-sm">
                {index + 1}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-black text-base md:text-lg truncate">
              {user.name || 'Без имени'}
            </div>
            <div className="text-xs md:text-sm text-gray-600 truncate">
              {user.email}
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="flex justify-end gap-1.5 md:gap-2 text-xs">
            {rankingType === 'contacts' && (
              <div className="text-center">
                <div className="text-xs md:text-sm font-bold text-green-600">К: {user.contacts}</div>
                <div className="text-[10px] md:text-xs text-gray-600 whitespace-nowrap">контакт</div>
              </div>
            )}
            {rankingType === 'shifts' && (
              <>
                <div className="text-center">
                  <div className="text-xs md:text-sm font-bold text-blue-600">{user.shifts_count || 0}</div>
                  <div className="text-[10px] md:text-xs text-gray-600 whitespace-nowrap">смен</div>
                </div>
                <Icon 
                  name={isExpanded ? "ChevronUp" : "ChevronDown"} 
                  size={16} 
                  className="text-gray-400 ml-2"
                />
              </>
            )}
            {rankingType === 'avg_per_shift' && (
              <>
                <div className="text-center">
                  <div className="text-xs md:text-sm font-bold text-purple-600">~{user.avg_per_shift || 0}</div>
                  <div className="text-[10px] md:text-xs text-gray-600 whitespace-nowrap">за см</div>
                </div>
                <Icon 
                  name={isExpanded ? "ChevronUp" : "ChevronDown"} 
                  size={16} 
                  className="text-gray-400 ml-2"
                />
              </>
            )}
            {rankingType === 'max_contacts_per_shift' && (
              <div className="text-center">
                <div className="text-xs md:text-sm font-bold text-orange-600">{user.max_contacts_per_shift || 0}</div>
                <div className="text-[10px] md:text-xs text-gray-600 whitespace-nowrap">рекорд</div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {rankingType === 'avg_per_shift' && isExpanded && (
        <div className="border-t border-gray-200 mt-3 pt-3 px-3 md:px-4 pb-3">
          <div className="text-xs font-semibold text-gray-600 mb-2">Статистика по организациям:</div>
          <UserOrgDetails orgStats={orgStats} />
        </div>
      )}
      
      {(rankingType === 'shifts' || rankingType === 'max_contacts_per_shift') && isExpanded && (
        <div className="border-t border-gray-200 mt-3 pt-3 px-3 md:px-4 pb-3">
          <div className="text-xs font-semibold text-gray-600 mb-2">
            {rankingType === 'max_contacts_per_shift' ? 'Топ-3 смены по контактам:' : 'Все смены:'}
          </div>
          {!shifts ? (
            <div className="text-xs text-gray-500 italic">Загрузка...</div>
          ) : (
            <UserShiftDetails shifts={shifts} rankingType={rankingType} />
          )}
        </div>
      )}
    </div>
  );
}
