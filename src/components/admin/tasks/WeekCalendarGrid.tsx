import Icon from '@/components/ui/icon';
import { PlannedOrganization } from './types';
import { getDayName, getMonthDay } from './utils';

interface WeekCalendarGridProps {
  weekDates: string[];
  todayStr: string;
  plans: PlannedOrganization[];
  showingHourlyFor: string | null;
  renamingPlanId: number | null;
  renameValue: string;
  renameNotesValue: string;
  onDateClick: (date: string, dayPlans: PlannedOrganization[]) => void;
  onAddOrgClick: (date: string) => void;
  onPlanClick: (plan: PlannedOrganization, date: string) => void;
  onStartRename: (plan: PlannedOrganization) => void;
  onSaveRename: (id: number) => void;
  onCancelRename: () => void;
  onDeletePlan: (id: number) => void;
  setRenameValue: (value: string) => void;
  setRenameNotesValue: (value: string) => void;
}

export default function WeekCalendarGrid({
  weekDates,
  todayStr,
  plans,
  showingHourlyFor,
  renamingPlanId,
  renameValue,
  renameNotesValue,
  onDateClick,
  onAddOrgClick,
  onPlanClick,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onDeletePlan,
  setRenameValue,
  setRenameNotesValue
}: WeekCalendarGridProps) {
  return (
    <div className="grid grid-cols-7 gap-1 md:gap-2">
      {weekDates.map((date) => {
        const isToday = date === todayStr;
        const dayPlans = plans.filter(p => p.date === date);
        const isPast = date < todayStr;
        
        return (
          <div
            key={date}
            className={`rounded-lg border-2 p-2 md:p-3 transition-all cursor-pointer ${
              isToday 
                ? 'border-blue-500 bg-blue-50' 
                : showingHourlyFor === date
                ? 'border-purple-500 bg-purple-50'
                : isPast
                ? 'border-gray-200 bg-gray-50 opacity-60'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => onDateClick(date, dayPlans)}
          >
            <div className="text-center">
              <div className={`text-[10px] md:text-xs font-semibold ${
                isToday ? 'text-blue-600' : isPast ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {getDayName(date)}
              </div>
              <div className={`text-lg md:text-2xl font-bold mt-0.5 ${
                isToday ? 'text-blue-600' : isPast ? 'text-gray-400' : 'text-gray-800'
              }`}>
                {getMonthDay(date)}
              </div>
            </div>
            
            {dayPlans.length > 0 && (
              <div className="mt-2 space-y-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddOrgClick(date);
                  }}
                  className="w-full flex items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white rounded px-2 py-1 mb-1 transition-colors"
                >
                  <Icon name="Plus" size={14} className="md:w-4 md:h-4" />
                  <span className="text-[9px] md:text-xs font-medium">Добавить</span>
                </button>
                {dayPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="bg-white rounded px-1.5 py-1 border border-gray-200 relative group cursor-pointer hover:border-purple-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (renamingPlanId !== plan.id) {
                        onPlanClick(plan, date);
                      }
                    }}
                  >
                    {renamingPlanId === plan.id ? (
                      <div 
                        className="pr-12 space-y-1" 
                        onClick={(e) => {
                          if (e.target === e.currentTarget) {
                            e.stopPropagation();
                          }
                        }}
                      >
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              onSaveRename(plan.id);
                            }
                            if (e.key === 'Escape') onCancelRename();
                          }}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Название организации"
                          className="w-full text-[9px] md:text-xs font-medium text-gray-800 border border-purple-500 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
                          autoFocus
                        />
                        <input
                          type="text"
                          value={renameNotesValue}
                          onChange={(e) => setRenameNotesValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              onSaveRename(plan.id);
                            }
                            if (e.key === 'Escape') onCancelRename();
                          }}
                          onBlur={() => onSaveRename(plan.id)}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Примечания (необязательно)"
                          className="w-full text-[8px] md:text-[10px] text-gray-600 border border-purple-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="text-[9px] md:text-xs font-medium text-gray-800 truncate pr-12">
                          {plan.organization}
                        </div>
                        {plan.notes && (
                          <div className="text-[8px] md:text-[10px] text-gray-500 truncate pr-12">
                            {plan.notes}
                          </div>
                        )}
                      </>
                    )}
                    <div className="absolute top-0.5 right-0.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartRename(plan);
                        }}
                        className="p-0.5 hover:bg-purple-100 rounded"
                      >
                        <Icon name="Pencil" size={12} className="text-purple-600 md:w-4 md:h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePlan(plan.id);
                        }}
                        className="p-0.5 hover:bg-red-100 rounded"
                      >
                        <Icon name="X" size={12} className="text-red-500 md:w-4 md:h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {dayPlans.length === 0 && !isPast && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddOrgClick(date);
                }}
                className="w-full mt-2 flex items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white rounded px-2 py-1 transition-colors"
              >
                <Icon name="Plus" size={14} className="md:w-4 md:h-4" />
                <span className="text-[9px] md:text-xs font-medium">Добавить</span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
