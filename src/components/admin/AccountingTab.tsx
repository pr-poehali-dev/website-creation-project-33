import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { ShiftRecord, User, Organization, NewShiftData } from './accounting/types';
import ShiftTable from './accounting/ShiftTable';
import AddShiftModal from './accounting/AddShiftModal';
import EditShiftModal from './accounting/EditShiftModal';
import AccountingHeader from './accounting/AccountingHeader';
import AccountingModal from './AccountingModal';
import KmsRevenueChart from './accounting/KmsRevenueChart';
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
    editingPersonalFunds,
    editingPayments,
    editingInvoiceDates,
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
  } = useShiftActions(loadAccountingData, getSessionToken);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftRecord | null>(null);
  const [exporting, setExporting] = useState(false);
  const [savingPayments, setSavingPayments] = useState(false);
  const [filters, setFilters] = useState({
    paid_by_organization: null as boolean | null,
    paid_to_worker: null as boolean | null,
    paid_kvv: null as boolean | null,
    paid_kms: null as boolean | null,
    invoice_issued: null as boolean | null
  });
  const [organizationFilter, setOrganizationFilter] = useState<string[]>([]);
  const [promoterFilter, setPromoterFilter] = useState<string[]>([]);
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<('cash' | 'cashless')[]>([]);
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
  const getMoscowDate = () => {
    const moscowTime = new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' });
    const [month, day, year] = moscowTime.split('/');
    return `${year}-${month}-${day}`;
  };

  const [newShift, setNewShift] = useState<NewShiftData>({
    user_id: 0,
    organization_id: 0,
    shift_date: getMoscowDate(),
    start_time: '09:00',
    end_time: '18:00',
    contacts_count: 0
  });

  const handleExportToGoogleSheets = async () => {
    if (filteredShifts.length === 0) {
      toast({
        title: 'Нет данных',
        description: 'Нет смен для экспорта',
        variant: 'destructive'
      });
      return;
    }

    setExporting(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      console.log('📤 Экспортируем смены:', filteredShifts);
      
      const response = await fetch('https://functions.poehali.dev/e7ea8b8a-c7f4-4c24-84f4-436f40f76963', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': getSessionToken() || ''
        },
        body: JSON.stringify({
          shifts: filteredShifts
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

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
      // Обновление данных происходит асинхронно в фоне, не блокируя закрытие модалки
      loadAccountingData();
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

  const handleSavePayments = async () => {
    setSavingPayments(true);
    await saveAllPayments(shifts);
    setSavingPayments(false);
  };

  const hasUnsavedPayments = 
    Object.keys(editingPayments).length > 0 || 
    Object.keys(editingInvoiceDates).length > 0 ||
    Object.keys(editingExpense).length > 0 ||
    Object.keys(editingComment).length > 0 ||
    Object.keys(editingPersonalFunds).length > 0;

  const dateFilteredShifts = shifts.filter(shift => {
    if (dateFilter.from && shift.date < dateFilter.from) return false;
    if (dateFilter.to && shift.date > dateFilter.to) return false;
    return true;
  });

  const uniqueOrganizations = Array.from(new Set(dateFilteredShifts.map(s => s.organization))).sort();
  const uniquePromoters = Array.from(new Set(dateFilteredShifts.map(s => s.user_name))).sort();

  const filteredShifts = dateFilteredShifts.filter(shift => {
    if (filters.paid_by_organization !== null && shift.paid_by_organization !== filters.paid_by_organization) return false;
    if (filters.paid_to_worker !== null && shift.paid_to_worker !== filters.paid_to_worker) return false;
    if (filters.paid_kvv !== null && shift.paid_kvv !== filters.paid_kvv) return false;
    if (filters.paid_kms !== null && shift.paid_kms !== filters.paid_kms) return false;
    if (filters.invoice_issued !== null && shift.invoice_issued !== filters.invoice_issued) return false;
    
    if (organizationFilter.length > 0 && !organizationFilter.includes(shift.organization)) return false;
    if (promoterFilter.length > 0 && !promoterFilter.includes(shift.user_name)) return false;
    if (paymentTypeFilter.length > 0 && !paymentTypeFilter.includes(shift.payment_type)) return false;
    
    return true;
  });

  const handleFilterChange = (key: keyof typeof filters) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key] === null ? true : prev[key] === true ? false : null
    }));
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== null).length;

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 rounded-2xl shadow-2xl">
        <CardContent className="p-8">
          <div className="text-center text-slate-300 flex items-center justify-center gap-3">
            <Icon name="Loader2" size={24} className="animate-spin text-cyan-400" />
            Загрузка данных...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-6">
        <KmsRevenueChart shifts={filteredShifts} />
      </div>
      
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 rounded-2xl shadow-2xl">
        <AccountingHeader
          onExport={handleExportToGoogleSheets}
          onAdd={() => setShowAddModal(true)}
          onFullscreen={() => setShowFullscreen(true)}
          exporting={exporting}
        />
        <CardContent>
          {hasUnsavedPayments && (
          <div className="mb-4 p-4 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/50 rounded-lg flex items-center justify-between backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Icon name="AlertCircle" size={20} className="text-orange-400" />
              <span className="text-sm text-orange-200 font-medium">
                У вас есть несохранённые изменения в оплатах
              </span>
            </div>
            <button
              onClick={handleSavePayments}
              disabled={savingPayments}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg flex items-center gap-2"
            >
              {savingPayments ? (
                <>
                  <Icon name="Loader2" size={16} className="animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Icon name="Save" size={16} />
                  Сохранить изменения
                </>
              )}
            </button>
          </div>
        )}
        <div className="min-h-[70vh]">
          <ShiftTable
            shifts={filteredShifts}
            editingExpense={editingExpense}
            editingComment={editingComment}
            editingPersonalFunds={editingPersonalFunds}
            editingPayments={editingPayments}
            editingInvoiceDates={editingInvoiceDates}
            filters={filters}
            organizationFilter={organizationFilter}
            promoterFilter={promoterFilter}
            paymentTypeFilter={paymentTypeFilter}
            dateFilter={dateFilter}
            uniqueOrganizations={uniqueOrganizations}
            uniquePromoters={uniquePromoters}
            onExpenseChange={(key, value) => setEditingExpense({ ...editingExpense, [key]: value })}
            onCommentChange={(key, value) => setEditingComment({ ...editingComment, [key]: value })}
            onPersonalFundsChange={(key, amount, by_kms, by_kvv) => setEditingPersonalFunds({ ...editingPersonalFunds, [key]: { amount, by_kms, by_kvv } })}
            onExpenseBlur={handleExpenseBlur}
            onPaymentToggle={handlePaymentToggle}
            onInvoiceIssuedDateChange={handleInvoiceIssuedDateChange}
            onInvoicePaidDateChange={handleInvoicePaidDateChange}
            onFilterChange={handleFilterChange}
            onOrganizationFilterChange={setOrganizationFilter}
            onPromoterFilterChange={setPromoterFilter}
            onPaymentTypeFilterChange={setPaymentTypeFilter}
            onDateFilterChange={(from, to) => setDateFilter({ from, to })}
            onDelete={deleteShift}
            onEdit={handleEditShift}
          />
        </div>
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

      <AccountingModal
        isOpen={showFullscreen}
        onClose={() => setShowFullscreen(false)}
        shifts={filteredShifts}
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
        hasUnsavedPayments={hasUnsavedPayments}
        savingPayments={savingPayments}
        editingExpense={editingExpense}
        editingComment={editingComment}
        editingPersonalFunds={editingPersonalFunds}
        editingPayments={editingPayments}
        editingInvoiceDates={editingInvoiceDates}
        onFilterChange={handleFilterChange}
        onOrganizationFilterChange={setOrganizationFilter}
        onPromoterFilterChange={setPromoterFilter}
        onPaymentTypeFilterChange={setPaymentTypeFilter}
        onDateFilterChange={(filter) => setDateFilter(filter)}
        onSavePayments={handleSavePayments}
        onEditShift={handleEditShift}
        onDeleteShift={deleteShift}
        onExpenseChange={(id, value) => setEditingExpense(prev => ({ ...prev, [id]: value }))}
        onExpenseBlur={handleExpenseBlur}
        onCommentChange={(id, value) => setEditingComment(prev => ({ ...prev, [id]: value }))}
        onPersonalFundsChange={(id, value) => setEditingPersonalFunds(prev => ({ ...prev, [id]: value }))}
        onPaymentToggle={handlePaymentToggle}
        onInvoiceIssuedDateChange={handleInvoiceIssuedDateChange}
        onInvoicePaidDateChange={handleInvoicePaidDateChange}
      />
    </Card>
    </>
  );
}