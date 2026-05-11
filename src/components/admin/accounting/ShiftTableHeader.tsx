import React, { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import FilterableHeader from './FilterableHeader';
import MultiSelectHeader from './MultiSelectHeader';
import PaymentTypeHeader from './PaymentTypeHeader';
import DateFilterHeader from './DateFilterHeader';
import { TableStatistics } from './ShiftTableCalculations';

function InvoicePartyFilterHeader({
  filterValue,
  onFilterChange
}: {
  filterValue: 'kms' | 'kvv' | null;
  onFilterChange: (v: 'kms' | 'kvv' | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const iconName = filterValue === null ? 'Filter' : 'FilterX';
  const iconColor = filterValue !== null ? 'text-blue-600' : 'text-gray-400';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 hover:bg-gray-100 px-1 py-0.5 rounded transition-colors w-full justify-center text-gray-700"
      >
        <span>Счёт</span>
        <Icon name={iconName} size={14} className={iconColor} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[1000] min-w-[100px]">
          {([null, 'kms', 'kvv'] as const).map((val) => (
            <button
              key={String(val)}
              onClick={() => { onFilterChange(val); setIsOpen(false); }}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-xs text-gray-700 border-t border-gray-100 first:border-0"
            >
              <Icon
                name={filterValue === val ? 'CheckCircle2' : 'Circle'}
                size={16}
                className={filterValue === val ? 'text-blue-600' : 'text-gray-400'}
              />
              {val === null ? 'Все' : val === 'kms' ? 'КМС' : 'КВВ'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface ShiftTableHeaderProps {
  stats: TableStatistics;
  filters: {
    paid_by_organization: boolean | null;
    paid_to_worker: boolean | null;
    paid_kvv: boolean | null;
    paid_kms: boolean | null;
    invoice_issued: boolean | null;
  };
  invoicePartyFilter: 'kms' | 'kvv' | null;
  onInvoicePartyFilterChange: (value: 'kms' | 'kvv' | null) => void;
  organizationFilter: string[];
  promoterFilter: string[];
  paymentTypeFilter: ('cash' | 'cashless')[];
  dateFilter: { from: string; to: string };
  uniqueOrganizations: string[];
  uniquePromoters: string[];
  onFilterChange: (key: 'paid_by_organization' | 'paid_to_worker' | 'paid_kvv' | 'paid_kms' | 'invoice_issued') => void;
  onOrganizationFilterChange: (values: string[]) => void;
  onPromoterFilterChange: (values: string[]) => void;
  onPaymentTypeFilterChange: (types: ('cash' | 'cashless')[]) => void;
  onDateFilterChange: (from: string, to: string) => void;
}

export default function ShiftTableHeader({
  stats,
  filters,
  invoicePartyFilter,
  onInvoicePartyFilterChange,
  organizationFilter,
  promoterFilter,
  paymentTypeFilter,
  dateFilter,
  uniqueOrganizations,
  uniquePromoters,
  onFilterChange,
  onOrganizationFilterChange,
  onPromoterFilterChange,
  onPaymentTypeFilterChange,
  onDateFilterChange
}: ShiftTableHeaderProps) {
  return (
    <thead>
      <tr className="bg-gray-50 text-gray-700 border-b border-gray-200 text-[10px] md:text-xs">
        <th className="border border-gray-200 p-1 md:p-2 text-left whitespace-nowrap">
          <DateFilterHeader
            label="Дата"
            dateFrom={dateFilter.from}
            dateTo={dateFilter.to}
            onDateChange={onDateFilterChange}
          />
        </th>
        <th className="border border-gray-200 p-1 md:p-2 text-left whitespace-nowrap">Время</th>
        <th className="border border-gray-200 p-1 md:p-2 text-left whitespace-nowrap">
          <MultiSelectHeader
            label="Организация"
            options={uniqueOrganizations}
            selectedValues={organizationFilter}
            onSelectionChange={onOrganizationFilterChange}
          />
        </th>
        <th className="border border-gray-200 p-1 md:p-2 text-center whitespace-nowrap">
          <InvoicePartyFilterHeader
            filterValue={invoicePartyFilter}
            onFilterChange={onInvoicePartyFilterChange}
          />
        </th>
        <th className="border border-gray-200 p-1 md:p-2 text-right whitespace-nowrap">
          <div>Сумма прихода</div>
          <div className="text-[8px] md:text-[9px] text-gray-500 mt-0.5">+ Компенсация</div>
          <div className="text-gray-800 font-bold mt-0.5 md:mt-1 text-[9px] md:text-xs">{stats.totalRevenue.toLocaleString('ru-RU')} ₽</div>
        </th>
        <th className="border border-gray-200 p-1 md:p-2 text-center whitespace-nowrap">
          <PaymentTypeHeader
            label="Оплата"
            selectedTypes={paymentTypeFilter}
            onSelectionChange={onPaymentTypeFilterChange}
          />
        </th>
        <th className="border border-gray-200 p-1 md:p-2 text-right whitespace-nowrap">
          <div>Налог 7%</div>
          <div className="text-gray-800 font-bold mt-0.5 md:mt-1 text-[9px] md:text-xs">{stats.totalTax.toLocaleString('ru-RU')} ₽</div>
        </th>
        <th className="border border-gray-200 p-1 md:p-2 text-right whitespace-nowrap">
          <div>После налога</div>
          <div className="text-gray-800 font-bold mt-0.5 md:mt-1 text-[9px] md:text-xs">{stats.totalAfterTax.toLocaleString('ru-RU')} ₽</div>
        </th>
        <th className="border border-gray-200 p-1 md:p-2 text-left whitespace-nowrap">
          <MultiSelectHeader
            label="Промоутер"
            options={uniquePromoters}
            selectedValues={promoterFilter}
            onSelectionChange={onPromoterFilterChange}
          />
        </th>
        <th className="border border-gray-200 p-1 md:p-2 text-center whitespace-nowrap text-[9px] md:text-xs text-gray-500">
          Статус
        </th>
        <th className="border border-gray-200 p-1 md:p-2 text-right whitespace-nowrap">
          <div>Контакты</div>
          <div className="text-gray-800 font-bold mt-0.5 md:mt-1 text-[9px] md:text-xs">{stats.totalContacts}</div>
        </th>
        <th className="border border-gray-200 p-1 md:p-2 text-right whitespace-nowrap">
          <div>Зарплата</div>
          <div className="text-gray-800 font-bold mt-0.5 md:mt-1 text-[9px] md:text-xs">{stats.totalSalary.toLocaleString('ru-RU')} ₽</div>
          <div className="text-gray-800 font-bold mt-0.5 md:mt-1 text-[9px] md:text-[10px]">Долг: {stats.unpaidSalary.toLocaleString('ru-RU')} ₽</div>
        </th>

        <th className="border border-gray-200 p-1 md:p-2 text-right whitespace-nowrap">Расход</th>
        <th className="border border-gray-200 p-1 md:p-2 text-left whitespace-nowrap">Комментарий</th>
        <th className="border border-gray-200 p-1 md:p-2 text-right whitespace-nowrap bg-emerald-50">
          <div>Чистый остаток</div>
          <div className="text-emerald-700 font-bold mt-0.5 md:mt-1 text-[9px] md:text-xs">{stats.totalNetProfit.toLocaleString('ru-RU')} ₽</div>
        </th>
        <th className="border border-gray-200 p-1 md:p-2 text-right whitespace-nowrap bg-blue-50">
          <div>КВВ</div>
          <div className="text-blue-700 font-bold mt-0.5 md:mt-1 text-[9px] md:text-xs">{stats.totalKVV.toLocaleString('ru-RU')} ₽</div>
        </th>
        <th className="border border-gray-200 p-1 md:p-2 text-right whitespace-nowrap bg-purple-50">
          <div>КМС</div>
          <div className="text-purple-700 font-bold mt-0.5 md:mt-1 text-[9px] md:text-xs">{stats.totalKMS.toLocaleString('ru-RU')} ₽</div>
        </th>
        <th className="border border-gray-200 p-1 md:p-2 text-center whitespace-nowrap">
          <FilterableHeader 
            label="Опл. орг." 
            filterValue={filters.paid_by_organization}
            onFilterChange={() => onFilterChange('paid_by_organization')}
          />
          <div className="text-gray-800 font-bold mt-0.5 md:mt-1 text-[9px] md:text-[10px]">Ожидаем: {stats.expectedRevenue.toLocaleString('ru-RU')} ₽</div>
        </th>
        <th className="border border-gray-200 p-1 md:p-2 text-center whitespace-nowrap">
          <FilterableHeader 
            label="Опл. испол." 
            filterValue={filters.paid_to_worker}
            onFilterChange={() => onFilterChange('paid_to_worker')}
          />
          <div className="text-gray-800 font-bold mt-0.5 md:mt-1 text-[9px] md:text-[10px]">Общий долг: {(stats.unpaidSalaryCashless + stats.unpaidSalaryCash + stats.salaryAtKVV).toLocaleString('ru-RU')} ₽</div>
          <div className="text-gray-800 font-bold mt-0.5 md:mt-1 text-[9px] md:text-[10px]">Долг б/нал: {stats.unpaidSalaryCashless.toLocaleString('ru-RU')} ₽</div>
          <div className="text-gray-800 font-bold mt-0.5 text-[9px] md:text-[10px]">Долг нал: {stats.unpaidSalaryCash.toLocaleString('ru-RU')} ₽</div>
          <div className="text-gray-800 font-bold mt-0.5 md:mt-1 text-[9px] md:text-[10px]">У КВВ: {stats.salaryAtKVV.toLocaleString('ru-RU')} ₽</div>
        </th>
        <th className="border border-gray-200 p-1 md:p-2 text-center whitespace-nowrap">
          <FilterableHeader 
            label="Опл. КВВ" 
            filterValue={filters.paid_kvv}
            onFilterChange={() => onFilterChange('paid_kvv')}
          />
          <div className="text-gray-800 font-bold mt-0.5 md:mt-1 text-[9px] md:text-[10px]">Долг б/нал: {stats.unpaidKVVCashless.toLocaleString('ru-RU')} ₽</div>
          <div className="text-gray-800 font-bold mt-0.5 text-[9px] md:text-[10px]">Долг нал: {stats.unpaidKVVCash.toLocaleString('ru-RU')} ₽</div>
        </th>
        <th className="border border-gray-200 p-1 md:p-2 text-center whitespace-nowrap">
          <FilterableHeader 
            label="Опл. КМС" 
            filterValue={filters.paid_kms}
            onFilterChange={() => onFilterChange('paid_kms')}
          />
          <div className="text-gray-800 font-bold mt-0.5 md:mt-1 text-[9px] md:text-[10px]">Долг б/нал: {stats.unpaidKMSCashless.toLocaleString('ru-RU')} ₽</div>
          <div className="text-gray-800 font-bold mt-0.5 text-[9px] md:text-[10px]">Долг нал: {stats.unpaidKMSCash.toLocaleString('ru-RU')} ₽</div>
        </th>
        <th className="border border-gray-200 p-1 md:p-2 text-center whitespace-nowrap">Действия</th>
      </tr>
    </thead>
  );
}