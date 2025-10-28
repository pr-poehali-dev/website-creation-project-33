import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { ShiftRecord, NewShiftData, ADMIN_API } from './types';
import { getShiftKey } from './calculations';

export function useShiftActions(
  loadAccountingData: () => Promise<void>,
  getSessionToken: () => string | null
) {
  const [editingExpense, setEditingExpense] = useState<{[key: string]: number}>({});
  const [editingComment, setEditingComment] = useState<{[key: string]: string}>({});
  const [editingPayments, setEditingPayments] = useState<{[key: string]: {
    paid_by_organization: boolean;
    paid_to_worker: boolean;
    paid_kvv: boolean;
    paid_kms: boolean;
  }}>({});

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

    if (!confirm(`Удалить смену ${shift.user_name} от ${new Date(shift.date).toLocaleDateString('ru-RU')}?`)) {
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

  const saveEditedShift = async (editingShift: ShiftRecord, updatedShift: Partial<ShiftRecord>) => {
    try {
      const response = await fetch(ADMIN_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': getSessionToken() || ''
        },
        body: JSON.stringify({
          action: 'update_work_shift',
          old_user_id: editingShift.user_id,
          old_work_date: editingShift.date,
          old_organization_id: editingShift.organization_id,
          new_user_id: updatedShift.user_id,
          new_work_date: updatedShift.date,
          new_organization_id: updatedShift.organization_id,
          start_time: updatedShift.start_time,
          end_time: updatedShift.end_time,
          contacts_count: updatedShift.contacts_count,
          contact_rate: updatedShift.contact_rate,
          payment_type: updatedShift.payment_type,
          expense_amount: updatedShift.expense_amount,
          expense_comment: updatedShift.expense_comment,
          paid_by_organization: updatedShift.paid_by_organization,
          paid_to_worker: updatedShift.paid_to_worker,
          paid_kvv: updatedShift.paid_kvv,
          paid_kms: updatedShift.paid_kms
        })
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Смена обновлена'
        });
        loadAccountingData();
        return true;
      } else {
        const error = await response.json();
        toast({
          title: 'Ошибка',
          description: error.error || 'Не удалось обновить смену',
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить смену',
        variant: 'destructive'
      });
      return false;
    }
  };

  const addManualShift = async (newShift: NewShiftData) => {
    if (!newShift.user_id || !newShift.organization_id) {
      toast({
        title: 'Ошибка',
        description: 'Выберите пользователя и организацию',
        variant: 'destructive'
      });
      return false;
    }

    try {
      const response = await fetch(ADMIN_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': getSessionToken() || ''
        },
        body: JSON.stringify({
          action: 'add_manual_work_shift',
          ...newShift
        })
      });

      if (response.ok) {
        toast({
          title: 'Успех',
          description: 'Смена добавлена'
        });
        loadAccountingData();
        return true;
      } else {
        const error = await response.json();
        toast({
          title: 'Ошибка',
          description: error.error || 'Не удалось добавить смену',
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить смену',
        variant: 'destructive'
      });
      return false;
    }
  };

  return {
    editingExpense,
    editingComment,
    editingPayments,
    setEditingExpense,
    setEditingComment,
    handleExpenseBlur,
    deleteShift,
    handlePaymentToggle,
    saveEditedShift,
    addManualShift
  };
}
