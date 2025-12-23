import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import ClientsChart from './clients/ClientsChart';

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
  const [allShifts, setAllShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgFilter, setOrgFilter] = useState<OrgFilter>('TOP');

  useEffect(() => {
    loadData();
  }, [currentDate, viewMode]);
  
  useEffect(() => {
    loadAllShiftsForChart();
  }, []);

  const loadAllShiftsForChart = async () => {
    try {
      const now = new Date();
      const past = new Date(now);
      past.setFullYear(past.getFullYear() - 1);
      
      const startDate = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}-${String(past.getDate()).padStart(2, '0')}`;
      const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      console.log('📊 Загрузка данных для графика:', { startDate, endDate });
      
      const response = await fetch(
        `https://functions.poehali.dev/ea6877bc-65c9-4dc3-bafd-dfa003d3948e?start_date=${startDate}&end_date=${endDate}`,
        {
          headers: {
            'X-Session-Token': sessionToken
          }
        }
      );

      if (!response.ok) throw new Error('Failed to load chart data');

      const data = await response.json();
      console.log('✅ Загружено смен для графика:', data.shifts?.length);
      setAllShifts(data.shifts || []);
    } catch (error) {
      console.error('Ошибка загрузки данных для графика:', error);
    }
  };

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
  
  const calculateStats = (days: number) => {
    const allOrgs = organizations;
    const topOrgs = organizations.filter(org => org.name.includes('ТОП'));
    const kiberoneOrgs = organizations.filter(org => org.name.includes('KIBERONE'));
    
    const countRecent = (orgs: Organization[]) => {
      return orgs.filter(org => {
        if (!org.days_since_last_shift) return false;
        return org.days_since_last_shift <= days;
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
  
  const stats14Days = calculateStats(14);
  const stats30Days = calculateStats(30);

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
    <div className="space-y-4 md:space-y-6">
      <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-700 p-3 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 mb-3 md:mb-4">
          <div>
            <h2 className="text-base md:text-2xl font-bold text-white mb-2 md:mb-3">Планирование выходов</h2>
            
            <div className="flex flex-wrap gap-2 md:gap-4 text-[10px] md:text-sm mb-1.5 md:mb-2">
              <span className="text-slate-400 italic whitespace-nowrap">14 дней:</span>
              <div className="text-slate-300 whitespace-nowrap">
                <span className="font-medium text-white">ВСЕ:</span> {stats14Days.all.percent}% ({stats14Days.all.recent}/{stats14Days.all.total})
              </div>
              <div className="text-slate-300 whitespace-nowrap">
                <span className="font-medium text-white">ТОП:</span> {stats14Days.top.percent}% ({stats14Days.top.recent}/{stats14Days.top.total})
              </div>
              <div className="text-slate-300 whitespace-nowrap">
                <span className="font-medium text-white">KIB:</span> {stats14Days.kiberone.percent}% ({stats14Days.kiberone.recent}/{stats14Days.kiberone.total})
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 md:gap-4 text-[10px] md:text-sm">
              <span className="text-slate-400 italic whitespace-nowrap">30 дней:</span>
              <div className="text-slate-300 whitespace-nowrap">
                <span className="font-medium text-white">ВСЕ:</span> {stats30Days.all.percent}% ({stats30Days.all.recent}/{stats30Days.all.total})
              </div>
              <div className="text-slate-300 whitespace-nowrap">
                <span className="font-medium text-white">ТОП:</span> {stats30Days.top.percent}% ({stats30Days.top.recent}/{stats30Days.top.total})
              </div>
              <div className="text-slate-300 whitespace-nowrap">
                <span className="font-medium text-white">KIB:</span> {stats30Days.kiberone.percent}% ({stats30Days.kiberone.recent}/{stats30Days.kiberone.total})
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {(['day', 'week', 'month', 'year'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  const now = new Date();
                  setCurrentDate(now);
                  setViewMode(mode);
                }}
                className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-sm font-medium transition-all ${
                  viewMode === mode
                    ? 'bg-cyan-500 text-white shadow-lg'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
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

        <div className="flex items-center justify-between gap-2 md:gap-4 bg-slate-800/50 rounded-lg p-2.5 md:p-4 border border-slate-700">
          <button
            onClick={() => navigateDate('prev')}
            className="p-1.5 md:p-2 hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
          >
            <Icon name="ChevronLeft" size={20} className="text-cyan-500 md:w-6 md:h-6" />
          </button>
          
          <div className="text-center min-w-0 flex-1">
            <div className="text-xs md:text-lg font-bold text-white truncate">{formatDateRange()}</div>
          </div>
          
          <button
            onClick={() => navigateDate('next')}
            className="p-1.5 md:p-2 hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
          >
            <Icon name="ChevronRight" size={20} className="text-cyan-500 md:w-6 md:h-6" />
          </button>
        </div>
      </div>

      {/* График динамики */}
      <ClientsChart organizations={organizations} shifts={allShifts} />

      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-700 p-3 md:p-6">
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <div className="p-1.5 md:p-2 bg-green-500/20 rounded-lg flex-shrink-0">
              <Icon name="CheckCircle2" size={20} className="text-green-400 md:w-6 md:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm md:text-lg font-bold text-white truncate">Были выходы</h3>
              <p className="text-xs md:text-sm text-slate-400">{organizationsWithShifts.length} организаций</p>
            </div>
          </div>
          
          <div className="space-y-2 md:space-y-3 max-h-[400px] md:max-h-[600px] overflow-y-auto">
            {organizationsWithShifts.map((org) => (
              <div key={org.id} className="border border-slate-700 rounded-lg p-2.5 md:p-4 hover:border-green-500 transition-colors bg-slate-800/50">
                <div className="font-medium text-white mb-1.5 md:mb-2 text-xs md:text-base leading-tight">{org.name}</div>
                <div className="space-y-1 md:space-y-2">
                  {shiftsGroupedByOrg[org.id]?.map((shift) => (
                    <div key={shift.id} className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
                      <Icon name="User" size={12} className="text-slate-400 flex-shrink-0 md:w-[14px] md:h-[14px]" />
                      <span className="text-slate-300 truncate">{shift.user_name}</span>
                      <span className="text-slate-500 flex-shrink-0">•</span>
                      <span className="text-slate-400 whitespace-nowrap">
                        {new Date(shift.shift_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {organizationsWithShifts.length === 0 && (
              <div className="text-center py-6 md:py-8 text-slate-400">
                <Icon name="Calendar" size={36} className="mx-auto mb-2 text-slate-600 md:w-12 md:h-12" />
                <p className="text-xs md:text-base">Нет выходов в этом периоде</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-700 p-3 md:p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div className="p-1.5 md:p-2 bg-red-500/20 rounded-lg flex-shrink-0">
                <Icon name="AlertCircle" size={20} className="text-red-400 md:w-6 md:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm md:text-lg font-bold text-white truncate">Не было выходов</h3>
                <p className="text-xs md:text-sm text-slate-400">{organizationsWithoutShifts.length} организаций</p>
              </div>
            </div>
            
            <div className="flex gap-1.5 md:gap-2 flex-shrink-0">
              <button
                onClick={() => setOrgFilter('ALL')}
                className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[10px] md:text-sm font-medium transition-all ${
                  orgFilter === 'ALL'
                    ? 'bg-cyan-500 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                ВСЕ
              </button>
              <button
                onClick={() => setOrgFilter('TOP')}
                className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[10px] md:text-sm font-medium transition-all ${
                  orgFilter === 'TOP'
                    ? 'bg-cyan-500 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                ТОП
              </button>
              <button
                onClick={() => setOrgFilter('KIBERONE')}
                className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[10px] md:text-sm font-medium transition-all ${
                  orgFilter === 'KIBERONE'
                    ? 'bg-cyan-500 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <span className="hidden xs:inline">KIBERONE</span>
                <span className="xs:hidden">KIB</span>
              </button>
            </div>
          </div>
          
          <div className="space-y-2 md:space-y-3 max-h-[400px] md:max-h-[600px] overflow-y-auto">
            {organizationsWithoutShifts.map((org) => {
              const colorScheme = getDaysColor(org.days_since_last_shift);
              return (
                <div 
                  key={org.id} 
                  className="border border-slate-700 rounded-lg p-2.5 md:p-4 transition-colors bg-slate-800/50 hover:border-red-500"
                >
                  <div className="font-medium text-white mb-1.5 md:mb-2 text-xs md:text-base leading-tight">{org.name}</div>
                  {org.last_shift_date ? (
                    <div className="flex flex-wrap items-center gap-1.5 md:gap-2 text-[10px] md:text-sm">
                      <Icon name="Clock" size={12} className="text-slate-400 flex-shrink-0 md:w-[14px] md:h-[14px]" />
                      <span className="text-slate-300">
                        {new Date(org.last_shift_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      {org.days_since_last_shift !== null && (
                        <>
                          <span className="text-slate-500 flex-shrink-0">•</span>
                          <span className={`font-medium whitespace-nowrap ${
                            org.days_since_last_shift <= 6 ? 'text-green-400' :
                            org.days_since_last_shift <= 13 ? 'text-yellow-400' :
                            'text-red-400'
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
                  <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-sm text-slate-400">
                    <Icon name="Info" size={12} className="flex-shrink-0 md:w-[14px] md:h-[14px]" />
                    <span>Еще не было выходов</span>
                  </div>
                )}
              </div>
            );
            })}
            {organizationsWithoutShifts.length === 0 && (
              <div className="text-center py-6 md:py-8 text-slate-400">
                <Icon name="CheckCircle" size={36} className="mx-auto mb-2 text-slate-600 md:w-12 md:h-12" />
                <p className="text-xs md:text-base">Во всех организациях были выходы!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}