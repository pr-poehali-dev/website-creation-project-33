import Icon from '@/components/ui/icon';
import { getDayName, getMonthDay } from './utils';
import { PlanEntry } from './PlanOrgModal';

interface WeekCalendarGridProps {
  weekDates: string[];
  todayStr: string;
  plans: PlanEntry[];
  onDateClick: (date: string) => void;
  onEditPlan: (plan: PlanEntry) => void;
  onDeletePlan: (id: number) => void;
}

export default function WeekCalendarGrid({
  weekDates,
  todayStr,
  plans,
  onDateClick,
  onEditPlan,
  onDeletePlan,
}: WeekCalendarGridProps) {
  return (
    <div className="grid grid-cols-7 gap-1 md:gap-1.5">
      {weekDates.map((date) => {
        const isToday = date === todayStr;
        const isPast = date < todayStr;
        const dayPlans = plans.filter(p => p.date === date);

        return (
          <div
            key={date}
            onClick={() => onDateClick(date)}
            className={`rounded-xl border transition-all duration-150 cursor-pointer group ${
              isToday
                ? 'border-cyan-500/60 bg-cyan-500/8 shadow-lg shadow-cyan-500/10'
                : isPast
                ? 'border-slate-700/30 bg-slate-800/20 opacity-60'
                : 'border-slate-700/40 bg-slate-800/30 hover:border-slate-600/60 hover:bg-slate-800/50'
            }`}
          >
            {/* Заголовок ячейки */}
            <div className="p-1.5 md:p-2 text-center">
              <div className={`text-[9px] md:text-[10px] font-semibold uppercase tracking-wider ${
                isToday ? 'text-cyan-400' : isPast ? 'text-slate-600' : 'text-slate-500'
              }`}>
                {getDayName(date)}
              </div>
              <div className={`text-base md:text-xl font-bold mt-0.5 leading-none ${
                isToday
                  ? 'text-cyan-400'
                  : isPast ? 'text-slate-600' : 'text-slate-200 group-hover:text-slate-100'
              }`}>
                {getMonthDay(date)}
              </div>
              {/* Плюс при hover если нет планов */}
              {!isPast && dayPlans.length === 0 && (
                <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Icon name="Plus" size={12} className="mx-auto text-slate-500" />
                </div>
              )}
            </div>

            {/* Список планов */}
            {dayPlans.length > 0 && (
              <div className="px-1 pb-1.5 space-y-0.5">
                {dayPlans.map(plan => (
                  <div
                    key={plan.id}
                    onClick={e => e.stopPropagation()}
                    className="group/plan relative rounded-md px-1.5 py-1 text-[9px] md:text-[10px] font-medium text-white truncate cursor-pointer hover:opacity-90 transition-opacity leading-tight"
                    style={{ backgroundColor: plan.color }}
                    title={`${plan.organization_name}${plan.senior_name ? ' • ' + plan.senior_name : ''}${plan.contact_limit ? ' • Лимит: ' + plan.contact_limit : ''}`}
                  >
                    <span className="block truncate pr-7">{plan.organization_name}</span>
                    {plan.contact_limit && (
                      <span className="block text-white/70 text-[8px]">{plan.contact_limit} кон.</span>
                    )}
                    {/* кнопки на hover */}
                    <div className="absolute top-0.5 right-0.5 hidden group-hover/plan:flex gap-0.5">
                      <button
                        onClick={e => { e.stopPropagation(); onEditPlan(plan); }}
                        className="w-4 h-4 rounded flex items-center justify-center bg-black/30 hover:bg-black/50"
                      >
                        <Icon name="Pencil" size={8} className="text-white" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); onDeletePlan(plan.id); }}
                        className="w-4 h-4 rounded flex items-center justify-center bg-black/30 hover:bg-red-500/70"
                      >
                        <Icon name="X" size={8} className="text-white" />
                      </button>
                    </div>
                  </div>
                ))}
                {/* Кнопка добавить ещё */}
                {!isPast && (
                  <button
                    onClick={e => { e.stopPropagation(); onDateClick(date); }}
                    className="w-full mt-0.5 flex items-center justify-center gap-0.5 rounded-md py-0.5 text-[9px] text-slate-500 hover:text-slate-300 hover:bg-slate-700/40 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Icon name="Plus" size={9} /> ещё
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
