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
      for (const user of schedules) {
        const userName = `${user.first_name} ${user.last_name}`;
        const userEmail = user.email;
        
        if (!userEmail) {
          console.log(`⚠️ Email не найден для: ${userName}`);
          continue;
        }
        
        console.log(`📧 Загружаем статистику для ${userName} (${userEmail})`);
        
        
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
    
    console.log('🔍 workComments (ВСЕ данные для проверки organization):', workComments);
    
    // Инициализация структуры рекомендаций
    schedules.forEach(user => {
      const userName = `${user.first_name} ${user.last_name}`;
      recommendations[userName] = {};
    });
    
    // Счётчик ОБЩЕГО использования организаций по всем промоутерам (накапливается по дням)
    const totalOrgUsageThisWeek: Record<string, number> = {};
    
    // Очищаем временные переменные для текущего дня
    (window as any).tempCurrentDayOrgs = null;
    (window as any).tempCurrentDayOrgsAdded = false;
    
    // Проходим по дням ПОСЛЕДОВАТЕЛЬНО
    weekDays.forEach(day => {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const isCurrentDay = day.date === today;
      const isFutureDay = day.date > today;
      const isPastDay = day.date < today; // Новая переменная: день УЖЕ ПРОШЁЛ
      
      console.log(`📅 Обрабатываем день: ${day.date} (${day.dayName}) | Сегодня: ${today} | Прошлый: ${isPastDay} | Текущий: ${isCurrentDay} | Будущий: ${isFutureDay}`);
      
      // Сначала собираем все выбранные организации на этот день
      const orgsUsedToday = new Set<string>();
      
      schedules.forEach(user => {
        const userName = `${user.first_name} ${user.last_name}`;
        const daySchedule = user.schedule[day.date];
        
        if (!daySchedule) return;
        
        const hasAnySlot = Object.keys(daySchedule).some(slotTime => daySchedule[slotTime] === true);
        if (!hasAnySlot) return;
        
        const currentOrg = workComments[day.date]?.[userName]?.organization;
        
        if (currentOrg) {
          // Организация уже выбрана — учитываем в счётчике, но НЕ добавляем в рекомендации
          // Рекомендация != Выбранная организация!
          orgsUsedToday.add(currentOrg);
          
          if (currentOrg === 'ТОП (Ногинск)') {
            console.log(`🔴 ТОП (Ногинск) найден! День: ${day.date}, Промоутер: ${userName}`);
          }
          
          if (currentOrg.includes('KIBERONE')) {
            console.log(`🟣 KIBERONE найден! День: ${day.date}, Промоутер: ${userName}, Организация: ${currentOrg}`);
          }
        }
      });
      
      // Обновляем общий счётчик использования организаций
      // Логика:
      // - Для ТЕКУЩЕГО дня: учитываем только ПРОШЛЫЕ дни (НЕ текущий!)
      //   Это позволяет рекомендовать одну организацию ВСЕМ промоутерам сегодня
      // - Для БУДУЩИХ дней: учитываем ПРОШЛЫЕ + ТЕКУЩИЙ день
      //   Уже сделанные выборы в текущем дне должны влиять на будущие рекомендации
      
      if (isPastDay) {
        // Прошлый день - всегда учитываем
        console.log(`   ✅ Учитываем использование за ${day.date} (прошлый день):`, Array.from(orgsUsedToday));
        orgsUsedToday.forEach(org => {
          totalOrgUsageThisWeek[org] = (totalOrgUsageThisWeek[org] || 0) + 1;
        });
      } else if (isCurrentDay) {
        // Текущий день - НЕ учитываем при расчёте рекомендаций для текущего дня
        // Но СОХРАНЯЕМ для использования при расчёте будущих дней
        console.log(`   ⏸️ Текущий день ${day.date} - сохраняем для будущих дней:`, Array.from(orgsUsedToday));
        // Сохраняем выборы текущего дня во временную переменную
        orgsUsedToday.forEach(org => {
          if (!(window as any).tempCurrentDayOrgs) (window as any).tempCurrentDayOrgs = {};
          (window as any).tempCurrentDayOrgs[org] = ((window as any).tempCurrentDayOrgs[org] || 0) + 1;
        });
      } else if (isFutureDay) {
        // Будущий день - добавляем выборы текущего дня в счётчик (один раз)
        if ((window as any).tempCurrentDayOrgs && !(window as any).tempCurrentDayOrgsAdded) {
          console.log(`   ➕ Добавляем текущий день в счётчик для будущих:`, (window as any).tempCurrentDayOrgs);
          Object.entries((window as any).tempCurrentDayOrgs as Record<string, number>).forEach(([org, count]) => {
            totalOrgUsageThisWeek[org] = (totalOrgUsageThisWeek[org] || 0) + count;
          });
          (window as any).tempCurrentDayOrgsAdded = true;
        }
        console.log(`   ⏭️ Будущий день ${day.date}`);
      }
      
      // Теперь для промоутеров рассчитываем рекомендацию
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
        let userStats = stats[userName] || [];
        
        // Фильтрация и дополнение по orgLimits (если заданы)
        if (orgLimits && orgLimits.size > 0) {
          // Сначала фильтруем существующую статистику
          userStats = userStats.filter(stat => orgLimits.has(stat.organization_name));
          
          // Добавляем организации из orgLimits, в которых промоутера не было
          const existingOrgNames = new Set(userStats.map(s => s.organization_name));
          orgLimits.forEach((_, orgName) => {
            if (!existingOrgNames.has(orgName)) {
              userStats.push({
                organization_name: orgName,
                avg_per_shift: 0, // Не было смен
                shift_count: 0
              });
            }
          });
          
          // Пересортируем: сначала по avg_per_shift (DESC), потом по shift_count (DESC)
          userStats.sort((a, b) => {
            if (b.avg_per_shift !== a.avg_per_shift) {
              return b.avg_per_shift - a.avg_per_shift;
            }
            return b.shift_count - a.shift_count;
          });
        }
        
        if (userName === 'Евгений Сурков' && day.date === '2025-12-12') {
          console.log(`
🔍🔍🔍 ДЕТАЛЬНЫЙ ЛОГ ДЛЯ СУРКОВА 12.12 🔍🔍🔍`);
          console.log(`1️⃣ ПОЛНАЯ статистика (${stats[userName]?.length || 0} орг) - ОТСОРТИРОВАНА:`);
          stats[userName]?.forEach((s, i) => console.log(`   ${i+1}. ${s.organization_name}: ${s.avg_per_shift}`));
          
          console.log(`2️⃣ После фильтрации (${userStats.length} орг):`);
          userStats.forEach((s, i) => console.log(`   ${i+1}. ${s.organization_name}: ${s.avg_per_shift}`));
          
          console.log(`3️⃣ Использовано на неделе:`, totalOrgUsageThisWeek);
          console.log(`4️⃣ orgLimits:`, orgLimits ? Object.fromEntries(orgLimits) : 'НЕТ');
        }
        
        // Ищем лучшую организацию, которая НЕ была использована на предыдущих днях
        let recommendedOrg = '';
        
        for (const orgStat of userStats) {
          const orgName = orgStat.organization_name;
          const maxUses = orgLimits?.get(orgName) || 1;
          const totalOrgUses = totalOrgUsageThisWeek[orgName] || 0;
          
          // Проверяем: организация не превысила лимит использования на неделе
          // ВАЖНО: НЕ увеличиваем счётчик здесь! Рекомендация != Использование
          // Счётчик увеличивается только когда администратор РЕАЛЬНО выбирает организацию
          if (totalOrgUses < maxUses) {
            recommendedOrg = orgName;
            break;
          }
        }
        
        recommendations[userName][day.date] = recommendedOrg;
        
        if (userName === 'Евгений Сурков' && day.date === '2025-12-12') {
          console.log(`✅ ВЫБРАНО ДЛЯ СУРКОВА: "${recommendedOrg}"`);
        }
      });
    });
    
    console.log('📊 Общее использование организаций на неделе:', totalOrgUsageThisWeek);
    console.log('🎯 Рекомендации:', recommendations);
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