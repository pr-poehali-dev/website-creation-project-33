import { PlannedOrganization } from './types';
import { getMoscowDate } from './utils';

interface DailyHourlyViewProps {
  plans: PlannedOrganization[];
  timeSlots: string[];
  selectedDate: string | null;
}

export default function DailyHourlyView({ plans, timeSlots, selectedDate }: DailyHourlyViewProps) {
  const displayDate = selectedDate || getMoscowDate();
  
  return (
    <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-4">
        Почасовой график на {new Date(displayDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
      </h3>
      <div className="space-y-2">
        {timeSlots.map((hour) => {
          const todayPlans = plans.filter(p => p.date === displayDate);
          const allNotes = todayPlans.map(plan => ({
            org: plan.organization,
            note: plan.hourlyNotes?.find(n => n.hour === hour)?.note || ''
          })).filter(item => item.note.trim());

          return (
            <div key={hour} className="flex items-start gap-3 border-b border-gray-100 pb-2">
              <div className="flex-shrink-0 w-14 md:w-16 pt-1">
                <div className="text-xs md:text-sm font-semibold text-gray-700">{hour}</div>
              </div>
              <div className="flex-1 min-h-[28px]">
                {allNotes.length > 0 ? (
                  <div className="space-y-1">
                    {allNotes.map((item, idx) => (
                      <div key={idx} className="text-xs md:text-sm">
                        <span className="font-medium text-purple-700">{item.org}:</span>{' '}
                        <span className="text-gray-700">{item.note}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs md:text-sm text-gray-300">—</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}