import React, { useRef, useMemo } from 'react';
import Icon from '@/components/ui/icon';
import ShiftTableRow from './ShiftTableRow';
import ShiftTableZoom from './ShiftTableZoom';
import ShiftTableHeader from './ShiftTableHeader';
import { ShiftRecord } from './types';
import { calculateTableStatistics } from './ShiftTableCalculations';

interface ShiftTableProps {
  shifts: ShiftRecord[];
  editingExpense: {[key: string]: number};
  editingComment: {[key: string]: string};
  editingPayments: {[key: string]: {
    paid_by_organization: boolean;
    paid_to_worker: boolean;
    salary_at_kvv: boolean;
    paid_kvv: boolean;
    paid_kms: boolean;
    invoice_issued: boolean;
    invoice_paid: boolean;
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
  onPaymentToggle: (shift: ShiftRecord, field: 'paid_by_organization' | 'paid_to_worker' | 'salary_at_kvv' | 'paid_kvv' | 'paid_kms' | 'invoice_issued' | 'invoice_paid') => void;
  onInvoiceIssuedDateChange: (shift: ShiftRecord, date: string | null) => void;
  onInvoicePaidDateChange: (shift: ShiftRecord, date: string | null) => void;
  onFilterChange: (key: 'paid_by_organization' | 'paid_to_worker' | 'paid_kvv' | 'paid_kms' | 'invoice_issued') => void;
  onOrganizationFilterChange: (values: string[]) => void;
  onPromoterFilterChange: (values: string[]) => void;
  onPaymentTypeFilterChange: (types: ('cash' | 'cashless')[]) => void;
  onDateFilterChange: (from: string, to: string) => void;
  onDelete: (shift: ShiftRecord) => void;
  onEdit: (shift: ShiftRecord) => void;
}

const MemoizedShiftTableRow = React.memo(ShiftTableRow);

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
  onInvoiceIssuedDateChange,
  onInvoicePaidDateChange,
  onFilterChange,
  onOrganizationFilterChange,
  onPromoterFilterChange,
  onPaymentTypeFilterChange,
  onDateFilterChange,
  onDelete,
  onEdit
}: ShiftTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  if (shifts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        <Icon name="FileSpreadsheet" size={32} className="mx-auto mb-3 opacity-30" />
        <p>Данные отсутствуют</p>
      </div>
    );
  }

  const stats = useMemo(() => calculateTableStatistics(shifts), [shifts]);

  return (
    <ShiftTableZoom parentRef={parentRef}>
      <table className="w-full text-xs md:text-sm border-collapse">
        <ShiftTableHeader
          stats={stats}
          filters={filters}
          organizationFilter={organizationFilter}
          promoterFilter={promoterFilter}
          paymentTypeFilter={paymentTypeFilter}
          dateFilter={dateFilter}
          uniqueOrganizations={uniqueOrganizations}
          uniquePromoters={uniquePromoters}
          onFilterChange={onFilterChange}
          onOrganizationFilterChange={onOrganizationFilterChange}
          onPromoterFilterChange={onPromoterFilterChange}
          onPaymentTypeFilterChange={onPaymentTypeFilterChange}
          onDateFilterChange={onDateFilterChange}
        />
        <tbody>
          {shifts.map((shift) => (
            <MemoizedShiftTableRow
              key={`${shift.user_id}-${shift.date}-${shift.start_time}-${shift.organization_id}`}
              shift={shift}
              editingExpense={editingExpense}
              editingComment={editingComment}
              editingPayments={editingPayments}
              onExpenseChange={onExpenseChange}
              onCommentChange={onCommentChange}
              onExpenseBlur={onExpenseBlur}
              onPaymentToggle={onPaymentToggle}
              onInvoiceIssuedDateChange={onInvoiceIssuedDateChange}
              onInvoicePaidDateChange={onInvoicePaidDateChange}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </tbody>
      </table>
    </ShiftTableZoom>
  );
}
