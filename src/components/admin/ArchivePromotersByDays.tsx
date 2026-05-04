import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatMoscowDate } from '@/utils/date';

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
  sessionToken: string;
}

interface WeeklyStats {
  weekStart: string;
  contacts: number;
}

export default function ArchivePromotersByDays({
  data,
  loading,
  byShifts = false,
  sessionToken,
}: ArchivePromotersByDaysProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPromoter, setSelectedPromoter] = useState<PromoterByDays | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

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
    return formatMoscowDate(dateStr, {
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
  const totalContacts = data.reduce((sum, p) => sum + p.contacts, 0);
  const avgDays = Math.round(totalDays / data.length);
  const avgContactsPerShift = byShifts && totalDays > 0 ? Math.round(totalContacts / totalDays) : avgDays;

  const handlePromoterClick = async (promoter: PromoterByDays) => {
    if (!byShifts) return;
    
    setSelectedPromoter(promoter);
    setLoadingStats(true);
    
    try {
      const response = await fetch(
        `https://functions.poehali.dev/6e86bd37-d9f4-4dcd-babd-21ff4d9b8a6f?action=promoter_weekly_stats&promoter=${encodeURIComponent(promoter.name)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': sessionToken,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Ошибка загрузки данных');
      }

      const result = await response.json();
      setWeeklyStats(result.data || []);
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
      setWeeklyStats([]);
    } finally {
      setLoadingStats(false);
    }
  };

  const formatWeekLabel = (weekStart: string) => {
    const date = new Date(weekStart);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 6);
    
    return `${date.getDate()}.${date.getMonth() + 1} - ${endDate.getDate()}.${endDate.getMonth() + 1}`;
  };

  const chartData = weeklyStats.map(stat => ({
    week: formatWeekLabel(stat.weekStart),
    contacts: stat.contacts,
  }));

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
              <p className={`text-lg md:text-2xl font-bold ${byShifts ? 'text-green-600' : 'text-blue-600'}`}>{byShifts ? avgContactsPerShift : avgDays}</p>
              <p className="text-xs md:text-sm text-gray-600">{byShifts ? 'Средний за смену' : 'Средний'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 md:space-y-3 max-h-[600px] overflow-y-auto scrollbar-light">
          {filteredData.map((promoter) => (
            <div
              key={promoter.rank}
              onClick={() => handlePromoterClick(promoter)}
              className={`p-3 md:p-4 rounded-xl border transition-all duration-300 hover:shadow-lg ${
                byShifts ? 'cursor-pointer' : ''
              } ${
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
                <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                  {byShifts && (
                    <div className="text-right">
                      <div className="px-2 py-1 md:px-3 md:py-1.5 rounded-lg bg-gray-100">
                        <p className="text-sm md:text-lg font-bold text-gray-700">
                          {promoter.daysWorked > 0 
                            ? Math.round(promoter.contacts / promoter.daysWorked) 
                            : 0}
                        </p>
                        <p className="text-[9px] md:text-[10px] font-medium text-gray-600">средн./смена</p>
                      </div>
                    </div>
                  )}
                  <div className="text-right">
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

      <Dialog open={selectedPromoter !== null} onOpenChange={(open) => !open && setSelectedPromoter(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Icon name="TrendingUp" size={20} className="text-green-600" />
              </div>
              <div>
                <div className="text-xl font-bold">{selectedPromoter?.name}</div>
                <div className="text-sm font-normal text-gray-600 mt-1">
                  Динамика работы по неделям
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          {loadingStats ? (
            <div className="flex items-center justify-center py-12">
              <Icon name="Loader2" size={32} className="animate-spin text-green-600" />
            </div>
          ) : weeklyStats.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <Icon name="AlertCircle" size={32} className="mx-auto mb-3 opacity-60" />
              <p>Нет данных по неделям</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4 p-4 bg-green-50 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{selectedPromoter?.daysWorked}</p>
                  <p className="text-sm text-gray-600">Всего смен</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{selectedPromoter?.contacts}</p>
                  <p className="text-sm text-gray-600">Всего контактов</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {selectedPromoter?.daysWorked && selectedPromoter.daysWorked > 0
                      ? Math.round(selectedPromoter.contacts / selectedPromoter.daysWorked)
                      : 0}
                  </p>
                  <p className="text-sm text-gray-600">Средн./смена</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Icon name="BarChart3" size={20} />
                  График контактов по неделям
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="week" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="contacts" fill="#22c55e" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Icon name="List" size={20} />
                  Детализация по неделям
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {weeklyStats.map((stat, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Icon name="Calendar" size={16} className="text-gray-500" />
                        <span className="font-medium">{formatWeekLabel(stat.weekStart)}</span>
                      </div>
                      <div className="px-3 py-1 bg-green-100 text-green-800 rounded-lg font-bold">
                        {stat.contacts}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}