import { useState, useEffect } from 'react';
import { DaySchedule, UserSchedule, DeleteSlotState, DayStats } from './types';
import { useScheduleData } from './useScheduleData';
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
  const [trainingCounts, setTrainingCounts] = useState<Record<string, number> | null>(null);
  const [promoterSlots, setPromoterSlots] = useState<Record<string, {total: number, used: number}>>({});

  // Загружаем промоутеров на каждый день недели
  useEffect(() => {
    if (!weekDays.length) return;
    const PLANNING_API = 'https://functions.poehali.dev/0476e6f3-5f78-4770-9742-11fda4ba89c8';
    Promise.all([
      // Загружаем планы (для подсчёта used)
      fetch(`${PLANNING_API}?date_from=${weekDays[0].date}&date_to=${weekDays[weekDays.length-1].date}`)
        .then(r => r.json()).then(d => d.plans || []).catch(() => []),
      // Загружаем промоутеров по дням (total)
      Promise.all(weekDays.map(day =>
        fetch(`${PLANNING_API}?action=promoters&date=${day.date}`)
          .then(r => r.json())
          .then(d => ({ date: day.date, total: (d.promoters || []).reduce((s: number, p: {total_slots: number}) => s + p.total_slots, 0) }))
          .catch(() => ({ date: day.date, total: 0 }))
      ))
    ]).then(([plans, totals]) => {
      const map: Record<string, {total: number, used: number}> = {};
      totals.forEach(({ date, total }: {date: string, total: number}) => {
        const used = plans.filter((p: {date: string, promoters?: unknown[]}) => p.date === date)
          .reduce((s: number, p: {promoters?: unknown[]}) => s + (p.promoters ?? []).length, 0);
        map[date] = { total, used };
      });
      setPromoterSlots(map);
    });
  }, [weekDays]);

  useEffect(() => {
    if (!weekDays.length) return;
    const TRAINING_API = 'https://functions.poehali.dev/1401561e-4d80-430c-87e9-7e8252e0a9b9';
    const headers = { 'Content-Type': 'application/json', 'X-Session-Token': localStorage.getItem('session_token') || '' };
    const dateFrom = weekDays[0].date;
    const dateTo = weekDays[weekDays.length - 1].date;
    fetch(`${TRAINING_API}?action=get_entries&date_from=${dateFrom}&date_to=${dateTo}`, { headers })
      .then(r => r.json())
      .then(data => {
        const counts: Record<string, number> = data.counts || {};
        weekDays.forEach(day => { if (!(day.date in counts)) counts[day.date] = 0; });
        setTrainingCounts(counts);
      })
      .catch(() => {
        const counts: Record<string, number> = {};
        weekDays.forEach(day => { counts[day.date] = 0; });
        setTrainingCounts(counts);
      });
  }, [weekDays]);

  const {
    workComments,
    allLocations,
    allOrganizations,
    userOrgStats,
    recommendedLocations,
    actualStats,
    loadingProgress,
    updateComment,
    saveComment,
    reloadWorkComments
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

  const handleAddSlotClick = (date: string, slotTime: string, slotLabel: string) => {
    setShowAddModal({date, slotTime, slotLabel});
  };

  const trainingReady = trainingCounts !== null;

  const daysWithWorkers = trainingReady
    ? weekDays.filter(day => {
        const hasWorkers = day.slots.some(slot => getUsersWorkingOnSlot(day.date, slot.time).length > 0);
        const hasTraining = (trainingCounts[day.date] ?? 0) > 0;
        return hasWorkers || hasTraining;
      })
    : [];

  const weekTotals = dayStats.reduce(
    (acc, stat) => ({
      expected: acc.expected + stat.expected,
      actual: acc.actual + stat.actual
    }),
    { expected: 0, actual: 0 }
  );

  return (
    <div className="space-y-4">
      {!trainingReady && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-24 bg-gray-100 rounded" />
                  <div className="h-2.5 w-16 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="h-10 bg-gray-50 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {trainingReady && daysWithWorkers.map((day) => {
        const isExpanded = expandedDays.has(day.date);
        const stats = dayStats.find(s => s.date === day.date);

        return (
          <DayCard
            key={day.date}
            day={day}
            isExpanded={isExpanded}
            stats={stats}
            trainingCount={trainingCounts[day.date] ?? 0}
            promoterSlots={promoterSlots[day.date]}
            getUsersWorkingOnSlot={getUsersWorkingOnSlot}
            workComments={workComments}
            allLocations={allLocations}
            allOrganizations={allOrganizations}
            userOrgStats={userOrgStats}
            recommendedLocations={recommendedLocations}
            actualStats={actualStats}
            loadingProgress={loadingProgress}
            onToggleDay={toggleDay}
            onCommentChange={updateComment}
            onSaveComment={saveComment}
            onAddSlot={handleAddSlotClick}
          />
        );
      })}

      <div className="flex items-center justify-end gap-3 py-2">
        <div className="flex items-center gap-4 bg-white border border-gray-100 shadow-sm rounded-2xl px-5 py-3">
          <div className="text-center">
            <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">План</div>
            <div className="text-2xl font-bold text-gray-700">{weekTotals.expected}</div>
          </div>
          <div className="w-px h-8 bg-gray-100" />
          <div className="text-center">
            <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">Факт</div>
            <div className={`text-2xl font-bold ${weekTotals.actual >= weekTotals.expected && weekTotals.expected > 0 ? 'text-emerald-500' : 'text-blue-500'}`}>
              {weekTotals.actual}
            </div>
          </div>
          {weekTotals.expected > 0 && (
            <>
              <div className="w-px h-8 bg-gray-100" />
              <div className="text-center">
                <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">%</div>
                <div className={`text-2xl font-bold ${weekTotals.actual >= weekTotals.expected ? 'text-emerald-500' : 'text-orange-400'}`}>
                  {Math.round((weekTotals.actual / weekTotals.expected) * 100)}
                </div>
              </div>
            </>
          )}
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