import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface AccountingHeaderProps {
  onExport: () => void;
  onAdd: () => void;
  onFullscreen: () => void;
  exporting: boolean;
}

export default function AccountingHeader({ 
  onExport, 
  onAdd, 
  onFullscreen, 
  exporting
}: AccountingHeaderProps) {
  return (
    <CardHeader className="pb-3 md:pb-4 bg-white border-b border-gray-100">
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2 md:gap-3 text-gray-800 text-lg md:text-xl">
          <div className="p-1.5 md:p-2 rounded-lg bg-blue-50 border border-blue-100">
            <Icon name="Calculator" size={18} className="text-blue-600 md:w-5 md:h-5" />
          </div>
          Бух.учет
        </CardTitle>
        <div className="flex gap-2">
          <button
            onClick={onFullscreen}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm"
            title="Полноэкранный режим"
          >
            <Icon name="Maximize2" size={16} />
            <span className="hidden md:inline">На весь экран</span>
          </button>
          <button
            onClick={onExport}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm"
            title="Добавить смену"
          >
            <Icon name="Plus" size={16} />
            <span className="hidden md:inline">Добавить</span>
          </button>
        </div>
      </div>
    </CardHeader>
  );
}