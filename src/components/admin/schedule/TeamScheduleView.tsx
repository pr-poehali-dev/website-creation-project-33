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
  const [selectedOrgs, setSelectedOrgs] = useState<Set<string>>(new Set());
  const [isSavingFilters, setIsSavingFilters] = useState(false);
  const [filtersLoaded, setFiltersLoaded] = useState(false);

  const {
    workComments,
    savingComment,
    allLocations,
    userOrgStats,
    recommendedLocations,
    saveComment,
    updateComment
  } = useScheduleData(weekDays, schedules, selectedOrgs);

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
          
          let orgsToSelect: string[] = [];
          
          if (data.organizations) {
            if (typeof data.organizations === 'string') {
              orgsToSelect = JSON.parse(data.organizations);
            } else if (Array.isArray(data.organizations)) {
              orgsToSelect = data.organizations;
            }
          }
          
          if (orgsToSelect.length > 0) {
            console.log(`✅ Загружено ${orgsToSelect.length} организаций из БД`);
            setSelectedOrgs(new Set(orgsToSelect));
          } else {
            console.log('ℹ️ Нет сохранённых фильтров, выбираем все организации');
            const allOrgs = new Set<string>();
            Object.values(userOrgStats).forEach(stats => {
              stats.forEach(stat => allOrgs.add(stat.organization_name));
            });
            setSelectedOrgs(allOrgs);
          }
        }
      } catch (error) {
        console.error('❌ Ошибка загрузки фильтров:', error);
        const allOrgs = new Set<string>();
        Object.values(userOrgStats).forEach(stats => {
          stats.forEach(stat => allOrgs.add(stat.organization_name));
        });
        setSelectedOrgs(allOrgs);
      }
      setFiltersLoaded(true);
    };
    
    loadFilters();
  }, [userOrgStats, weekStart, filtersLoaded]);

  const handleOrgToggle = (org: string) => {
    setSelectedOrgs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(org)) {
        newSet.delete(org);
      } else {
        newSet.add(org);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const allOrgs = new Set<string>();
    Object.values(userOrgStats).forEach(stats => {
      stats.forEach(stat => allOrgs.add(stat.organization_name));
    });
    setSelectedOrgs(allOrgs);
  };

  const handleClearAll = () => {
    setSelectedOrgs(new Set());
  };

  const handleSaveFilters = async () => {
    setIsSavingFilters(true);
    try {
      const response = await fetch(
        'https://functions.poehali.dev/c2ddb9ba-a3c4-442a-a859-fc8cd5043101',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            week_start: weekStart,
            organizations: Array.from(selectedOrgs)
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

  const handleCommentBlur = (userName: string, date: string, comment: string) => {
    saveComment(userName, date, comment);
  };

  const handleAddSlotClick = (date: string, slotTime: string, slotLabel: string) => {
    setShowAddModal({date, slotTime, slotLabel});
  };

  const daysWithWorkers = weekDays.filter(day => 
    day.slots.some(slot => getUsersWorkingOnSlot(day.date, slot.time).length > 0)
  );

  return (
    <div className="space-y-4">
      <WeekCalendar weekDays={weekDays} />

      <OrganizationFilter
        userOrgStats={userOrgStats}
        selectedOrgs={selectedOrgs}
        weekStart={weekStart}
        onOrgToggle={handleOrgToggle}
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
            userOrgStats={userOrgStats}
            recommendedLocations={recommendedLocations}
            onToggleDay={toggleDay}
            onCommentChange={updateComment}
            onCommentBlur={handleCommentBlur}
            onRemoveSlot={confirmRemoveSlot}
            onAddSlot={handleAddSlotClick}
            deletingSlot={deletingSlot}
          />
        );
      })}

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