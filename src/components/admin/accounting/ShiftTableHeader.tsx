import React from 'react';
import FilterableHeader from './FilterableHeader';
import MultiSelectHeader from './MultiSelectHeader';
import PaymentTypeHeader from './PaymentTypeHeader';
import DateFilterHeader from './DateFilterHeader';
import { TableStatistics } from './ShiftTableCalculations';

interface ShiftTableHeaderProps {
  stats: TableStatistics;
  filters: {
    paid_by_organization: boolean | null;
    paid_to_worker: boolean | null;
    paid_kvv: boolean | null;
    paid_kms: boolean | null;
    invoice_issued: boolean | null;
  };
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
      <tr className="bg-gray-100 text-gray-700">
        <th className="border border-gray-300 p-1 md:p-2 text-left whitespace-nowrap">
          <DateFilterHeader
            label="Дата"
            dateFrom={dateFilter.from}
            dateTo={dateFilter.to}
            onDateChange={onDateFilterChange}
          />
        </th>
        <th className="border border-gray-300 p-1 md:p-2 text-left whitespace-nowrap">Время</th>
        <th className="border border-gray-300 p-1 md:p-2 text-left whitespace-nowrap">
          <MultiSelectHeader
            label="Организация"
            options={uniqueOrganizations}
            selectedValues={organizationFilter}
            onSelectionChange={onOrganizationFilterChange}
          />
        </th>
        <th className="border border-gray-300 p-1 md:p-2 text-center whitespace-nowrap">
          <div className="flex flex-col">
            <div className="border-b border-gray-300 pb-1 mb-1">Счёт</div>
            <div className="flex gap-2 text-[10px] font-normal">
              <div className="flex-1 text-center">Выставлен</div>
              <div className="flex-1 text-center">Оплачен</div>
            </div>
          </div>
        </th>
        <th className="border border-gray-300 p-1 md:p-2 text-right whitespace-nowrap">
          <div>Сумма прихода</div>
          <div className="text-green-600 font-bold mt-1">{stats.totalRevenue.toLocaleString('ru-RU')} ₽</div>
        </th>
        <th className="border border-gray-300 p-1 md:p-2 text-center whitespace-nowrap">
          <PaymentTypeHeader
            label="Оплата"
            selectedTypes={paymentTypeFilter}
            onSelectionChange={onPaymentTypeFilterChange}
          />
        </th>
        <th className="border border-gray-300 p-1 md:p-2 text-right whitespace-nowrap">
          <div>Налог 7%</div>
          <div className="text-red-600 font-bold mt-1">{stats.totalTax.toLocaleString('ru-RU')} ₽</div>
        </th>
        <th className="border border-gray-300 p-1 md:p-2 text-right whitespace-nowrap">
          <div>После налога</div>
          <div className="text-blue-600 font-bold mt-1">{stats.totalAfterTax.toLocaleString('ru-RU')} ₽</div>
        </th>
        <th className="border border-gray-300 p-1 md:p-2 text-left whitespace-nowrap">
          <MultiSelectHeader
            label="Промоутер"
            options={uniquePromoters}
            selectedValues={promoterFilter}
            onSelectionChange={onPromoterFilterChange}
          />
        </th>
        <th className="border border-gray-300 p-1 md:p-2 text-right whitespace-nowrap">
          <div>Контакты</div>
          <div className="text-blue-600 font-bold mt-1">{stats.totalContacts}</div>
        </th>
        <th className="border border-gray-300 p-1 md:p-2 text-right whitespace-nowrap">
          <div>Зарплата</div>
          <div className="text-orange-600 font-bold mt-1">{stats.totalSalary.toLocaleString('ru-RU')} ₽</div>
          <div className="text-red-600 font-bold mt-1 text-[10px]">Долг: {stats.unpaidSalary.toLocaleString('ru-RU')} ₽</div>
        </th>
        <th className="border border-gray-300 p-1 md:p-2 text-center whitespace-nowrap">
          <div>Внесение</div>
          <div>личных средств</div>
        </th>
        <th className="border border-gray-300 p-1 md:p-2 text-right whitespace-nowrap">Расход</th>
        <th className="border border-gray-300 p-1 md:p-2 text-left whitespace-nowrap">Комментарий</th>
        <th className="border border-gray-300 p-1 md:p-2 text-right whitespace-nowrap bg-green-50">
          <div>Чистый остаток</div>
          <div className="text-green-600 font-bold mt-1">{stats.totalNetProfit.toLocaleString('ru-RU')} ₽</div>
        </th>
        <th className="border border-gray-300 p-1 md:p-2 text-right whitespace-nowrap bg-blue-50">
          <div>КВВ</div>
          <div className="text-blue-600 font-bold mt-1">{stats.totalKVV.toLocaleString('ru-RU')} ₽</div>
        </th>
        <th className="border border-gray-300 p-1 md:p-2 text-right whitespace-nowrap bg-purple-50">
          <div>КМС</div>
          <div className="text-purple-600 font-bold mt-1">{stats.totalKMS.toLocaleString('ru-RU')} ₽</div>
        </th>
        <th className="border border-gray-300 p-1 md:p-2 text-center whitespace-nowrap">
          <FilterableHeader 
            label="Опл. орг." 
            filterValue={filters.paid_by_organization}
            onFilterChange={() => onFilterChange('paid_by_organization')}
          />
          <div className="text-green-600 font-bold mt-1 text-[10px]">Ожидаем: {stats.expectedRevenue.toLocaleString('ru-RU')} ₽</div>
        </th>
        <th className="border border-gray-300 p-1 md:p-2 text-center whitespace-nowrap">
          <FilterableHeader 
            label="Опл. испол." 
            filterValue={filters.paid_to_worker}
            onFilterChange={() => onFilterChange('paid_to_worker')}
          />
          <div className="text-green-600 font-bold mt-1 text-[10px]">Оплачено: {stats.paidSalary.toLocaleString('ru-RU')} ₽</div>
          <div className="text-red-600 font-bold mt-1 text-[10px]">Долг б/нал: {stats.unpaidSalaryCashless.toLocaleString('ru-RU')} ₽</div>
          <div className="text-red-600 font-bold mt-0.5 text-[10px]">Долг нал: {stats.unpaidSalaryCash.toLocaleString('ru-RU')} ₽</div>
          <div className="text-yellow-700 font-bold mt-1 text-[10px]">У КВВ: {stats.salaryAtKVV.toLocaleString('ru-RU')} ₽</div>
        </th>
        <th className="border border-gray-300 p-1 md:p-2 text-center whitespace-nowrap">
          <FilterableHeader 
            label="Опл. КВВ" 
            filterValue={filters.paid_kvv}
            onFilterChange={() => onFilterChange('paid_kvv')}
          />
          <div className="text-red-600 font-bold mt-1 text-[10px]">Долг б/нал: {stats.unpaidKVVCashless.toLocaleString('ru-RU')} ₽</div>
          <div className="text-red-600 font-bold mt-0.5 text-[10px]">Долг нал: {stats.unpaidKVVCash.toLocaleString('ru-RU')} ₽</div>
        </th>
        <th className="border border-gray-300 p-1 md:p-2 text-center whitespace-nowrap">
          <FilterableHeader 
            label="Опл. КМС" 
            filterValue={filters.paid_kms}
            onFilterChange={() => onFilterChange('paid_kms')}
          />
          <div className="text-red-600 font-bold mt-1 text-[10px]">Долг б/нал: {stats.unpaidKMSCashless.toLocaleString('ru-RU')} ₽</div>
          <div className="text-red-600 font-bold mt-0.5 text-[10px]">Долг нал: {stats.unpaidKMSCash.toLocaleString('ru-RU')} ₽</div>
        </th>
        <th className="border border-gray-300 p-1 md:p-2 text-center whitespace-nowrap">Действия</th>
      </tr>
    </thead>
  );
}