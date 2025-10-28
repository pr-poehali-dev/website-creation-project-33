import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { ShiftRecord, User, Organization, NewShiftData } from './accounting/types';
import ShiftTable from './accounting/ShiftTable';
import AddShiftModal from './accounting/AddShiftModal';
import EditShiftModal from './accounting/EditShiftModal';
import AccountingHeader from './accounting/AccountingHeader';
import { useAccountingData } from './accounting/useAccountingData';
import { useShiftActions } from './accounting/useShiftActions';

interface AccountingTabProps {
  enabled?: boolean;
}

export default function AccountingTab({ enabled = true }: AccountingTabProps) {
  const {
    shifts,
    loading,
    users,
    organizations,
    loadAccountingData,
    getSessionToken
  } = useAccountingData(enabled);

  const {
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
  } = useShiftActions(loadAccountingData, getSessionToken);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftRecord | null>(null);
  const [exporting, setExporting] = useState(false);
  const [newShift, setNewShift] = useState<NewShiftData>({
    user_id: 0,
    organization_id: 0,
    shift_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '18:00',
    contacts_count: 0
  });

  const handleExportToGoogleSheets = async () => {
    setExporting(true);
    try {
      const response = await fetch('https://functions.poehali.dev/e7ea8b8a-c7f4-4c24-84f4-436f40f76963', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': getSessionToken() || ''
        },
        body: JSON.stringify({
          shifts: shifts
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Успешно!',
          description: data.message,
        });
        if (data.sheet_url) {
          window.open(data.sheet_url, '_blank');
        }
      } else {
        const error = await response.json();
        toast({
          title: 'Ошибка',
          description: error.error || 'Не удалось экспортировать данные',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось экспортировать данные',
        variant: 'destructive'
      });
    } finally {
      setExporting(false);
    }
  };

  const handleRefresh = () => {
    loadAccountingData();
    toast({
      title: 'Обновление',
      description: 'Загрузка свежих данных...',
    });
  };

  const handleEditShift = (shift: ShiftRecord) => {
    setEditingShift(shift);
    setShowEditModal(true);
  };

  const handleSaveEditedShift = async (updatedShift: Partial<ShiftRecord>) => {
    if (!editingShift) return;
    
    const success = await saveEditedShift(editingShift, updatedShift);
    if (success) {
      setShowEditModal(false);
      setEditingShift(null);
    }
  };

  const handleAddManualShift = async () => {
    const success = await addManualShift(newShift);
    if (success) {
      setShowAddModal(false);
      setNewShift({
        user_id: 0,
        organization_id: 0,
        shift_date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '18:00',
        contacts_count: 0
      });
    }
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
      <AccountingHeader
        onExport={handleExportToGoogleSheets}
        onAdd={() => setShowAddModal(true)}
        onRefresh={handleRefresh}
        exporting={exporting}
      />
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
          onEdit={handleEditShift}
        />
      </CardContent>

      <AddShiftModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddManualShift}
        newShift={newShift}
        setNewShift={setNewShift}
        users={users}
        organizations={organizations}
      />

      <EditShiftModal
        show={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingShift(null);
        }}
        onSave={handleSaveEditedShift}
        shift={editingShift}
        users={users}
        organizations={organizations}
      />
    </Card>
  );
}