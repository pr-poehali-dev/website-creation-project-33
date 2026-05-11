import React, { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { ShiftRecord } from './types';
import {
  calculateRevenue,
  calculateTax,
  calculateAfterTax,
  calculateWorkerSalary,
  calculateNetProfit,
  calculateKVV,
  calculateKMS,
  formatDate,
  formatTime,
  getShiftKey
} from './calculations';

interface ShiftTableRowProps {
  shift: ShiftRecord;
  editingExpense: {[key: string]: number};
  editingComment: {[key: string]: string};
  editingPersonalFunds: {[key: string]: {
    amount: number;
    by_kms: boolean;
    by_kvv: boolean;
  }};
  editingPayments: {[key: string]: {
    paid_by_organization: boolean;
    paid_to_worker: boolean;
    salary_at_kvv: boolean;
    paid_kvv: boolean;
    paid_kms: boolean;
    invoice_issued: boolean;
    invoice_paid: boolean;
  }};
  editingInvoiceDates: {[key: string]: {
    invoice_issued_date: string | null;
    invoice_paid_date: string | null;
  }};
  onExpenseChange: (key: string, value: number) => void;
  onCommentChange: (key: string, value: string) => void;
  onPersonalFundsChange: (key: string, amount: number, by_kms: boolean, by_kvv: boolean) => void;
  onExpenseBlur: (shift: ShiftRecord) => void;
  onPaymentToggle: (shift: ShiftRecord, field: 'paid_by_organization' | 'paid_to_worker' | 'salary_at_kvv' | 'paid_kvv' | 'paid_kms' | 'invoice_issued' | 'invoice_paid') => void;
  onInvoiceIssuedDateChange: (shift: ShiftRecord, date: string | null) => void;
  onInvoicePaidDateChange: (shift: ShiftRecord, date: string | null) => void;
  onInvoicePartyChange: (shift: ShiftRecord, party: 'kms' | 'kvv' | null) => void;
  editingInvoiceParty: {[key: string]: 'kms' | 'kvv' | null};
  onDelete: (shift: ShiftRecord) => void;
  onEdit: (shift: ShiftRecord) => void;
}

function ShiftTableRow({
  shift,
  editingExpense,
  editingComment,
  editingPersonalFunds,
  editingPayments,
  editingInvoiceDates,
  editingInvoiceParty,
  onExpenseChange,
  onCommentChange,
  onPersonalFundsChange,
  onExpenseBlur,
  onPaymentToggle,
  onInvoiceIssuedDateChange,
  onInvoicePaidDateChange,
  onInvoicePartyChange,
  onDelete,
  onEdit
}: ShiftTableRowProps) {
  const key = React.useMemo(() => getShiftKey(shift), [shift.user_id, shift.date, shift.start_time, shift.organization_id]);
  
  // Мемоизация обработчиков для предотвращения ререндера других строк
  const handlePaymentToggleCallback = useCallback((field: 'paid_by_organization' | 'paid_to_worker' | 'salary_at_kvv' | 'paid_kvv' | 'paid_kms' | 'invoice_issued' | 'invoice_paid') => {
    onPaymentToggle(shift, field);
  }, [onPaymentToggle, shift]);
  
  const handleInvoiceIssuedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onInvoiceIssuedDateChange(shift, e.target.value || null);
  }, [onInvoiceIssuedDateChange, shift]);
  
  const handleInvoicePaidChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onInvoicePaidDateChange(shift, e.target.value || null);
  }, [onInvoicePaidDateChange, shift]);
  
  const handleExpenseChangeCallback = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onExpenseChange(key, Number(e.target.value));
  }, [onExpenseChange, key]);
  
  const handleCommentChangeCallback = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onCommentChange(key, e.target.value);
  }, [onCommentChange, key]);
  
  const handleExpenseBlurCallback = useCallback(() => {
    onExpenseBlur(shift);
  }, [onExpenseBlur, shift]);
  
  const handleDeleteCallback = useCallback(() => {
    onDelete(shift);
  }, [onDelete, shift]);
  
  const handleEditCallback = useCallback(() => {
    onEdit(shift);
  }, [onEdit, shift]);
  const revenue = calculateRevenue(shift);
  const tax = calculateTax(shift);
  const afterTax = calculateAfterTax(shift);
  const orgName = shift.organization_name || shift.organization;
  const workerSalary = calculateWorkerSalary(shift.contacts_count, shift.date, orgName, shift.user_id, shift.employee_status, shift.user_registered_at);
  const netProfit = calculateNetProfit(shift);
  
  // Личные средства для отображения в UI
  const personalFunds = editingPersonalFunds[key] || {
    amount: shift.personal_funds_amount || 0,
    by_kms: shift.personal_funds_by_kms || false,
    by_kvv: shift.personal_funds_by_kvv || false
  };
  
  // KVV/KMS рассчитываются БЕЗ личных средств (личные средства идут только в долги)
  const kvv = calculateKVV(shift);
  const kms = calculateKMS(shift);
  
  const invoiceDates = editingInvoiceDates[key] || {
    invoice_issued_date: shift.invoice_issued_date,
    invoice_paid_date: shift.invoice_paid_date
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors text-[10px] md:text-xs">
      <td className="border border-gray-200 p-1 md:p-2 whitespace-nowrap text-gray-700">{formatDate(shift.date)}</td>
      <td className="border border-gray-200 p-1 md:p-2 whitespace-nowrap text-gray-700">
        {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
      </td>
      <td className="border border-gray-200 p-1 md:p-2 text-gray-700">{shift.organization}</td>
      <td className="border border-gray-200 p-1 md:p-2">
        <div className="flex items-center justify-center">
          {(() => {
            const party = key in editingInvoiceParty ? editingInvoiceParty[key] : shift.invoice_party;
            return (
              <select
                value={party ?? ''}
                onChange={(e) => onInvoicePartyChange(shift, (e.target.value as 'kms' | 'kvv') || null)}
                className={`w-14 md:w-16 h-6 md:h-7 text-[9px] md:text-xs border rounded px-0.5 font-medium cursor-pointer ${
                  party === 'kms' ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                  : party === 'kvv' ? 'bg-red-100 text-red-700 border-red-300'
                  : 'bg-gray-100 text-gray-500 border-gray-300'
                }`}
              >
                <option value="">—</option>
                <option value="kms">КМС</option>
                <option value="kvv">КВВ</option>
              </select>
            );
          })()}
        </div>
      </td>
      <td className="border border-gray-200 p-1 md:p-2 text-right">
        <div className="flex flex-col gap-0.5 md:gap-1 items-end">
          <div className="font-medium text-gray-800">
            {revenue.toLocaleString()} ₽
            {(shift.compensation_amount !== 0 || editingExpense[`${key}_compensation`] !== undefined) && (
              <span className={`ml-1 text-[9px] ${(editingExpense[`${key}_compensation`] ?? shift.compensation_amount ?? 0) > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {(editingExpense[`${key}_compensation`] ?? shift.compensation_amount ?? 0) > 0 ? '↑' : '↓'}
              </span>
            )}
          </div>
          <Input
            type="number"
            value={(editingExpense[`${key}_compensation`] ?? shift.compensation_amount ?? 0) === 0 ? '' : (editingExpense[`${key}_compensation`] ?? shift.compensation_amount ?? 0)}
            onChange={(e) => {
              const newValue = e.target.value === '' ? 0 : (parseInt(e.target.value) || 0);
              onExpenseChange(`${key}_compensation`, newValue);
            }}
            placeholder="0"
            className="w-20 md:w-24 h-6 md:h-7 text-[10px] md:text-xs border-gray-300 bg-white text-gray-700 placeholder:text-gray-400"
          />
        </div>
      </td>
      <td className="border border-gray-200 p-1 md:p-2 text-center">
        <div className="flex items-center justify-center gap-0.5 md:gap-1">
          <span className={`px-1 md:px-1.5 py-0.5 rounded text-[9px] md:text-[10px] ${shift.payment_type === 'cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
            {shift.payment_type === 'cash' ? '💵' : '💳'}
          </span>
          <span className="text-[10px] md:text-xs font-medium text-gray-700">{shift.contact_rate}₽</span>
        </div>
      </td>
      <td className="border border-gray-200 p-1 md:p-2 text-right text-gray-700">{tax > 0 ? `${tax.toLocaleString()} ₽` : '—'}</td>
      <td className="border border-gray-200 p-1 md:p-2 text-right font-medium text-gray-800">{afterTax.toLocaleString()} ₽</td>
      <td className="border border-gray-200 p-1 md:p-2 text-gray-700">{shift.user_name}</td>
      <td className="border border-gray-200 p-1 md:p-2 text-center whitespace-nowrap">
        {!shift.is_active ? (
          <span className="text-[9px] md:text-[10px] font-medium text-red-500">Уволен</span>
        ) : shift.employee_status === 'intern' ? (
          <span className="text-[9px] md:text-[10px] font-medium text-amber-600">Стажёр</span>
        ) : (
          <span className="text-[9px] md:text-[10px] font-medium text-green-600">Сотрудник</span>
        )}
      </td>
      <td className="border border-gray-200 p-1 md:p-2 text-right text-gray-700">{shift.contacts_count}</td>
      <td className="border border-gray-200 p-1 md:p-2 text-right font-medium text-gray-800">{workerSalary.toLocaleString()} ₽</td>

      <td className="border border-gray-200 p-1 md:p-2">
        <Input
          type="number"
          value={(editingExpense[key] ?? shift.expense_amount ?? 0) === 0 ? '' : (editingExpense[key] ?? shift.expense_amount ?? 0)}
          onChange={(e) => {
            const newValue = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
            onExpenseChange(key, newValue);
          }}
          className="w-16 md:w-20 h-6 md:h-7 text-[10px] md:text-xs border-gray-300 bg-white text-gray-700"
        />
      </td>
      <td className="border border-gray-200 p-1 md:p-2">
        <Input
          type="text"
          value={editingComment[key] ?? shift.expense_comment ?? ''}
          onChange={(e) => onCommentChange(key, e.target.value)}
          placeholder="Комментарий"
          className="w-full min-w-[120px] md:min-w-[150px] h-6 md:h-7 text-[10px] md:text-xs border-gray-300 bg-white text-gray-700 placeholder:text-gray-400"
        />
      </td>
      <td className="border border-gray-200 p-1 md:p-2 text-right font-bold bg-emerald-50 text-emerald-700">
        {netProfit.toLocaleString()} ₽
      </td>
      <td className="border border-gray-200 p-1 md:p-2 text-right font-bold bg-blue-50 text-blue-700">
        {kvv.toLocaleString()} ₽
      </td>
      <td className="border border-gray-200 p-1 md:p-2 text-right font-bold bg-purple-50 text-purple-700">
        {kms.toLocaleString()} ₽
      </td>
      <td className="border border-gray-200 p-1 md:p-2 text-center">
        <select
          value={(editingPayments[key]?.paid_by_organization ?? shift.paid_by_organization) ? 'yes' : 'no'}
          onChange={() => handlePaymentToggleCallback('paid_by_organization')}
          className={`w-12 md:w-16 h-6 md:h-7 text-[10px] md:text-xs border rounded px-0.5 md:px-1 font-medium ${
            (editingPayments[key]?.paid_by_organization ?? shift.paid_by_organization)
              ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
              : 'bg-red-100 text-red-700 border-red-300'
          }`}
        >
          <option value="no" className="bg-white text-gray-700">Нет</option>
          <option value="yes" className="bg-white text-gray-700">Да</option>
        </select>
      </td>
      <td className="border border-gray-200 p-1 md:p-2 text-center">
        <div className="flex flex-col gap-0.5 md:gap-1">
          <select
            value={(editingPayments[key]?.paid_to_worker ?? shift.paid_to_worker) ? 'yes' : 'no'}
            onChange={() => handlePaymentToggleCallback('paid_to_worker')}
            className={`w-12 md:w-16 h-6 md:h-7 text-[10px] md:text-xs border rounded px-0.5 md:px-1 font-medium ${
              (editingPayments[key]?.paid_to_worker ?? shift.paid_to_worker)
                ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                : 'bg-red-100 text-red-700 border-red-300'
            }`}
          >
            <option value="no" className="bg-white text-gray-700">Нет</option>
            <option value="yes" className="bg-white text-gray-700">Да</option>
          </select>
          <button
            onClick={() => handlePaymentToggleCallback('salary_at_kvv')}
            className={`w-12 md:w-16 h-5 md:h-6 text-[9px] md:text-xs border rounded px-0.5 md:px-1 font-medium transition-colors ${
              (editingPayments[key]?.salary_at_kvv ?? shift.salary_at_kvv)
                ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'
            }`}
            title="У КВВ"
          >
            {(editingPayments[key]?.salary_at_kvv ?? shift.salary_at_kvv) ? '📦 КВВ' : 'КВВ'}
          </button>
        </div>
      </td>
      <td className="border border-gray-200 p-1 md:p-2 text-center">
        <select
          value={(editingPayments[key]?.paid_kvv ?? shift.paid_kvv) ? 'yes' : 'no'}
          onChange={() => handlePaymentToggleCallback('paid_kvv')}
          className={`w-12 md:w-16 h-6 md:h-7 text-[10px] md:text-xs border rounded px-0.5 md:px-1 font-medium ${
            (editingPayments[key]?.paid_kvv ?? shift.paid_kvv)
              ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
              : 'bg-red-100 text-red-700 border-red-300'
          }`}
        >
          <option value="no" className="bg-white text-gray-700">Нет</option>
          <option value="yes" className="bg-white text-gray-700">Да</option>
        </select>
      </td>
      <td className="border border-gray-200 p-1 md:p-2 text-center">
        <select
          value={(editingPayments[key]?.paid_kms ?? shift.paid_kms) ? 'yes' : 'no'}
          onChange={() => handlePaymentToggleCallback('paid_kms')}
          className={`w-12 md:w-16 h-6 md:h-7 text-[10px] md:text-xs border rounded px-0.5 md:px-1 font-medium ${
            (editingPayments[key]?.paid_kms ?? shift.paid_kms)
              ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
              : 'bg-red-100 text-red-700 border-red-300'
          }`}
        >
          <option value="no" className="bg-white text-gray-700">Нет</option>
          <option value="yes" className="bg-white text-gray-700">Да</option>
        </select>
      </td>
      <td className="border border-gray-200 p-1 md:p-2 text-center">
        <div className="flex items-center justify-center gap-0.5 md:gap-1">
          <button
            onClick={handleEditCallback}
            className="p-0.5 md:p-1 hover:bg-blue-100 rounded transition-colors"
            title="Редактировать смену"
          >
            <Icon name="Edit" size={14} className="text-blue-600 md:w-4 md:h-4" />
          </button>
          <button
            onClick={handleDeleteCallback}
            className="p-0.5 md:p-1 hover:bg-red-100 rounded transition-colors"
            title="Удалить смену"
          >
            <Icon name="Trash2" size={14} className="text-red-500 md:w-4 md:h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// Оптимизированное сравнение для React.memo
export default React.memo(ShiftTableRow, (prevProps, nextProps) => {
  const prevKey = getShiftKey(prevProps.shift);
  const nextKey = getShiftKey(nextProps.shift);
  
  // Сравниваем только то, что может измениться для этой конкретной строки
  return (
    prevKey === nextKey &&
    prevProps.editingExpense[prevKey] === nextProps.editingExpense[nextKey] &&
    prevProps.editingExpense[`${prevKey}_compensation`] === nextProps.editingExpense[`${nextKey}_compensation`] &&
    prevProps.editingComment[prevKey] === nextProps.editingComment[nextKey] &&
    JSON.stringify(prevProps.editingPersonalFunds[prevKey]) === JSON.stringify(nextProps.editingPersonalFunds[nextKey]) &&
    JSON.stringify(prevProps.editingPayments[prevKey]) === JSON.stringify(nextProps.editingPayments[nextKey]) &&
    JSON.stringify(prevProps.editingInvoiceDates[prevKey]) === JSON.stringify(nextProps.editingInvoiceDates[nextKey]) &&
    prevProps.editingInvoiceParty[prevKey] === nextProps.editingInvoiceParty[nextKey] &&
    prevProps.shift === nextProps.shift
  );
});