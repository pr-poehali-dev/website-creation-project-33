import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

const ADMIN_API = 'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214';

interface ShiftRecord {
  date: string;
  start_time: string;
  end_time: string;
  organization: string;
  organization_id: number;
  user_id: number;
  user_name: string;
  contacts_count: number;
  contact_rate: number;
  payment_type: 'cash' | 'cashless';
  expense_amount: number;
  expense_comment: string;
  paid_by_organization: boolean;
  paid_to_worker: boolean;
  paid_kvv: boolean;
  paid_kms: boolean;
}

interface AccountingTabProps {
  enabled?: boolean;
}

export default function AccountingTab({ enabled = true }: AccountingTabProps) {
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState<{[key: string]: number}>({});
  const [editingComment, setEditingComment] = useState<{[key: string]: string}>({});
  const [editingPayments, setEditingPayments] = useState<{[key: string]: {
    paid_by_organization: boolean;
    paid_to_worker: boolean;
    paid_kvv: boolean;
    paid_kms: boolean;
  }}>({});

  const getSessionToken = () => localStorage.getItem('session_token');

  useEffect(() => {
    if (enabled) {
      loadAccountingData();
    }
  }, [enabled]);

  const loadAccountingData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${ADMIN_API}?action=get_accounting_data`,
        {
          headers: {
            'X-Session-Token': getSessionToken() || '',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const filteredShifts = (data.shifts || []).filter((shift: ShiftRecord) => {
          const shiftDate = new Date(shift.date);
          const cutoffDate = new Date('2025-10-20');
          return shiftDate >= cutoffDate;
        });
        setShifts(filteredShifts);
      } else {
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить данные',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading accounting data:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateExpense = async (shift: ShiftRecord, expenseAmount: number, expenseComment: string, payments?: {
    paid_by_organization: boolean;
    paid_to_worker: boolean;
    paid_kvv: boolean;
    paid_kms: boolean;
  }) => {
    try {
      const response = await fetch(ADMIN_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': getSessionToken() || '',
        },
        body: JSON.stringify({
          action: 'update_accounting_expense',
          user_id: shift.user_id,
          work_date: shift.date,
          organization_id: shift.organization_id,
          expense_amount: expenseAmount,
          expense_comment: expenseComment,
          paid_by_organization: payments?.paid_by_organization ?? shift.paid_by_organization,
          paid_to_worker: payments?.paid_to_worker ?? shift.paid_to_worker,
          paid_kvv: payments?.paid_kvv ?? shift.paid_kvv,
          paid_kms: payments?.paid_kms ?? shift.paid_kms,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Данные обновлены',
        });
        loadAccountingData();
      } else {
        const error = await response.json();
        toast({
          title: 'Ошибка',
          description: error.error || 'Не удалось обновить данные',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить данные',
        variant: 'destructive',
      });
    }
  };

  const calculateRevenue = (shift: ShiftRecord) => {
    return shift.contacts_count * shift.contact_rate;
  };

  const calculateTax = (shift: ShiftRecord) => {
    if (shift.payment_type === 'cashless') {
      const revenue = calculateRevenue(shift);
      return Math.round(revenue * 0.06);
    }
    return 0;
  };

  const calculateAfterTax = (shift: ShiftRecord) => {
    const revenue = calculateRevenue(shift);
    const tax = calculateTax(shift);
    return revenue - tax;
  };

  const calculateWorkerSalary = (contactsCount: number) => {
    if (contactsCount >= 10) {
      return contactsCount * 300;
    }
    return contactsCount * 200;
  };

  const calculateNetProfit = (shift: ShiftRecord) => {
    const afterTax = calculateAfterTax(shift);
    const workerSalary = calculateWorkerSalary(shift.contacts_count);
    const expense = shift.expense_amount || 0;
    return afterTax - workerSalary - expense;
  };

  const calculateKVV = (shift: ShiftRecord) => {
    return Math.round(calculateNetProfit(shift) / 2);
  };

  const calculateKMS = (shift: ShiftRecord) => {
    return Math.round(calculateNetProfit(shift) / 2);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU');
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '—';
    return timeStr.substring(0, 5);
  };

  const getShiftKey = (shift: ShiftRecord) => {
    return `${shift.user_id}-${shift.date}-${shift.organization_id}`;
  };

  const handleExpenseBlur = (shift: ShiftRecord) => {
    const key = getShiftKey(shift);
    const expenseAmount = editingExpense[key] ?? shift.expense_amount;
    const expenseComment = editingComment[key] ?? shift.expense_comment;
    const payments = editingPayments[key];
    
    if (expenseAmount !== shift.expense_amount || expenseComment !== shift.expense_comment || payments) {
      updateExpense(shift, expenseAmount, expenseComment, payments);
    }
  };

  const deleteShift = async (shift: ShiftRecord) => {
    const password = prompt('Введите пароль для удаления:');
    if (password !== '955650') {
      toast({
        title: 'Ошибка',
        description: 'Неверный пароль',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Удалить смену ${shift.user_name} от ${formatDate(shift.date)}?`)) {
      return;
    }

    try {
      const response = await fetch(ADMIN_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': getSessionToken() || '',
        },
        body: JSON.stringify({
          action: 'delete_work_shift',
          user_id: shift.user_id,
          work_date: shift.date,
          organization_id: shift.organization_id,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Смена удалена',
        });
        loadAccountingData();
      } else {
        const error = await response.json();
        toast({
          title: 'Ошибка',
          description: error.error || 'Не удалось удалить смену',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting shift:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить смену',
        variant: 'destructive',
      });
    }
  };

  const handlePaymentToggle = (shift: ShiftRecord, field: 'paid_by_organization' | 'paid_to_worker' | 'paid_kvv' | 'paid_kms') => {
    const key = getShiftKey(shift);
    const currentPayments = editingPayments[key] || {
      paid_by_organization: shift.paid_by_organization,
      paid_to_worker: shift.paid_to_worker,
      paid_kvv: shift.paid_kvv,
      paid_kms: shift.paid_kms
    };
    
    const newPayments = {
      ...currentPayments,
      [field]: !currentPayments[field]
    };
    
    setEditingPayments({ ...editingPayments, [key]: newPayments });
    updateExpense(shift, shift.expense_amount, shift.expense_comment, newPayments);
  };

  if (loading) {
    return (
      <Card className="bg-white border-gray-200 rounded-2xl">
        <CardContent className="p-8">
          <div className="text-center text-gray-600 flex items-center justify-center gap-3">
            <Icon name="Loader2" size={24} className="animate-spin" />
            Загрузка данных...
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleRefresh = () => {
    loadAccountingData();
    toast({
      title: 'Обновление',
      description: 'Загрузка свежих данных...',
    });
  };

  return (
    <Card className="bg-white border-gray-200 rounded-2xl">
      <CardHeader className="pb-3 md:pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 md:gap-3 text-gray-900 text-lg md:text-xl">
            <div className="p-1.5 md:p-2 rounded-lg bg-blue-100">
              <Icon name="Calculator" size={18} className="text-blue-600 md:w-5 md:h-5" />
            </div>
            Бух.учет
          </CardTitle>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="Обновить данные"
          >
            <Icon name="RefreshCw" size={16} />
            <span className="hidden md:inline">Обновить</span>
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {shifts.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            <Icon name="FileSpreadsheet" size={32} className="mx-auto mb-3 opacity-30" />
            <p>Данные отсутствуют</p>
          </div>
        ) : (
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
                {shifts.map((shift) => {
                  const key = getShiftKey(shift);
                  const revenue = calculateRevenue(shift);
                  const tax = calculateTax(shift);
                  const afterTax = calculateAfterTax(shift);
                  const workerSalary = calculateWorkerSalary(shift.contacts_count);
                  const netProfit = calculateNetProfit(shift);
                  const kvv = calculateKVV(shift);
                  const kms = calculateKMS(shift);

                  return (
                    <tr key={key} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-1 md:p-2 whitespace-nowrap">{formatDate(shift.date)}</td>
                      <td className="border border-gray-300 p-1 md:p-2 whitespace-nowrap">
                        {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                      </td>
                      <td className="border border-gray-300 p-1 md:p-2">{shift.organization}</td>
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
                          onChange={(e) => setEditingExpense({ ...editingExpense, [key]: parseInt(e.target.value) || 0 })}
                          onBlur={() => handleExpenseBlur(shift)}
                          className="w-20 h-7 text-xs border-gray-300"
                        />
                      </td>
                      <td className="border border-gray-300 p-1 md:p-2">
                        <Input
                          type="text"
                          value={editingComment[key] ?? shift.expense_comment ?? ''}
                          onChange={(e) => setEditingComment({ ...editingComment, [key]: e.target.value })}
                          onBlur={() => handleExpenseBlur(shift)}
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
                          onChange={(e) => handlePaymentToggle(shift, 'paid_by_organization')}
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
                          onChange={(e) => handlePaymentToggle(shift, 'paid_to_worker')}
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
                          onChange={(e) => handlePaymentToggle(shift, 'paid_kvv')}
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
                          onChange={(e) => handlePaymentToggle(shift, 'paid_kms')}
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
                        <button
                          onClick={() => deleteShift(shift)}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                          title="Удалить смену"
                        >
                          <Icon name="Trash2" size={16} className="text-red-600" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}