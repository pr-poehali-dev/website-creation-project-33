import { useState, useEffect } from 'react';
import { DaySchedule } from './types';
import Icon from '@/components/ui/icon';
import { PlanEntry } from '../tasks/PlanOrgModal';
import DayDetailModal from './DayDetailModal';
import { getMoscowDate } from './utils';

const PLANNING_API = 'https://functions.poehali.dev/0476e6f3-5f78-4770-9742-11fda4ba89c8';
const _msk = getMoscowDate();
const TODAY = `${_msk.getFullYear()}-${String(_msk.getMonth() + 1).padStart(2, '0')}-${String(_msk.getDate()).padStart(2, '0')}`;

interface WeekCalendarInteractiveProps {
  weekDays: DaySchedule[];
  weekStartDate: string;
}

export default function WeekCalendarInteractive({ weekDays, weekStartDate }: WeekCalendarInteractiveProps) {
  const [plans, setPlans]                     = useState<PlanEntry[]>([]);
  const [detailDate, setDetailDate]           = useState<string | null>(null);
  // slotsByDate[date] = { total, used }
  const [slotsByDate, setSlotsByDate]         = useState<Record<string, {total: number, used: number}>>({});


  useEffect(() => {
    if (!weekDays.length) return;
    const from = weekDays[0].date;
    const to = weekDays[weekDays.length - 1].date;

    // Два запроса параллельно вместо 8
    Promise.all([
      fetch(`${PLANNING_API}?date_from=${from}&date_to=${to}`).then(r => r.json()),
      fetch(`${PLANNING_API}?action=week_slots&date_from=${from}&date_to=${to}`).then(r => r.json()),
    ]).then(([plansData, slotsData]) => {
      setPlans(plansData.plans || []);
      setSlotsByDate(slotsData.slots_by_date || {});
    });
  }, [weekStartDate]);

  const handleSave = (plan: PlanEntry) => {
    setPlans(prev => {
      const exists = prev.find(p => p.id === plan.id);
      if (exists) return prev.map(p => p.id === plan.id ? plan : p);
      return [...prev, plan];
    });
  };

  const handleDelete = (id: number) => {
    setPlans(prev => prev.filter(p => p.id !== id));
  };

  return (
    <>
      {/* Горизонтальный скролл на мобильных, grid на десктопе */}
      <div className="overflow-x-auto -mx-3 px-3 md:overflow-x-visible md:mx-0 md:px-0">
        <div className="grid grid-cols-7 gap-1 md:gap-1.5 min-w-[560px] md:min-w-0">
          {weekDays.map(day => {
            const isToday = day.date === TODAY;
            const isPast  = day.date < TODAY;
            const dayNum  = new Date(day.date).getDate();
            const month   = (new Date(day.date).getMonth() + 1).toString().padStart(2, '0');
            const dayPlans = plans.filter(p => p.date === day.date);
            const daySlots = slotsByDate[day.date];
            const totalSlots = daySlots?.total ?? null;
            const usedSlots = daySlots?.used ?? 0;
            const allFilled = totalSlots !== null && totalSlots > 0 && usedSlots >= totalSlots;

            return (
              <div
                key={day.date}
                onClick={() => setDetailDate(day.date)}
                className={`relative flex flex-col items-center rounded-2xl transition-all group cursor-pointer ${
                  isPast
                    ? 'bg-slate-800/40 ring-1 ring-slate-700/20 opacity-50'
                    : isToday
                    ? 'bg-slate-800/80 ring-2 ring-cyan-500/50 hover:ring-cyan-400/70'
                    : 'bg-slate-800/60 ring-1 ring-slate-700/30 hover:ring-slate-500/50 hover:bg-slate-800/80'
                }`}
              >
                {/* Бейдж промоутеров — правый верхний угол */}
                {totalSlots !== null && totalSlots > 0 && (
                  <div className={`absolute top-1.5 right-1.5 px-1 py-0.5 rounded text-[7px] md:text-[8px] font-bold leading-none ${
                    allFilled
                      ? 'bg-emerald-500/25 text-emerald-400'
                      : usedSlots > 0
                        ? 'bg-amber-500/25 text-amber-400'
                        : 'bg-slate-700/60 text-slate-500'
                  }`}>
                    {usedSlots}/{totalSlots}
                  </div>
                )}

                {/* День недели + число */}
                <div className="py-2.5 md:py-3 text-center w-full px-1">
                  <span className={`text-[9px] md:text-[10px] font-semibold uppercase tracking-widest block mb-1 ${
                    isToday ? 'text-cyan-400' : day.isWeekend ? 'text-orange-400/70' : 'text-slate-500'
                  }`}>
                    {day.dayName}
                  </span>
                  <span className="text-sm md:text-xl font-bold leading-none">
                    <span className={isToday ? 'text-cyan-400' : day.isWeekend ? 'text-orange-300' : 'text-slate-200'}>
                      {dayNum}
                    </span>
                    <span className={`text-[10px] md:text-xs font-normal ml-0.5 ${isToday ? 'text-cyan-500' : 'text-slate-600'}`}>
                      .{month}
                    </span>
                  </span>
                </div>

                {/* Планы */}
                {dayPlans.length > 0 && (
                  <div className="w-full px-1 pb-1.5 space-y-0.5">
                    {dayPlans.map(plan => {
                      const shortName = plan.organization_name.includes('(')
                        ? `${plan.organization_name.split('(')[0].trim()} (${plan.organization_name.split('(')[1].replace(')', '').trim().slice(0, 3)})`
                        : plan.organization_name.split(' ').slice(0, 2).join(' ');

                      const hasNoPromoter = (plan.promoters ?? []).length === 0;
                      const isViktor = plan.senior_name?.toLowerCase().includes('кобыляцкий');

                      return (
                        <div
                          key={plan.id}
                          className="relative rounded-md px-1 py-0.5 text-[8px] md:text-[9px] font-semibold text-white flex items-center gap-0.5"
                          style={{ backgroundColor: plan.color }}
                          title={`${plan.organization_name}${plan.senior_name ? ' · ' + plan.senior_name : ''}${plan.contact_limit ? ' · ' + plan.contact_limit + ' кон.' : ''}`}
                        >
                          <span className="flex-1 truncate leading-tight">{shortName}</span>
                          {plan.contact_limit && (
                            <span className="flex-shrink-0 text-white/70 text-[7px] leading-none">({plan.contact_limit})</span>
                          )}
                          {isViktor && <span className="flex-shrink-0 text-[9px] leading-none">👋</span>}
                          {hasNoPromoter && (
                            <span className="flex-shrink-0 w-3.5 h-3.5 rounded-sm bg-red-500 flex items-center justify-center text-white font-black text-[9px] leading-none ring-1 ring-red-300/50">!</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Плюс при hover на пустых днях */}
                {!isPast && dayPlans.length === 0 && (
                  <div className="pb-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Icon name="Plus" size={11} className="text-slate-600" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {detailDate && (
        <DayDetailModal
          date={detailDate}
          plans={plans.filter(p => p.date === detailDate)}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setDetailDate(null)}
        />
      )}
    </>
  );
}