import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { DaySchedule, UserSchedule, DeleteSlotState, DayStats, OrganizationData } from './types';
import TimeSlotCard from './TimeSlotCard';
import DaySummary from './DaySummary';

interface DayCardProps {
  day: DaySchedule;
  isExpanded: boolean;
  stats?: DayStats;
  getUsersWorkingOnSlot: (date: string, slotTime: string) => UserSchedule[];
  workComments: Record<string, Record<string, {location?: string, flyers?: string}>>;
  savingComment: string | null;
  allLocations: string[];
  allOrganizations: OrganizationData[];
  userOrgStats: Record<string, Array<{organization_name: string, avg_per_shift: number}>>;
  recommendedLocations: Record<string, Record<string, string>>;
  actualStats: Record<string, {contacts: number, revenue: number}>;
  loadingProgress?: number;
  onToggleDay: (date: string) => void;
  onCommentChange: (userName: string, date: string, field: 'location' | 'flyers', value: string) => void;
  onCommentBlur: (userName: string, date: string, field: 'location' | 'flyers', value: string) => void;
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
  allOrganizations,
  userOrgStats,
  recommendedLocations,
  actualStats,
  loadingProgress,
  onToggleDay,
  onCommentChange,
  onCommentBlur,
  onRemoveSlot,
  onAddSlot,
  deletingSlot
}: DayCardProps) {
  const isSuccessful = stats && stats.expected > 0 && stats.actual >= stats.expected;
  
  return (
    <Card className={`border border-slate-700/50 md:border-2 shadow-sm transition-all ${isSuccessful ? 'bg-emerald-500/10 md:border-emerald-500/50' : 'bg-slate-800/50 md:border-slate-700/50'}`}>
      <CardContent className="p-2 md:p-4">
        <div 
          className={`flex items-center justify-between cursor-pointer -m-2 md:-m-4 p-2 md:p-4 rounded-lg transition-colors ${isSuccessful ? 'hover:bg-emerald-500/20' : 'hover:bg-slate-700/50'}`}
          onClick={() => onToggleDay(day.date)}
        >
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg ${isSuccessful ? 'bg-emerald-500' : day.isWeekend ? 'bg-orange-500' : 'bg-cyan-600'} text-white flex flex-col items-center justify-center font-bold text-[9px] md:text-xs`}>
              <span>{day.dayName}</span>
              <span className="text-xs md:text-sm">{new Date(day.date).getDate()}</span>
            </div>
            <div>
              <p className="font-semibold text-slate-100 text-xs md:text-base">
                {day.dayNameFull}
              </p>
              <p className="text-[10px] md:text-xs text-slate-400">{day.date}</p>
            </div>
            {stats && stats.expected > 0 && (
              <span className={`text-[10px] md:text-xs ml-1 md:ml-2 px-1.5 md:px-2 py-0.5 md:py-1 rounded ${isSuccessful ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-300 bg-slate-700/50'}`}>
                {stats.expected} / {stats.actual}
              </span>
            )}
            {isSuccessful && (
              <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-emerald-500 flex items-center justify-center ml-0.5 md:ml-1 animate-in zoom-in-50 duration-500">
                <Icon name="Check" size={14} className="text-white md:w-4 md:h-4" />
              </div>
            )}
          </div>
          <Icon 
            name={isExpanded ? "ChevronUp" : "ChevronDown"} 
            size={18} 
            className="text-slate-400 md:w-5 md:h-5"
          />
        </div>

        {isExpanded && (
          <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-slate-700/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 md:gap-2 lg:gap-3">
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
                    allOrganizations={allOrganizations}
                    userOrgStats={userOrgStats}
                    recommendedLocations={recommendedLocations}
                    loadingProgress={loadingProgress}
                    onCommentChange={onCommentChange}
                    onCommentBlur={onCommentBlur}
                    onRemoveSlot={onRemoveSlot}
                    onAddSlot={onAddSlot}
                    deletingSlot={deletingSlot}
                  />
                );
              })}
            </div>
            
            <DaySummary
              day={day}
              getUsersWorkingOnSlot={getUsersWorkingOnSlot}
              workComments={workComments}
              allOrganizations={allOrganizations}
              userOrgStats={userOrgStats}
              recommendedLocations={recommendedLocations}
              actualStats={actualStats}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}