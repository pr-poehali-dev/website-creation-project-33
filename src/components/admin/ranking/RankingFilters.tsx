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
          <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Поиск по имени или email..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-cyan-500"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          onClick={() => onRankingTypeChange('contacts')}
          variant={rankingType === 'contacts' ? 'default' : 'outline'}
          size="sm"
          className={`transition-all duration-300 ${rankingType === 'contacts'
            ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
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
            ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
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
            ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
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
            ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
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
            ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
        >
          <Icon name="DollarSign" size={14} className="mr-1.5" />
          Доход
        </Button>
      </div>
    </>
  );
}