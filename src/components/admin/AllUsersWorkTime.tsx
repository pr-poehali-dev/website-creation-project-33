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

export default function AllUsersWorkTime({ sessionToken }: AllUsersWorkTimeProps) {
  const [workTimeData, setWorkTimeData] = useState<WorkTimeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingShift, setDeletingShift] = useState<string | null>(null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

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
            work_date: workDate,
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

  useEffect(() => {
    loadWorkTime();
    
    const interval = setInterval(() => {
      loadWorkTime();
    }, 30000);

    return () => clearInterval(interval);
  }, [sessionToken]);

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Icon name="Clock" size={24} />
            Время работы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2 text-white py-8">
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
    <Card className="bg-gray-800 border-gray-700 rounded-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2 text-lg md:text-xl">
            <div className="p-2 rounded-lg bg-white/5">
              <Icon name="Clock" size={20} className="md:w-6 md:h-6" />
            </div>
            Время работы промоутеров
          </CardTitle>
          <button
            onClick={loadWorkTime}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            title="Обновить данные"
          >
            <Icon name="RefreshCw" size={18} className="text-white" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {workTimeData.length === 0 ? (
          <div className="text-center py-6 md:py-8 text-white/70">
            <Icon name="Calendar" size={40} className="mx-auto mb-3 md:mb-4 text-white/30 md:w-12 md:h-12" />
            <p className="text-base md:text-lg font-medium text-white">Нет данных</p>
            <p className="text-xs md:text-sm mt-2">Промоутеры еще не открывали смены</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDates.map((date) => {
              const shifts = groupedByDate[date];
              const totalLeads = shifts.reduce((sum, shift) => sum + shift.leads_count, 0);
              const isExpanded = expandedDates.has(date);
              
              return (
                <div key={date} className="border-2 border-white/10 rounded-xl overflow-hidden bg-white/5">
                  <div 
                    className="flex flex-col md:flex-row md:items-center md:justify-between p-3 md:p-4 cursor-pointer hover:bg-white/10 transition-colors gap-2"
                    onClick={() => toggleDate(date)}
                  >
                    <div className="flex items-center gap-2 md:gap-3">
                      <Icon 
                        name={isExpanded ? "ChevronDown" : "ChevronRight"} 
                        size={18} 
                        className="text-white transition-transform md:w-5 md:h-5" 
                      />
                      <Icon name="Calendar" size={18} className="text-white md:w-5 md:h-5" />
                      <span className="font-bold text-white text-sm md:text-base">{date}</span>
                      <span className="text-xs md:text-sm text-white/50">({shifts.length})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs md:text-sm text-white/70 bg-white/10 px-2 py-1 md:px-3 rounded-lg ml-7 md:ml-0">
                      <Icon name="MessageSquare" size={12} className="md:w-[14px] md:h-[14px]" />
                      <span>{totalLeads} лидов</span>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="space-y-2 p-3 md:p-4 pt-0">
                    {shifts.map((shift, index) => {
                      const workDate = shift.date.split('.').reverse().join('-');
                      const shiftKey = `${shift.user_id}-${workDate}`;
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
                                  handleDeleteShift(shift.user_id, workDate);
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
    </Card>
  );
}