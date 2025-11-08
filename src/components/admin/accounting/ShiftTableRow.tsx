import React, { useState } from 'react';
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
  editingPayments: {[key: string]: {
    paid_by_organization: boolean;
    paid_to_worker: boolean;
    paid_kvv: boolean;
    paid_kms: boolean;
    invoice_issued: boolean;
  }};
  onExpenseChange: (key: string, value: number) => void;
  onCommentChange: (key: string, value: string) => void;
  onExpenseBlur: (shift: ShiftRecord) => void;
  onPaymentToggle: (shift: ShiftRecord, field: 'paid_by_organization' | 'paid_to_worker' | 'paid_kvv' | 'paid_kms' | 'invoice_issued') => void;
  onInvoiceDateChange: (shift: ShiftRecord, date: string | null) => void;
  onDelete: (shift: ShiftRecord) => void;
  onEdit: (shift: ShiftRecord) => void;
}

export default function ShiftTableRow({
  shift,
  editingExpense,
  editingComment,
  editingPayments,
  onExpenseChange,
  onCommentChange,
  onExpenseBlur,
  onPaymentToggle,
  onInvoiceDateChange,
  onDelete,
  onEdit
}: ShiftTableRowProps) {
  const key = getShiftKey(shift);
  const revenue = calculateRevenue(shift);
  const tax = calculateTax(shift);
  const afterTax = calculateAfterTax(shift);
  const workerSalary = calculateWorkerSalary(shift.contacts_count);
  const netProfit = calculateNetProfit(shift);
  const kvv = calculateKVV(shift);
  const kms = calculateKMS(shift);
  
  const [localInvoiceDate, setLocalInvoiceDate] = useState(shift.invoice_date || '');

  return (
    <tr className="hover:bg-gray-50">
      <td className="border border-gray-300 p-1 md:p-2 whitespace-nowrap">{formatDate(shift.date)}</td>
      <td className="border border-gray-300 p-1 md:p-2 whitespace-nowrap">
        {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
      </td>
      <td className="border border-gray-300 p-1 md:p-2">{shift.organization}</td>
      <td className="border border-gray-300 p-1 md:p-2">
        <div className="flex flex-col gap-1 items-center">
          <select
            value={(editingPayments[key]?.invoice_issued ?? shift.invoice_issued) ? 'yes' : 'no'}
            onChange={() => onPaymentToggle(shift, 'invoice_issued')}
            className={`w-16 h-7 text-xs border rounded px-1 font-medium ${
              (editingPayments[key]?.invoice_issued ?? shift.invoice_issued)
                ? 'bg-green-100 text-green-800 border-green-300'
                : 'bg-red-100 text-red-800 border-red-300'
            }`}
          >
            <option value="no">Нет</option>
            <option value="yes">Да</option>
          </select>
          {(editingPayments[key]?.invoice_issued ?? shift.invoice_issued) && (
            <Input
              type="date"
              value={localInvoiceDate}
              onChange={(e) => setLocalInvoiceDate(e.target.value)}
              onBlur={(e) => {
                if (e.target.value !== shift.invoice_date) {
                  onInvoiceDateChange(shift, e.target.value || null);
                }
              }}
              className="w-28 h-7 text-xs border-gray-300"
              placeholder="Дата счета"
            />
          )}
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