import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Stats } from './types';

interface StatsOverviewProps {
  stats: Stats;
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <Card className="border-border shadow-sm bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-card-foreground text-xl">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon name="BarChart3" size={20} className="text-primary" />
          </div>
          Общая статистика
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Общее количество */}
          <div className="text-center p-4 md:p-6 rounded-lg bg-secondary border border-border">
            <div className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {stats.total_leads}
            </div>
            <div className="text-muted-foreground text-sm md:text-base font-medium">Всего лидов</div>
          </div>

          {/* Контакты */}
          <div className="text-center p-4 md:p-6 rounded-lg bg-green-50 border border-green-200">
            <div className="text-2xl md:text-3xl font-bold text-green-700 mb-2">
              {stats.contacts}
            </div>
            <div className="text-green-600 text-sm md:text-base font-medium">Контактов</div>
          </div>

          {/* Подходы */}
          <div className="text-center p-4 md:p-6 rounded-lg bg-orange-50 border border-orange-200">
            <div className="text-2xl md:text-3xl font-bold text-orange-700 mb-2">
              {stats.approaches}
            </div>
            <div className="text-orange-600 text-sm md:text-base font-medium">Подходов</div>
          </div>
        </div>

        {/* Проценты */}
        <div className="mt-6 grid grid-cols-2 gap-4 md:gap-6 text-sm">
          <div className="flex items-center gap-2 text-foreground">
            <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            <span className="font-medium">Контакты: {stats.total_leads > 0 ? Math.round((stats.contacts / stats.total_leads) * 100) : 0}%</span>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
            <span className="font-medium">Подходы: {stats.total_leads > 0 ? Math.round((stats.approaches / stats.total_leads) * 100) : 0}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}