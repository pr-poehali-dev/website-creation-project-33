import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { UserSchedule, DeleteSlotState, OrganizationData } from './types';
import { isMaximKorelsky } from './utils';
import WorkerCard from './WorkerCard';

interface TimeSlotCardProps {
  slot: { label: string; time: string };
  workers: UserSchedule[];
  dayDate: string;
  workComments: Record<string, Record<string, {location?: string, flyers?: string}>>;
  savingComment: string | null;
  allLocations: string[];
  allOrganizations: OrganizationData[];
  userOrgStats: Record<string, Array<{organization_name: string, avg_per_shift: number}>>;
  recommendedLocations: Record<string, Record<string, string[]>>;
  loadingProgress?: number;
  onCommentChange: (userName: string, date: string, field: 'location' | 'flyers', value: string) => void;
  onCommentBlur: (userName: string, date: string, field: 'location' | 'flyers', value: string) => void;
  onRemoveSlot: (userId: number, userName: string, date: string, slotTime: string, slotLabel: string) => void;
  onAddSlot: (date: string, slotTime: string, slotLabel: string) => void;
  deletingSlot: DeleteSlotState | null;
}

export default function TimeSlotCard({
  slot,
  workers,
  dayDate,
  workComments,
  savingComment,
  allLocations,
  allOrganizations,
  userOrgStats,
  recommendedLocations,
  loadingProgress,
  onCommentChange,
  onCommentBlur,
  onRemoveSlot,
  onAddSlot,
  deletingSlot
}: TimeSlotCardProps) {
  const hasMaxim = workers.some(w => isMaximKorelsky(w.first_name, w.last_name));

  return (
    <div className={`${hasMaxim ? 'bg-purple-500/10 border border-purple-500/50 md:border-2' : 'bg-emerald-500/10 border border-emerald-500/50 md:border-2'} p-1.5 md:p-2 lg:p-3 rounded-lg`}>
      <div className="flex items-center justify-between mb-1.5 md:mb-2 min-w-0">
        <span className={`text-[10px] md:text-xs lg:text-sm font-semibold ${hasMaxim ? 'text-purple-400' : 'text-emerald-400'} truncate flex-1 min-w-0`}>
          <Icon name="Clock" size={10} className={`${hasMaxim ? 'text-purple-400' : 'text-emerald-400'} inline mr-0.5 md:mr-1 md:w-3 md:h-3 lg:w-[14px] lg:h-[14px] flex-shrink-0`} />
          {slot.label}
        </span>
        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0 ml-1">
          <Badge className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 ${hasMaxim ? 'bg-purple-600' : 'bg-emerald-600'} flex-shrink-0`}>
            {workers.length}
          </Badge>
          <button
            onClick={() => onAddSlot(dayDate, slot.time, slot.label)}
            className="text-emerald-400 hover:text-emerald-300 flex-shrink-0"
            title="Добавить промоутера"
          >
            <Icon name="Plus" size={14} className="md:w-4 md:h-4" />
          </button>
        </div>
      </div>
      <div className="space-y-0.5 md:space-y-1">
        {workers.length === 0 ? (
          <p className="text-[10px] md:text-xs text-slate-500 italic">Нет промоутеров</p>
        ) : (
          workers.map(worker => {
            const workerName = `${worker.first_name} ${worker.last_name}`;
            const recommendedOrgs = recommendedLocations[workerName]?.[dayDate] || [];
            const orgStats = userOrgStats[workerName] || [];

            return (
              <WorkerCard
                key={worker.user_id}
                worker={worker}
                dayDate={dayDate}
                slotTime={slot.time}
                slotLabel={slot.label}
                workComments={workComments}
                savingComment={savingComment}
                allLocations={allLocations}
                allOrganizations={allOrganizations}
                recommendedOrgs={recommendedOrgs}
                orgStats={orgStats}
                loadingProgress={loadingProgress}
                onCommentChange={onCommentChange}
                onCommentBlur={onCommentBlur}
                onRemoveSlot={onRemoveSlot}
                deletingSlot={deletingSlot}
              />
            );
          })
        )}
      </div>
    </div>
  );
}