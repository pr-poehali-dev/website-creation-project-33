import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Stats } from './types';

interface StatsOverviewProps {
  stats: Stats;
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <Card className="border-gray-200 shadow-lg bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-black text-xl">
          <div className="p-2 rounded-lg bg-gray-100">
            <Icon name="BarChart3" size={20} className="text-gray-600" />
          </div>
          Общая статистика
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Общее количество */}
          <div className="text-center p-4 md:p-6 rounded-xl bg-gray-50 border border-gray-100">
            <div className="text-2xl md:text-3xl font-bold text-black mb-2">
              {stats.total_leads}
            </div>
            <div className="text-gray-600 text-sm md:text-base">Всего лидов</div>
          </div>

          {/* Контакты */}
          <div className="text-center p-4 md:p-6 rounded-xl bg-green-50 border border-green-100">
            <div className="text-2xl md:text-3xl font-bold text-green-600 mb-2">
              {stats.contacts}
            </div>
            <div className="text-gray-600 text-sm md:text-base">Контактов</div>
          </div>

          {/* Подходы */}
          <div className="text-center p-4 md:p-6 rounded-xl bg-orange-50 border border-orange-100">
            <div className="text-2xl md:text-3xl font-bold text-orange-600 mb-2">
              {stats.approaches}
            </div>
            <div className="text-gray-600 text-sm md:text-base">Подходов</div>
          </div>
        </div>

        {/* Проценты */}
        <div className="mt-6 grid grid-cols-2 gap-4 md:gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            <span>Контакты: {stats.total_leads > 0 ? Math.round((stats.contacts / stats.total_leads) * 100) : 0}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
            <span>Подходы: {stats.total_leads > 0 ? Math.round((stats.approaches / stats.total_leads) * 100) : 0}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}