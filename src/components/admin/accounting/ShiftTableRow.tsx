import React from 'react';
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
  onDelete: (shift: ShiftRecord) => void;
  onEdit: (shift: ShiftRecord) => void;
}

export default function ShiftTableRow({
  shift,
  editingExpense,
  editingComment,
  editingPersonalFunds,
  editingPayments,
  editingInvoiceDates,
  onExpenseChange,
  onCommentChange,
  onPersonalFundsChange,
  onExpenseBlur,
  onPaymentToggle,
  onInvoiceIssuedDateChange,
  onInvoicePaidDateChange,
  onDelete,
  onEdit
}: ShiftTableRowProps) {
  const key = getShiftKey(shift);
  const revenue = calculateRevenue(shift);
  const tax = calculateTax(shift);
  const afterTax = calculateAfterTax(shift);
  const orgName = shift.organization_name || shift.organization;
  const workerSalary = calculateWorkerSalary(shift.contacts_count, shift.date, orgName);
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
    <tr className="hover:bg-gray-50">
      <td className="border border-gray-300 p-1 md:p-2 whitespace-nowrap">{formatDate(shift.date)}</td>
      <td className="border border-gray-300 p-1 md:p-2 whitespace-nowrap">
        {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
      </td>
      <td className="border border-gray-300 p-1 md:p-2">{shift.organization}</td>
      <td className="border border-gray-300 p-2 min-w-[260px]">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2 items-center">
            <input
              type="checkbox"
              checked={editingPayments[key]?.invoice_issued ?? shift.invoice_issued}
              onChange={() => onPaymentToggle(shift, 'invoice_issued')}
              className="w-5 h-5 cursor-pointer accent-green-600 flex-shrink-0"
            />
            <input
              type="date"
              value={invoiceDates.invoice_issued_date || ''}
              onChange={(e) => onInvoiceIssuedDateChange(shift, e.target.value || null)}
              className="w-full h-8 text-xs border border-gray-300 rounded px-2 disabled:bg-gray-100 disabled:text-gray-400"
              disabled={!(editingPayments[key]?.invoice_issued ?? shift.invoice_issued)}
            />
          </div>
          <div className="flex flex-col gap-2 items-center border-l border-gray-300 pl-3">
            <input
              type="checkbox"
              checked={editingPayments[key]?.invoice_paid ?? shift.invoice_paid}
              onChange={() => onPaymentToggle(shift, 'invoice_paid')}
              className="w-5 h-5 cursor-pointer accent-green-600 flex-shrink-0"
            />
            <input
              type="date"
              value={invoiceDates.invoice_paid_date || ''}
              onChange={(e) => onInvoicePaidDateChange(shift, e.target.value || null)}
              className="w-full h-8 text-xs border border-gray-300 rounded px-2 disabled:bg-gray-100 disabled:text-gray-400"
              disabled={!(editingPayments[key]?.invoice_paid ?? shift.invoice_paid)}
            />
          </div>
        </div>
      </td>
      <td className="border border-gray-300 p-1 md:p-2 text-right font-medium">{revenue.toLocaleString()} ₽</td>
      <td className="border border-gray-300 p-1 md:p-2 text-center">
        <div className="flex items-center justify-center gap-1">
          <span className={`px-1.5 py-0.5 rounded text-[10px] ${shift.payment_type === 'cash' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
            {shift.payment_type === 'cash' ? '💵' : '💳'}
          </span>
          <span className="text-xs font-medium text-gray-700">{shift.contact_rate}₽</span>
        </div>
      </td>
      <td className="border border-gray-300 p-1 md:p-2 text-right text-red-600">{tax > 0 ? `${tax.toLocaleString()} ₽` : '—'}</td>
      <td className="border border-gray-300 p-1 md:p-2 text-right font-medium">{afterTax.toLocaleString()} ₽</td>
      <td className="border border-gray-300 p-1 md:p-2">{shift.user_name}</td>
      <td className="border border-gray-300 p-1 md:p-2 text-right">{shift.contacts_count}</td>
      <td className="border border-gray-300 p-1 md:p-2 text-right font-medium text-orange-600">{workerSalary.toLocaleString()} ₽</td>
      <td className="border border-gray-300 p-1 md:p-2">
        <div className="flex flex-col gap-1">
          <Input
            type="number"
            value={personalFunds.amount === 0 ? '' : personalFunds.amount}
            onChange={(e) => {
              const newAmount = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
              onPersonalFundsChange(key, newAmount, personalFunds.by_kms, personalFunds.by_kvv);
            }}
            onBlur={() => onExpenseBlur(shift)}
            placeholder="Сумма"
            className="w-20 h-7 text-xs border-gray-300"
          />
          <div className="flex gap-1">
            <button
              onClick={() => {
                const newByKms = !personalFunds.by_kms;
                onPersonalFundsChange(key, personalFunds.amount, newByKms, newByKms ? false : personalFunds.by_kvv);
                // Автосохранение после изменения
                setTimeout(() => onExpenseBlur(shift), 0);
              }}
              className={`flex-1 h-6 text-[10px] border rounded px-1 font-medium transition-colors ${
                personalFunds.by_kms
                  ? 'bg-purple-100 text-purple-800 border-purple-300'
                  : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'
              }`}
              title="КМС"
            >
              КМС
            </button>
            <button
              onClick={() => {
                const newByKvv = !personalFunds.by_kvv;
                onPersonalFundsChange(key, personalFunds.amount, newByKvv ? false : personalFunds.by_kms, newByKvv);
                // Автосохранение после изменения
                setTimeout(() => onExpenseBlur(shift), 0);
              }}
              className={`flex-1 h-6 text-[10px] border rounded px-1 font-medium transition-colors ${
                personalFunds.by_kvv
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'
              }`}
              title="КВВ"
            >
              КВВ
            </button>
          </div>
        </div>
      </td>
      <td className="border border-gray-300 p-1 md:p-2">
        <Input
          type="number"
          value={editingExpense[key] ?? shift.expense_amount ?? 0}
          onChange={(e) => onExpenseChange(key, parseInt(e.target.value) || 0)}
          onBlur={() => onExpenseBlur(shift)}
          className="w-20 h-7 text-xs border-gray-300"
        />
      </td>
      <td className="border border-gray-300 p-1 md:p-2">
        <Input
          type="text"
          value={editingComment[key] ?? shift.expense_comment ?? ''}
          onChange={(e) => onCommentChange(key, e.target.value)}
          onBlur={() => onExpenseBlur(shift)}
          placeholder="Комментарий"
          className="w-full min-w-[150px] h-7 text-xs border-gray-300"
        />
      </td>
      <td className="border border-gray-300 p-1 md:p-2 text-right font-bold bg-green-50">
        {netProfit.toLocaleString()} ₽
      </td>
      <td className="border border-gray-300 p-1 md:p-2 text-right font-bold bg-blue-50">
        {kvv.toLocaleString()} ₽
      </td>
      <td className="border border-gray-300 p-1 md:p-2 text-right font-bold bg-purple-50">
        {kms.toLocaleString()} ₽
      </td>
      <td className="border border-gray-300 p-1 md:p-2 text-center">
        <select
          value={(editingPayments[key]?.paid_by_organization ?? shift.paid_by_organization) ? 'yes' : 'no'}
          onChange={() => onPaymentToggle(shift, 'paid_by_organization')}
          className={`w-16 h-7 text-xs border rounded px-1 font-medium ${
            (editingPayments[key]?.paid_by_organization ?? shift.paid_by_organization)
              ? 'bg-green-100 text-green-800 border-green-300'
              : 'bg-red-100 text-red-800 border-red-300'
          }`}
        >
          <option value="no">Нет</option>
          <option value="yes">Да</option>
        </select>
      </td>
      <td className="border border-gray-300 p-1 md:p-2 text-center">
        <div className="flex flex-col gap-1">
          <select
            value={(editingPayments[key]?.paid_to_worker ?? shift.paid_to_worker) ? 'yes' : 'no'}
            onChange={() => onPaymentToggle(shift, 'paid_to_worker')}
            className={`w-16 h-7 text-xs border rounded px-1 font-medium ${
              (editingPayments[key]?.paid_to_worker ?? shift.paid_to_worker)
                ? 'bg-green-100 text-green-800 border-green-300'
                : 'bg-red-100 text-red-800 border-red-300'
            }`}
          >
            <option value="no">Нет</option>
            <option value="yes">Да</option>
          </select>
          <button
            onClick={() => onPaymentToggle(shift, 'salary_at_kvv')}
            className={`w-16 h-6 text-xs border rounded px-1 font-medium transition-colors ${
              (editingPayments[key]?.salary_at_kvv ?? shift.salary_at_kvv)
                ? 'bg-yellow-200 text-yellow-900 border-yellow-400'
                : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'
            }`}
            title="У КВВ"
          >
            {(editingPayments[key]?.salary_at_kvv ?? shift.salary_at_kvv) ? '📦 КВВ' : 'КВВ'}
          </button>
        </div>
      </td>
      <td className="border border-gray-300 p-1 md:p-2 text-center">
        <select
          value={(editingPayments[key]?.paid_kvv ?? shift.paid_kvv) ? 'yes' : 'no'}
          onChange={() => onPaymentToggle(shift, 'paid_kvv')}
          className={`w-16 h-7 text-xs border rounded px-1 font-medium ${
            (editingPayments[key]?.paid_kvv ?? shift.paid_kvv)
              ? 'bg-green-100 text-green-800 border-green-300'
              : 'bg-red-100 text-red-800 border-red-300'
          }`}
        >
          <option value="no">Нет</option>
          <option value="yes">Да</option>
        </select>
      </td>
      <td className="border border-gray-300 p-1 md:p-2 text-center">
        <select
          value={(editingPayments[key]?.paid_kms ?? shift.paid_kms) ? 'yes' : 'no'}
          onChange={() => onPaymentToggle(shift, 'paid_kms')}
          className={`w-16 h-7 text-xs border rounded px-1 font-medium ${
            (editingPayments[key]?.paid_kms ?? shift.paid_kms)
              ? 'bg-green-100 text-green-800 border-green-300'
              : 'bg-red-100 text-red-800 border-red-300'
          }`}
        >
          <option value="no">Нет</option>
          <option value="yes">Да</option>
        </select>
      </td>
      <td className="border border-gray-300 p-1 md:p-2 text-center">
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => onEdit(shift)}
            className="p-1 hover:bg-blue-100 rounded transition-colors"
            title="Редактировать смену"
          >
            <Icon name="Edit" size={16} className="text-blue-600" />
          </button>
          <button
            onClick={() => onDelete(shift)}
            className="p-1 hover:bg-red-100 rounded transition-colors"
            title="Удалить смену"
          >
            <Icon name="Trash2" size={16} className="text-red-600" />
          </button>
        </div>
      </td>
    </tr>
  );
}