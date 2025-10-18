import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TimeSlot {
  label: string;
  time: string;
}

interface UserSchedule {
  user_id: number;
  first_name: string;
  last_name: string;
  schedule: any;
}

interface DaySchedule {
  date: string;
  dayName: string;
  isWeekend: boolean;
  slots: TimeSlot[];
}

const getAllWeeksUntilEndOfYear = () => {
  const weeks = [];
  const startDate = new Date('2025-10-20');
  const endOfYear = new Date('2025-12-31');
  
  let currentMonday = new Date(startDate);
  
  while (currentMonday <= endOfYear) {
    const weekEnd = new Date(currentMonday);
    weekEnd.setDate(currentMonday.getDate() + 6);
    
    weeks.push({
      start: currentMonday.toISOString().split('T')[0],
      label: `${currentMonday.getDate().toString().padStart(2, '0')}.${(currentMonday.getMonth() + 1).toString().padStart(2, '0')} - ${weekEnd.getDate().toString().padStart(2, '0')}.${(weekEnd.getMonth() + 1).toString().padStart(2, '0')}`
    });
    
    currentMonday = new Date(currentMonday);
    currentMonday.setDate(currentMonday.getDate() + 7);
  }
  
  return weeks;
};

export default function ScheduleAnalyticsTab() {
  const weeks = getAllWeeksUntilEndOfYear();
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [view, setView] = useState<'team' | 'individual'>('team');
  const [schedules, setSchedules] = useState<UserSchedule[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [weekDays, setWeekDays] = useState<DaySchedule[]>([]);
  const [deletingSlot, setDeletingSlot] = useState<{userId: number, date: string, slot: string} | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{userId: number, userName: string, date: string, slot: string, slotLabel: string} | null>(null);

  useEffect(() => {
    initializeWeekDays();
    if (view === 'team') {
      loadAllSchedules();
    }
  }, [view, currentWeekIndex]);

  const initializeWeekDays = () => {
    const days: DaySchedule[] = [];
    const startDate = new Date(weeks[currentWeekIndex].start);
    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      const isWeekend = i >= 5;
      
      days.push({
        date: dateStr,
        dayName: dayNames[i],
        isWeekend,
        slots: isWeekend ? [
          { label: '11:00-15:00', time: 'slot1' },
          { label: '15:00-19:00', time: 'slot2' }
        ] : [
          { label: '12:00-16:00', time: 'slot1' },
          { label: '16:00-20:00', time: 'slot2' }
        ]
      });
    }
    
    setWeekDays(days);
  };

  const loadAllSchedules = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/13a21013-236c-4e06-a825-ee3679b130c2', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': localStorage.getItem('session_token') || '',
        },
        body: JSON.stringify({
          week_start_date: weeks[currentWeekIndex].start
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSchedules(data.schedules || []);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUsersWorkingOnSlot = (date: string, slotTime: string) => {
    return schedules.filter(user => 
      user.schedule[date] && user.schedule[date][slotTime]
    );
  };

  const getUserScheduleForDay = (userSchedule: any, date: string) => {
    return userSchedule[date] || { slot1: false, slot2: false };
  };

  const getTotalShifts = (userSchedule: any) => {
    let total = 0;
    Object.values(userSchedule).forEach((day: any) => {
      if (day.slot1) total++;
      if (day.slot2) total++;
    });
    return total;
  };

  const confirmRemoveSlot = (userId: number, userName: string, date: string, slotTime: string, slotLabel: string) => {
    setConfirmDelete({userId, userName, date, slot: slotTime, slotLabel});
  };

  const removeSlot = async () => {
    if (!confirmDelete) return;
    
    const {userId, date, slot: slotTime} = confirmDelete;
    setDeletingSlot({userId, date, slot: slotTime});
    setConfirmDelete(null);
    
    try {
      const userSchedule = schedules.find(s => s.user_id === userId);
      if (!userSchedule) return;

      const updatedSchedule = { ...userSchedule.schedule };
      if (updatedSchedule[date]) {
        updatedSchedule[date] = {
          ...updatedSchedule[date],
          [slotTime]: false
        };
      }

      const response = await fetch('https://functions.poehali.dev/13a21013-236c-4e06-a825-ee3679b130c2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': localStorage.getItem('session_token') || '',
        },
        body: JSON.stringify({
          user_id: userId,
          week_start_date: weeks[currentWeekIndex].start,
          schedule: updatedSchedule
        })
      });

      if (response.ok) {
        await loadAllSchedules();
      }
    } catch (error) {
      console.error('Error removing slot:', error);
    } finally {
      setDeletingSlot(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader2" size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  const selectedUserData = schedules.find(s => s.user_id === selectedUser);

  return (
    <div className="space-y-6">
      <Card className="bg-white border-2 border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Icon name="Calendar" size={24} className="text-blue-600 md:w-7 md:h-7" />
                График работы отдела
              </h2>
              <div className="flex gap-2">
                <Button
                  onClick={() => setView('team')}
                  variant={view === 'team' ? 'default' : 'outline'}
                  className={`text-xs md:text-sm ${view === 'team' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white hover:bg-gray-50 border border-gray-300 text-gray-700'}`}
                  size="sm"
                >
                  <Icon name="Users" size={16} className="mr-1 md:mr-2" />
                  Общий
                </Button>
                <Button
                  onClick={() => setView('individual')}
                  variant={view === 'individual' ? 'default' : 'outline'}
                  className={`text-xs md:text-sm ${view === 'individual' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white hover:bg-gray-50 border border-gray-300 text-gray-700'}`}
                  size="sm"
                >
                  <Icon name="User" size={16} className="mr-1 md:mr-2" />
                  Индивидуально
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 bg-gray-50 p-3 rounded-lg border-2 border-gray-200">
              <Button
                onClick={() => setCurrentWeekIndex(prev => Math.max(0, prev - 1))}
                disabled={currentWeekIndex === 0 || loading}
                variant="outline"
                size="sm"
                className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
              >
                <Icon name="ChevronLeft" size={16} className="md:mr-1" />
                <span className="hidden md:inline">Предыдущая</span>
              </Button>
              
              <div className="text-center">
                <p className="text-sm md:text-base font-bold text-gray-900">{weeks[currentWeekIndex].label}</p>
                <p className="text-[10px] md:text-xs text-gray-500">Неделя {currentWeekIndex + 1} из {weeks.length}</p>
              </div>
              
              <Button
                onClick={() => setCurrentWeekIndex(prev => Math.min(weeks.length - 1, prev + 1))}
                disabled={currentWeekIndex === weeks.length - 1 || loading}
                variant="outline"
                size="sm"
                className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
              >
                <span className="hidden md:inline">Следующая</span>
                <Icon name="ChevronRight" size={16} className="md:ml-1" />
              </Button>
            </div>
          </div>

          {view === 'team' && (
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-1 md:gap-2">
                {weekDays.map(day => (
                  <div key={day.date} className={`p-2 md:p-3 rounded-lg text-center border-2 ${day.isWeekend ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
                    <div className={`text-[10px] md:text-xs font-semibold mb-1 ${day.isWeekend ? 'text-orange-600' : 'text-blue-600'}`}>
                      {day.dayName}
                    </div>
                    <div className="text-sm md:text-lg font-bold text-gray-900">
                      {new Date(day.date).getDate()}.10
                    </div>
                  </div>
                ))}
              </div>

              {weekDays.map(day => {
                const hasAnyWorkers = day.slots.some(slot => getUsersWorkingOnSlot(day.date, slot.time).length > 0);
                if (!hasAnyWorkers) return null;

                return (
                  <Card key={day.date} className="bg-white border-2 border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-10 h-10 rounded-lg ${day.isWeekend ? 'bg-orange-500' : 'bg-blue-600'} text-white flex flex-col items-center justify-center font-bold text-xs`}>
                            <span>{day.dayName}</span>
                            <span className="text-sm">{new Date(day.date).getDate()}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {day.isWeekend ? 'Выходной' : 'Рабочий день'}
                            </p>
                            <p className="text-xs text-gray-500">{day.date}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                        {day.slots.map(slot => {
                          const workers = getUsersWorkingOnSlot(day.date, slot.time);
                          if (workers.length === 0) return null;

                          return (
                            <div key={slot.time} className="bg-green-50 border-2 border-green-300 p-2 md:p-3 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs md:text-sm font-semibold text-green-700">
                                  <Icon name="Clock" size={12} className="text-green-600 inline mr-1 md:w-[14px] md:h-[14px]" />
                                  {slot.label}
                                </span>
                                <Badge className="text-xs bg-green-600">
                                  {workers.length}
                                </Badge>
                              </div>
                              <div className="space-y-1">
                                {workers.map(worker => (
                                  <div key={worker.user_id} className="flex items-center justify-between group">
                                    <span className="text-[10px] md:text-xs text-gray-700">
                                      • {worker.first_name} {worker.last_name}
                                    </span>
                                    <button
                                      onClick={() => confirmRemoveSlot(worker.user_id, `${worker.first_name} ${worker.last_name}`, day.date, slot.time, slot.label)}
                                      disabled={deletingSlot?.userId === worker.user_id && deletingSlot?.date === day.date && deletingSlot?.slot === slot.time}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 disabled:opacity-50"
                                      title="Удалить смену"
                                    >
                                      {deletingSlot?.userId === worker.user_id && deletingSlot?.date === day.date && deletingSlot?.slot === slot.time ? (
                                        <Icon name="Loader2" size={14} className="animate-spin" />
                                      ) : (
                                        <Icon name="X" size={14} />
                                      )}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                      })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {view === 'individual' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <Select
                  value={selectedUser?.toString() || ''}
                  onValueChange={(val) => setSelectedUser(parseInt(val))}
                >
                  <SelectTrigger className="w-full md:w-64 bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Выберите промоутера" />
                  </SelectTrigger>
                  <SelectContent>
                    {schedules.map(user => (
                      <SelectItem key={user.user_id} value={user.user_id.toString()}>
                        {user.first_name} {user.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedUserData && (
                  <Badge className="bg-blue-600 text-white text-sm md:text-lg px-3 md:px-4 py-1 md:py-2">
                    {getTotalShifts(selectedUserData.schedule)} смен
                  </Badge>
                )}
              </div>

              {selectedUserData && (
                <div className="space-y-3">
                  {weekDays.map(day => {
                    const daySchedule = getUserScheduleForDay(selectedUserData.schedule, day.date);
                    const hasActiveSlots = day.slots.some(slot => daySchedule[slot.time]);
                    if (!hasActiveSlots) return null;

                    return (
                      <Card key={day.date} className="bg-white border-2 border-gray-200 shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-lg ${day.isWeekend ? 'bg-orange-500' : 'bg-blue-600'} text-white flex flex-col items-center justify-center font-bold`}>
                                <span className="text-xs">{day.dayName}</span>
                                <span className="text-lg">{new Date(day.date).getDate()}.10</span>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {day.isWeekend ? 'Выходной' : 'Рабочий день'}
                                </p>
                                <p className="text-xs text-gray-600">{day.date}</p>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {day.slots.map(slot => {
                                if (!daySchedule[slot.time]) return null;

                                return (
                                  <div key={slot.time} className="relative group">
                                    <Badge className="bg-green-600 pr-7">
                                      <Icon name="Clock" size={14} className="mr-1" />
                                      {slot.label}
                                    </Badge>
                                    <button
                                      onClick={() => confirmRemoveSlot(selectedUserData.user_id, `${selectedUserData.first_name} ${selectedUserData.last_name}`, day.date, slot.time, slot.label)}
                                      disabled={deletingSlot?.userId === selectedUserData.user_id && deletingSlot?.date === day.date && deletingSlot?.slot === slot.time}
                                      className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-white hover:text-red-200 disabled:opacity-50"
                                      title="Удалить смену"
                                    >
                                      {deletingSlot?.userId === selectedUserData.user_id && deletingSlot?.date === day.date && deletingSlot?.slot === slot.time ? (
                                        <Icon name="Loader2" size={12} className="animate-spin" />
                                      ) : (
                                        <Icon name="X" size={12} />
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {!selectedUserData && schedules.length > 0 && (
                <Card className="bg-white border-2 border-gray-200 shadow-sm">
                  <CardContent className="p-8 text-center">
                    <Icon name="UserSearch" size={48} className="mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-600">Выберите промоутера для просмотра графика</p>
                  </CardContent>
                </Card>
              )}

              {schedules.length === 0 && (
                <Card className="bg-white border-2 border-gray-200 shadow-sm">
                  <CardContent className="p-8 text-center">
                    <Icon name="Calendar" size={48} className="mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-600">Графики еще не заполнены</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent className="bg-white border-2 border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Удалить смену?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700">
              {confirmDelete && (
                <>
                  Вы уверены, что хотите удалить смену <strong>{confirmDelete.slotLabel}</strong> для{' '}
                  <strong>{confirmDelete.userName}</strong> на{' '}
                  <strong>{new Date(confirmDelete.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={removeSlot}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}