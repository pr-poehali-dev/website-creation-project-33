import React from 'react';
import Icon from '@/components/ui/icon';
import { Stats } from './types';

interface StatsOverviewProps {
  stats: Stats;
  onExportAll?: () => void;
  exportingAll?: boolean;
}

export default function StatsOverview({ stats, onExportAll, exportingAll }: StatsOverviewProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Icon name="BarChart3" size={18} className="text-emerald-500" />
          </div>
          <h2 className="font-semibold text-gray-800 text-base">Общая статистика</h2>
        </div>
        {onExportAll && (
          <button
            onClick={onExportAll}
            disabled={exportingAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-medium border border-gray-100 transition-colors disabled:opacity-50"
          >
            {exportingAll ? (
              <><Icon name="Loader2" size={13} className="animate-spin" /><span>Экспорт...</span></>
            ) : (
              <><Icon name="Sheet" size={13} /><span className="hidden sm:inline">Экспорт всей статистики</span><span className="sm:hidden">Экспорт</span></>
            )}
          </button>
        )}
      </div>
      <div className="p-5 flex justify-center">
        <div className="text-center px-10 py-6 rounded-2xl bg-emerald-50 border border-emerald-100 min-w-[180px]">
          <div className="text-4xl font-bold text-emerald-500 mb-1">{stats.contacts}</div>
          <div className="text-gray-500 text-sm font-medium">Контактов</div>
        </div>
      </div>
    </div>
  );
}
