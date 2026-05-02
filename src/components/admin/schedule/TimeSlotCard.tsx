import Icon from '@/components/ui/icon';
import { UserSchedule, OrganizationData } from './types';
import { isMaximKorelsky } from './utils';
import WorkerCard from './WorkerCard';

interface TimeSlotCardProps {
  slot: { label: string; time: string };
  workers: UserSchedule[];
  dayDate: string;
  workComments: Record<string, Record<string, unknown>>;
  allLocations: string[];
  allOrganizations: OrganizationData[];
  userOrgStats: Record<string, Array<{ organization_name: string; avg_per_shift: number }>>;
  recommendedLocations: Record<string, Record<string, string[]>>;
  loadingProgress?: number;
  onCommentChange: (userName: string, date: string, field: string, value: string, shiftTime?: string) => void;
  onSaveComment: (userName: string, date: string, field: string, value: string, shiftTime?: string) => void;
  onAddSlot: (date: string, slotTime: string, slotLabel: string) => void;
}

export default function TimeSlotCard({
  slot, workers, dayDate,
  workComments, allLocations, allOrganizations,
  userOrgStats, recommendedLocations,
  loadingProgress,
  onCommentChange, onSaveComment, onAddSlot,
}: TimeSlotCardProps) {
  const hasMaxim = workers.some(w => isMaximKorelsky(w.first_name, w.last_name));
  const accentColor = hasMaxim ? 'text-purple-500' : 'text-gray-400';
  const dotColor = hasMaxim ? 'bg-purple-400' : 'bg-gray-300';

  return (
    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
      {/* Slot header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${dotColor} flex-shrink-0`} />
          <span className="text-xs font-semibold text-gray-600">
            <Icon name="Clock" size={11} className="text-gray-400 inline mr-1" />
            {slot.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
            {workers.length}
          </span>
          <button
            onClick={() => onAddSlot(dayDate, slot.time, slot.label)}
            className={`w-6 h-6 flex items-center justify-center rounded-lg transition-all ${accentColor} hover:bg-gray-100`}
            title="Добавить промоутера"
          >
            <Icon name="Plus" size={14} />
          </button>
        </div>
      </div>

      {/* Workers */}
      <div className="px-2.5 py-2 space-y-1.5">
        {workers.length === 0 ? (
          <p className="text-[10px] text-gray-400 italic py-1">Нет промоутеров</p>
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
                allLocations={allLocations}
                allOrganizations={allOrganizations}
                recommendedOrgs={recommendedOrgs}
                orgStats={orgStats}
                loadingProgress={loadingProgress}
                onCommentChange={onCommentChange}
                onSaveComment={onSaveComment}
              />
            );
          })
        )}
      </div>
    </div>
  );
}