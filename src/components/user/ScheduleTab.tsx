import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';

interface TimeSlot {
  label: string;
  time: string;
  selected: boolean;
}

interface DaySchedule {
  date: string;
  dayName: string;
  isWeekend: boolean;
  slots: TimeSlot[];
}

const WEEK_START = '2025-10-20'; // Monday

export default function ScheduleTab() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    initializeSchedule();
    loadSchedule();
  }, []);

  const initializeSchedule = () => {
    const days: DaySchedule[] = [];
    const startDate = new Date('2025-10-20');
    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      const isWeekend = i >= 5; // Saturday and Sunday
      
      days.push({
        date: dateStr,
        dayName: dayNames[i],
        isWeekend,
        slots: isWeekend ? [
          { label: '11:00-15:00', time: 'slot1', selected: false },
          { label: '15:00-19:00', time: 'slot2', selected: false }
        ] : [
          { label: '12:00-16:00', time: 'slot1', selected: false },
          { label: '16:00-20:00', time: 'slot2', selected: false }
        ]
      });
    }
    
    setSchedule(days);
  };

  const loadSchedule = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `https://functions.poehali.dev/13a21013-236c-4e06-a825-ee3679b130c2?user_id=${user.id}&week_start=${WEEK_START}`,
        {
          headers: {
            'X-Session-Token': localStorage.getItem('session_token') || '',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.schedule) {
          updateScheduleFromData(data.schedule);
        }
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateScheduleFromData = (scheduleData: any) => {
    setSchedule(prev => prev.map(day => {
      const dayData = scheduleData[day.date];
      if (dayData) {
        return {
          ...day,
          slots: day.slots.map(slot => ({
            ...slot,
            selected: dayData[slot.time] || false
          }))
        };
      }
      return day;
    }));
  };

  const toggleSlot = (dayIndex: number, slotIndex: number) => {
    setSchedule(prev => prev.map((day, dIdx) => {
      if (dIdx === dayIndex) {
        return {
          ...day,
          slots: day.slots.map((slot, sIdx) => 
            sIdx === slotIndex ? { ...slot, selected: !slot.selected } : slot
          )
        };
      }
      return day;
    }));
    setSaved(false);
  };

  const saveSchedule = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      const scheduleData: any = {};
      schedule.forEach(day => {
        scheduleData[day.date] = {
          slot1: day.slots[0].selected,
          slot2: day.slots[1].selected
        };
      });

      const response = await fetch('https://functions.poehali.dev/13a21013-236c-4e06-a825-ee3679b130c2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': localStorage.getItem('session_token') || '',
        },
        body: JSON.stringify({
          user_id: user.id,
          week_start_date: WEEK_START,
          schedule: scheduleData
        })
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
    } finally {
      setSaving(false);
    }
  };

  const getSelectedCount = () => {
    return schedule.reduce((total, day) => 
      total + day.slots.filter(slot => slot.selected).length, 0
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader2" size={32} className="animate-spin text-[#001f54]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white border-2 border-[#001f54]/10 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#001f54] flex items-center gap-2">
                <Icon name="Calendar" size={28} />
                График работы
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Выберите удобные промежутки времени на неделю
              </p>
            </div>
            <Badge className="bg-[#001f54] text-white text-lg px-4 py-2">
              {getSelectedCount()} смен
            </Badge>
          </div>

          <div className="space-y-3">
            {schedule.map((day, dayIndex) => (
              <Card 
                key={day.date} 
                className={`border-2 ${day.isWeekend ? 'border-orange-200 bg-orange-50/30' : 'border-blue-200 bg-blue-50/30'}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg ${day.isWeekend ? 'bg-orange-500' : 'bg-[#001f54]'} text-white flex flex-col items-center justify-center font-bold`}>
                        <span className="text-xs">{day.dayName}</span>
                        <span className="text-lg">{new Date(day.date).getDate()}.10</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {day.isWeekend ? 'Выходной' : 'Рабочий день'}
                        </p>
                        <p className="text-xs text-gray-500">{day.date}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {day.slots.map((slot, slotIndex) => (
                        <Button
                          key={slot.time}
                          onClick={() => toggleSlot(dayIndex, slotIndex)}
                          variant={slot.selected ? 'default' : 'outline'}
                          className={`transition-all duration-300 ${
                            slot.selected
                              ? day.isWeekend
                                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                : 'bg-[#001f54] hover:bg-[#002b6b] text-white'
                              : 'border-2 hover:border-[#001f54] hover:bg-gray-50'
                          }`}
                        >
                          <Icon name="Clock" size={16} className="mr-2" />
                          {slot.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            {saved && (
              <Badge className="bg-green-500 text-white px-4 py-2 flex items-center gap-2">
                <Icon name="Check" size={16} />
                Сохранено
              </Badge>
            )}
            <Button
              onClick={saveSchedule}
              disabled={saving || getSelectedCount() === 0}
              className="bg-[#001f54] hover:bg-[#002b6b] text-white px-8 py-6 text-lg shadow-lg hover:scale-105 transition-all duration-300"
            >
              {saving ? (
                <>
                  <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Icon name="Save" size={20} className="mr-2" />
                  Подтвердить график
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Icon name="Info" size={20} className="text-blue-600 mt-0.5" />
            <div className="text-sm text-gray-700">
              <p className="font-semibold mb-2">Как заполнить график:</p>
              <ul className="space-y-1 text-xs">
                <li>• Будни: выберите смены с 12:00-16:00 или 16:00-20:00</li>
                <li>• Выходные: смены с 11:00-15:00 или 15:00-19:00</li>
                <li>• Можно выбрать обе смены в один день</li>
                <li>• Не забудьте нажать "Подтвердить график" для сохранения</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
