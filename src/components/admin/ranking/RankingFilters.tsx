import React from 'react';
import Icon from '@/components/ui/icon';

export type RankingType = 'contacts' | 'shifts' | 'avg_per_shift' | 'max_contacts_per_shift' | 'revenue';

interface RankingFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  rankingType: RankingType;
  onRankingTypeChange: (type: RankingType) => void;
  showOnlyActive: boolean;
  onShowOnlyActiveChange: (showOnlyActive: boolean) => void;
}

const RANKING_TABS: { type: RankingType; icon: string; label: string }[] = [
  { type: 'contacts', icon: 'UserCheck', label: 'Контакты' },
  { type: 'shifts', icon: 'Calendar', label: 'Смены' },
  { type: 'avg_per_shift', icon: 'TrendingUp', label: 'Средний' },
  { type: 'max_contacts_per_shift', icon: 'Award', label: 'Рекорд' },
  { type: 'revenue', icon: 'DollarSign', label: 'Доход' },
];

export default function RankingFilters({
  searchQuery,
  onSearchChange,
  rankingType,
  onRankingTypeChange,
  showOnlyActive,
  onShowOnlyActiveChange
}: RankingFiltersProps) {
  return (
    <div className="space-y-3 mb-4">
      <div className="relative">
        <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Поиск по имени или email..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-blue-300 focus:bg-white transition-colors"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {RANKING_TABS.map(tab => (
          <button
            key={tab.type}
            onClick={() => onRankingTypeChange(tab.type)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              rankingType === tab.type
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Icon name={tab.icon} size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
        <Icon name="Users" size={14} className="text-gray-400" />
        <span className="text-xs text-gray-500 mr-auto">Показывать:</span>
        <button
          onClick={() => onShowOnlyActiveChange(true)}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            showOnlyActive ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-200'
          }`}
        >
          Активные
        </button>
        <button
          onClick={() => onShowOnlyActiveChange(false)}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            !showOnlyActive ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-200'
          }`}
        >
          Все
        </button>
      </div>
    </div>
  );
}
