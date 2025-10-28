import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { ShiftRecord, User, Organization, NewShiftData, ADMIN_API } from './accounting/types';
import { getShiftKey } from './accounting/calculations';
import ShiftTable from './accounting/ShiftTable';
import AddShiftModal from './accounting/AddShiftModal';

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
  const [showAddModal, setShowAddModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [newShift, setNewShift] = useState<NewShiftData>({
    user_id: 0,
    organization_id: 0,
    shift_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '18:00',
    contacts_count: 0
  });

  const getSessionToken = () => localStorage.getItem('session_token');

  useEffect(() => {
    if (enabled) {
      loadAccountingData();
      loadUsers();
      loadOrganizations();
    }
  }, [enabled]);

  const loadUsers = async () => {
    try {
      const response = await fetch(`${ADMIN_API}?action=users`, {
        headers: { 'X-Session-Token': getSessionToken() || '' }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadOrganizations = async () => {
    try {
      const response = await fetch(`${ADMIN_API}?action=get_organizations`, {
        headers: { 'X-Session-Token': getSessionToken() || '' }
      });
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
    }
  };

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

  const addManualShift = async () => {
    if (!newShift.user_id || !newShift.organization_id) {
      toast({
        title: 'Ошибка',
        description: 'Выберите пользователя и организацию',
        variant: 'destructive'
      });
      return;
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
        setShowAddModal(false);
        setNewShift({
          user_id: 0,
          organization_id: 0,
          shift_date: new Date().toISOString().split('T')[0],
          start_time: '09:00',
          end_time: '18:00',
          contacts_count: 0
        });
        loadAccountingData();
      } else {
        const error = await response.json();
        toast({
          title: 'Ошибка',
          description: error.error || 'Не удалось добавить смену',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить смену',
        variant: 'destructive'
      });
    }
  };

  const handleRefresh = () => {
    loadAccountingData();
    toast({
      title: 'Обновление',
      description: 'Загрузка свежих данных...',
    });
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
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              title="Добавить смену"
            >
              <Icon name="Plus" size={16} />
              <span className="hidden md:inline">Добавить</span>
            </button>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Обновить данные"
            >
              <Icon name="RefreshCw" size={16} />
              <span className="hidden md:inline">Обновить</span>
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ShiftTable
          shifts={shifts}
          editingExpense={editingExpense}
          editingComment={editingComment}
          editingPayments={editingPayments}
          onExpenseChange={(key, value) => setEditingExpense({ ...editingExpense, [key]: value })}
          onCommentChange={(key, value) => setEditingComment({ ...editingComment, [key]: value })}
          onExpenseBlur={handleExpenseBlur}
          onPaymentToggle={handlePaymentToggle}
          onDelete={deleteShift}
        />
      </CardContent>

      <AddShiftModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addManualShift}
        newShift={newShift}
        setNewShift={setNewShift}
        users={users}
        organizations={organizations}
      />
    </Card>
  );
}
