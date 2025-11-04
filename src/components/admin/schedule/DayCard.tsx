import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { DaySchedule, UserSchedule, DeleteSlotState, DayStats } from './types';
import TimeSlotCard from './TimeSlotCard';

interface DayCardProps {
  day: DaySchedule;
  isExpanded: boolean;
  stats?: DayStats;
  getUsersWorkingOnSlot: (date: string, slotTime: string) => UserSchedule[];
  workComments: Record<string, Record<string, string>>;
  savingComment: string | null;
  allLocations: string[];
  userOrgStats: Record<string, Array<{organization_name: string, avg_per_shift: number}>>;
  recommendedLocations: Record<string, Record<string, string>>;
  onToggleDay: (date: string) => void;
  onCommentChange: (userName: string, date: string, comment: string) => void;
  onCommentBlur: (userName: string, date: string, comment: string) => void;
  onRemoveSlot: (userId: number, userName: string, date: string, slotTime: string, slotLabel: string) => void;
  onAddSlot: (date: string, slotTime: string, slotLabel: string) => void;
  deletingSlot: DeleteSlotState | null;
}

export default function DayCard({
  day,
  isExpanded,
  stats,
  getUsersWorkingOnSlot,
  workComments,
  savingComment,
  allLocations,
  userOrgStats,
  recommendedLocations,
  onToggleDay,
  onCommentChange,
  onCommentBlur,
  onRemoveSlot,
  onAddSlot,
  deletingSlot
}: DayCardProps) {
  const isSuccessful = stats && stats.expected > 0 && stats.actual >= stats.expected;
  
  return (
    <Card className={`border-2 shadow-sm transition-all ${isSuccessful ? 'bg-green-50 border-green-500' : 'bg-white border-gray-200'}`}>
      <CardContent className="p-4">
        <div 
          className={`flex items-center justify-between cursor-pointer -m-4 p-4 rounded-lg transition-colors ${isSuccessful ? 'hover:bg-green-100' : 'hover:bg-gray-50'}`}
          onClick={() => onToggleDay(day.date)}
        >
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-lg ${isSuccessful ? 'bg-green-500' : day.isWeekend ? 'bg-orange-500' : 'bg-blue-600'} text-white flex flex-col items-center justify-center font-bold text-xs`}>
              <span>{day.dayName}</span>
              <span className="text-sm">{new Date(day.date).getDate()}</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {day.dayNameFull}
              </p>
              <p className="text-xs text-gray-500">{day.date}</p>
            </div>
            {stats && stats.expected > 0 && (
              <span className={`text-xs ml-2 px-2 py-1 rounded ${isSuccessful ? 'bg-green-200 text-green-800' : 'text-gray-600 bg-gray-100'}`}>
                {stats.expected} / {stats.actual}
              </span>
            )}
            {isSuccessful && (
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center ml-1 animate-in zoom-in-50 duration-500">
                <Icon name="Check" size={16} className="text-white" />
              </div>
            )}
          </div>
          <Icon 
            name={isExpanded ? "ChevronUp" : "ChevronDown"} 
            size={20} 
            className="text-gray-400"
          />
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
              {day.slots.map(slot => {
                const workers = getUsersWorkingOnSlot(day.date, slot.time);

                return (
                  <TimeSlotCard
                    key={slot.time}
                    slot={slot}
                    workers={workers}
                    dayDate={day.date}
                    workComments={workComments}
                    savingComment={savingComment}
                    allLocations={allLocations}
                    userOrgStats={userOrgStats}
                    recommendedLocations={recommendedLocations}
                    onCommentChange={onCommentChange}
                    onCommentBlur={onCommentBlur}
                    onRemoveSlot={onRemoveSlot}
                    onAddSlot={onAddSlot}
                    deletingSlot={deletingSlot}
                  />
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}