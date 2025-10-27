import { useState, useEffect } from 'react';
import { DaySchedule, UserSchedule } from './types';

export function useScheduleData(weekDays: DaySchedule[], schedules: UserSchedule[]) {
  const [workComments, setWorkComments] = useState<Record<string, Record<string, string>>>({});
  const [savingComment, setSavingComment] = useState<string | null>(null);
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [userOrgStats, setUserOrgStats] = useState<Record<string, Array<{organization_name: string, avg_per_shift: number}>>>({});
  const [recommendedLocations, setRecommendedLocations] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    loadWorkComments();
    loadAllLocations();
    loadUserOrgStats();
  }, [weekDays, schedules]);

  const loadAllLocations = async () => {
    try {
      const response = await fetch(
        'https://functions.poehali.dev/1b7f0423-384e-417f-8aea-767e5a1c32b2?get_locations=true'
      );
      
      if (response.ok) {
        const data = await response.json();
        setAllLocations(data.locations || []);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const loadUserOrgStats = async () => {
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
      
      if (!usersResponse.ok) return;
      
      const usersData = await usersResponse.json();
      const userEmailMap = new Map(
        usersData.users?.map((u: any) => [`${u.name}`, u.email]) || []
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
      
      setUserOrgStats(stats);
      calculateRecommendations(stats);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const calculateRecommendations = (stats: Record<string, Array<{organization_name: string, avg_per_shift: number}>>) => {
    const usedOrgsByUser: Record<string, Set<string>> = {};
    const usedOrgsThisWeek: Set<string> = new Set();
    const recommendations: Record<string, Record<string, string>> = {};
    
    schedules.forEach(user => {
      const userName = `${user.first_name} ${user.last_name}`;
      usedOrgsByUser[userName] = new Set();
      recommendations[userName] = {};
    });
    
    weekDays.forEach(day => {
      schedules.forEach(user => {
        const userName = `${user.first_name} ${user.last_name}`;
        const userStats = stats[userName] || [];
        
        const daySchedule = user.schedule[day.date];
        if (!daySchedule) {
          return;
        }
        
        const hasAnySlot = Object.keys(daySchedule).some(slotTime => daySchedule[slotTime] === true);
        if (!hasAnySlot) {
          return;
        }
        
        if (userStats.length === 0) {
          console.log(`⚠️ Нет статистики для ${userName}`);
        }
        
        let recommendedOrg = '';
        for (const orgStat of userStats) {
          const orgName = orgStat.organization_name;
          if (!usedOrgsByUser[userName].has(orgName) && !usedOrgsThisWeek.has(orgName)) {
            recommendedOrg = orgName;
            usedOrgsByUser[userName].add(orgName);
            usedOrgsThisWeek.add(orgName);
            break;
          }
        }
        
        if (!recommendedOrg && userStats.length > 0) {
          console.log(`⚠️ Все организации для ${userName} уже использованы. Доступно: ${userStats.length}, Использовано на неделе: ${usedOrgsThisWeek.size}`);
        }
        
        recommendations[userName][day.date] = recommendedOrg;
      });
    });
    
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

  const saveComment = async (userName: string, date: string, comment: string) => {
    const key = `${userName}-${date}`;
    console.log(`💾 Сохранение места работы: ${userName} | ${date} | "${comment}"`);
    setSavingComment(key);
    try {
      const response = await fetch(
        'https://functions.poehali.dev/1b7f0423-384e-417f-8aea-767e5a1c32b2',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_name: userName,
            work_date: date,
            location_comment: comment
          })
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Место работы сохранено:`, result);
        setWorkComments(prev => ({
          ...prev,
          [date]: {
            ...prev[date],
            [userName]: comment
          }
        }));
      } else {
        console.error(`❌ Ошибка сохранения: ${response.status}`, await response.text());
      }
    } catch (error) {
      console.error('❌ Ошибка сохранения места работы:', error);
    } finally {
      setSavingComment(null);
    }
  };

  const updateComment = (userName: string, date: string, comment: string) => {
    setWorkComments(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        [userName]: comment
      }
    }));
  };

  return {
    workComments,
    savingComment,
    allLocations,
    userOrgStats,
    recommendedLocations,
    saveComment,
    updateComment
  };
}