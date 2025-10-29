import React from 'react';
import Icon from '@/components/ui/icon';
import ShiftTableRow from './ShiftTableRow';
import FilterableHeader from './FilterableHeader';
import MultiSelectHeader from './MultiSelectHeader';
import PaymentTypeHeader from './PaymentTypeHeader';
import { ShiftRecord } from './types';

interface ShiftTableProps {
  shifts: ShiftRecord[];
  editingExpense: {[key: string]: number};
  editingComment: {[key: string]: string};
  editingPayments: {[key: string]: {
    paid_by_organization: boolean;
    paid_to_worker: boolean;
    paid_kvv: boolean;
    paid_kms: boolean;
  }};
  filters: {
    paid_by_organization: boolean | null;
    paid_to_worker: boolean | null;
    paid_kvv: boolean | null;
    paid_kms: boolean | null;
  };
  organizationFilter: string[];
  promoterFilter: string[];
  paymentTypeFilter: ('cash' | 'cashless')[];
  uniqueOrganizations: string[];
  uniquePromoters: string[];
  onExpenseChange: (key: string, value: number) => void;
  onCommentChange: (key: string, value: string) => void;
  onExpenseBlur: (shift: ShiftRecord) => void;
  onPaymentToggle: (shift: ShiftRecord, field: 'paid_by_organization' | 'paid_to_worker' | 'paid_kvv' | 'paid_kms') => void;
  onFilterChange: (key: 'paid_by_organization' | 'paid_to_worker' | 'paid_kvv' | 'paid_kms') => void;
  onOrganizationFilterChange: (values: string[]) => void;
  onPromoterFilterChange: (values: string[]) => void;
  onPaymentTypeFilterChange: (types: ('cash' | 'cashless')[]) => void;
  onDelete: (shift: ShiftRecord) => void;
  onEdit: (shift: ShiftRecord) => void;
}

export default function ShiftTable({
  shifts,
  editingExpense,
  editingComment,
  editingPayments,
  filters,
  organizationFilter,
  promoterFilter,
  paymentTypeFilter,
  uniqueOrganizations,
  uniquePromoters,
  onExpenseChange,
  onCommentChange,
  onExpenseBlur,
  onPaymentToggle,
  onFilterChange,
  onOrganizationFilterChange,
  onPromoterFilterChange,
  onPaymentTypeFilterChange,
  onDelete,
  onEdit
}: ShiftTableProps) {
  if (shifts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        <Icon name="FileSpreadsheet" size={32} className="mx-auto mb-3 opacity-30" />
        <p>Данные отсутствуют</p>
      </div>
    );
  }

  const totalContacts = shifts.reduce((sum, shift) => sum + (shift.contacts_count || 0), 0);
  
  const unpaidSalary = shifts
    .filter(shift => !shift.paid_to_worker)
    .reduce((sum, shift) => {
      const salary = calculateWorkerSalary(shift.contacts_count);
      return sum + salary;
    }, 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs md:text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100 text-gray-700">
            <th className="border border-gray-300 p-1 md:p-2 text-left whitespace-nowrap">Дата</th>
            <th className="border border-gray-300 p-1 md:p-2 text-left whitespace-nowrap">Время</th>
            <th className="border border-gray-300 p-1 md:p-2 text-left whitespace-nowrap">
              <MultiSelectHeader
                label="Организация"
                options={uniqueOrganizations}
                selectedValues={organizationFilter}
                onSelectionChange={onOrganizationFilterChange}
              />
            </th>
            <th className="border border-gray-300 p-1 md:p-2 text-right whitespace-nowrap">Сумма прихода</th>
            <th className="border border-gray-300 p-1 md:p-2 text-center whitespace-nowrap">
              <PaymentTypeHeader
                label="Оплата"
                selectedTypes={paymentTypeFilter}
                onSelectionChange={onPaymentTypeFilterChange}
              />
            </th>
            <th className="border border-gray-300 p-1 md:p-2 text-right whitespace-nowrap">Налог 7%</th>
            <th className="border border-gray-300 p-1 md:p-2 text-right whitespace-nowrap">После налога</th>
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
              <div className="text-blue-600 font-bold mt-1">{totalContacts}</div>
            </th>
            <th className="border border-gray-300 p-1 md:p-2 text-right whitespace-nowrap">
              <div>Зарплата</div>
              <div className="text-red-600 font-bold mt-1">Долг: {unpaidSalary.toLocaleString('ru-RU')} ₽</div>
            </th>
            <th className="border border-gray-300 p-1 md:p-2 text-right whitespace-nowrap">Расход</th>
            <th className="border border-gray-300 p-1 md:p-2 text-left whitespace-nowrap">Комментарий</th>
            <th className="border border-gray-300 p-1 md:p-2 text-right whitespace-nowrap bg-green-50">Чистый остаток</th>
            <th className="border border-gray-300 p-1 md:p-2 text-right whitespace-nowrap bg-blue-50">КВВ</th>
            <th className="border border-gray-300 p-1 md:p-2 text-right whitespace-nowrap bg-purple-50">КМС</th>
            <th className="border border-gray-300 p-1 md:p-2 text-center whitespace-nowrap">
              <FilterableHeader 
                label="Опл. орг." 
                filterValue={filters.paid_by_organization}
                onFilterChange={() => onFilterChange('paid_by_organization')}
              />
            </th>
            <th className="border border-gray-300 p-1 md:p-2 text-center whitespace-nowrap">
              <FilterableHeader 
                label="Опл. испол." 
                filterValue={filters.paid_to_worker}
                onFilterChange={() => onFilterChange('paid_to_worker')}
              />
            </th>
            <th className="border border-gray-300 p-1 md:p-2 text-center whitespace-nowrap">
              <FilterableHeader 
                label="Опл. КВВ" 
                filterValue={filters.paid_kvv}
                onFilterChange={() => onFilterChange('paid_kvv')}
              />
            </th>
            <th className="border border-gray-300 p-1 md:p-2 text-center whitespace-nowrap">
              <FilterableHeader 
                label="Опл. КМС" 
                filterValue={filters.paid_kms}
                onFilterChange={() => onFilterChange('paid_kms')}
              />
            </th>
            <th className="border border-gray-300 p-1 md:p-2 text-center whitespace-nowrap">Действия</th>
          </tr>
        </thead>
        <tbody>
          {shifts.map((shift) => (
            <ShiftTableRow
              key={`${shift.user_id}-${shift.date}-${shift.organization_id}`}
              shift={shift}
              editingExpense={editingExpense}
              editingComment={editingComment}
              editingPayments={editingPayments}
              onExpenseChange={onExpenseChange}
              onCommentChange={onCommentChange}
              onExpenseBlur={onExpenseBlur}
              onPaymentToggle={onPaymentToggle}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}