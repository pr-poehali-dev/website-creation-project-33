import React from 'react';
import Icon from '@/components/ui/icon';
import ShiftTableRow from './ShiftTableRow';
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
  onExpenseChange: (key: string, value: number) => void;
  onCommentChange: (key: string, value: string) => void;
  onExpenseBlur: (shift: ShiftRecord) => void;
  onPaymentToggle: (shift: ShiftRecord, field: 'paid_by_organization' | 'paid_to_worker' | 'paid_kvv' | 'paid_kms') => void;
  onDelete: (shift: ShiftRecord) => void;
}

export default function ShiftTable({
  shifts,
  editingExpense,
  editingComment,
  editingPayments,
  onExpenseChange,
  onCommentChange,
  onExpenseBlur,
  onPaymentToggle,
  onDelete
}: ShiftTableProps) {
  if (shifts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        <Icon name="FileSpreadsheet" size={32} className="mx-auto mb-3 opacity-30" />
        <p>Данные отсутствуют</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs md:text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100 text-gray-700">
            <th className="border border-gray-300 p-1 md:p-2 text-left whitespace-nowrap">Дата</th>
            <th className="border border-gray-300 p-1 md:p-2 text-left whitespace-nowrap">Время</th>
            <th className="border border-gray-300 p-1 md:p-2 text-left whitespace-nowrap">Организация</th>
            <th className="border border-gray-300 p-1 md:p-2 text-right whitespace-nowrap">Сумма прихода</th>
            <th className="border border-gray-300 p-1 md:p-2 text-center whitespace-nowrap">Оплата</th>
            <th className="border border-gray-300 p-1 md:p-2 text-right whitespace-nowrap">Налог 6%</th>
            <th className="border border-gray-300 p-1 md:p-2 text-right whitespace-nowrap">После налога</th>
            <th className="border border-gray-300 p-1 md:p-2 text-left whitespace-nowrap">Промоутер</th>
            <th className="border border-gray-300 p-1 md:p-2 text-right whitespace-nowrap">Контакты</th>
            <th className="border border-gray-300 p-1 md:p-2 text-right whitespace-nowrap">Зарплата</th>
            <th className="border border-gray-300 p-1 md:p-2 text-right whitespace-nowrap">Расход</th>
            <th className="border border-gray-300 p-1 md:p-2 text-left whitespace-nowrap">Комментарий</th>
            <th className="border border-gray-300 p-1 md:p-2 text-right whitespace-nowrap bg-green-50">Чистый остаток</th>
            <th className="border border-gray-300 p-1 md:p-2 text-right whitespace-nowrap bg-blue-50">КВВ</th>
            <th className="border border-gray-300 p-1 md:p-2 text-right whitespace-nowrap bg-purple-50">КМС</th>
            <th className="border border-gray-300 p-1 md:p-2 text-center whitespace-nowrap">Опл. орг.</th>
            <th className="border border-gray-300 p-1 md:p-2 text-center whitespace-nowrap">Опл. испол.</th>
            <th className="border border-gray-300 p-1 md:p-2 text-center whitespace-nowrap">Опл. КВВ</th>
            <th className="border border-gray-300 p-1 md:p-2 text-center whitespace-nowrap">Опл. КМС</th>
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
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
