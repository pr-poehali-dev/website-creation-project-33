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

type OrgFilter = 'ALL' | 'TOP' | 'KIBERONE';

export default function ClientsTab({ sessionToken }: ClientsTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgFilter, setOrgFilter] = useState<OrgFilter>('TOP');

  useEffect(() => {
    loadData();
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
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = currentDate.getDate();
    
    let startDate: string;
    let endDate: string;

    switch (viewMode) {
      case 'day':
        startDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
        endDate = startDate;
        break;
        
      case 'week':
        const start = new Date(year, month, date);
        const day = start.getDay();
        const diff = date - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(year, month, diff);
        const weekEnd = new Date(year, month, diff + 6);
        
        startDate = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
        endDate = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`;
        break;
        
      case 'month':
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);
        
        startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(monthEnd.getDate()).padStart(2, '0')}`;
        console.log('📆 Месяц:', { year, month: month + 1, startDate, endDate });
        break;
        
      case 'year':
        startDate = `${year}-01-01`;
        endDate = `${year}-12-31`;
        break;
        
      default:
        startDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
        endDate = startDate;
    }

    console.log('📅 Диапазон дат:', { viewMode, startDate, endDate });
    return { startDate, endDate };
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
  
  const filterOrganizations = (orgs: Organization[]) => {
    if (orgFilter === 'ALL') return orgs;
    if (orgFilter === 'TOP') return orgs.filter(org => org.name.includes('ТОП'));
    if (orgFilter === 'KIBERONE') return orgs.filter(org => org.name.includes('KIBERONE'));
    return orgs;
  };
  
  const organizationsWithoutShifts = filterOrganizations(
    organizations.filter(org => !org.has_shift_in_period)
  );
  
  const getDaysColor = (days: number | null) => {
    if (days === null) return { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-600' };
    if (days <= 6) return { bg: 'bg-green-50 border-green-200', text: 'text-green-700' };
    if (days <= 13) return { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700' };
    return { bg: 'bg-red-50 border-red-200', text: 'text-red-600' };
  };
  
  const calculate13DaysStats = () => {
    const allOrgs = organizations;
    const topOrgs = organizations.filter(org => org.name.includes('ТОП'));
    const kiberoneOrgs = organizations.filter(org => org.name.includes('KIBERONE'));
    
    const countRecent = (orgs: Organization[]) => {
      return orgs.filter(org => {
        if (!org.days_since_last_shift) return false;
        return org.days_since_last_shift <= 13;
      }).length;
    };
    
    const allTotal = allOrgs.length;
    const allRecent = countRecent(allOrgs);
    const allPercent = allTotal > 0 ? Math.round((allRecent / allTotal) * 100) : 0;
    
    const topTotal = topOrgs.length;
    const topRecent = countRecent(topOrgs);
    const topPercent = topTotal > 0 ? Math.round((topRecent / topTotal) * 100) : 0;
    
    const kiberoneTotal = kiberoneOrgs.length;
    const kiberoneRecent = countRecent(kiberoneOrgs);
    const kiberonePercent = kiberoneTotal > 0 ? Math.round((kiberoneRecent / kiberoneTotal) * 100) : 0;
    
    return {
      all: { total: allTotal, recent: allRecent, percent: allPercent },
      top: { total: topTotal, recent: topRecent, percent: topPercent },
      kiberone: { total: kiberoneTotal, recent: kiberoneRecent, percent: kiberonePercent }
    };
  };
  
  const stats13Days = calculate13DaysStats();

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Планирование выходов</h2>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">ВСЕ:</span> {stats13Days.all.percent}% ({stats13Days.all.recent} из {stats13Days.all.total})
              </div>
              <div>
                <span className="font-medium">ТОП:</span> {stats13Days.top.percent}% ({stats13Days.top.recent} из {stats13Days.top.total})
              </div>
              <div>
                <span className="font-medium">KIBERONE:</span> {stats13Days.kiberone.percent}% ({stats13Days.kiberone.recent} из {stats13Days.kiberone.total})
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {(['day', 'week', 'month', 'year'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  const now = new Date();
                  setCurrentDate(now);
                  setViewMode(mode);
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Icon name="AlertCircle" size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Не было выходов</h3>
                <p className="text-sm text-gray-600">{organizationsWithoutShifts.length} организаций</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setOrgFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  orgFilter === 'ALL'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ВСЕ
              </button>
              <button
                onClick={() => setOrgFilter('TOP')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  orgFilter === 'TOP'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ТОП
              </button>
              <button
                onClick={() => setOrgFilter('KIBERONE')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  orgFilter === 'KIBERONE'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                KIBERONE
              </button>
            </div>
          </div>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {organizationsWithoutShifts.map((org) => {
              const colorScheme = getDaysColor(org.days_since_last_shift);
              return (
                <div 
                  key={org.id} 
                  className={`border rounded-lg p-4 transition-colors ${colorScheme.bg}`}
                >
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
                          <span className={`font-medium ${colorScheme.text}`}>
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
            );
            })}
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