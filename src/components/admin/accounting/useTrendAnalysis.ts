import { useMemo } from 'react';

interface ChartData {
  label: string;
  revenue: number;
  date: string;
  startDate?: string;
  endDate?: string;
}

type Period = 'day' | 'week' | 'month' | 'year';

export interface TrendAnalysis {
  trendText: string;
  trendIcon: 'TrendingUp' | 'TrendingDown' | 'Minus';
  trendColor: string;
  slope: number;
  avgRevenue: number;
  novemberForecast: number;
  decemberForecast: number;
  changePerPeriod: number;
}

export function useTrendAnalysis(chartData: ChartData[], period: Period): TrendAnalysis | null {
  return useMemo(() => {
    if (chartData.length < 3) return null;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const getCurrentWeekStart = () => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(today);
      monday.setDate(today.getDate() + diff);
      monday.setHours(0, 0, 0, 0);
      return monday;
    };
    
    const currentWeekStart = getCurrentWeekStart();
    
    const completedPeriodsData = period === 'month' 
      ? chartData.filter(item => {
          const itemDate = new Date(item.startDate || item.date);
          return itemDate.getMonth() < currentMonth || itemDate.getFullYear() < currentYear;
        })
      : period === 'week'
      ? chartData.filter(item => {
          const itemDate = new Date(item.startDate || item.date);
          return itemDate < currentWeekStart;
        })
      : chartData;
    
    const recentDataCount = Math.min(Math.ceil(completedPeriodsData.length / 3), 10);
    const recentData = completedPeriodsData.slice(-recentDataCount);
    
    const n = recentData.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    recentData.forEach((item, i) => {
      sumX += i;
      sumY += item.revenue;
      sumXY += i * item.revenue;
      sumX2 += i * i;
    });
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const avgRevenue = recentData.reduce((sum, d) => sum + d.revenue, 0) / n;
    const trendPercentage = Math.abs(slope) / (avgRevenue || 1) * 100;
    
    let trendText = '';
    let trendIcon: 'TrendingUp' | 'TrendingDown' | 'Minus' = 'Minus';
    let trendColor = 'text-gray-600';
    
    if (slope > 0 && trendPercentage > 5) {
      trendText = 'Растущий тренд';
      trendIcon = 'TrendingUp';
      trendColor = 'text-green-600';
    } else if (slope < 0 && trendPercentage > 5) {
      trendText = 'Падающий тренд';
      trendIcon = 'TrendingDown';
      trendColor = 'text-red-600';
    } else {
      trendText = 'Стабильный уровень';
      trendIcon = 'Minus';
      trendColor = 'text-blue-600';
    }
    
    const calculateMonthlyForecast = (targetMonth: number, targetYear: number) => {
      const monthStart = new Date(targetYear, targetMonth, 1);
      const monthEnd = new Date(targetYear, targetMonth + 1, 0);
      const daysInMonth = monthEnd.getDate();
      
      if (period === 'month' || period === 'year') {
        if (targetMonth === currentMonth && targetYear === currentYear) {
          const daysPassed = now.getDate();
          
          if (daysPassed === 0) {
            return Math.round(avgRevenue * (period === 'month' ? 1 : 12));
          }
          
          const currentMonthRevenue = chartData
            .filter(item => {
              const itemDate = new Date(item.startDate || item.date);
              return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
            })
            .reduce((sum, item) => sum + item.revenue, 0);
          
          if (currentMonthRevenue === 0) {
            return Math.round(avgRevenue * (period === 'month' ? 1 : 12));
          }
          
          const avgDailyRevenue = currentMonthRevenue / daysPassed;
          const projectedTotal = avgDailyRevenue * daysInMonth;
          
          return Math.round(projectedTotal);
        }
        
        if (targetMonth < currentMonth || targetYear < currentYear) {
          const pastRevenue = chartData
            .filter(item => {
              const itemDate = new Date(item.startDate || item.date);
              return itemDate.getMonth() === targetMonth && itemDate.getFullYear() === targetYear;
            })
            .reduce((sum, item) => sum + item.revenue, 0);
          return Math.round(pastRevenue);
        }
        
        const periodsToForecast = period === 'month' ? 1 : 12;
        let forecastSum = 0;
        
        for (let i = 0; i < periodsToForecast; i++) {
          const forecastValue = intercept + slope * (n + i);
          forecastSum += Math.max(0, forecastValue);
        }
        
        return Math.round(forecastSum);
      }
      
      let existingRevenue = 0;
      let periodsInMonth = 0;
      let lastPeriodEndDate = monthStart;
      
      chartData.forEach(item => {
        const itemStart = new Date(item.startDate || item.date);
        const itemEnd = new Date(item.endDate || item.date);
        
        if (itemEnd >= monthStart && itemStart <= monthEnd) {
          existingRevenue += item.revenue;
          periodsInMonth++;
          if (itemEnd > lastPeriodEndDate) {
            lastPeriodEndDate = itemEnd;
          }
        }
      });
      
      if (targetMonth < currentMonth || targetYear < currentYear) {
        return Math.round(existingRevenue);
      }
      
      if (targetMonth === currentMonth && targetYear === currentYear) {
        if (lastPeriodEndDate >= monthEnd) {
          return Math.round(existingRevenue);
        }
        
        const daysCovered = Math.min(now.getDate(), lastPeriodEndDate.getDate());
        const daysRemaining = daysInMonth - daysCovered;
        
        if (daysRemaining <= 0) {
          return Math.round(existingRevenue);
        }
        
        const periodsPerDay = period === 'day' ? 1 : 1/7;
        const remainingPeriods = Math.ceil(daysRemaining * periodsPerDay);
        
        let projectedRevenue = 0;
        for (let i = 0; i < remainingPeriods; i++) {
          const forecastValue = intercept + slope * (n + i);
          projectedRevenue += Math.max(0, forecastValue);
        }
        
        return Math.round(existingRevenue + projectedRevenue);
      }
      
      const periodsPerMonth = period === 'day' ? 30 : 4.33;
      const periodsToForecast = Math.ceil(periodsPerMonth);
      const monthsAhead = (targetYear - currentYear) * 12 + (targetMonth - currentMonth);
      
      let forecastSum = 0;
      for (let i = 0; i < periodsToForecast; i++) {
        const periodOffset = (monthsAhead - 1) * periodsToForecast + i;
        const forecastValue = intercept + slope * (n + periodOffset);
        forecastSum += Math.max(0, forecastValue);
      }
      
      return Math.round(forecastSum);
    };
    
    const calculateCurrentWeekForecast = () => {
      const currentWeekData = chartData.filter(item => {
        const itemDate = new Date(item.startDate || item.date);
        return itemDate >= currentWeekStart;
      });
      
      if (currentWeekData.length === 0) return Math.round(avgRevenue);
      
      const currentWeekRevenue = currentWeekData.reduce((sum, item) => sum + item.revenue, 0);
      const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
      const daysPassed = dayOfWeek;
      const daysRemaining = 7 - daysPassed;
      
      if (daysRemaining === 0 || daysPassed === 0) return currentWeekRevenue;
      
      const avgDailyRevenue = currentWeekRevenue / daysPassed;
      const projectedTotal = currentWeekRevenue + avgDailyRevenue * daysRemaining;
      
      return Math.round(projectedTotal);
    };
    
    const novemberForecast = period === 'week' 
      ? calculateCurrentWeekForecast() 
      : calculateMonthlyForecast(10, 2025);
    
    const decemberForecast = calculateMonthlyForecast(11, 2025);
    
    const getCurrentPeriodForecast = () => {
      if (period === 'month') return novemberForecast;
      if (period === 'week') return novemberForecast;
      return avgRevenue;
    };
    
    const changePerPeriod = (period === 'month' || period === 'week')
      ? Math.round(getCurrentPeriodForecast() - avgRevenue)
      : Math.round(slope);
    
    return {
      trendText,
      trendIcon,
      trendColor,
      slope,
      avgRevenue: Math.round(avgRevenue),
      novemberForecast,
      decemberForecast,
      changePerPeriod
    };
  }, [chartData, period]);
}