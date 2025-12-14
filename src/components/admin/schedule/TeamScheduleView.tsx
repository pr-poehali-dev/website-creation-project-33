import { useState, useEffect } from 'react';
import { DaySchedule, UserSchedule, DeleteSlotState, DayStats } from './types';
import { useScheduleData } from './useScheduleData';
import WeekCalendar from './WeekCalendar';
import DayCard from './DayCard';
import AddPromoterModal from './AddPromoterModal';
import OrganizationFilter from './OrganizationFilter';

interface TeamScheduleViewProps {
  weekDays: DaySchedule[];
  schedules: UserSchedule[];
  getUsersWorkingOnSlot: (date: string, slotTime: string) => UserSchedule[];
  confirmRemoveSlot: (userId: number, userName: string, date: string, slotTime: string, slotLabel: string) => void;
  deletingSlot: DeleteSlotState | null;
  dayStats: DayStats[];
  addSlot: (userId: number, date: string, slotTime: string) => Promise<void>;
  addingSlot: DeleteSlotState | null;
}

export default function TeamScheduleView({
  weekDays,
  schedules,
  getUsersWorkingOnSlot,
  confirmRemoveSlot,
  deletingSlot,
  dayStats,
  addSlot,
  addingSlot
}: TeamScheduleViewProps) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState<{date: string, slotTime: string, slotLabel: string} | null>(null);
  const [orgLimits, setOrgLimits] = useState<Map<string, number>>(new Map());
  const [isSavingFilters, setIsSavingFilters] = useState(false);
  const [filtersLoaded, setFiltersLoaded] = useState(false);

  const {
    workComments,
    savingComment,
    allLocations,
    allOrganizations,
    userOrgStats,
    recommendedLocations,
    actualStats,
    loadingProgress,
    saveComment,
    updateComment
  } = useScheduleData(weekDays, schedules, orgLimits);

  const weekStart = weekDays.length > 0 ? weekDays[0].date : '';

  useEffect(() => {
    if (Object.keys(userOrgStats).length === 0 || filtersLoaded || !weekStart) return;
    
    const loadFilters = async () => {
      console.log(`📥 Загрузка фильтров для недели: ${weekStart}`);
      try {
        const response = await fetch(
          `https://functions.poehali.dev/c2ddb9ba-a3c4-442a-a859-fc8cd5043101?week_start=${weekStart}`
        );
        
        if (response.ok) {
          const data = await response.json();
          console.log('📦 Данные фильтров из БД:', data);
          
          let limitsData: Array<{name: string, maxUses: number}> = [];
          
          if (data.organizations) {
            if (typeof data.organizations === 'string') {
              limitsData = JSON.parse(data.organizations);
            } else if (Array.isArray(data.organizations)) {
              limitsData = data.organizations;
            }
          }
          
          if (limitsData.length > 0 && typeof limitsData[0] === 'object' && 'name' in limitsData[0]) {
            console.log(`✅ Загружено ${limitsData.length} организаций с лимитами из БД`);
            const newLimits = new Map<string, number>();
            limitsData.forEach(item => {
              newLimits.set(item.name, item.maxUses);
            });
            setOrgLimits(newLimits);
          } else if (limitsData.length > 0 && typeof limitsData[0] === 'string') {
            console.log('🔄 Миграция старого формата данных');
            const newLimits = new Map<string, number>();
            limitsData.forEach((orgName: any) => {
              newLimits.set(orgName, 1);
            });
            setOrgLimits(newLimits);
          } else {
            console.log('ℹ️ Нет сохранённых фильтров, выбираем все организации');
            const newLimits = new Map<string, number>();
            Object.values(userOrgStats).forEach(stats => {
              stats.forEach(stat => newLimits.set(stat.organization_name, 1));
            });
            setOrgLimits(newLimits);
          }
        }
      } catch (error) {
        console.error('❌ Ошибка загрузки фильтров:', error);
        const newLimits = new Map<string, number>();
        Object.values(userOrgStats).forEach(stats => {
          stats.forEach(stat => newLimits.set(stat.organization_name, 1));
        });
        setOrgLimits(newLimits);
      }
      setFiltersLoaded(true);
    };
    
    loadFilters();
  }, [userOrgStats, weekStart, filtersLoaded]);

  const handleOrgToggle = (org: string) => {
    setOrgLimits(prev => {
      const newLimits = new Map(prev);
      if (newLimits.has(org)) {
        newLimits.delete(org);
      } else {
        newLimits.set(org, 1);
      }
      return newLimits;
    });
  };

  const handleOrgLimitChange = (org: string, limit: number) => {
    setOrgLimits(prev => {
      const newLimits = new Map(prev);
      newLimits.set(org, limit);
      return newLimits;
    });
  };

  const handleSelectAll = () => {
    const newLimits = new Map<string, number>();
    Object.values(userOrgStats).forEach(stats => {
      stats.forEach(stat => newLimits.set(stat.organization_name, 1));
    });
    setOrgLimits(newLimits);
  };

  const handleClearAll = () => {
    setOrgLimits(new Map());
  };

  const handleSaveFilters = async () => {
    setIsSavingFilters(true);
    try {
      const limitsArray = Array.from(orgLimits.entries()).map(([name, maxUses]) => ({
        name,
        maxUses
      }));
      
      const response = await fetch(
        'https://functions.poehali.dev/c2ddb9ba-a3c4-442a-a859-fc8cd5043101',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            week_start: weekStart,
            organizations: limitsArray
          })
        }
      );
      
      if (response.ok) {
        console.log('✅ Фильтры организаций сохранены');
      } else {
        console.error('❌ Ошибка сохранения фильтров:', await response.text());
      }
    } catch (error) {
      console.error('❌ Ошибка сохранения фильтров:', error);
    } finally {
      setIsSavingFilters(false);
    }
  };

  const toggleDay = (date: string) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  const handleCommentBlur = (userName: string, date: string, field: 'location' | 'flyers', value: string) => {
    saveComment(userName, date, field, value);
  };

  const handleAddSlotClick = (date: string, slotTime: string, slotLabel: string) => {
    setShowAddModal({date, slotTime, slotLabel});
  };

  const daysWithWorkers = weekDays.filter(day => 
    day.slots.some(slot => getUsersWorkingOnSlot(day.date, slot.time).length > 0)
  );

  const weekTotals = dayStats.reduce(
    (acc, stat) => ({
      expected: acc.expected + stat.expected,
      actual: acc.actual + stat.actual
    }),
    { expected: 0, actual: 0 }
  );

  return (
    <div className="space-y-4">
      <WeekCalendar weekDays={weekDays} />

      {loadingProgress > 0 && loadingProgress < 100 && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-slate-300">Загрузка статистики...</span>
                <span className="text-sm font-bold text-cyan-400">{loadingProgress}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <OrganizationFilter
        userOrgStats={userOrgStats}
        orgLimits={orgLimits}
        weekStart={weekStart}
        onOrgToggle={handleOrgToggle}
        onOrgLimitChange={handleOrgLimitChange}
        onSelectAll={handleSelectAll}
        onClearAll={handleClearAll}
        onSave={handleSaveFilters}
        isSaving={isSavingFilters}
      />

      {daysWithWorkers.map((day) => {
        const isExpanded = expandedDays.has(day.date);
        const stats = dayStats.find(s => s.date === day.date);

        return (
          <DayCard
            key={day.date}
            day={day}
            isExpanded={isExpanded}
            stats={stats}
            getUsersWorkingOnSlot={getUsersWorkingOnSlot}
            workComments={workComments}
            savingComment={savingComment}
            allLocations={allLocations}
            allOrganizations={allOrganizations}
            userOrgStats={userOrgStats}
            recommendedLocations={recommendedLocations}
            actualStats={actualStats}
            loadingProgress={loadingProgress}
            onToggleDay={toggleDay}
            onCommentChange={updateComment}
            onCommentBlur={handleCommentBlur}
            onRemoveSlot={confirmRemoveSlot}
            onAddSlot={handleAddSlotClick}
            deletingSlot={deletingSlot}
          />
        );
      })}

      <div className="flex justify-end gap-6 py-4">
        <div className="text-right">
          <div className="text-sm text-slate-400">План</div>
          <div className="text-2xl font-bold text-cyan-400">{weekTotals.expected}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-400">Факт</div>
          <div className="text-2xl font-bold text-emerald-400">{weekTotals.actual}</div>
        </div>
      </div>

      {showAddModal && (
        <AddPromoterModal
          date={showAddModal.date}
          slotTime={showAddModal.slotTime}
          slotLabel={showAddModal.slotLabel}
          schedules={schedules}
          addingSlot={addingSlot}
          onAddSlot={addSlot}
          onClose={() => setShowAddModal(null)}
        />
      )}
    </div>
  );
}