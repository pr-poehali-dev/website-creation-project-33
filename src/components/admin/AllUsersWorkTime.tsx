import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
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
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  const loadWorkTime = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214?action=all_users_work_time',
        {
          headers: {
            'X-Session-Token': sessionToken,
          },
        }
      );
      const data = await response.json();
      if (data.work_time) {
        setWorkTimeData(data.work_time);
      }
    } catch (error) {
      console.error('Ошибка загрузки времени работы:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteShift = async (userId: number, workDate: string) => {
    if (!confirm('Вы уверены, что хотите удалить информацию о смене?')) {
      return;
    }

    const shiftKey = `${userId}-${workDate}`;
    setDeletingShift(shiftKey);

    const [day, month] = workDate.split('.');
    const year = new Date().getFullYear();
    const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    try {
      const response = await fetch(
        'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': sessionToken,
          },
          body: JSON.stringify({
            action: 'delete_shift',
            user_id: userId,
            work_date: formattedDate,
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        await loadWorkTime();
      } else {
        alert('Ошибка при удалении смены');
      }
    } catch (error) {
      console.error('Ошибка удаления смены:', error);
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
      const response = await fetch(
        'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Session-Token': sessionToken },
          body: JSON.stringify({ action: 'close_shift', user_id: userId, work_date: formattedDate, organization_id: organizationId }),
        }
      );
      const result = await response.json();
      if (result.success) {
        await loadWorkTime();
      } else {
        alert(result.error || 'Ошибка при закрытии смены');
      }
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
        {
          method: 'GET',
          headers: {
            'X-Session-Token': sessionToken,
          },
        }
      );
      const data = await response.json();
      if (data.users) {
        const formattedUsers = data.users.map((u: { id: number; name?: string }) => ({
          id: u.id,
          first_name: u.name?.split(' ')[0] || '',
          last_name: u.name?.split(' ')[1] || ''
        }));
        setUsers(formattedUsers);
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
      const response = await fetch(
        'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': sessionToken,
          },
          body: JSON.stringify({
            action: 'add_shift',
            user_id: selectedUser,
            work_date: selectedDate,
            start_time: startTime,
            end_time: endTime,
          }),
        }
      );

      const result = await response.json();
      console.log('Add shift response:', response.status, result);

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
      console.error('Ошибка добавления смены:', error);
      alert('Ошибка при добавлении смены: ' + error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    loadWorkTime();
    loadUsers();

    const interval = setInterval(() => {
      loadWorkTime();
    }, 30000);

    return () => clearInterval(interval);
  }, [sessionToken]);

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 rounded-2xl shadow-2xl">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <Icon name="Clock" size={24} className="text-cyan-400" />
            Время работы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2 text-slate-300 py-8">
            <Icon name="Loader2" size={20} className="animate-spin text-cyan-400" />
            Загрузка данных...
          </div>
        </CardContent>
      </Card>
    );
  }

  const groupedByDate = workTimeData.reduce((acc, item) => {
    if (!acc[item.date]) {
      acc[item.date] = [];
    }
    acc[item.date].push(item);
    return acc;
  }, {} as Record<string, WorkTimeData[]>);

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
    const dateA = a.split('.').reverse().join('-');
    const dateB = b.split('.').reverse().join('-');
    return dateB.localeCompare(dateA);
  });

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 rounded-2xl shadow-2xl">
      <CardHeader className="pb-3 sm:pb-6">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-slate-100 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-lg md:text-xl">
            <div className="p-1.5 sm:p-2 rounded-lg bg-slate-800">
              <Icon name="Clock" size={16} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-cyan-400" />
            </div>
            <span className="hidden xs:inline">Время работы промоутеров</span>
            <span className="xs:hidden">Время работы</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs md:text-sm font-semibold"
              size="sm"
            >
              <Icon name="Plus" size={14} className="md:w-4 md:h-4" />
              <span className="hidden sm:inline ml-1">Добавить смену</span>
              <span className="sm:hidden ml-1">Добавить</span>
            </Button>
            <button
              onClick={loadWorkTime}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
              title="Обновить данные"
            >
              <Icon name="RefreshCw" size={16} className="text-cyan-400 md:w-[18px] md:h-[18px]" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {workTimeData.length === 0 ? (
          <div className="text-center py-6 md:py-8 text-slate-400">
            <Icon name="Calendar" size={40} className="mx-auto mb-3 md:mb-4 text-slate-500 md:w-12 md:h-12" />
            <p className="text-base md:text-lg font-medium text-slate-100">Нет данных</p>
            <p className="text-xs md:text-sm mt-2">Промоутеры еще не открывали смены</p>
          </div>
        ) : (
          <div className="space-y-4">
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
      </CardContent>

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
    </Card>
  );
}
