import { useState, useEffect } from 'react';
import { DaySchedule } from './types';
import Icon from '@/components/ui/icon';
import PlanOrgModal, { PlanEntry } from '../tasks/PlanOrgModal';

const PLANNING_API = 'https://functions.poehali.dev/0476e6f3-5f78-4770-9742-11fda4ba89c8';
const TODAY = new Date().toISOString().slice(0, 10);

interface WeekCalendarInteractiveProps {
  weekDays: DaySchedule[];
  weekStartDate: string;
}

export default function WeekCalendarInteractive({ weekDays, weekStartDate }: WeekCalendarInteractiveProps) {
  const [plans, setPlans]             = useState<PlanEntry[]>([]);
  const [modalDate, setModalDate]     = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<PlanEntry | null>(null);

  useEffect(() => {
    if (!weekDays.length) return;
    const from = weekDays[0].date;
    const to = weekDays[weekDays.length - 1].date;
    fetch(`${PLANNING_API}?date_from=${from}&date_to=${to}`)
      .then(r => r.json())
      .then(d => setPlans(d.plans || []));
  }, [weekStartDate]);

  const handleSave = (plan: PlanEntry) => {
    setPlans(prev => {
      const exists = prev.find(p => p.id === plan.id);
      if (exists) return prev.map(p => p.id === plan.id ? plan : p);
      return [...prev, plan];
    });
    setModalDate(null);
    setEditingPlan(null);
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`${PLANNING_API}?id=${id}`, { method: 'DELETE' });
    setPlans(prev => prev.filter(p => p.id !== id));
  };

  const handleEdit = (plan: PlanEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPlan(plan);
    setModalDate(plan.date);
  };

  return (
    <>
      {/* Горизонтальный скролл на мобильных, grid на десктопе */}
      <div className="overflow-x-auto -mx-3 px-3 md:overflow-x-visible md:mx-0 md:px-0">
        <div className="grid grid-cols-7 gap-1 md:gap-1.5 min-w-[560px] md:min-w-0">
          {weekDays.map(day => {
            const isToday = day.date === TODAY;
            const isPast = day.date < TODAY;
            const dayNum = new Date(day.date).getDate();
            const month = (new Date(day.date).getMonth() + 1).toString().padStart(2, '0');
            const dayPlans = plans.filter(p => p.date === day.date);

            return (
              <div
                key={day.date}
                onClick={() => !isPast && (setEditingPlan(null), setModalDate(day.date))}
                className={`relative flex flex-col items-center rounded-2xl transition-all group ${
                  isPast
                    ? 'bg-slate-800/40 ring-1 ring-slate-700/20 opacity-50 cursor-default'
                    : isToday
                    ? 'bg-slate-800/80 ring-2 ring-cyan-500/50 cursor-pointer hover:ring-cyan-400/70'
                    : 'bg-slate-800/60 ring-1 ring-slate-700/30 cursor-pointer hover:ring-slate-500/50 hover:bg-slate-800/80'
                }`}
              >
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
                      // Короткое имя: первое слово или аббревиатура до скобки
                      const shortName = plan.organization_name.includes('(')
                        ? plan.organization_name.split('(')[1].replace(')', '').trim()
                        : plan.organization_name.split(' ')[0];

                      return (
                        <div
                          key={plan.id}
                          onClick={e => e.stopPropagation()}
                          className="group/plan relative rounded-md px-1 py-0.5 text-[8px] md:text-[9px] font-semibold text-white"
                          style={{ backgroundColor: plan.color }}
                          title={`${plan.organization_name}${plan.senior_name ? ' · ' + plan.senior_name : ''}${plan.contact_limit ? ' · ' + plan.contact_limit + ' кон.' : ''}`}
                        >
                          {/* Название — приоритет */}
                          <span className="block truncate pr-5 leading-tight">{shortName}</span>
                          {plan.contact_limit && (
                            <span className="text-white/70 text-[7px] block leading-tight">{plan.contact_limit} к.</span>
                          )}
                          <div className="absolute top-0 right-0 hidden group-hover/plan:flex h-full">
                            <button onClick={e => handleEdit(plan, e)} className="px-0.5 bg-black/30 hover:bg-black/50 flex items-center">
                              <Icon name="Pencil" size={7} className="text-white" />
                            </button>
                            <button onClick={e => handleDelete(plan.id, e)} className="px-0.5 bg-black/30 hover:bg-red-500/70 flex items-center rounded-r-md">
                              <Icon name="X" size={7} className="text-white" />
                            </button>
                          </div>
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

      {modalDate && (
        <PlanOrgModal
          date={modalDate}
          editPlan={editingPlan}
          onSave={handleSave}
          onClose={() => { setModalDate(null); setEditingPlan(null); }}
        />
      )}
    </>
  );
}
