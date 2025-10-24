import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface PromoterByDays {
  rank: number;
  name: string;
  daysWorked: number;
  contacts: number;
  firstDate: string;
  lastDate: string;
}

interface ArchivePromotersByDaysProps {
  data: PromoterByDays[];
  loading: boolean;
  byShifts?: boolean;
}

export default function ArchivePromotersByDays({
  data,
  loading,
  byShifts = false,
}: ArchivePromotersByDaysProps) {
  const [searchTerm, setSearchTerm] = useState('');

  if (loading) {
    return (
      <Card className="bg-white border-gray-200 rounded-2xl">
        <CardContent className="p-8">
          <div className="text-center text-gray-600 flex items-center justify-center gap-3">
            <Icon name="Loader2" size={20} className="animate-spin" />
            Загрузка рейтинга...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="bg-white border-gray-200 rounded-2xl">
        <CardContent className="p-8">
          <div className="text-center text-gray-600">
            <Icon name="AlertCircle" size={28} className="mx-auto mb-3 opacity-60" />
            <div className="text-lg font-medium">Нет данных для отображения</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredData = searchTerm
    ? data.filter((promoter) =>
        promoter.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : data;

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500';
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600';
    return 'bg-gray-100';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysText = (days: number) => {
    if (byShifts) {
      if (days === 1) return 'смена';
      if (days >= 2 && days <= 4) return 'смены';
      return 'смен';
    }
    if (days === 1) return 'день';
    if (days >= 2 && days <= 4) return 'дня';
    return 'дней';
  };

  const totalDays = data.reduce((sum, p) => sum + p.daysWorked, 0);
  const avgDays = Math.round(totalDays / data.length);

  return (
    <Card className="bg-white border-gray-200 rounded-2xl hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 md:gap-3 text-gray-900 text-base md:text-xl">
          <div className={`p-1.5 md:p-2 rounded-lg ${byShifts ? 'bg-green-100' : 'bg-blue-100'}`}>
            <Icon name={byShifts ? "CalendarCheck" : "Briefcase"} size={16} className={`md:w-5 md:h-5 ${byShifts ? 'text-green-600' : 'text-blue-600'}`} />
          </div>
          {byShifts ? 'Рейтинг промоутеров по сменам' : 'Рейтинг промоутеров по стажу'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 md:mb-6">
          <div className="relative">
            <Icon
              name="Search"
              size={16}
              className="absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 md:w-[18px] md:h-[18px]"
            />
            <Input
              placeholder="Поиск промоутера..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 md:pl-10 h-10 md:h-11 text-sm md:text-base"
            />
          </div>
        </div>

        <div className={`mb-4 md:mb-6 p-3 md:p-4 rounded-lg ${byShifts ? 'bg-green-50' : 'bg-blue-50'}`}>
          <div className="grid grid-cols-3 gap-2 md:gap-4 text-center">
            <div>
              <p className={`text-lg md:text-2xl font-bold ${byShifts ? 'text-green-600' : 'text-blue-600'}`}>{data.length}</p>
              <p className="text-xs md:text-sm text-gray-600">Промоутеров</p>
            </div>
            <div>
              <p className={`text-lg md:text-2xl font-bold ${byShifts ? 'text-green-600' : 'text-blue-600'}`}>{totalDays}</p>
              <p className="text-xs md:text-sm text-gray-600">{byShifts ? 'Всего смен' : 'Всего дней'}</p>
            </div>
            <div>
              <p className={`text-lg md:text-2xl font-bold ${byShifts ? 'text-green-600' : 'text-blue-600'}`}>{avgDays}</p>
              <p className="text-xs md:text-sm text-gray-600">Средний</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 md:space-y-3 max-h-[600px] overflow-y-auto">
          {filteredData.map((promoter) => (
            <div
              key={promoter.rank}
              className={`p-3 md:p-4 rounded-xl border transition-all duration-300 hover:shadow-lg ${
                promoter.rank <= 3
                  ? byShifts
                    ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50'
                    : 'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50'
                  : byShifts
                  ? 'border-gray-200 hover:border-green-200'
                  : 'border-gray-200 hover:border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
                  <div
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${getRankColor(
                      promoter.rank
                    )}`}
                  >
                    {promoter.rank <= 3 ? (
                      <span className="text-xl md:text-2xl">{getMedalIcon(promoter.rank)}</span>
                    ) : (
                      <span className="text-gray-700 text-sm md:text-base">#{promoter.rank}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 text-sm md:text-lg truncate">
                      {promoter.name}
                    </p>
                    <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-gray-600">
                      <Icon name="Calendar" size={12} className="flex-shrink-0 md:w-[14px] md:h-[14px]" />
                      <span className="truncate">
                        {formatDate(promoter.firstDate)} — {formatDate(promoter.lastDate)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div
                    className={`px-2 py-1 md:px-4 md:py-2 rounded-lg ${
                      promoter.rank === 1
                        ? 'bg-yellow-100 text-yellow-800'
                        : promoter.rank === 2
                        ? 'bg-gray-200 text-gray-800'
                        : promoter.rank === 3
                        ? 'bg-orange-100 text-orange-800'
                        : byShifts
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    <p className="text-lg md:text-2xl font-bold">{promoter.daysWorked}</p>
                    <p className="text-[10px] md:text-xs font-medium">{getDaysText(promoter.daysWorked)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-6 md:py-8 text-gray-600">
            <Icon name="Search" size={24} className="mx-auto mb-2 md:mb-3 opacity-40 md:w-8 md:h-8" />
            <p className="text-sm md:text-base">Промоутер не найден</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}