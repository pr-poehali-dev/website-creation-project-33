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
  const [editingPersonalFunds, setEditingPersonalFunds] = useState<{[key: string]: {
    amount: number;
    by_kms: boolean;
    by_kvv: boolean;
  }}>({});
  const [editingPayments, setEditingPayments] = useState<{[key: string]: {
    paid_by_organization: boolean;
    paid_to_worker: boolean;
    salary_at_kvv: boolean;
    paid_kvv: boolean;
    paid_kms: boolean;
    invoice_issued: boolean;
  }}>({});

  const updateExpense = async (shift: ShiftRecord, expenseAmount: number, expenseComment: string, payments?: {
    paid_by_organization: boolean;
    paid_to_worker: boolean;
    salary_at_kvv: boolean;
    paid_kvv: boolean;
    paid_kms: boolean;
    invoice_issued: boolean;
  }, invoiceIssuedDate?: string | null, invoicePaidDate?: string | null) => {
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
          salary_at_kvv: payments?.salary_at_kvv ?? shift.salary_at_kvv,
          paid_kvv: payments?.paid_kvv ?? shift.paid_kvv,
          paid_kms: payments?.paid_kms ?? shift.paid_kms,
          invoice_issued: payments?.invoice_issued ?? shift.invoice_issued,
          invoice_issued_date: invoiceIssuedDate ?? shift.invoice_issued_date ?? null,
          invoice_paid: payments?.invoice_paid ?? shift.invoice_paid,
          invoice_paid_date: invoicePaidDate ?? shift.invoice_paid_date ?? null,
          personal_funds_amount: shift.personal_funds_amount || 0,
          personal_funds_by_kms: shift.personal_funds_by_kms || false,
          personal_funds_by_kvv: shift.personal_funds_by_kvv || false,
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
    const personalFunds = editingPersonalFunds[key];
    
    // Обновляем shift с данными о личных средствах, если они есть
    const updatedShift = personalFunds ? {
      ...shift,
      personal_funds_amount: personalFunds.amount,
      personal_funds_by_kms: personalFunds.by_kms,
      personal_funds_by_kvv: personalFunds.by_kvv
    } : shift;
    
    const hasChanges = 
      expenseAmount !== shift.expense_amount || 
      expenseComment !== shift.expense_comment || 
      payments ||
      (personalFunds && (
        personalFunds.amount !== shift.personal_funds_amount ||
        personalFunds.by_kms !== shift.personal_funds_by_kms ||
        personalFunds.by_kvv !== shift.personal_funds_by_kvv
      ));
    
    if (hasChanges) {
      updateExpense(updatedShift, expenseAmount, expenseComment, payments);
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

  const handlePaymentToggle = (shift: ShiftRecord, field: 'paid_by_organization' | 'paid_to_worker' | 'salary_at_kvv' | 'paid_kvv' | 'paid_kms' | 'invoice_issued' | 'invoice_paid') => {
    const key = getShiftKey(shift);
    const currentPayments = editingPayments[key] || {
      paid_by_organization: shift.paid_by_organization,
      paid_to_worker: shift.paid_to_worker,
      salary_at_kvv: shift.salary_at_kvv,
      paid_kvv: shift.paid_kvv,
      paid_kms: shift.paid_kms,
      invoice_issued: shift.invoice_issued,
      invoice_paid: shift.invoice_paid
    };
    
    const newPayments = {
      ...currentPayments,
      [field]: !currentPayments[field]
    };
    
    setEditingPayments({ ...editingPayments, [key]: newPayments });
  };

  const handleInvoiceIssuedDateChange = async (shift: ShiftRecord, date: string | null) => {
    const key = getShiftKey(shift);
    const expenseAmount = editingExpense[key] ?? shift.expense_amount ?? 0;
    const expenseComment = editingComment[key] ?? shift.expense_comment ?? '';
    const payments = editingPayments[key];
    
    await updateExpense(shift, expenseAmount, expenseComment, payments, date, shift.invoice_paid_date);
  };

  const handleInvoicePaidDateChange = async (shift: ShiftRecord, date: string | null) => {
    const key = getShiftKey(shift);
    const expenseAmount = editingExpense[key] ?? shift.expense_amount ?? 0;
    const expenseComment = editingComment[key] ?? shift.expense_comment ?? '';
    const payments = editingPayments[key];
    
    await updateExpense(shift, expenseAmount, expenseComment, payments, shift.invoice_issued_date, date);
  };

  const saveAllPayments = async (shifts: ShiftRecord[]) => {
    const updates = Object.entries(editingPayments).map(async ([key, payments]) => {
      const shift = shifts.find(s => getShiftKey(s) === key);
      if (!shift) return;
      
      const expenseAmount = editingExpense[key] ?? shift.expense_amount ?? 0;
      const expenseComment = editingComment[key] ?? shift.expense_comment ?? '';
      
      return fetch(ADMIN_API, {
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
          paid_by_organization: payments.paid_by_organization,
          paid_to_worker: payments.paid_to_worker,
          salary_at_kvv: payments.salary_at_kvv,
          paid_kvv: payments.paid_kvv,
          paid_kms: payments.paid_kms,
          invoice_issued: payments.invoice_issued,
          invoice_issued_date: shift.invoice_issued_date,
          invoice_paid: payments.invoice_paid,
          invoice_paid_date: shift.invoice_paid_date,
        }),
      });
    });

    try {
      await Promise.all(updates);
      toast({
        title: 'Успешно',
        description: 'Все изменения сохранены',
      });
      setEditingPayments({});
      loadAccountingData();
      return true;
    } catch (error) {
      console.error('Error saving payments:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить изменения',
        variant: 'destructive',
      });
      return false;
    }
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
          paid_kms: updatedShift.paid_kms,
          invoice_issued: updatedShift.invoice_issued
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
    editingPersonalFunds,
    editingPayments,
    setEditingExpense,
    setEditingComment,
    setEditingPersonalFunds,
    handleExpenseBlur,
    deleteShift,
    handlePaymentToggle,
    handleInvoiceIssuedDateChange,
    handleInvoicePaidDateChange,
    saveAllPayments,
    saveEditedShift,
    addManualShift
  };
}