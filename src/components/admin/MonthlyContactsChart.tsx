import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useMonthlyContacts } from '@/hooks/useAdminData';

interface MonthlyStats {
  month: string;
  month_name: string;
  median_contacts: number;
  days_count: number;
  total_contacts: number;
}

export default function MonthlyContactsChart() {
  const { data, isLoading } = useMonthlyContacts(true);
  const monthlyStats: MonthlyStats[] = data?.monthly_stats || [];

  if (isLoading) {
    return (
      <Card className="bg-white border-gray-200 rounded-2xl">
        <CardContent className="p-4 md:p-8">
          <div className="text-center text-gray-600 flex items-center justify-center gap-2 md:gap-3 text-sm md:text-base">
            <Icon name="Loader2" size={20} className="animate-spin md:w-6 md:h-6" />
            Загрузка статистики по месяцам...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!monthlyStats.length) {
    return null;
  }

  const maxMedian = Math.max(...monthlyStats.map(s => s.median_contacts));

  return (
    <Card className="bg-white border-gray-200 rounded-2xl slide-up hover:shadow-2xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 md:gap-3 text-gray-900 text-base md:text-xl">
          <div className="p-1.5 md:p-2 rounded-lg bg-gray-100">
            <Icon name="TrendingUp" size={18} className="text-gray-900 md:w-5 md:h-5" />
          </div>
          Медианные контакты по месяцам
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 md:space-y-4">
          {monthlyStats.map((stat) => {
            const percentage = (stat.median_contacts / maxMedian) * 100;
            const isHighest = stat.median_contacts === maxMedian;
            
            return (
              <div key={stat.month} className="space-y-1">
                <div className="flex items-center justify-between text-xs md:text-sm">
                  <span className="font-medium text-gray-700">{stat.month_name}</span>
                  <div className="flex items-center gap-2 md:gap-3">
                    <span className="text-gray-500 text-[10px] md:text-xs">
                      {stat.total_contacts} всего / {stat.days_count} дней
                    </span>
                    <span className={`font-bold ${isHighest ? 'text-green-600' : 'text-gray-900'}`}>
                      {stat.median_contacts.toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="h-6 md:h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      isHighest 
                        ? 'bg-gradient-to-r from-green-500 to-green-600' 
                        : 'bg-gradient-to-r from-blue-400 to-blue-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}