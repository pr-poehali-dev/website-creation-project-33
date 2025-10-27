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

  const {
    workComments,
    savingComment,
    allLocations,
    userOrgStats,
    recommendedLocations,
    saveComment,
    updateComment
  } = useScheduleData(weekDays, schedules, selectedOrgs);

  useEffect(() => {
    const allOrgs = new Set<string>();
    Object.values(userOrgStats).forEach(stats => {
      stats.forEach(stat => allOrgs.add(stat.organization_name));
    });
    setSelectedOrgs(allOrgs);
  }, [userOrgStats]);

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
        onOrgToggle={handleOrgToggle}
        onSelectAll={handleSelectAll}
        onClearAll={handleClearAll}
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