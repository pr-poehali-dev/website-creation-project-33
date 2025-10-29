import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

interface HourlyNote {
  hour: string;
  note: string;
}

interface PlannedOrganization {
  id: number;
  organization: string;
  date: string;
  notes?: string;
  hourlyNotes?: HourlyNote[];
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

const getWeekDates = (weekOffset: number = 0) => {
  const today = new Date(getMoscowDate());
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setDate(monday.getDate() + (weekOffset * 7));
  
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
  const [weekOffset, setWeekOffset] = useState(0);
  const [editingPlan, setEditingPlan] = useState<PlannedOrganization | null>(null);
  const [renamingPlanId, setRenamingPlanId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameNotesValue, setRenameNotesValue] = useState('');
  const weekDates = getWeekDates(weekOffset);
  const todayStr = getMoscowDate();
  
  const timeSlots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];

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
  
  const startRename = (plan: PlannedOrganization) => {
    setRenamingPlanId(plan.id);
    setRenameValue(plan.organization);
    setRenameNotesValue(plan.notes || '');
  };
  
  const saveRename = (id: number) => {
    if (!renameValue.trim()) return;
    setPlans(plans.map(p => p.id === id ? { 
      ...p, 
      organization: renameValue.trim(),
      notes: renameNotesValue.trim() || undefined
    } : p));
    setRenamingPlanId(null);
    setRenameValue('');
    setRenameNotesValue('');
  };
  
  const cancelRename = () => {
    setRenamingPlanId(null);
    setRenameValue('');
    setRenameNotesValue('');
  };
  
  const updateHourlyNote = (hour: string, note: string) => {
    if (!editingPlan) return;
    
    const existingNotes = editingPlan.hourlyNotes || [];
    const updatedNotes = existingNotes.filter(n => n.hour !== hour);
    
    if (note.trim()) {
      updatedNotes.push({ hour, note: note.trim() });
    }
    
    const updatedPlan = { ...editingPlan, hourlyNotes: updatedNotes };
    setEditingPlan(updatedPlan);
    setPlans(plans.map(p => p.id === editingPlan.id ? updatedPlan : p));
  };
  
