import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { getAllWeeksUntilEndOfYear, getCurrentWeekIndex } from './schedule/scheduleUtils';
import ScheduleWeekNavigation from './schedule/ScheduleWeekNavigation';
import ScheduleDayCard from './schedule/ScheduleDayCard';

interface TimeSlot {
  label: string;
  time: string;
  selected: boolean;
}

interface DaySchedule {
  date: string;
  dayName: string;
  dayNameFull: string;
  isWeekend: boolean;
  slots: TimeSlot[];
}

interface WorkShift {
  date: string;
  start_time: string;
  end_time: string;
  organization_name: string;
  organization_id: number;
}

export default function ScheduleTab() {
  const { user } = useAuth();
  const weeks = getAllWeeksUntilEndOfYear();
  const [currentWeekIndex, setCurrentWeekIndex] = useState(getCurrentWeekIndex());
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const isUkrainian = user?.name === 'Виктор Кобыляцкий';
  const [workComments, setWorkComments] = useState<Record<string, {
    location?: string;
    flyers?: string;
    organization?: string;
    location_type?: string;
    location_details?: string;
  }>>({});
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);

  // Сброс на текущую неделю при монтировании компонента
  useEffect(() => {
    setCurrentWeekIndex(getCurrentWeekIndex());
  }, []);

  useEffect(() => {
    initializeSchedule();
    loadSchedule();
    loadWorkComments();
  }, [currentWeekIndex]);

  const initializeSchedule = () => {
    const days: DaySchedule[] = [];
    const startDate = new Date(weeks[currentWeekIndex].start);
    const dayNames = isUkrainian ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'] : ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const dayNamesFull = isUkrainian ? ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота', 'Неділя'] : ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      const isWeekend = i >= 5; // Saturday and Sunday
      
      days.push({
        date: dateStr,
        dayName: dayNames[i],
        dayNameFull: dayNamesFull[i],
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
        `https://functions.poehali.dev/13a21013-236c-4e06-a825-ee3679b130c2?user_id=${user.id}&week_start=${weeks[currentWeekIndex].start}&get_shifts=true`,
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
        if (data.work_shifts) {
          setWorkShifts(data.work_shifts);
        }
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkComments = async () => {
    if (!user?.name) return;
    
    try {
      const startDate = new Date(weeks[currentWeekIndex].start);
      const comments: Record<string, {
        location?: string;
        flyers?: string;
        organization?: string;
        location_type?: string;
        location_details?: string;
      }> = {};
      
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];
        
        const response = await fetch(
          `https://functions.poehali.dev/1b7f0423-384e-417f-8aea-767e5a1c32b2?work_date=${dateStr}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.comments && data.comments[user.name]) {
            comments[dateStr] = data.comments[user.name];
          }
        }
      }
      
      setWorkComments(comments);
    } catch (error) {
      console.error('Error loading work comments:', error);
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
          week_start_date: weeks[currentWeekIndex].start,
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
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-[#001f54] flex items-center gap-2">
                  <Icon name="Calendar" size={24} className="md:w-7 md:h-7" />
                  {isUkrainian ? 'Графік роботи' : 'График работы'}
                </h2>
                <p className="text-xs md:text-sm text-gray-600 mt-1">
                  {isUkrainian ? 'Виберіть зручні проміжки часу на тиждень' : 'Выберите удобные промежутки времени на неделю'}
                </p>
              </div>
              <Badge className="bg-[#001f54] text-white text-sm md:text-lg px-3 md:px-4 py-1 md:py-2">
                {getSelectedCount()} {isUkrainian ? 'змін' : 'смен'}
              </Badge>
            </div>
            
            <ScheduleWeekNavigation
              currentWeekIndex={currentWeekIndex}
              weeks={weeks}
              onPrevious={() => setCurrentWeekIndex(prev => Math.max(0, prev - 1))}
              onNext={() => setCurrentWeekIndex(prev => Math.min(weeks.length - 1, prev + 1))}
              loading={loading}
              isUkrainian={isUkrainian}
            />
          </div>

          <div className="space-y-3">
            {schedule.map((day, dayIndex) => (
              <ScheduleDayCard
                key={day.date}
                day={day}
                dayIndex={dayIndex}
                workShifts={workShifts}
                workComment={workComments[day.date]}
                onToggleSlot={toggleSlot}
                isUkrainian={isUkrainian}
              />
            ))}
          </div>

          <div className="mt-6 flex flex-col md:flex-row justify-end gap-3">
            {saved && (
              <Badge className="bg-green-500 text-white px-3 md:px-4 py-2 flex items-center gap-2 justify-center">
                <Icon name="Check" size={16} />
                {isUkrainian ? 'Збережено' : 'Сохранено'}
              </Badge>
            )}
            <Button
              onClick={saveSchedule}
              disabled={saving || getSelectedCount() === 0}
              className="bg-[#001f54] hover:bg-[#002b6b] text-white px-6 md:px-8 py-4 md:py-6 text-base md:text-lg shadow-lg hover:scale-105 transition-all duration-300 w-full md:w-auto"
            >
              {saving ? (
                <>
                  <Icon name="Loader2" size={18} className="mr-2 animate-spin md:w-5 md:h-5" />
                  {isUkrainian ? 'Збереження...' : 'Сохранение...'}
                </>
              ) : (
                <>
                  <Icon name="Save" size={18} className="mr-2 md:w-5 md:h-5" />
                  {isUkrainian ? 'Підтвердити графік' : 'Подтвердить график'}
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
