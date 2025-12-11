import { useState, useEffect } from 'react';
import { DaySchedule, UserSchedule, OrganizationData } from './types';

export function useScheduleData(weekDays: DaySchedule[], schedules: UserSchedule[], orgLimits?: Map<string, number>) {
  const [workComments, setWorkComments] = useState<Record<string, Record<string, {
    location?: string;
    flyers?: string;
    organization?: string;
    location_type?: string;
    location_details?: string;
  }>>>({});
  const [savingComment, setSavingComment] = useState<string | null>(null);
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [allOrganizations, setAllOrganizations] = useState<OrganizationData[]>([]);
  const [userOrgStats, setUserOrgStats] = useState<Record<string, Array<{organization_name: string, avg_per_shift: number}>>>({});
  const [recommendedLocations, setRecommendedLocations] = useState<Record<string, Record<string, string>>>({});

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
          const orgsData: OrganizationData[] = data.organizations.map((org: any) => ({
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
    
    const stats: Record<string, Array<{organization_name: string, avg_per_shift: number}>> = {};
    
    try {
      const usersResponse = await fetch(
        'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214?action=users',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': localStorage.getItem('session_token') || '',
          }
        }
      );
      
      if (!usersResponse.ok) {
        console.log('❌ Ошибка загрузки пользователей:', usersResponse.status);
        return;
      }
      
      const usersData = await usersResponse.json();
      console.log('📦 Данные пользователей из API:', usersData);
      
      const allUsers = [...(usersData.active_users || []), ...(usersData.inactive_users || [])];
      console.log('📋 Все пользователи (активные + неактивные):', allUsers.length);
      
      const userEmailMap = new Map(
        allUsers.map((u: any) => [`${u.name}`, u.email])
      );
      
      console.log('📧 Маппинг имён и email:', Object.fromEntries(userEmailMap));
      
      for (const user of schedules) {
        const userName = `${user.first_name} ${user.last_name}`;
        const userEmail = userEmailMap.get(userName);
        
        if (!userEmail) {
          console.log(`⚠️ Email не найден для: ${userName}`);
          continue;
        }
        
        try {
          const response = await fetch(
            'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Session-Token': localStorage.getItem('session_token') || '',
              },
              body: JSON.stringify({
                action: 'get_user_org_stats',
                email: userEmail
              })
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.org_stats && data.org_stats.length > 0) {
              stats[userName] = data.org_stats.sort((a: any, b: any) => b.avg_per_shift - a.avg_per_shift);
            }
          }
        } catch (error) {
          console.error(`Error loading org stats for ${userName}:`, error);
        }
      }
      
      console.log('📊 Загружена статистика по организациям:', stats);
      setUserOrgStats(stats);
      calculateRecommendations(stats);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const calculateRecommendations = (stats: Record<string, Array<{organization_name: string, avg_per_shift: number}>>) => {
    const recommendations: Record<string, Record<string, string>> = {};
    
    // Инициализация структуры рекомендаций
    schedules.forEach(user => {
      const userName = `${user.first_name} ${user.last_name}`;
      recommendations[userName] = {};
    });
    
    // Счётчик использования организаций (накапливается по мере прохода по дням)
    const userOrgUsageThisWeek: Record<string, Record<string, number>> = {};
    
    // Проходим по дням ПОСЛЕДОВАТЕЛЬНО (важно для учёта предыдущих дней)
    weekDays.forEach(day => {
      schedules.forEach(user => {
        const userName = `${user.first_name} ${user.last_name}`;
        let userStats = stats[userName] || [];
        
        // Фильтрация по orgLimits (если заданы)
        if (orgLimits && orgLimits.size > 0) {
          userStats = userStats.filter(stat => orgLimits.has(stat.organization_name));
        }
        
        const daySchedule = user.schedule[day.date];
        if (!daySchedule) return;
        
        const hasAnySlot = Object.keys(daySchedule).some(slotTime => daySchedule[slotTime] === true);
        if (!hasAnySlot) return;
        
        // Проверяем, выбрана ли уже организация администратором
        const currentOrg = workComments[day.date]?.[userName]?.organization;
        
        if (currentOrg) {
          // Организация выбрана — сохраняем как рекомендацию и учитываем в счётчике
          recommendations[userName][day.date] = currentOrg;
          
          if (!userOrgUsageThisWeek[userName]) {
            userOrgUsageThisWeek[userName] = {};
          }
          userOrgUsageThisWeek[userName][currentOrg] = (userOrgUsageThisWeek[userName][currentOrg] || 0) + 1;
        } else {
          // Организация НЕ выбрана — рассчитываем рекомендацию на основе предыдущих дней
          let recommendedOrg = '';
          
          for (const orgStat of userStats) {
            const orgName = orgStat.organization_name;
            const maxUses = orgLimits?.get(orgName) || 1;
            const userOrgUses = userOrgUsageThisWeek[userName]?.[orgName] || 0;
            
            if (userOrgUses < maxUses) {
              recommendedOrg = orgName;
              // Временно помечаем как "использованную" для следующих дней
              if (!userOrgUsageThisWeek[userName]) {
                userOrgUsageThisWeek[userName] = {};
              }
              userOrgUsageThisWeek[userName][orgName] = userOrgUses + 1;
              break;
            }
          }
          
          recommendations[userName][day.date] = recommendedOrg;
        }
      });
    });
    
    console.log('🎯 Рекомендации на основе последовательного анализа дней:', recommendations);
    setRecommendedLocations(recommendations);
  };

  const loadWorkComments = async () => {
    const comments: Record<string, Record<string, string>> = {};
    
    for (const day of weekDays) {
      try {
        const response = await fetch(
          `https://functions.poehali.dev/1b7f0423-384e-417f-8aea-767e5a1c32b2?work_date=${day.date}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.comments) {
            comments[day.date] = data.comments;
          }
        }
      } catch (error) {
        console.error('Error loading work comments:', error);
      }
    }
    
    setWorkComments(comments);
  };

  const saveComment = async (userName: string, date: string, field: string, value: string) => {
    const key = `${userName}-${date}`;
    console.log(`💾 Сохранение данных: ${userName} | ${date} | ${field}: "${value}"`);
    setSavingComment(key);
    
    const currentData = workComments[date]?.[userName] || {};
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
            ...updatedData
          })
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Данные сохранены:`, result);
        setWorkComments(prev => ({
          ...prev,
          [date]: {
            ...prev[date],
            [userName]: {
              location: updatedData.location_comment,
              flyers: updatedData.flyers_comment,
              organization: updatedData.organization,
              location_type: updatedData.location_type,
              location_details: updatedData.location_details
            }
          }
        }));
      } else {
        console.error(`❌ Ошибка сохранения: ${response.status}`, await response.text());
      }
    } catch (error) {
      console.error('❌ Ошибка сохранения данных:', error);
    } finally {
      setSavingComment(null);
    }
  };

  const updateComment = (userName: string, date: string, field: string, value: string) => {
    setWorkComments(prev => {
      const currentData = prev[date]?.[userName] || {};
      return {
        ...prev,
        [date]: {
          ...prev[date],
          [userName]: {
            ...currentData,
            [field]: value
          }
        }
      };
    });
  };

  useEffect(() => {
    const loadData = async () => {
      await loadAllLocations();
      await loadWorkComments();
      await loadUserOrgStats();
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
    recommendedLocations,
    saveComment,
    updateComment
  };
}