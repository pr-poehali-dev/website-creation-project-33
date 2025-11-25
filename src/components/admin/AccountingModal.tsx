import React, { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { ShiftRecord, User, Organization } from './accounting/types';
import ShiftTable from './accounting/ShiftTable';

interface AccountingModalProps {
  isOpen: boolean;
  onClose: () => void;
  shifts: ShiftRecord[];
  users: User[];
  organizations: Organization[];
  filters: any;
  organizationFilter: string[];
  promoterFilter: string[];
  paymentTypeFilter: ('cash' | 'cashless')[];
  dateFilter: { from: string; to: string };
  uniqueOrganizations: string[];
  uniquePromoters: string[];
  activeFiltersCount: number;
  hasUnsavedPayments: boolean;
  savingPayments: boolean;
  editingExpense: Record<string, string>;
  editingComment: Record<string, string>;
  editingPersonalFunds: Record<string, string>;
  editingPayments: Record<string, any>;
  editingInvoiceDates: Record<string, any>;
  onFilterChange: (key: string) => void;
  onOrganizationFilterChange: (value: string[]) => void;
  onPromoterFilterChange: (value: string[]) => void;
  onPaymentTypeFilterChange: (value: ('cash' | 'cashless')[]) => void;
  onDateFilterChange: (filter: { from: string; to: string }) => void;
  onSavePayments: () => void;
  onEditShift: (shift: ShiftRecord) => void;
  onDeleteShift: (id: number) => void;
  onExpenseChange: (id: number, value: string) => void;
  onExpenseBlur: (id: number) => void;
  onCommentChange: (id: number, value: string) => void;
  onPersonalFundsChange: (id: number, value: string) => void;
  onPaymentToggle: (id: number, field: string) => void;
  onInvoiceIssuedDateChange: (id: number, date: string) => void;
  onInvoicePaidDateChange: (id: number, date: string) => void;
}

export default function AccountingModal({
  isOpen,
  onClose,
  shifts,
  users,
  organizations,
  filters,
  organizationFilter,
  promoterFilter,
  paymentTypeFilter,
  dateFilter,
  uniqueOrganizations,
  uniquePromoters,
  activeFiltersCount,
  hasUnsavedPayments,
  savingPayments,
  editingExpense,
  editingComment,
  editingPersonalFunds,
  editingPayments,
  editingInvoiceDates,
  onFilterChange,
  onOrganizationFilterChange,
  onPromoterFilterChange,
  onPaymentTypeFilterChange,
  onDateFilterChange,
  onSavePayments,
  onEditShift,
  onDeleteShift,
  onExpenseChange,
  onExpenseBlur,
  onCommentChange,
  onPersonalFundsChange,
  onPaymentToggle,
  onInvoiceIssuedDateChange,
  onInvoicePaidDateChange
}: AccountingModalProps) {
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      
      <div className="relative w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-b border-slate-700/50">
          <h2 className="text-xl font-semibold text-white flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
              <Icon name="Calculator" size={20} className="text-cyan-400" />
            </div>
            Бухгалтерский учёт
          </h2>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700">
              <button
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                className="p-1 hover:bg-slate-700 rounded transition-colors"
                title="Уменьшить"
              >
                <Icon name="ZoomOut" size={18} className="text-slate-300" />
              </button>
              <span className="text-sm text-slate-300 min-w-[50px] text-center">{zoom}%</span>
              <button
                onClick={() => setZoom(Math.min(150, zoom + 10))}
                className="p-1 hover:bg-slate-700 rounded transition-colors"
                title="Увеличить"
              >
                <Icon name="ZoomIn" size={18} className="text-slate-300" />
              </button>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              title="Закрыть"
            >
              <Icon name="X" size={24} className="text-slate-300" />
            </button>
          </div>
        </div>

        <div 
          className="flex-1 overflow-auto p-6"
          style={{ zoom: `${zoom}%` }}
        >
          {hasUnsavedPayments && (
            <div className="mb-4 p-4 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 rounded-xl shadow-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon name="AlertTriangle" size={20} className="text-orange-400" />
                <span className="text-slate-200">Есть несохраненные изменения</span>
              </div>
              <button
                onClick={onSavePayments}
                disabled={savingPayments}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {savingPayments ? (
                  <>
                    <Icon name="Loader2" size={16} className="animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Icon name="Save" size={16} />
                    Сохранить все
                  </>
                )}
              </button>
            </div>
          )}

          <ShiftTable
            shifts={shifts}
            users={users}
            organizations={organizations}
            filters={filters}
            organizationFilter={organizationFilter}
            promoterFilter={promoterFilter}
            paymentTypeFilter={paymentTypeFilter}
            dateFilter={dateFilter}
            uniqueOrganizations={uniqueOrganizations}
            uniquePromoters={uniquePromoters}
            activeFiltersCount={activeFiltersCount}
            editingExpense={editingExpense}
            editingComment={editingComment}
            editingPersonalFunds={editingPersonalFunds}
            editingPayments={editingPayments}
            editingInvoiceDates={editingInvoiceDates}
            onFilterChange={onFilterChange}
            onOrganizationFilterChange={onOrganizationFilterChange}
            onPromoterFilterChange={onPromoterFilterChange}
            onPaymentTypeFilterChange={onPaymentTypeFilterChange}
            onDateFilterChange={onDateFilterChange}
            onEditShift={onEditShift}
            onDeleteShift={onDeleteShift}
            onExpenseChange={onExpenseChange}
            onExpenseBlur={onExpenseBlur}
            onCommentChange={onCommentChange}
            onPersonalFundsChange={onPersonalFundsChange}
            onPaymentToggle={onPaymentToggle}
            onInvoiceIssuedDateChange={onInvoiceIssuedDateChange}
            onInvoicePaidDateChange={onInvoicePaidDateChange}
          />
        </div>
      </div>
    </div>
  );
}
