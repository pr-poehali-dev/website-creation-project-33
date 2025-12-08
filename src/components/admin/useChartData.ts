import React from 'react';
import { ChartDataPoint, UserStats, ADMIN_API } from './types';
import { toMoscowTime } from '@/utils/date';

export const USER_COLORS = [
  '#7C93C3',
  '#9EB384',
  '#C8A2C8',
  '#D4A574',
  '#9DC5C3',
  '#C48B9F',
  '#A7B8A8',
  '#B89D9D',
  '#8EACCD'
];

export function useChartData(
  chartData: ChartDataPoint[],
  userStats: UserStats[],
  groupBy: 'day' | 'week' | 'month' | 'year',
  timeRange: string,
  selectedOrganizations: number[]
) {
  const getWeekKey = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${d.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
  };

  const getMonthKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const getYearKey = (date: Date) => {
    return `${date.getFullYear()}`;
  };

  const getWeekLabel = (weekKey: string) => {
    const [year, week] = weekKey.split('-W');
    const jan4 = new Date(parseInt(year), 0, 4);
    const monday = new Date(jan4);
    monday.setDate(jan4.getDate() - (jan4.getDay() || 7) + 1 + (parseInt(week) - 1) * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return `${String(monday.getDate()).padStart(2, '0')}.${String(monday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}.${String(sunday.getMonth() + 1).padStart(2, '0')}`;
  };

  const getMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const filterByTimeRange = (data: ChartDataPoint[]) => {
    if (timeRange === 'all') {
      return data;
    }

    const now = new Date();
    const cutoffDate = new Date();

    switch (timeRange) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '14d':
        cutoffDate.setDate(now.getDate() - 14);
        break;
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      case '6m':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return data;
    }

    return data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= cutoffDate;
    });
  };

  const getFilteredChartData = () => {
    let timeFilteredData = filterByTimeRange(chartData);

    // Фильтруем по организациям если выбраны
    if (selectedOrganizations.length > 0) {
      console.log('🔍 Фильтр по организациям:', selectedOrganizations);
      console.log('📦 Данные до фильтра:', timeFilteredData.slice(0, 2));
      
      timeFilteredData = timeFilteredData.map(item => {
        const userOrgs = (item as any).user_orgs || {};
        const newItem: any = {
          date: item.date,
          total: 0,
          contacts: 0,
          approaches: 0,
          organization_ids: item.organization_ids,
          user_orgs: item.user_orgs
        };
        
        // Для каждого пользователя проверяем, работал ли он в выбранных организациях
        userStats.forEach(user => {
          const userName = user.name;
          const userOrgIds = userOrgs[userName] || [];
          
          // Проверяем есть ли пересечение между организациями пользователя и выбранными
          const hasMatch = userOrgIds.some((orgId: number) => selectedOrganizations.includes(orgId));
          
          if (hasMatch) {
            // Если пользователь работал в выбранной организации, копируем его данные
            const contactsKey = `${userName}_contacts`;
            const approachesKey = `${userName}_approaches`;
            const totalKey = `${userName}_total`;
            
            newItem[contactsKey] = (item as any)[contactsKey] || 0;
            newItem[approachesKey] = (item as any)[approachesKey] || 0;
            newItem[totalKey] = (item as any)[totalKey] || 0;
            
            newItem.total += newItem[totalKey];
            newItem.contacts += newItem[contactsKey];
            newItem.approaches += newItem[approachesKey];
          } else {
            // Если пользователь не работал в выбранной организации, ставим 0
            newItem[`${userName}_contacts`] = 0;
            newItem[`${userName}_approaches`] = 0;
            newItem[`${userName}_total`] = 0;
          }
        });
        
        return newItem;
      }).filter(item => item.total > 0);  // Убираем дни без данных
      
      console.log('✅ Данные после фильтра:', timeFilteredData.slice(0, 2));
    }

    if (groupBy === 'day') {
      return timeFilteredData;
    }

    const grouped: Record<string, any> = {};
    
    timeFilteredData.forEach(item => {
      const date = new Date(toMoscowTime(item.date));
      let key: string;
      
      if (groupBy === 'week') {
        key = getWeekKey(date);
      } else if (groupBy === 'month') {
        key = getMonthKey(date);
      } else {
        key = getYearKey(date);
      }

      if (!grouped[key]) {
        const userFields: Record<string, number> = {};
        userStats.forEach(u => {
          userFields[`${u.name}_contacts`] = 0;
          userFields[`${u.name}_approaches`] = 0;
        });
        
        grouped[key] = {
          date: key,
          displayDate: groupBy === 'week' ? getWeekLabel(key) : groupBy === 'month' ? getMonthLabel(key) : key,
          total: 0,
          contacts: 0,
          approaches: 0,
          ...userFields
        };
      }

      grouped[key].total += item.total || 0;
      grouped[key].contacts += item.contacts || 0;
      grouped[key].approaches += item.approaches || 0;
      
      userStats.forEach(user => {
        const contactsKey = `${user.name}_contacts`;
        const approachesKey = `${user.name}_approaches`;
        
        if (item[contactsKey] !== undefined) {
          grouped[key][contactsKey] += item[contactsKey];
        }
        if (item[approachesKey] !== undefined) {
          grouped[key][approachesKey] += item[approachesKey];
        }
      });
    });

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  };

  const fetchPeriodDetails = async (
    period: string,
    displayLabel: string,
    setLoadingPeriod: (loading: boolean) => void,
    setSelectedPeriod: (period: {period: string, displayLabel: string}) => void,
    setPeriodLeads: (leads: any[]) => void
  ) => {
    console.log('fetchPeriodDetails called:', period, displayLabel);
    setLoadingPeriod(true);
    setSelectedPeriod({ period, displayLabel });
    setPeriodLeads([]);

    try {
      const sessionToken = localStorage.getItem('session_token');
      
      let dates: string[] = [];
      
      if (groupBy === 'day') {
        dates = [period];
      } else if (groupBy === 'week') {
        const [year, week] = period.split('-W');
        const jan4 = new Date(parseInt(year), 0, 4);
        const monday = new Date(jan4);
        monday.setDate(jan4.getDate() - (jan4.getDay() || 7) + 1 + (parseInt(week) - 1) * 7);
        
        for (let i = 0; i < 7; i++) {
          const day = new Date(monday);
          day.setDate(monday.getDate() + i);
          dates.push(day.toISOString().split('T')[0]);
        }
      } else if (groupBy === 'month') {
        const [year, month] = period.split('-');
        const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
          dates.push(`${year}-${month}-${String(day).padStart(2, '0')}`);
        }
      } else if (groupBy === 'year') {
        const year = parseInt(period);
        for (let month = 1; month <= 12; month++) {
          const daysInMonth = new Date(year, month, 0).getDate();
          for (let day = 1; day <= daysInMonth; day++) {
            dates.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
          }
        }
      }

      const allLeads: any[] = [];
      
      for (const date of dates) {
        const response = await fetch(`${ADMIN_API}?action=daily_user_stats&date=${date}`, {
          headers: {
            'X-Session-Token': sessionToken || '',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.detailed_leads && data.detailed_leads.length > 0) {
            allLeads.push(...data.detailed_leads);
          }
        }
      }
      
      setPeriodLeads(allLeads);
    } catch (error) {
      console.error('Error fetching period details:', error);
    } finally {
      setLoadingPeriod(false);
    }
  };

  const userColorMap = userStats.reduce((acc, user, index) => {
    acc[user.name] = USER_COLORS[index % USER_COLORS.length];
    return acc;
  }, {} as Record<string, string>);

  return {
    getFilteredChartData,
    fetchPeriodDetails,
    userColorMap,
    getWeekLabel,
    getMonthLabel
  };
}