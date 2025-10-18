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

const WEEK_START = '2025-10-20';

export default function ScheduleAnalyticsTab() {
  const [view, setView] = useState<'team' | 'individual'>('team');
  const [schedules, setSchedules] = useState<UserSchedule[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [weekDays, setWeekDays] = useState<DaySchedule[]>([]);

  useEffect(() => {
    initializeWeekDays();
    if (view === 'team') {
      loadAllSchedules();
    }
  }, [view]);

  const initializeWeekDays = () => {
    const days: DaySchedule[] = [];
    const startDate = new Date('2025-10-20');
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
          week_start_date: WEEK_START
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader2" size={32} className="animate-spin text-white" />
      </div>
    );
  }

  const selectedUserData = schedules.find(s => s.user_id === selectedUser);

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Icon name="Calendar" size={28} />
              График работы отдела
            </h2>
            <div className="flex gap-2">
              <Button
                onClick={() => setView('team')}
                variant={view === 'team' ? 'default' : 'outline'}
                className={view === 'team' ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-600 text-gray-300'}
              >
                <Icon name="Users" size={18} className="mr-2" />
                Общий график
              </Button>
              <Button
                onClick={() => setView('individual')}
                variant={view === 'individual' ? 'default' : 'outline'}
                className={view === 'individual' ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-600 text-gray-300'}
              >
                <Icon name="User" size={18} className="mr-2" />
                По сотрудникам
              </Button>
            </div>
          </div>

          {view === 'team' && (
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map(day => (
                  <div key={day.date} className={`p-3 rounded-lg text-center ${day.isWeekend ? 'bg-orange-900/30' : 'bg-blue-900/30'}`}>
                    <div className={`text-xs font-semibold mb-1 ${day.isWeekend ? 'text-orange-400' : 'text-blue-400'}`}>
                      {day.dayName}
                    </div>
                    <div className="text-lg font-bold text-white">
                      {new Date(day.date).getDate()}.10
                    </div>
                  </div>
                ))}
              </div>

              {weekDays.map(day => (
                <Card key={day.date} className="bg-gray-700 border-gray-600">
                  <CardContent className="p-4">
                    <div className="mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-lg ${day.isWeekend ? 'bg-orange-500' : 'bg-blue-600'} text-white flex flex-col items-center justify-center font-bold text-xs`}>
                          <span>{day.dayName}</span>
                          <span className="text-sm">{new Date(day.date).getDate()}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            {day.isWeekend ? 'Выходной' : 'Рабочий день'}
                          </p>
                          <p className="text-xs text-gray-400">{day.date}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {day.slots.map(slot => {
                        const workers = getUsersWorkingOnSlot(day.date, slot.time);
                        return (
                          <div key={slot.time} className="bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-gray-300">
                                <Icon name="Clock" size={14} className="inline mr-1" />
                                {slot.label}
                              </span>
                              <Badge className={workers.length > 0 ? 'bg-green-600' : 'bg-gray-600'}>
                                {workers.length} чел.
                              </Badge>
                            </div>
                            {workers.length > 0 ? (
                              <div className="space-y-1">
                                {workers.map(worker => (
                                  <div key={worker.user_id} className="text-xs text-gray-300">
                                    • {worker.first_name} {worker.last_name}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500 italic">Никого не запланировано</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {view === 'individual' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Select
                  value={selectedUser?.toString() || ''}
                  onValueChange={(val) => setSelectedUser(parseInt(val))}
                >
                  <SelectTrigger className="w-64 bg-gray-700 border-gray-600 text-white">
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
                  <Badge className="bg-blue-600 text-white text-lg px-4 py-2">
                    {getTotalShifts(selectedUserData.schedule)} смен
                  </Badge>
                )}
              </div>

              {selectedUserData && (
                <div className="space-y-3">
                  {weekDays.map(day => {
                    const daySchedule = getUserScheduleForDay(selectedUserData.schedule, day.date);
                    return (
                      <Card key={day.date} className="bg-gray-700 border-gray-600">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-lg ${day.isWeekend ? 'bg-orange-500' : 'bg-blue-600'} text-white flex flex-col items-center justify-center font-bold`}>
                                <span className="text-xs">{day.dayName}</span>
                                <span className="text-lg">{new Date(day.date).getDate()}.10</span>
                              </div>
                              <div>
                                <p className="font-semibold text-white">
                                  {day.isWeekend ? 'Выходной' : 'Рабочий день'}
                                </p>
                                <p className="text-xs text-gray-400">{day.date}</p>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {day.slots.map(slot => (
                                <Badge
                                  key={slot.time}
                                  className={daySchedule[slot.time] ? 'bg-green-600' : 'bg-gray-600'}
                                >
                                  <Icon name="Clock" size={14} className="mr-1" />
                                  {slot.label}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {!selectedUserData && schedules.length > 0 && (
                <Card className="bg-gray-700 border-gray-600">
                  <CardContent className="p-8 text-center">
                    <Icon name="UserSearch" size={48} className="mx-auto mb-3 text-gray-500" />
                    <p className="text-gray-400">Выберите промоутера для просмотра графика</p>
                  </CardContent>
                </Card>
              )}

              {schedules.length === 0 && (
                <Card className="bg-gray-700 border-gray-600">
                  <CardContent className="p-8 text-center">
                    <Icon name="Calendar" size={48} className="mx-auto mb-3 text-gray-500" />
                    <p className="text-gray-400">Графики еще не заполнены</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
