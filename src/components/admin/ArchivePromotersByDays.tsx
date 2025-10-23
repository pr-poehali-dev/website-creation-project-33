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
}

export default function ArchivePromotersByDays({
  data,
  loading,
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
    if (days === 1) return 'день';
    if (days >= 2 && days <= 4) return 'дня';
    return 'дней';
  };

  const totalDays = data.reduce((sum, p) => sum + p.daysWorked, 0);
  const avgDays = Math.round(totalDays / data.length);

  return (
    <Card className="bg-white border-gray-200 rounded-2xl hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-gray-900 text-xl">
          <div className="p-2 rounded-lg bg-blue-100">
            <Icon name="Briefcase" size={20} className="text-blue-600" />
          </div>
          Рейтинг промоутеров по стажу
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="relative">
            <Icon
              name="Search"
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <Input
              placeholder="Поиск промоутера..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{data.length}</p>
              <p className="text-sm text-gray-600">Промоутеров</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{totalDays}</p>
              <p className="text-sm text-gray-600">Всего дней</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{avgDays}</p>
              <p className="text-sm text-gray-600">Средний стаж</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filteredData.map((promoter) => (
            <div
              key={promoter.rank}
              className={`p-4 rounded-xl border transition-all duration-300 hover:shadow-lg ${
                promoter.rank <= 3
                  ? 'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50'
                  : 'border-gray-200 hover:border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getRankColor(
                      promoter.rank
                    )}`}
                  >
                    {promoter.rank <= 3 ? (
                      <span className="text-2xl">{getMedalIcon(promoter.rank)}</span>
                    ) : (
                      <span className="text-gray-700">#{promoter.rank}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">
                      {promoter.name}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Icon name="Calendar" size={14} />
                      <span>
                        {formatDate(promoter.firstDate)} — {formatDate(promoter.lastDate)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      promoter.rank === 1
                        ? 'bg-yellow-100 text-yellow-800'
                        : promoter.rank === 2
                        ? 'bg-gray-200 text-gray-800'
                        : promoter.rank === 3
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    <p className="text-2xl font-bold">{promoter.daysWorked}</p>
                    <p className="text-xs font-medium">{getDaysText(promoter.daysWorked)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-8 text-gray-600">
            <Icon name="Search" size={32} className="mx-auto mb-3 opacity-40" />
            <p>Промоутер не найден</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
