import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

interface WorkTimeData {
  user_id: number;
  user_name: string;
  date: string;
  start_time: string;
  end_time: string;
  hours_worked: string;
  leads_count: number;
}

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
        const formattedUsers = data.users.map((u: any) => ({
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
      <Card className="bg-white border-gray-200 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Icon name="Clock" size={24} />
            Время работы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2 text-gray-900 py-8">
            <Icon name="Loader2" size={20} className="animate-spin" />
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
    <Card className="bg-white border-gray-200 rounded-2xl">
      <CardHeader className="pb-3 sm:pb-6">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-gray-900 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-lg md:text-xl">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gray-100">
              <Icon name="Clock" size={16} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
            </div>
            <span className="hidden xs:inline">Время работы промоутеров</span>
            <span className="xs:hidden">Время работы</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm"
              size="sm"
            >
              <Icon name="Plus" size={14} className="md:w-4 md:h-4" />
              <span className="hidden sm:inline ml-1">Добавить смену</span>
              <span className="sm:hidden ml-1">Добавить</span>
            </Button>
            <button
              onClick={loadWorkTime}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Обновить данные"
            >
              <Icon name="RefreshCw" size={16} className="text-gray-900 md:w-[18px] md:h-[18px]" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {workTimeData.length === 0 ? (
          <div className="text-center py-6 md:py-8 text-gray-600">
            <Icon name="Calendar" size={40} className="mx-auto mb-3 md:mb-4 text-gray-300 md:w-12 md:h-12" />
            <p className="text-base md:text-lg font-medium text-gray-900">Нет данных</p>
            <p className="text-xs md:text-sm mt-2">Промоутеры еще не открывали смены</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDates.map((date) => {
              const shifts = groupedByDate[date];
              const totalLeads = shifts.reduce((sum, shift) => sum + shift.leads_count, 0);
              const isExpanded = expandedDates.has(date);
              
              return (
                <div key={date} className="border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-100">
                  <div 
                    className="flex flex-col md:flex-row md:items-center md:justify-between p-3 md:p-4 cursor-pointer hover:bg-gray-100 transition-colors gap-2"
                    onClick={() => toggleDate(date)}
                  >
                    <div className="flex items-center gap-2 md:gap-3">
                      <Icon 
                        name={isExpanded ? "ChevronDown" : "ChevronRight"} 
                        size={18} 
                        className="text-gray-900 transition-transform md:w-5 md:h-5" 
                      />
                      <Icon name="Calendar" size={18} className="text-gray-900 md:w-5 md:h-5" />
                      <span className="font-bold text-gray-900 text-sm md:text-base">{date}</span>
                      <span className="text-xs md:text-sm text-gray-500">({shifts.length})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs md:text-sm text-gray-600 bg-gray-100 px-2 py-1 md:px-3 rounded-lg ml-7 md:ml-0">
                      <Icon name="MessageSquare" size={12} className="md:w-[14px] md:h-[14px]" />
                      <span>{totalLeads} лидов</span>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="space-y-2 p-3 md:p-4 pt-0">
                    {shifts.map((shift, index) => {
                      const shiftKey = `${shift.user_id}-${shift.date}`;
                      const isDeleting = deletingShift === shiftKey;

                      return (
                        <div 
                          key={index} 
                          className="bg-white/50 rounded-lg p-2.5 md:p-3 border border-[#001f54]/10"
                        >
                          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                            <div className="flex items-center gap-1.5 md:gap-2">
                              <Icon name="User" size={12} className="text-[#001f54]/70 md:w-[14px] md:h-[14px]" />
                              <span className="font-medium text-[#001f54] text-xs md:text-sm">{shift.user_name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 md:gap-2">
                              <div className="flex items-center gap-0.5 md:gap-1 text-[10px] md:text-xs text-[#001f54]/70">
                                <Icon name="MessageSquare" size={10} className="md:w-3 md:h-3" />
                                <span>{shift.leads_count}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteShift(shift.user_id, shift.date);
                                }}
                                disabled={isDeleting}
                                className="h-5 w-5 md:h-6 md:w-6 p-0 hover:bg-red-100"
                              >
                                {isDeleting ? (
                                  <Icon name="Loader2" size={12} className="animate-spin text-[#001f54]/70 md:w-[14px] md:h-[14px]" />
                                ) : (
                                  <Icon name="Trash2" size={12} className="text-red-600 md:w-[14px] md:h-[14px]" />
                                )}
                              </Button>
                            </div>
                          </div>
                      
                      <div className="grid grid-cols-3 gap-2 md:gap-3 text-xs md:text-sm">
                        <div className="flex flex-col">
                          <span className="text-[#001f54]/60 text-[10px] md:text-xs mb-0.5 md:mb-1">Начало</span>
                          <div className="flex items-center gap-1 md:gap-1.5 text-[#001f54] font-medium">
                            <Icon name="LogIn" size={12} className="text-green-600 md:w-[14px] md:h-[14px]" />
                            <span className="text-[11px] md:text-sm">{shift.start_time}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col">
                          <span className="text-[#001f54]/60 text-[10px] md:text-xs mb-0.5 md:mb-1">Окончание</span>
                          <div className="flex items-center gap-1 md:gap-1.5 text-[#001f54] font-medium">
                            <Icon name="LogOut" size={12} className="text-red-600 md:w-[14px] md:h-[14px]" />
                            <span className="text-[11px] md:text-sm">{shift.end_time}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col">
                          <span className="text-[#001f54]/60 text-[10px] md:text-xs mb-0.5 md:mb-1">Отработано</span>
                          <div className="flex items-center gap-1 md:gap-1.5 text-[#001f54] font-bold">
                            <Icon name="Timer" size={12} className="text-blue-600 md:w-[14px] md:h-[14px]" />
                            <span className="text-[10px] md:text-xs">{shift.hours_worked}</span>
                          </div>
                        </div>
                      </div>
                      </div>
                    );
                  })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <Card className="w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg">Добавить смену</CardTitle>
                <button 
                  onClick={() => setShowAddModal(false)} 
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <Icon name="X" size={20} />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Промоутер
                </label>
                <select
                  value={selectedUser || ''}
                  onChange={(e) => setSelectedUser(Number(e.target.value))}
                  className="w-full p-2.5 sm:p-2 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Выберите промоутера</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Дата
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-2.5 sm:p-2 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Время открытия
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-2.5 sm:p-2 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Время закрытия
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full p-2.5 sm:p-2 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  onClick={handleAddShift}
                  disabled={isSubmitting || !selectedUser || !selectedDate || !startTime || !endTime}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2.5"
                >
                  {isSubmitting ? (
                    <>
                      <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                      Добавление...
                    </>
                  ) : (
                    'Добавить'
                  )}
                </Button>
                <Button
                  onClick={() => setShowAddModal(false)}
                  variant="outline"
                  disabled={isSubmitting}
                  className="sm:flex-none text-sm py-2.5"
                >
                  Отмена
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  );
}