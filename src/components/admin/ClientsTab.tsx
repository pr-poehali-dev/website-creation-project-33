import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

interface ClientsTabProps {
  sessionToken: string;
}

type ViewMode = 'day' | 'week' | 'month' | 'year';

interface Organization {
  id: number;
  name: string;
  last_shift_date: string | null;
  days_since_last_shift: number | null;
  has_shift_in_period: boolean;
}

interface Shift {
  id: number;
  user_id: number;
  user_name: string;
  organization_id: number;
  organization_name: string;
  shift_date: string;
  shift_start: string;
  shift_end: string;
}

export default function ClientsTab({ sessionToken }: ClientsTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [currentDate, viewMode]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      console.log('📅 Загрузка данных:', { viewMode, startDate, endDate });
      
      const response = await fetch(
        `https://functions.poehali.dev/ea6877bc-65c9-4dc3-bafd-dfa003d3948e?start_date=${startDate}&end_date=${endDate}`,
        {
          headers: {
            'X-Session-Token': sessionToken
          }
        }
      );

      if (!response.ok) throw new Error('Failed to load data');

      const data = await response.json();
      console.log('✅ Получено организаций:', data.organizations?.length, 'смен:', data.shifts?.length);
      setOrganizations(data.organizations || []);
      setShifts(data.shifts || []);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    console.log('🔍 getDateRange вызван с currentDate:', currentDate, 'viewMode:', viewMode);
    const start = new Date(currentDate);
    let end = new Date(currentDate);

    switch (viewMode) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        console.log('📆 До изменений start:', start);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        console.log('📆 После start.setDate(1):', start);
        end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        console.log('📆 Создан end:', end, 'год:', start.getFullYear(), 'месяц+1:', start.getMonth() + 1);
        end.setHours(23, 59, 59, 999);
        break;
      case 'year':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const formatDateRange = () => {
    const { startDate, endDate } = getDateRange();
    const start = new Date(startDate);
    const end = new Date(endDate);

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    };

    switch (viewMode) {
      case 'day':
        return start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
      case 'week':
        return `${formatDate(start)} - ${formatDate(end)}`;
      case 'month':
        return start.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
      case 'year':
        return start.getFullYear().toString();
    }
  };

  const organizationsWithShifts = organizations.filter(org => org.has_shift_in_period);
  const organizationsWithoutShifts = organizations.filter(org => !org.has_shift_in_period);

  const shiftsGroupedByOrg = shifts.reduce((acc, shift) => {
    if (!acc[shift.organization_id]) {
      acc[shift.organization_id] = [];
    }
    acc[shift.organization_id].push(shift);
    return acc;
  }, {} as Record<number, Shift[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-gray-600">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Загрузка данных...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Планирование выходов</h2>
          
          <div className="flex flex-wrap gap-2">
            {(['day', 'week', 'month', 'year'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setViewMode(mode);
                  setCurrentDate(new Date());
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  viewMode === mode
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {mode === 'day' && 'День'}
                {mode === 'week' && 'Неделя'}
                {mode === 'month' && 'Месяц'}
                {mode === 'year' && 'Год'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <Icon name="ChevronLeft" size={24} className="text-purple-600" />
          </button>
          
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{formatDateRange()}</div>
          </div>
          
          <button
            onClick={() => navigateDate('next')}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <Icon name="ChevronRight" size={24} className="text-purple-600" />
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Icon name="CheckCircle2" size={24} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Были выходы</h3>
              <p className="text-sm text-gray-600">{organizationsWithShifts.length} организаций</p>
            </div>
          </div>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {organizationsWithShifts.map((org) => (
              <div key={org.id} className="border border-gray-200 rounded-lg p-4 hover:border-green-400 transition-colors">
                <div className="font-medium text-gray-900 mb-2">{org.name}</div>
                <div className="space-y-2">
                  {shiftsGroupedByOrg[org.id]?.map((shift) => (
                    <div key={shift.id} className="flex items-center gap-2 text-sm">
                      <Icon name="User" size={14} className="text-gray-400" />
                      <span className="text-gray-700">{shift.user_name}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">
                        {new Date(shift.shift_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {organizationsWithShifts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Icon name="Calendar" size={48} className="mx-auto mb-2 text-gray-300" />
                <p>Нет выходов в этом периоде</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <Icon name="AlertCircle" size={24} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Не было выходов</h3>
              <p className="text-sm text-gray-600">{organizationsWithoutShifts.length} организаций</p>
            </div>
          </div>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {organizationsWithoutShifts.map((org) => (
              <div key={org.id} className="border border-gray-200 rounded-lg p-4 hover:border-red-400 transition-colors">
                <div className="font-medium text-gray-900 mb-2">{org.name}</div>
                {org.last_shift_date ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Icon name="Clock" size={14} className="text-gray-400" />
                    <span className="text-gray-600">
                      Последний выход: {new Date(org.last_shift_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {org.days_since_last_shift !== null && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className={`font-medium ${
                          org.days_since_last_shift > 30 ? 'text-red-600' : 
                          org.days_since_last_shift > 14 ? 'text-orange-600' : 
                          'text-gray-600'
                        }`}>
                          {org.days_since_last_shift} {
                            org.days_since_last_shift === 1 ? 'день' :
                            org.days_since_last_shift < 5 ? 'дня' : 'дней'
                          } назад
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Icon name="Info" size={14} />
                    <span>Еще не было выходов</span>
                  </div>
                )}
              </div>
            ))}
            {organizationsWithoutShifts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Icon name="CheckCircle" size={48} className="mx-auto mb-2 text-gray-300" />
                <p>Во всех организациях были выходы!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}