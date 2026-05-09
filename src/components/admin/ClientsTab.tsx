import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { toast } from '@/lib/toast';
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
      
      const response = await fetch(
        `https://functions.poehali.dev/ea6877bc-65c9-4dc3-bafd-dfa003d3948e?start_date=${startDate}&end_date=${endDate}`,
        { headers: { 'X-Session-Token': sessionToken } }
      );

      if (!response.ok) throw new Error('Failed to load chart data');
      const data = await response.json();
      setAllShifts(data.shifts || []);
    } catch (error) {
      console.error('Ошибка загрузки данных для графика:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      
      const response = await fetch(
        `https://functions.poehali.dev/ea6877bc-65c9-4dc3-bafd-dfa003d3948e?start_date=${startDate}&end_date=${endDate}`,
        { headers: { 'X-Session-Token': sessionToken } }
      );

      if (!response.ok) throw new Error('Failed to load data');

      const data = await response.json();
      setOrganizations(data.organizations || []);
      setShifts(data.shifts || []);
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить данные', variant: 'destructive' });
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
        
      case 'week': {
        const wStart = new Date(year, month, date);
        const wDay = wStart.getDay();
        const wDiff = date - wDay + (wDay === 0 ? -6 : 1);
        const weekStart = new Date(year, month, wDiff);
        const weekEnd = new Date(year, month, wDiff + 6);
        startDate = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
        endDate = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`;
        break;
      }
        
      case 'month': {
        const monthEnd = new Date(year, month + 1, 0);
        startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(monthEnd.getDate()).padStart(2, '0')}`;
        break;
      }
        
      case 'year':
        startDate = `${year}-01-01`;
        endDate = `${year}-12-31`;
        break;
        
      default:
        startDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
        endDate = startDate;
    }

    return { startDate, endDate };
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'day': newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1)); break;
      case 'week': newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7)); break;
      case 'month': newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1)); break;
      case 'year': newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1)); break;
    }
    setCurrentDate(newDate);
  };

  const formatDateRange = () => {
    const { startDate, endDate } = getDateRange();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const formatDate = (date: Date) => date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

    switch (viewMode) {
      case 'day': return start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
      case 'week': return `${formatDate(start)} - ${formatDate(end)}`;
      case 'month': return start.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
      case 'year': return start.getFullYear().toString();
    }
  };

  const organizationsWithShifts = organizations.filter(org => org.has_shift_in_period);
  
  const filterOrganizations = (orgs: Organization[]) => {
    if (orgFilter === 'ALL') return orgs;
    if (orgFilter === 'TOP') return orgs.filter(org => org.name.includes('ТОП'));
    if (orgFilter === 'KIBERONE') return orgs.filter(org => org.name.includes('KIBERONE'));
    return orgs;
  };
  
  const organizationsWithoutShifts = filterOrganizations(organizations.filter(org => !org.has_shift_in_period));
  
  const calculateStats = (days: number) => {
    const allOrgs = organizations;
    const topOrgs = organizations.filter(org => org.name.includes('ТОП'));
    const kiberoneOrgs = organizations.filter(org => org.name.includes('KIBERONE'));
    
    const countRecent = (orgs: Organization[]) =>
      orgs.filter(org => org.days_since_last_shift !== null && org.days_since_last_shift <= days).length;
    
    const allTotal = allOrgs.length;
    const allRecent = countRecent(allOrgs);
    const topTotal = topOrgs.length;
    const topRecent = countRecent(topOrgs);
    const kiberoneTotal = kiberoneOrgs.length;
    const kiberoneRecent = countRecent(kiberoneOrgs);
    
    return {
      all: { total: allTotal, recent: allRecent, percent: allTotal > 0 ? Math.round((allRecent / allTotal) * 100) : 0 },
      top: { total: topTotal, recent: topRecent, percent: topTotal > 0 ? Math.round((topRecent / topTotal) * 100) : 0 },
      kiberone: { total: kiberoneTotal, recent: kiberoneRecent, percent: kiberoneTotal > 0 ? Math.round((kiberoneRecent / kiberoneTotal) * 100) : 0 },
    };
  };
  
  const stats14Days = calculateStats(14);
  const stats30Days = calculateStats(30);

  const shiftsGroupedByOrg = shifts.reduce((acc, shift) => {
    if (!acc[shift.organization_id]) acc[shift.organization_id] = [];
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

  const viewLabels: Record<ViewMode, string> = { day: 'День', week: 'Неделя', month: 'Месяц', year: 'Год' };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Планирование выходов */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 mb-3 md:mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2 md:mb-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-blue-50 border border-blue-100">
                <Icon name="CalendarDays" size={18} className="text-blue-600" />
              </div>
              <h2 className="text-base md:text-xl font-bold text-gray-800">Планирование выходов</h2>
            </div>
            
            <div className="flex flex-wrap gap-2 md:gap-4 text-[10px] md:text-sm mb-1.5 md:mb-2">
              <span className="text-gray-400 italic whitespace-nowrap">14 дней:</span>
              <div className="text-gray-600 whitespace-nowrap">
                <span className="font-semibold text-gray-800">ВСЕ:</span> {stats14Days.all.percent}% ({stats14Days.all.recent}/{stats14Days.all.total})
              </div>
              <div className="text-gray-600 whitespace-nowrap">
                <span className="font-semibold text-gray-800">ТОП:</span> {stats14Days.top.percent}% ({stats14Days.top.recent}/{stats14Days.top.total})
              </div>
              <div className="text-gray-600 whitespace-nowrap">
                <span className="font-semibold text-gray-800">KIB:</span> {stats14Days.kiberone.percent}% ({stats14Days.kiberone.recent}/{stats14Days.kiberone.total})
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 md:gap-4 text-[10px] md:text-sm">
              <span className="text-gray-400 italic whitespace-nowrap">30 дней:</span>
              <div className="text-gray-600 whitespace-nowrap">
                <span className="font-semibold text-gray-800">ВСЕ:</span> {stats30Days.all.percent}% ({stats30Days.all.recent}/{stats30Days.all.total})
              </div>
              <div className="text-gray-600 whitespace-nowrap">
                <span className="font-semibold text-gray-800">ТОП:</span> {stats30Days.top.percent}% ({stats30Days.top.recent}/{stats30Days.top.total})
              </div>
              <div className="text-gray-600 whitespace-nowrap">
                <span className="font-semibold text-gray-800">KIB:</span> {stats30Days.kiberone.percent}% ({stats30Days.kiberone.recent}/{stats30Days.kiberone.total})
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {(['day', 'week', 'month', 'year'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => { setCurrentDate(new Date()); setViewMode(mode); }}
                className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-sm font-medium transition-all border ${
                  viewMode === mode
                    ? 'bg-blue-600 text-white border-transparent shadow-sm'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {viewLabels[mode]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 md:gap-4 bg-gray-50 rounded-xl p-2.5 md:p-4 border border-gray-200">
          <button
            onClick={() => navigateDate('prev')}
            className="p-1.5 md:p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
          >
            <Icon name="ChevronLeft" size={20} className="text-blue-600 md:w-6 md:h-6" />
          </button>
          
          <div className="text-center min-w-0 flex-1">
            <div className="text-xs md:text-lg font-bold text-gray-800 truncate">{formatDateRange()}</div>
          </div>
          
          <button
            onClick={() => navigateDate('next')}
            className="p-1.5 md:p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
          >
            <Icon name="ChevronRight" size={20} className="text-blue-600 md:w-6 md:h-6" />
          </button>
        </div>
      </div>

      {/* График динамики */}
      <ClientsChart organizations={organizations} shifts={allShifts} />

      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        {/* Были выходы */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 md:p-6">
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4 pb-3 border-b border-gray-100">
            <div className="p-1.5 md:p-2 bg-green-50 border border-green-100 rounded-lg flex-shrink-0">
              <Icon name="CheckCircle2" size={18} className="text-green-600 md:w-5 md:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm md:text-lg font-bold text-gray-800 truncate">Были выходы</h3>
              <p className="text-xs md:text-sm text-gray-500">{organizationsWithShifts.length} организаций</p>
            </div>
          </div>
          
          <div className="space-y-2 md:space-y-3 max-h-[400px] md:max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {organizationsWithShifts.map((org) => (
              <div key={org.id} className="border border-gray-100 rounded-xl p-2.5 md:p-4 hover:border-green-200 hover:bg-green-50/50 transition-colors bg-gray-50">
                <div className="font-medium text-gray-800 mb-1.5 md:mb-2 text-xs md:text-base leading-tight">{org.name}</div>
                <div className="space-y-1 md:space-y-2">
                  {shiftsGroupedByOrg[org.id]?.map((shift) => (
                    <div key={shift.id} className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
                      <Icon name="User" size={12} className="text-gray-400 flex-shrink-0 md:w-[14px] md:h-[14px]" />
                      <span className="text-gray-600 truncate">{shift.user_name}</span>
                      <span className="text-gray-300 flex-shrink-0">•</span>
                      <span className="text-gray-500 whitespace-nowrap">
                        {new Date(shift.shift_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {organizationsWithShifts.length === 0 && (
              <div className="text-center py-6 md:py-8 text-gray-400">
                <Icon name="Calendar" size={36} className="mx-auto mb-2 opacity-30 md:w-12 md:h-12" />
                <p className="text-xs md:text-base">Нет выходов в этом периоде</p>
              </div>
            )}
          </div>
        </div>

        {/* Не было выходов */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 md:p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-3 md:mb-4 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div className="p-1.5 md:p-2 bg-red-50 border border-red-100 rounded-lg flex-shrink-0">
                <Icon name="AlertCircle" size={18} className="text-red-500 md:w-5 md:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm md:text-lg font-bold text-gray-800 truncate">Не было выходов</h3>
                <p className="text-xs md:text-sm text-gray-500">{organizationsWithoutShifts.length} организаций</p>
              </div>
            </div>
            
            <div className="flex gap-1.5 md:gap-2 flex-shrink-0">
              {(['ALL', 'TOP', 'KIBERONE'] as OrgFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setOrgFilter(filter)}
                  className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[10px] md:text-sm font-medium transition-all border ${
                    orgFilter === filter
                      ? 'bg-blue-600 text-white border-transparent shadow-sm'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {filter === 'ALL' ? 'Все' : filter === 'KIBERONE' ? <><span className="hidden xs:inline">KIBERONE</span><span className="xs:hidden">KIB</span></> : filter}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2 md:space-y-3 max-h-[400px] md:max-h-[600px] overflow-y-auto scrollbar-thin">
            {organizationsWithoutShifts.map((org) => (
              <div 
                key={org.id}
                className="border border-gray-100 rounded-xl p-2.5 md:p-4 hover:border-red-200 hover:bg-red-50/50 transition-colors bg-gray-50"
              >
                <div className="font-medium text-gray-800 mb-1.5 md:mb-2 text-xs md:text-base leading-tight">{org.name}</div>
                {org.last_shift_date ? (
                  <div className="flex flex-wrap items-center gap-1.5 md:gap-2 text-[10px] md:text-sm">
                    <Icon name="Clock" size={12} className="text-gray-400 flex-shrink-0 md:w-[14px] md:h-[14px]" />
                    <span className="text-gray-600">
                      {new Date(org.last_shift_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {org.days_since_last_shift !== null && (
                      <>
                        <span className="text-gray-300 flex-shrink-0">•</span>
                        <span className={`font-medium whitespace-nowrap ${
                          org.days_since_last_shift <= 6 ? 'text-green-600' :
                          org.days_since_last_shift <= 13 ? 'text-yellow-600' :
                          'text-red-500'
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
                  <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-sm text-gray-400">
                    <Icon name="Info" size={12} className="flex-shrink-0 md:w-[14px] md:h-[14px]" />
                    <span>Ещё не было выходов</span>
                  </div>
                )}
              </div>
            ))}
            {organizationsWithoutShifts.length === 0 && (
              <div className="text-center py-6 md:py-8 text-gray-400">
                <Icon name="CheckCircle" size={36} className="mx-auto mb-2 opacity-30 md:w-12 md:h-12" />
                <p className="text-xs md:text-base">Во всех организациях были выходы!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}