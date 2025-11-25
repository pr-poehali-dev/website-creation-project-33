import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface AccountingHeaderProps {
  onExport: () => void;
  onAdd: () => void;
  onRefresh: () => void;
  onFullscreen: () => void;
  exporting: boolean;
}

export default function AccountingHeader({ 
  onExport, 
  onAdd, 
  onRefresh,
  onFullscreen, 
  exporting 
}: AccountingHeaderProps) {
  return (
    <CardHeader className="pb-3 md:pb-4 bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-b border-slate-700/50">
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2 md:gap-3 text-slate-100 text-lg md:text-xl">
          <div className="p-1.5 md:p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
            <Icon name="Calculator" size={18} className="text-cyan-400 md:w-5 md:h-5" />
          </div>
          Бух.учет
        </CardTitle>
        <div className="flex gap-2">
          <button
            onClick={onFullscreen}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg"
            title="Полноэкранный режим"
          >
            <Icon name="Maximize2" size={16} />
            <span className="hidden md:inline">На весь экран</span>
          </button>
          <button
            onClick={onExport}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            title="Экспорт в Google Таблицы"
          >
            {exporting ? (
              <Icon name="Loader2" size={16} className="animate-spin" />
            ) : (
              <Icon name="Sheet" size={16} />
            )}
            <span className="hidden md:inline">{exporting ? 'Экспорт...' : 'Google Таблицы'}</span>
          </button>
          <button
            onClick={onAdd}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg"
            title="Добавить смену"
          >
            <Icon name="Plus" size={16} />
            <span className="hidden md:inline">Добавить</span>
          </button>
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg"
            title="Обновить данные"
          >
            <Icon name="RefreshCw" size={16} />
            <span className="hidden md:inline">Обновить</span>
          </button>
        </div>
      </div>
    </CardHeader>
  );
}