import { useState } from 'react';
import { DaySchedule, UserSchedule, DeleteSlotState, DayStats } from './types';
import { useScheduleData } from './useScheduleData';
import WeekCalendar from './WeekCalendar';
import DayCard from './DayCard';
import AddPromoterModal from './AddPromoterModal';

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

  const {
    workComments,
    savingComment,
    allLocations,
    userOrgStats,
    recommendedOrgs,
    saveComment,
    updateComment
  } = useScheduleData(weekDays, schedules);

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
    const currentComment = workComments[date]?.[userName] || '';
    if (comment !== currentComment) {
      saveComment(userName, date, comment);
    }
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
            recommendedOrgs={recommendedOrgs}
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
