import React, { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import ShiftTableRow from './ShiftTableRow';
import FilterableHeader from './FilterableHeader';
import MultiSelectHeader from './MultiSelectHeader';
import PaymentTypeHeader from './PaymentTypeHeader';
import DateFilterHeader from './DateFilterHeader';
import { ShiftRecord } from './types';
import { calculateWorkerSalary } from './calculations';

interface ShiftTableProps {
  shifts: ShiftRecord[];
  editingExpense: {[key: string]: number};
  editingComment: {[key: string]: string};
  editingPayments: {[key: string]: {
    paid_by_organization: boolean;
    paid_to_worker: boolean;
    paid_kvv: boolean;
    paid_kms: boolean;
    invoice_issued: boolean;
  }};
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
  onExpenseChange: (key: string, value: number) => void;
  onCommentChange: (key: string, value: string) => void;
  onExpenseBlur: (shift: ShiftRecord) => void;
  onPaymentToggle: (shift: ShiftRecord, field: 'paid_by_organization' | 'paid_to_worker' | 'paid_kvv' | 'paid_kms' | 'invoice_issued') => void;
  onInvoiceDateChange: (shift: ShiftRecord, date: string | null) => void;
  onFilterChange: (key: 'paid_by_organization' | 'paid_to_worker' | 'paid_kvv' | 'paid_kms' | 'invoice_issued') => void;
  onOrganizationFilterChange: (values: string[]) => void;
  onPromoterFilterChange: (values: string[]) => void;
  onPaymentTypeFilterChange: (types: ('cash' | 'cashless')[]) => void;
  onDateFilterChange: (from: string, to: string) => void;
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
  dateFilter,
  uniqueOrganizations,
  uniquePromoters,
  onExpenseChange,
  onCommentChange,
  onExpenseBlur,
  onPaymentToggle,
  onInvoiceDateChange,
  onFilterChange,
  onOrganizationFilterChange,
  onPromoterFilterChange,
  onPaymentTypeFilterChange,
  onDateFilterChange,
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

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const shiftsForCurrentMonth = shifts.filter(shift => {
    const shiftDate = new Date(shift.date);
    return shiftDate.getMonth() === currentMonth && shiftDate.getFullYear() === currentYear;
  });

  const totalContacts = shiftsForCurrentMonth.reduce((sum, shift) => sum + (shift.contacts_count || 0), 0);
  
  const unpaidSalary = shifts
    .filter(shift => !shift.paid_to_worker)
    .reduce((sum, shift) => {
      const salary = calculateWorkerSalary(shift.contacts_count);
      return sum + salary;
    }, 0);

  const totalRevenue = shiftsForCurrentMonth.reduce((sum, shift) => sum + (shift.contacts_count * shift.contact_rate), 0);
  const totalTax = shiftsForCurrentMonth.reduce((sum, shift) => {
    if (shift.payment_type === 'cashless') {
      return sum + Math.round((shift.contacts_count * shift.contact_rate) * 0.07);
    }
    return sum;
  }, 0);
  const totalAfterTax = totalRevenue - totalTax;
  const totalSalary = shiftsForCurrentMonth.reduce((sum, shift) => sum + calculateWorkerSalary(shift.contacts_count), 0);
  const totalNetProfit = shiftsForCurrentMonth.reduce((sum, shift) => {
    const revenue = shift.contacts_count * shift.contact_rate;
    const tax = shift.payment_type === 'cashless' ? Math.round(revenue * 0.07) : 0;
    const afterTax = revenue - tax;
    const salary = calculateWorkerSalary(shift.contacts_count);
    const expense = shift.expense_amount || 0;
    return sum + (afterTax - salary - expense);
  }, 0);
  const totalKVV = Math.round(totalNetProfit / 2);
  const totalKMS = Math.round(totalNetProfit / 2);

  const unpaidKVV = shifts
    .filter(shift => !shift.paid_kvv)
    .reduce((sum, shift) => {
      const revenue = shift.contacts_count * shift.contact_rate;
      const tax = shift.payment_type === 'cashless' ? Math.round(revenue * 0.07) : 0;
      const afterTax = revenue - tax;
      const salary = calculateWorkerSalary(shift.contacts_count);
      const expense = shift.expense_amount || 0;
      const netProfit = afterTax - salary - expense;
      const kvv = Math.round(netProfit / 2);
      return sum + kvv;
    }, 0);

  const unpaidKMS = shifts
    .filter(shift => !shift.paid_kms)
    .reduce((sum, shift) => {
      const revenue = shift.contacts_count * shift.contact_rate;
      const tax = shift.payment_type === 'cashless' ? Math.round(revenue * 0.07) : 0;
      const afterTax = revenue - tax;
      const salary = calculateWorkerSalary(shift.contacts_count);
      const expense = shift.expense_amount || 0;
      const netProfit = afterTax - salary - expense;
      const kms = Math.round(netProfit / 2);
      return sum + kms;
    }, 0);

  const [scale, setScale] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPinching, setIsPinching] = useState(false);
  const initialDistanceRef = useRef<number>(0);
  const initialScaleRef = useRef<number>(100);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 10, 300));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 10, 30));
  };

  const handleResetZoom = () => {
    setScale(100);
  };

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const getDistance = (touches: TouchList) => {
      const touch1 = touches[0];
      const touch2 = touches[1];
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        setIsPinching(true);
        initialDistanceRef.current = getDistance(e.touches);
        initialScaleRef.current = scale;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && isPinching) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches);
        const scaleDelta = (currentDistance / initialDistanceRef.current) - 1;
        const newScale = Math.round(initialScaleRef.current * (1 + scaleDelta));
        setScale(Math.max(30, Math.min(300, newScale)));
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        setIsPinching(false);
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [scale, isPinching]);

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3 bg-gray-50 p-2 rounded-lg">
        <div className="flex items-center gap-2">
          <Button
            onClick={handleZoomOut}
            variant="outline"
            size="sm"
            disabled={scale <= 30}
            className="h-8 w-8 p-0"
          >
            <Icon name="ZoomOut" size={16} />
          </Button>
          <Button
            onClick={handleZoomIn}
            variant="outline"
            size="sm"
            disabled={scale >= 300}
            className="h-8 w-8 p-0"
          >
            <Icon name="ZoomIn" size={16} />
          </Button>
          <Button
            onClick={handleResetZoom}
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs"
          >
            {scale}%
          </Button>
        </div>
        <div className="text-xs text-gray-500 hidden md:block">
          Используйте жест двумя пальцами для масштабирования
        </div>
      </div>
      <div 
        ref={containerRef}
        className="overflow-x-auto"
        style={{
          transformOrigin: 'top left',
          touchAction: isPinching ? 'none' : 'auto'
        }}
      >
        <div
          style={{
            transform: `scale(${scale / 100})`,
            transformOrigin: 'top left',
            transition: isPinching ? 'none' : 'transform 0.2s ease-out'
          }}
        >
      <table className="w-full text-xs md:text-sm border-collapse">
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
              <FilterableHeader 
                label="Счёт" 
                filterValue={filters.invoice_issued}
                onFilterChange={() => onFilterChange('invoice_issued')}
              />
            </th>
            <th className="border border-gray-300 p-1 md:p-2 text-right whitespace-nowrap">
              <div>Сумма прихода</div>
              <div className="text-green-600 font-bold mt-1">{totalRevenue.toLocaleString('ru-RU')} ₽</div>
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
              <div className="text-red-600 font-bold mt-1">{totalTax.toLocaleString('ru-RU')} ₽</div>
            </th>
            <th className="border border-gray-300 p-1 md:p-2 text-right whitespace-nowrap">
              <div>После налога</div>
              <div className="text-blue-600 font-bold mt-1">{totalAfterTax.toLocaleString('ru-RU')} ₽</div>
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
              <div className="text-blue-600 font-bold mt-1">{totalContacts}</div>
            </th>
            <th className="border border-gray-300 p-1 md:p-2 text-right whitespace-nowrap">
              <div>Зарплата</div>
              <div className="text-orange-600 font-bold mt-1">{totalSalary.toLocaleString('ru-RU')} ₽</div>
              <div className="text-red-600 font-bold mt-1 text-[10px]">Долг: {unpaidSalary.toLocaleString('ru-RU')} ₽</div>
            </th>
            <th className="border border-gray-300 p-1 md:p-2 text-right whitespace-nowrap">Расход</th>
            <th className="border border-gray-300 p-1 md:p-2 text-left whitespace-nowrap">Комментарий</th>
            <th className="border border-gray-300 p-1 md:p-2 text-right whitespace-nowrap bg-green-50">
              <div>Чистый остаток</div>
              <div className="text-green-600 font-bold mt-1">{totalNetProfit.toLocaleString('ru-RU')} ₽</div>
            </th>
            <th className="border border-gray-300 p-1 md:p-2 text-right whitespace-nowrap bg-blue-50">
              <div>КВВ</div>
              <div className="text-blue-600 font-bold mt-1">{totalKVV.toLocaleString('ru-RU')} ₽</div>
            </th>
            <th className="border border-gray-300 p-1 md:p-2 text-right whitespace-nowrap bg-purple-50">
              <div>КМС</div>
              <div className="text-purple-600 font-bold mt-1">{totalKMS.toLocaleString('ru-RU')} ₽</div>
            </th>
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
              <div className="text-red-600 font-bold mt-1 text-[10px]">Долг: {unpaidKVV.toLocaleString('ru-RU')} ₽</div>
            </th>
            <th className="border border-gray-300 p-1 md:p-2 text-center whitespace-nowrap">
              <FilterableHeader 
                label="Опл. КМС" 
                filterValue={filters.paid_kms}
                onFilterChange={() => onFilterChange('paid_kms')}
              />
              <div className="text-red-600 font-bold mt-1 text-[10px]">Долг: {unpaidKMS.toLocaleString('ru-RU')} ₽</div>
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
              onInvoiceDateChange={onInvoiceDateChange}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
          {Array.from({ length: Math.max(0, 10 - shifts.length) }).map((_, index) => (
            <tr key={`empty-${index}`} className="border-b border-gray-200">
              <td className="border border-gray-300 p-1 md:p-2 h-12 bg-gray-50/30"></td>
              <td className="border border-gray-300 p-1 md:p-2 h-12 bg-gray-50/30"></td>
              <td className="border border-gray-300 p-1 md:p-2 h-12 bg-gray-50/30"></td>
              <td className="border border-gray-300 p-1 md:p-2 h-12 bg-gray-50/30"></td>
              <td className="border border-gray-300 p-1 md:p-2 h-12 bg-gray-50/30"></td>
              <td className="border border-gray-300 p-1 md:p-2 h-12 bg-gray-50/30"></td>
              <td className="border border-gray-300 p-1 md:p-2 h-12 bg-gray-50/30"></td>
              <td className="border border-gray-300 p-1 md:p-2 h-12 bg-gray-50/30"></td>
              <td className="border border-gray-300 p-1 md:p-2 h-12 bg-gray-50/30"></td>
              <td className="border border-gray-300 p-1 md:p-2 h-12 bg-gray-50/30"></td>
              <td className="border border-gray-300 p-1 md:p-2 h-12 bg-gray-50/30"></td>
              <td className="border border-gray-300 p-1 md:p-2 h-12 bg-gray-50/30"></td>
              <td className="border border-gray-300 p-1 md:p-2 h-12 bg-gray-50/30"></td>
              <td className="border border-gray-300 p-1 md:p-2 h-12 bg-gray-50/30"></td>
              <td className="border border-gray-300 p-1 md:p-2 h-12 bg-gray-50/30"></td>
              <td className="border border-gray-300 p-1 md:p-2 h-12 bg-gray-50/30"></td>
              <td className="border border-gray-300 p-1 md:p-2 h-12 bg-gray-50/30"></td>
              <td className="border border-gray-300 p-1 md:p-2 h-12 bg-gray-50/30"></td>
              <td className="border border-gray-300 p-1 md:p-2 h-12 bg-gray-50/30"></td>
              <td className="border border-gray-300 p-1 md:p-2 h-12 bg-gray-50/30"></td>
            </tr>
          ))}
        </tbody>
      </table>
        </div>
      </div>
    </div>
  );
}