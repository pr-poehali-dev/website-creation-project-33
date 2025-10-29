import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

interface PlannedOrganization {
  id: number;
  organization: string;
  date: string;
  notes?: string;
}

const STORAGE_KEY = 'planned_organizations';

const getInitialPlans = (): PlannedOrganization[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load plans:', error);
  }
  return [];
};

const getMoscowDate = () => {
  const moscowTime = new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' });
  const [month, day, year] = moscowTime.split('/');
  return `${year}-${month}-${day}`;
};

const getWeekDates = () => {
  const today = new Date(getMoscowDate());
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

export default function TasksTab() {
  const [plans, setPlans] = useState<PlannedOrganization[]>(getInitialPlans);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newOrg, setNewOrg] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const weekDates = getWeekDates();
  const todayStr = getMoscowDate();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    } catch (error) {
      console.error('Failed to save plans:', error);
    }
  }, [plans]);

  const addPlan = () => {
    if (!selectedDate || !newOrg.trim()) return;
    
    const newPlan: PlannedOrganization = {
      id: Date.now(),
      organization: newOrg,
      date: selectedDate,
      notes: newNotes.trim() || undefined
    };
    
    setPlans([...plans, newPlan]);
    setNewOrg('');
    setNewNotes('');
    setSelectedDate(null);
  };

  const deletePlan = (id: number) => {
    setPlans(plans.filter(p => p.id !== id));
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return days[date.getDay()];
  };

  const getMonthDay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.getDate();
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">Планирование на неделю</h2>
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {weekDates.map((date) => {
          const isToday = date === todayStr;
          const dayPlans = plans.filter(p => p.date === date);
          const isPast = date < todayStr;
          
          return (
            <div
              key={date}
              className={`rounded-lg border-2 p-2 md:p-3 transition-all cursor-pointer ${
                isToday 
                  ? 'border-blue-500 bg-blue-50' 
                  : selectedDate === date
                  ? 'border-purple-500 bg-purple-50'
                  : isPast
                  ? 'border-gray-200 bg-gray-50 opacity-60'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => !isPast && setSelectedDate(date)}
            >
              <div className="text-center">
                <div className={`text-[10px] md:text-xs font-semibold ${
                  isToday ? 'text-blue-600' : isPast ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {getDayName(date)}
                </div>
                <div className={`text-lg md:text-2xl font-bold mt-0.5 ${
                  isToday ? 'text-blue-600' : isPast ? 'text-gray-400' : 'text-gray-800'
                }`}>
                  {getMonthDay(date)}
                </div>
              </div>
              
              {dayPlans.length > 0 && (
                <div className="mt-2 space-y-1">
                  {dayPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="bg-white rounded px-1.5 py-1 border border-gray-200 relative group"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="text-[9px] md:text-xs font-medium text-gray-800 truncate pr-4">
                        {plan.organization}
                      </div>
                      {plan.notes && (
                        <div className="text-[8px] md:text-[10px] text-gray-500 truncate">
                          {plan.notes}
                        </div>
                      )}
                      <button
                        onClick={() => deletePlan(plan.id)}
                        className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Icon name="X" size={12} className="text-red-500 md:w-4 md:h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedDate && (
        <div className="bg-white rounded-lg border-2 border-purple-500 p-3 md:p-4">
          <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3">
            Добавить организацию на {new Date(selectedDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
          </h3>
          
          <div className="space-y-3">
            <input
              type="text"
              value={newOrg}
              onChange={(e) => setNewOrg(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && addPlan()}
              placeholder="Название организации..."
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base"
              autoFocus
            />
            
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Примечания (необязательно)..."
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base resize-none"
              rows={2}
            />
            
            <div className="flex gap-2">
              <button
                onClick={addPlan}
                disabled={!newOrg.trim()}
                className="flex-1 md:flex-none px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm md:text-base"
              >
                Добавить
              </button>
              <button
                onClick={() => {
                  setSelectedDate(null);
                  setNewOrg('');
                  setNewNotes('');
                }}
                className="flex-1 md:flex-none px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm md:text-base"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}