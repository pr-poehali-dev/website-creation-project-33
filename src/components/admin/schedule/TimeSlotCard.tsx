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

  const color = hasMaxim
    ? { border: 'border-purple-200', bg: 'bg-purple-50', dot: 'bg-purple-400', text: 'text-purple-600', badge: 'bg-purple-100 text-purple-600', btn: 'text-purple-400 hover:text-purple-600 hover:bg-purple-100' }
    : { border: 'border-emerald-200', bg: 'bg-emerald-50', dot: 'bg-emerald-400', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-600', btn: 'text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100' };

  return (
    <div className={`rounded-xl border ${color.border} ${color.bg} overflow-hidden`}>
      {/* Slot header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/60">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${color.dot} flex-shrink-0`} />
          <span className={`text-xs font-semibold ${color.text}`}>
            <Icon name="Clock" size={11} className={`${color.text} inline mr-1`} />
            {slot.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${color.badge}`}>
            {workers.length}
          </span>
          <button
            onClick={() => onAddSlot(dayDate, slot.time, slot.label)}
            className={`w-6 h-6 flex items-center justify-center rounded-lg transition-all ${color.btn}`}
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
