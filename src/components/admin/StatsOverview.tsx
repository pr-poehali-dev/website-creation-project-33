import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Stats } from './types';

interface StatsOverviewProps {
  stats: Stats;
  onExportAll?: () => void;
  exportingAll?: boolean;
}

export default function StatsOverview({ stats, onExportAll, exportingAll }: StatsOverviewProps) {
  return (
    <Card className="bg-slate-900 border-slate-700 rounded-2xl slide-up hover:shadow-2xl transition-all duration-300">
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2 md:gap-3 text-slate-100 text-base md:text-xl">
            <div className="p-1.5 md:p-2 rounded-lg bg-slate-800">
              <Icon name="BarChart3" size={18} className="text-cyan-400 md:w-5 md:h-5" />
            </div>
            Общая статистика
          </CardTitle>
          {onExportAll && (
            <Button
              onClick={onExportAll}
              disabled={exportingAll}
              className="glass-button bg-slate-800 hover:bg-slate-700 text-slate-100 shadow-lg transition-all duration-300 hover:scale-105 w-full md:w-auto text-sm md:text-base border border-slate-700"
              size="sm"
            >
              {exportingAll ? (
                <>
                  <Icon name="Loader2" size={14} className="mr-2 animate-spin md:w-[14px] md:h-[14px]" />
                  Экспорт...
                </>
              ) : (
                <>
                  <Icon name="Sheet" size={14} className="mr-2 md:w-[14px] md:h-[14px]" />
                  Экспорт всей статистики
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          {/* Контакты */}
          <div className="text-center p-6 md:p-8 rounded-xl bg-slate-800/50 border-2 border-green-400/30 transition-all duration-300 hover:shadow-lg hover:scale-105 min-w-[200px]">
            <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">
              {stats.contacts}
            </div>
            <div className="text-slate-300 text-base md:text-lg font-medium">Контактов</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}