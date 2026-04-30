import React, { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import WorkTimeDateGroup from './WorkTimeDateGroup';
import WorkTimeAddModal from './WorkTimeAddModal';
import { WorkTimeData } from './WorkTimeShiftCard';

interface AllUsersWorkTimeProps {
  sessionToken: string;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
}

export default function AllUsersWorkTime({ sessionToken }: AllUsersWorkTimeProps) {
  const [workTimeData, setWorkTimeData] = useState<WorkTimeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingShift, setDeletingShift] = useState<string | null>(null);
  const [closingShift, setClosingShift] = useState<string | null>(null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleDate = (date: string) => {
    setExpandedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) newSet.delete(date);
      else newSet.add(date);
      return newSet;
    });
  };

  const loadWorkTime = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214?action=all_users_work_time',
        { headers: { 'X-Session-Token': sessionToken } }
      );
      const data = await response.json();
      if (data.work_time) setWorkTimeData(data.work_time);
    } catch (error) {
      console.error('Ошибка загрузки времени работы:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteShift = async (userId: number, workDate: string) => {
    if (!confirm('Вы уверены, что хотите удалить информацию о смене?')) return;
    const shiftKey = `${userId}-${workDate}`;
    setDeletingShift(shiftKey);
    const [day, month] = workDate.split('.');
    const year = new Date().getFullYear();
    const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    try {
      const response = await fetch('https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'X-Session-Token': sessionToken },
        body: JSON.stringify({ action: 'delete_shift', user_id: userId, work_date: formattedDate }),
      });
      const result = await response.json();
      if (result.success) await loadWorkTime();
      else alert('Ошибка при удалении смены');
    } catch (error) {
      alert('Ошибка при удалении смены');
    } finally {
      setDeletingShift(null);
    }
  };

  const handleCloseShift = async (userId: number, workDate: string, organizationId: number) => {
    if (!confirm('Закрыть смену сейчас? Время окончания будет установлено на текущий момент.')) return;
    const shiftKey = `close-${userId}-${workDate}`;
    setClosingShift(shiftKey);
    const [day, month] = workDate.split('.');
    const year = new Date().getFullYear();
    const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    try {
      const response = await fetch('https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-Token': sessionToken },
        body: JSON.stringify({ action: 'close_shift', user_id: userId, work_date: formattedDate, organization_id: organizationId }),
      });
      const result = await response.json();
      if (result.success) await loadWorkTime();
      else alert(result.error || 'Ошибка при закрытии смены');
    } catch (error) {
      alert('Ошибка при закрытии смены');
    } finally {
      setClosingShift(null);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch(
        'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214?action=users',
        { method: 'GET', headers: { 'X-Session-Token': sessionToken } }
      );
      const data = await response.json();
      if (data.users) {
        setUsers(data.users.map((u: { id: number; name?: string }) => ({
          id: u.id,
          first_name: u.name?.split(' ')[0] || '',
          last_name: u.name?.split(' ')[1] || ''
        })));
      }
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    }
  };

  const handleAddShift = async () => {
    if (!selectedUser || !selectedDate || !startTime || !endTime) {
      alert('Заполните все поля');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-Token': sessionToken },
        body: JSON.stringify({ action: 'add_shift', user_id: selectedUser, work_date: selectedDate, start_time: startTime, end_time: endTime }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setShowAddModal(false);
        setSelectedUser(null);
        setSelectedDate('');
        setStartTime('');
        setEndTime('');
        await loadWorkTime();
      } else {
        alert(result.error || `Ошибка ${response.status}: ${JSON.stringify(result)}`);
      }
    } catch (error) {
      alert('Ошибка при добавлении смены: ' + error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    loadWorkTime();
    loadUsers();
    const interval = setInterval(loadWorkTime, 30000);
    return () => clearInterval(interval);
  }, [sessionToken]);

  const groupedByDate = workTimeData.reduce((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {} as Record<string, WorkTimeData[]>);

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
    const dateA = a.split('.').reverse().join('-');
    const dateB = b.split('.').reverse().join('-');
    return dateB.localeCompare(dateA);
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <Icon name="Clock" size={18} className="text-blue-500" />
          </div>
          <h2 className="font-semibold text-gray-800 text-base">Время работы</h2>
        </div>
        <div className="flex items-center justify-center gap-2 text-gray-400 py-8">
          <Icon name="Loader2" size={18} className="animate-spin text-blue-400" />
          <span className="text-sm">Загрузка данных...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <Icon name="Clock" size={18} className="text-blue-500" />
          </div>
          <h2 className="font-semibold text-gray-800 text-base">Время работы</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition-colors"
          >
            <Icon name="Plus" size={14} />
            <span className="hidden sm:inline">Добавить смену</span>
            <span className="sm:hidden">Добавить</span>
          </button>
          <button
            onClick={loadWorkTime}
            className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
            title="Обновить"
          >
            <Icon name="RefreshCw" size={14} className="text-gray-400" />
          </button>
        </div>
      </div>

      <div className="p-5">
        {workTimeData.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <Icon name="Calendar" size={24} className="text-gray-300" />
            </div>
            <p className="font-semibold text-gray-700 text-sm">Нет данных</p>
            <p className="text-gray-400 text-xs mt-1">Промоутеры ещё не открывали смены</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedDates.map((date) => (
              <WorkTimeDateGroup
                key={date}
                date={date}
                shifts={groupedByDate[date]}
                isExpanded={expandedDates.has(date)}
                deletingShift={deletingShift}
                closingShift={closingShift}
                onToggle={toggleDate}
                onDelete={handleDeleteShift}
                onClose={handleCloseShift}
              />
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <WorkTimeAddModal
          users={users}
          selectedUser={selectedUser}
          selectedDate={selectedDate}
          startTime={startTime}
          endTime={endTime}
          isSubmitting={isSubmitting}
          onSelectUser={setSelectedUser}
          onSelectDate={setSelectedDate}
          onStartTime={setStartTime}
          onEndTime={setEndTime}
          onSubmit={handleAddShift}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