  const getHourlyNote = (hour: string): string => {
    if (!editingPlan?.hourlyNotes) return '';
    const note = editingPlan.hourlyNotes.find(n => n.hour === hour);
    return note?.note || '';
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

  const getWeekLabel = () => {
    const firstDate = new Date(weekDates[0]);
    const lastDate = new Date(weekDates[6]);
    const firstDay = firstDate.getDate();
    const lastDay = lastDate.getDate();
    const month = firstDate.toLocaleDateString('ru-RU', { month: 'long' });
    const year = firstDate.getFullYear();
    
    if (firstDate.getMonth() === lastDate.getMonth()) {
      return `${firstDay}–${lastDay} ${month} ${year}`;
    } else {
      const month2 = lastDate.toLocaleDateString('ru-RU', { month: 'long' });
      return `${firstDay} ${month} – ${lastDay} ${month2} ${year}`;
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">Планирование на неделю</h2>
      </div>

      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-3 md:p-4">
        <button
          onClick={() => setWeekOffset(weekOffset - 1)}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
        >
          <Icon name="ChevronLeft" size={24} className="text-gray-600" />
        </button>
        
        <div className="text-center">
          <div className="text-base md:text-lg font-semibold text-gray-800">
            {getWeekLabel()}
          </div>
          {weekOffset === 0 && (
            <div className="text-xs md:text-sm text-blue-600 font-medium">Текущая неделя</div>
          )}
        </div>
        
        <button
          onClick={() => setWeekOffset(weekOffset + 1)}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
        >
          <Icon name="ChevronRight" size={24} className="text-gray-600" />
        </button>
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
              onClick={() => setSelectedDate(date)}
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
                      className="bg-white rounded px-1.5 py-1 border border-gray-200 relative group cursor-pointer hover:border-purple-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (renamingPlanId !== plan.id) {
                          setEditingPlan(plan);
                        }
                      }}
                    >
                      {renamingPlanId === plan.id ? (
                        <div className="pr-12 space-y-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                saveRename(plan.id);
                              }
                              if (e.key === 'Escape') cancelRename();
                            }}
                            placeholder="Название организации"
                            className="w-full text-[9px] md:text-xs font-medium text-gray-800 border border-purple-500 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            autoFocus
                          />
                          <input
                            type="text"
                            value={renameNotesValue}
                            onChange={(e) => setRenameNotesValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                saveRename(plan.id);
                              }
                              if (e.key === 'Escape') cancelRename();
                            }}
                            onBlur={() => saveRename(plan.id)}
                            placeholder="Примечания (необязательно)"
                            className="w-full text-[8px] md:text-[10px] text-gray-600 border border-purple-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="text-[9px] md:text-xs font-medium text-gray-800 truncate pr-12">
                            {plan.organization}
                          </div>
                          {plan.notes && (
                            <div className="text-[8px] md:text-[10px] text-gray-500 truncate pr-12">
                              {plan.notes}
                            </div>
                          )}
                        </>
                      )}
                      <div className="absolute top-0.5 right-0.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startRename(plan);
                          }}
                          className="p-0.5 hover:bg-purple-100 rounded"
                        >
                          <Icon name="Pencil" size={12} className="text-purple-600 md:w-4 md:h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePlan(plan.id);
                          }}
                          className="p-0.5 hover:bg-red-100 rounded"
                        >
                          <Icon name="X" size={12} className="text-red-500 md:w-4 md:h-4" />
                        </button>
                      </div>
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

      <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-4">
          Почасовой график на {new Date(getMoscowDate()).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
        </h3>
        <div className="space-y-2">
          {timeSlots.map((hour) => {
            const todayDate = getMoscowDate();
            const todayPlans = plans.filter(p => p.date === todayDate);
            const allNotes = todayPlans.map(plan => ({
              org: plan.organization,
              note: plan.hourlyNotes?.find(n => n.hour === hour)?.note || ''
            })).filter(item => item.note.trim());

            return (
              <div key={hour} className="flex items-start gap-3 border-b border-gray-100 pb-2">
                <div className="flex-shrink-0 w-14 md:w-16 pt-1">
                  <div className="text-xs md:text-sm font-semibold text-gray-700">{hour}</div>
                </div>
                <div className="flex-1 min-h-[28px]">
                  {allNotes.length > 0 ? (
                    <div className="space-y-1">
                      {allNotes.map((item, idx) => (
                        <div key={idx} className="text-xs md:text-sm">
                          <span className="font-medium text-purple-700">{item.org}:</span>{' '}
                          <span className="text-gray-700">{item.note}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs md:text-sm text-gray-300">—</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {editingPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditingPlan(null)}>
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-gray-800">{editingPlan.organization}</h3>
                <p className="text-sm text-gray-600">
                  {new Date(editingPlan.date).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
              <button
                onClick={() => setEditingPlan(null)}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
              >
                <Icon name="X" size={24} className="text-gray-600" />
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              {timeSlots.map((hour) => (
                <div key={hour} className="flex items-start gap-3 border-b border-gray-100 pb-3">
                  <div className="flex-shrink-0 w-16 md:w-20 pt-2">
                    <div className="text-sm md:text-base font-semibold text-gray-700">{hour}</div>
                    <div className="text-xs text-gray-400">
                      {hour.split(':')[0] === '08' && '2 часа'}
                      {hour.split(':')[0] !== '08' && hour.split(':')[0] !== '22' && ''}
                    </div>
                  </div>
                  <textarea
                    value={getHourlyNote(hour)}
                    onChange={(e) => updateHourlyNote(hour, e.target.value)}
                    placeholder="Заметки для этого времени..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base resize-none"
                    rows={2}
                  />
                </div>
              ))}
            </div>
            
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4">
              <button
                onClick={() => setEditingPlan(null)}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm md:text-base"
              >
                Готово
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}