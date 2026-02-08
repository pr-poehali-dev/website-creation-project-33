import { useState, useEffect } from 'react';
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
    allOrganizations,
    userOrgStats,
    recommendedLocations,
    actualStats,
    loadingProgress,
    saveComment,
    updateComment
  } = useScheduleData(weekDays, schedules, undefined);

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