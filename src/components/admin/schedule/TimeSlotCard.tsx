import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { UserSchedule, DeleteSlotState } from './types';
import { isMaximKorelsky } from './utils';
import WorkerCard from './WorkerCard';

interface TimeSlotCardProps {
  slot: { label: string; time: string };
  workers: UserSchedule[];
  dayDate: string;
  workComments: Record<string, Record<string, string>>;
  savingComment: string | null;
  allLocations: string[];
  userOrgStats: Record<string, Array<{organization_name: string, avg_per_shift: number}>>;
  recommendedLocations: Record<string, Record<string, string>>;
  onCommentChange: (userName: string, date: string, comment: string) => void;
  onCommentBlur: (userName: string, date: string, comment: string) => void;
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
  userOrgStats,
  recommendedLocations,
  onCommentChange,
  onCommentBlur,
  onRemoveSlot,
  onAddSlot,
  deletingSlot
}: TimeSlotCardProps) {
  const hasMaxim = workers.some(w => isMaximKorelsky(w.first_name, w.last_name));

  return (
    <div className={`${hasMaxim ? 'bg-purple-50 border-2 border-purple-300' : 'bg-green-50 border-2 border-green-300'} p-2 md:p-3 rounded-lg`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs md:text-sm font-semibold ${hasMaxim ? 'text-purple-700' : 'text-green-700'}`}>
          <Icon name="Clock" size={12} className={`${hasMaxim ? 'text-purple-600' : 'text-green-600'} inline mr-1 md:w-[14px] md:h-[14px]`} />
          {slot.label}
        </span>
        <div className="flex items-center gap-2">
          <Badge className={`text-xs ${hasMaxim ? 'bg-purple-600' : 'bg-green-600'}`}>
            {workers.length}
          </Badge>
          <button
            onClick={() => onAddSlot(dayDate, slot.time, slot.label)}
            className="text-green-600 hover:text-green-700"
            title="Добавить промоутера"
          >
            <Icon name="Plus" size={16} />
          </button>
        </div>
      </div>
      <div className="space-y-1">
        {workers.length === 0 ? (
          <p className="text-xs text-gray-500 italic">Нет промоутеров</p>
        ) : (
          workers.map(worker => {
            const workerName = `${worker.first_name} ${worker.last_name}`;
            const recommendedOrg = recommendedLocations[workerName]?.[dayDate] || '';
            const orgStats = userOrgStats[workerName] || [];
            const orgAvg = orgStats.find(o => o.organization_name === recommendedOrg)?.avg_per_shift;

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
                recommendedOrg={recommendedOrg}
                orgAvg={orgAvg}
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