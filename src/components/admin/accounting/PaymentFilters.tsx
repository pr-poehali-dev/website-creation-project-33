import React from 'react';
import Icon from '@/components/ui/icon';

interface PaymentFiltersProps {
  filters: {
    paid_by_organization: boolean | null;
    paid_to_worker: boolean | null;
    paid_kvv: boolean | null;
    paid_kms: boolean | null;
  };
  onFilterChange: (key: keyof PaymentFiltersProps['filters']) => void;
  activeCount: number;
}

export default function PaymentFilters({ filters, onFilterChange, activeCount }: PaymentFiltersProps) {
  const getFilterIcon = (value: boolean | null) => {
    if (value === null) return 'Circle';
    if (value === true) return 'CheckCircle2';
    return 'XCircle';
  };

  const getFilterColor = (value: boolean | null) => {
    if (value === null) return 'text-gray-400';
    if (value === true) return 'text-green-600';
    return 'text-red-600';
  };

  const getFilterLabel = (value: boolean | null) => {
    if (value === null) return 'Все';
    if (value === true) return 'Да';
    return 'Нет';
  };

  return (
    <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Icon name="Filter" size={16} />
          Фильтры по оплатам
          {activeCount > 0 && (
            <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
              {activeCount}
            </span>
          )}
        </h3>
        {activeCount > 0 && (
          <button
            onClick={() => {
              onFilterChange('paid_by_organization');
              onFilterChange('paid_to_worker');
              onFilterChange('paid_kvv');
              onFilterChange('paid_kms');
            }}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Icon name="X" size={14} />
            Сбросить все
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => onFilterChange('paid_by_organization')}
          className="flex items-center gap-2 p-2 rounded-lg border border-gray-300 hover:border-blue-500 transition-colors bg-white"
        >
          <Icon 
            name={getFilterIcon(filters.paid_by_organization)} 
            size={18} 
            className={getFilterColor(filters.paid_by_organization)}
          />
          <div className="flex flex-col items-start">
            <span className="text-xs text-gray-600">Опл. орг.</span>
            <span className={`text-sm font-medium ${getFilterColor(filters.paid_by_organization)}`}>
              {getFilterLabel(filters.paid_by_organization)}
            </span>
          </div>
        </button>

        <button
          onClick={() => onFilterChange('paid_to_worker')}
          className="flex items-center gap-2 p-2 rounded-lg border border-gray-300 hover:border-blue-500 transition-colors bg-white"
        >
          <Icon 
            name={getFilterIcon(filters.paid_to_worker)} 
            size={18} 
            className={getFilterColor(filters.paid_to_worker)}
          />
          <div className="flex flex-col items-start">
            <span className="text-xs text-gray-600">Опл. испол.</span>
            <span className={`text-sm font-medium ${getFilterColor(filters.paid_to_worker)}`}>
              {getFilterLabel(filters.paid_to_worker)}
            </span>
          </div>
        </button>

        <button
          onClick={() => onFilterChange('paid_kvv')}
          className="flex items-center gap-2 p-2 rounded-lg border border-gray-300 hover:border-blue-500 transition-colors bg-white"
        >
          <Icon 
            name={getFilterIcon(filters.paid_kvv)} 
            size={18} 
            className={getFilterColor(filters.paid_kvv)}
          />
          <div className="flex flex-col items-start">
            <span className="text-xs text-gray-600">Опл. КВВ</span>
            <span className={`text-sm font-medium ${getFilterColor(filters.paid_kvv)}`}>
              {getFilterLabel(filters.paid_kvv)}
            </span>
          </div>
        </button>

        <button
          onClick={() => onFilterChange('paid_kms')}
          className="flex items-center gap-2 p-2 rounded-lg border border-gray-300 hover:border-blue-500 transition-colors bg-white"
        >
          <Icon 
            name={getFilterIcon(filters.paid_kms)} 
            size={18} 
            className={getFilterColor(filters.paid_kms)}
          />
          <div className="flex flex-col items-start">
            <span className="text-xs text-gray-600">Опл. КМС</span>
            <span className={`text-sm font-medium ${getFilterColor(filters.paid_kms)}`}>
              {getFilterLabel(filters.paid_kms)}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
