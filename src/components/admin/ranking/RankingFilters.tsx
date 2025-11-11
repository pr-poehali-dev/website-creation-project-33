import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

export type RankingType = 'contacts' | 'shifts' | 'avg_per_shift' | 'max_contacts_per_shift' | 'revenue';

interface RankingFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  rankingType: RankingType;
  onRankingTypeChange: (type: RankingType) => void;
}

export default function RankingFilters({
  searchQuery,
  onSearchChange,
  rankingType,
  onRankingTypeChange
}: RankingFiltersProps) {
  return (
    <>
      <div className="mb-4">
        <div className="relative">
          <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Поиск по имени или email..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          onClick={() => onRankingTypeChange('contacts')}
          variant={rankingType === 'contacts' ? 'default' : 'outline'}
          size="sm"
          className={`transition-all duration-300 ${rankingType === 'contacts'
            ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
            : 'bg-gray-100 hover:bg-gray-100 text-green-400 border-green-400/30'
          }`}
        >
          <Icon name="UserCheck" size={14} className="mr-1.5" />
          Контакты
        </Button>
        <Button
          onClick={() => onRankingTypeChange('shifts')}
          variant={rankingType === 'shifts' ? 'default' : 'outline'}
          size="sm"
          className={`transition-all duration-300 ${rankingType === 'shifts'
            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
            : 'bg-gray-100 hover:bg-gray-100 text-blue-400 border-blue-400/30'
          }`}
        >
          <Icon name="Calendar" size={14} className="mr-1.5" />
          Смены
        </Button>
        <Button
          onClick={() => onRankingTypeChange('avg_per_shift')}
          variant={rankingType === 'avg_per_shift' ? 'default' : 'outline'}
          size="sm"
          className={`transition-all duration-300 ${rankingType === 'avg_per_shift'
            ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg'
            : 'bg-gray-100 hover:bg-gray-100 text-purple-400 border-purple-400/30'
          }`}
        >
          <Icon name="TrendingUp" size={14} className="mr-1.5" />
          Средний
        </Button>
        <Button
          onClick={() => onRankingTypeChange('max_contacts_per_shift')}
          variant={rankingType === 'max_contacts_per_shift' ? 'default' : 'outline'}
          size="sm"
          className={`transition-all duration-300 ${rankingType === 'max_contacts_per_shift'
            ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg'
            : 'bg-gray-100 hover:bg-gray-100 text-orange-400 border-orange-400/30'
          }`}
        >
          <Icon name="Award" size={14} className="mr-1.5" />
          Рекорд
        </Button>
        <Button
          onClick={() => onRankingTypeChange('revenue')}
          variant={rankingType === 'revenue' ? 'default' : 'outline'}
          size="sm"
          className={`transition-all duration-300 ${rankingType === 'revenue'
            ? 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg'
            : 'bg-gray-100 hover:bg-gray-100 text-yellow-600 border-yellow-600/30'
          }`}
        >
          <Icon name="DollarSign" size={14} className="mr-1.5" />
          Доход
        </Button>
      </div>
    </>
  );
}