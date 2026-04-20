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
  const [trainingCounts, setTrainingCounts] = useState<Record<string, number>>({});
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
    Promise.all(
      weekDays.map(day =>
        fetch(`${TRAINING_API}?action=get_entries&date=${day.date}`, { headers })
          .then(r => r.json())
          .then(data => ({ date: day.date, count: (data.entries || []).length }))
          .catch(() => ({ date: day.date, count: 0 }))
      )
    ).then(results => {
      const counts: Record<string, number> = {};
      results.forEach(r => { counts[r.date] = r.count; });
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

  const handleAddSlotClick = (date: string, slotTime: string, slotLabel: string) => {
    setShowAddModal({date, slotTime, slotLabel});
  };

  const daysWithWorkers = weekDays.filter(day => {
    const hasWorkers = day.slots.some(slot => getUsersWorkingOnSlot(day.date, slot.time).length > 0);
    const hasTraining = (trainingCounts[day.date] ?? 0) > 0;
    return hasWorkers || hasTraining;
  });

  const weekTotals = dayStats.reduce(
    (acc, stat) => ({
      expected: acc.expected + stat.expected,
      actual: acc.actual + stat.actual
    }),
    { expected: 0, actual: 0 }
  );

  return (
    <div className="space-y-4">
      {loadingProgress > 0 && loadingProgress < 100 && (
        <div className="bg-slate-900/60 ring-1 ring-slate-700/40 rounded-2xl p-3 md:p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-400">Загрузка статистики...</span>
            <span className="text-xs font-bold text-cyan-400">{loadingProgress}%</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 rounded-full"
              style={{ width: `${loadingProgress}%` }}
            />
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
            onRemoveSlot={confirmRemoveSlot}
            onAddSlot={handleAddSlotClick}
            deletingSlot={deletingSlot}
          />
        );
      })}

      <div className="flex items-center justify-end gap-3 py-4">
        <div className="flex items-center gap-4 bg-slate-900/60 ring-1 ring-slate-700/40 rounded-2xl px-5 py-3">
          <div className="text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">План</div>
            <div className="text-2xl font-bold text-slate-300">{weekTotals.expected}</div>
          </div>
          <div className="w-px h-8 bg-slate-700/50" />
          <div className="text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Факт</div>
            <div className={`text-2xl font-bold ${weekTotals.actual >= weekTotals.expected && weekTotals.expected > 0 ? 'text-emerald-400' : 'text-cyan-400'}`}>
              {weekTotals.actual}
            </div>
          </div>
          {weekTotals.expected > 0 && (
            <>
              <div className="w-px h-8 bg-slate-700/50" />
              <div className="text-center">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">%</div>
                <div className={`text-2xl font-bold ${weekTotals.actual >= weekTotals.expected ? 'text-emerald-400' : 'text-orange-400'}`}>
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