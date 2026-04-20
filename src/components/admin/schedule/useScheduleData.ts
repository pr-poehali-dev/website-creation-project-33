import { useState, useEffect } from 'react';
import { DaySchedule, UserSchedule, OrganizationData } from './types';

type ShiftData = {
  location?: string;
  flyers?: string;
  organization?: string;
  location_type?: string;
  location_details?: string;
};

// workComments[date][userName][shiftTime] — отдельные данные для каждой смены
type WorkComments = Record<string, Record<string, Record<string, ShiftData> & ShiftData>>;

export function useScheduleData(weekDays: DaySchedule[], schedules: UserSchedule[], orgLimits?: Map<string, number>) {
  const [workComments, setWorkComments] = useState<WorkComments>({});
  const [savingComment, setSavingComment] = useState<string | null>(null);
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [allOrganizations, setAllOrganizations] = useState<OrganizationData[]>([]);
  const [userOrgStats, setUserOrgStats] = useState<Record<string, Array<{organization_name: string, avg_per_shift: number}>>>({});
  const [recommendedLocations, setRecommendedLocations] = useState<Record<string, Record<string, string>>>({});
  const [actualStats, setActualStats] = useState<Record<string, {contacts: number, revenue: number}>>({});
  const [loadingProgress, setLoadingProgress] = useState<number>(0);

  const loadActualStats = async () => {
    if (weekDays.length === 0) return;
    
    try {
      const dates = weekDays.map(d => d.date);
      const cacheKey = `actual-stats-${dates.join('-')}`;
      const cached = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(`${cacheKey}-time`);
      
      // Кэш на 5 минут
      if (cached && cacheTime) {
        const age = Date.now() - parseInt(cacheTime);
        if (age < 5 * 60 * 1000) {
          const cachedData = JSON.parse(cached);
          setActualStats(cachedData);
          console.log('📦 Использую кэшированные фактические данные');
          return;
        }
      }
      
      // 1. Получаем реальные контакты из leads_analytics через schedule-stats
      const contactsResponse = await fetch(
        'https://functions.poehali.dev/1bee9f5e-8c1a-4353-aa1b-726199b50b62',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': localStorage.getItem('session_token') || '',
          },
          body: JSON.stringify({ dates })
        }
      );
      
      const statsByDate: Record<string, {contacts: number, revenue: number}> = {};
      
      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json();
        if (contactsData.actual && Array.isArray(contactsData.actual)) {
          contactsData.actual.forEach((item: {date: string, count: number}) => {
            statsByDate[item.date] = { contacts: item.count || 0, revenue: 0 };
          });
        }
      }
      
      // 2. Получаем доход КМС из бухучёта
      const accountingResponse = await fetch(
        'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214?action=get_accounting_data',
        {
          headers: {
            'X-Session-Token': localStorage.getItem('session_token') || '',
          }
        }
      );
      
      if (accountingResponse.ok) {
        const accountingData = await accountingResponse.json();
        if (accountingData.shifts && Array.isArray(accountingData.shifts)) {
          accountingData.shifts.forEach((shift: {date: string, contacts_count: number, organization: string, contact_rate: number, compensation_amount: number, payment_type: string, expense_amount: number}) => {
            const date = shift.date;
            if (!date) return;
            
            if (!statsByDate[date]) {
              statsByDate[date] = { contacts: 0, revenue: 0 };
            }
            
            const contacts = shift.contacts_count || 0;
            const orgName = shift.organization;
            
            let baseRevenue = 0;
            if (orgName === 'Администратор') {
              baseRevenue = 2968;
            } else {
              baseRevenue = contacts * (shift.contact_rate || 0);
            }
            const compensation = shift.compensation_amount || 0;
            const revenue = baseRevenue + compensation;
            
            let tax = 0;
            if (orgName === 'Администратор') {
              tax = 172;
            } else if (shift.payment_type === 'cashless') {
              tax = Math.round(revenue * 0.07);
            }
            const afterTax = revenue - tax;
            
            let workerSalary = 0;
            if (orgName === 'Администратор') {
              workerSalary = 600;
            } else if (date && new Date(date) >= new Date('2025-10-01') && contacts >= 10) {
              workerSalary = contacts * 300;
            } else {
              workerSalary = contacts * 200;
            }
            
            const expense = shift.expense_amount || 0;
            const netProfit = afterTax - workerSalary - expense;
            const kmsIncome = Math.round(netProfit / 2);
            
            statsByDate[date].revenue += kmsIncome;
          });
        }
      }
      
      setActualStats(statsByDate);
      
      // Сохраняем в кэш
      localStorage.setItem(cacheKey, JSON.stringify(statsByDate));
      localStorage.setItem(`${cacheKey}-time`, Date.now().toString());
      
      console.log('✅ Загружены фактические данные:', statsByDate);
    } catch (error) {
      console.error('Error loading actual stats:', error);
    }
  };

  const loadAllLocations = async () => {
    try {
      const response = await fetch(
        'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214?action=get_organizations',
        {
          headers: {
            'X-Session-Token': localStorage.getItem('session_token') || '',
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.organizations && Array.isArray(data.organizations)) {
          const orgsData: OrganizationData[] = data.organizations.map((org: {id: number, name: string, contact_rate: number, payment_type: string}) => ({
            id: org.id,
            name: org.name,
            contact_rate: org.contact_rate || 0,
            payment_type: org.payment_type || 'cash'
          }));
          setAllOrganizations(orgsData);
          const orgNames = orgsData.map(org => org.name).sort();
          setAllLocations(orgNames);
          console.log(`✅ Загружено ${orgNames.length} организаций для списка`);
        }
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
    }
  };

  const loadUserOrgStats = async () => {
    console.log('🔎 Начинаем загрузку статистики. schedules:', schedules);
    if (schedules.length === 0) return;
    
    setLoadingProgress(30);
    
    try {
      const usersWithEmail = schedules.filter(u => u.email);
      
      if (usersWithEmail.length === 0) {
        setLoadingProgress(100);
        return;
      }
      
      // Собираем все emails для батч-запроса
      const emails = usersWithEmail.map(u => u.email);
      
      console.log(`⚡ Батч-загрузка статистики для ${emails.length} промоутеров одним запросом`);
      setLoadingProgress(50);
      
      // Один запрос для всех промоутеров сразу!
      const response = await fetch(
        'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': localStorage.getItem('session_token') || '',
          },
          body: JSON.stringify({
            action: 'get_batch_user_org_stats',
            emails: emails
          })
        }
      );
      
      setLoadingProgress(80);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.batch_stats) {
          // Преобразуем результат: email → userName
          const stats: Record<string, Array<{organization_name: string, avg_per_shift: number, shift_count: number}>> = {};
          
          usersWithEmail.forEach(user => {
            const userName = `${user.first_name} ${user.last_name}`;
            const userEmail = user.email;
            
            if (data.batch_stats[userEmail]) {
              stats[userName] = data.batch_stats[userEmail];
            }
          });
          
          console.log(`📊 Загружена статистика для ${Object.keys(stats).length} промоутеров`);
          setUserOrgStats(stats);
          calculateRecommendations(stats);
        }
      } else {
        console.error('Ошибка загрузки статистики:', await response.text());
      }
      
      setLoadingProgress(100);
    } catch (error) {
      console.error('Error loading batch stats:', error);
      setLoadingProgress(0);
    }
  };

  const calculateKMS = (orgName: string, avgContacts: number): number => {
    if (avgContacts <= 0) return 0;
    
    const orgData = allOrganizations.find(o => o.name === orgName);
    if (!orgData) return 0;
    
    const contactsCount = Math.round(avgContacts);
    const rate = orgData.contact_rate;
    
    const revenue = contactsCount * rate;
    const tax = orgData.payment_type === 'cashless' ? Math.round(revenue * 0.07) : 0;
    const afterTax = revenue - tax;
    
    const workerSalary = contactsCount >= 10 ? contactsCount * 300 : contactsCount * 200;
    const netProfit = afterTax - workerSalary;
    
    return Math.round(netProfit / 2);
  };

  const calculateRecommendations = (stats: Record<string, Array<{organization_name: string, avg_per_shift: number, shift_count?: number}>>) => {
    const recommendations: Record<string, Record<string, string[]>> = {};
    
    console.log('🔍 workComments (ВСЕ данные для проверки organization):', workComments);
    
    // Инициализация структуры рекомендаций
    schedules.forEach(user => {
      const userName = `${user.first_name} ${user.last_name}`;
      recommendations[userName] = {};
    });
    
    // Проходим по дням и рассчитываем рекомендации
    weekDays.forEach(day => {
      // Для каждого промоутера рассчитываем рекомендации
      schedules.forEach(user => {
        const userName = `${user.first_name} ${user.last_name}`;
        const daySchedule = user.schedule[day.date];
        
        if (userName === 'Евгений Сурков' && day.date === '2025-12-12') {
          console.log(`🔍 [${userName}] Проверка на ${day.date}:`);
          console.log(`  - daySchedule:`, daySchedule);
        }
        
        if (!daySchedule) {
          if (userName === 'Евгений Сурков' && day.date === '2025-12-12') {
            console.log(`  ❌ ПРОПУЩЕН: нет daySchedule`);
          }
          return;
        }
        
        const hasAnySlot = Object.keys(daySchedule).some(slotTime => daySchedule[slotTime] === true);
        
        if (userName === 'Евгений Сурков' && day.date === '2025-12-12') {
          console.log(`  - hasAnySlot:`, hasAnySlot);
        }
        
        if (!hasAnySlot) {
          if (userName === 'Евгений Сурков' && day.date === '2025-12-12') {
            console.log(`  ❌ ПРОПУЩЕН: нет активных слотов`);
          }
          return;
        }
        
        if (userName === 'Евгений Сурков' && day.date === '2025-12-12') {
          console.log(`  ✅ ПРОХОДИТ ВСЕ ПРОВЕРКИ - начинаем расчёт рекомендации`);
        }
        
        // Получаем статистику промоутера
        const userStats = stats[userName] || [];
        
        // Теперь всегда используем ВСЕ организации (без фильтрации)
        // Сортируем по предполагаемому доходу (DESC), потом по shift_count (DESC)
        userStats.sort((a, b) => {
          const incomeA = calculateKMS(a.organization_name, a.avg_per_shift);
          const incomeB = calculateKMS(b.organization_name, b.avg_per_shift);
          
          if (incomeB !== incomeA) {
            return incomeB - incomeA;
          }
          return (b.shift_count || 0) - (a.shift_count || 0);
        });
        
        // Выбираем ТОП-3 организации по доходу (без ограничений на использование)
        const top3Orgs = userStats.slice(0, 3).map(stat => stat.organization_name);
        
        recommendations[userName][day.date] = top3Orgs;
      });
    });
    
    console.log('🎯 Рекомендации (топ-3 для каждого):', recommendations);
    setRecommendedLocations(recommendations);
  };

  const loadWorkComments = async () => {
    const comments: WorkComments = {};
    
    for (const day of weekDays) {
      try {
        const response = await fetch(
          `https://functions.poehali.dev/1b7f0423-384e-417f-8aea-767e5a1c32b2?work_date=${day.date}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.comments) {
            // Бэкенд возвращает: { userName: { shiftTime: {...data} } }
            // или для старых записей без смены: { userName: {...data} }
            comments[day.date] = data.comments;
          }
        }
      } catch (error) {
        console.error('Error loading work comments:', error);
      }
    }
    
    setWorkComments(comments);
  };

  // shiftTime — время смены, напр. "12:00-16:00". Если не передано — обратная совместимость
  const saveComment = async (userName: string, date: string, field: string, value: string, shiftTime?: string) => {
    const key = `${userName}-${date}-${shiftTime || ''}`;
    console.log(`💾 Сохранение данных: ${userName} | ${date} | смена: ${shiftTime} | ${field}: "${value}"`);
    setSavingComment(key);
    
    // Получаем текущие данные для конкретной смены
    const userComments = workComments[date]?.[userName] || {};
    const currentData: ShiftData = shiftTime
      ? ((userComments as Record<string, ShiftData>)[shiftTime] || {})
      : (userComments as ShiftData);

    const updatedData = {
      location_comment: currentData.location || '',
      flyers_comment: field === 'flyers' ? value : (currentData.flyers || ''),
      organization: field === 'organization' ? value : (currentData.organization || ''),
      location_type: field === 'location_type' ? value : (currentData.location_type || ''),
      location_details: field === 'location_details' ? value : (currentData.location_details || '')
    };
    
    try {
      const response = await fetch(
        'https://functions.poehali.dev/1b7f0423-384e-417f-8aea-767e5a1c32b2',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_name: userName,
            work_date: date,
            shift_time: shiftTime || null,
            ...updatedData
          })
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Данные сохранены:`, result);
        const newShiftData: ShiftData = {
          location: updatedData.location_comment,
          flyers: updatedData.flyers_comment,
          organization: updatedData.organization,
          location_type: updatedData.location_type,
          location_details: updatedData.location_details
        };
        setWorkComments(prev => {
          const prevUser = prev[date]?.[userName] || {};
          const updatedUser = shiftTime
            ? { ...prevUser, [shiftTime]: newShiftData }
            : { ...prevUser, ...newShiftData };
          return {
            ...prev,
            [date]: {
              ...prev[date],
              [userName]: updatedUser
            }
          };
        });
      } else {
        console.error(`❌ Ошибка сохранения: ${response.status}`, await response.text());
      }
    } catch (error) {
      console.error('❌ Ошибка сохранения данных:', error);
    } finally {
      setSavingComment(null);
    }
  };

  const updateComment = (userName: string, date: string, field: string, value: string, shiftTime?: string) => {
    setWorkComments(prev => {
      const prevUser = prev[date]?.[userName] || {};
      if (shiftTime) {
        const prevShift = (prevUser as Record<string, ShiftData>)[shiftTime] || {};
        return {
          ...prev,
          [date]: {
            ...prev[date],
            [userName]: {
              ...prevUser,
              [shiftTime]: { ...prevShift, [field]: value }
            }
          }
        };
      }
      return {
        ...prev,
        [date]: {
          ...prev[date],
          [userName]: { ...prevUser, [field]: value }
        }
      };
    });
  };

  useEffect(() => {
    const loadData = async () => {
      await loadAllLocations();
      await loadWorkComments();
      await loadUserOrgStats();
      await loadActualStats();
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekDays, schedules]);

  useEffect(() => {
    if (Object.keys(userOrgStats).length > 0) {
      calculateRecommendations(userOrgStats);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgLimits, userOrgStats, weekDays, schedules, workComments]);

  return {
    workComments,
    savingComment,
    allLocations,
    allOrganizations,
    userOrgStats,
    loadingProgress,
    recommendedLocations,
    actualStats,
    saveComment,
    updateComment,
    reloadWorkComments: loadWorkComments
  };
}