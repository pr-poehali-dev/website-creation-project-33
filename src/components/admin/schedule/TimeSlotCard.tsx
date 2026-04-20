import Icon from '@/components/ui/icon';
import { UserSchedule, DeleteSlotState, OrganizationData } from './types';
import { isMaximKorelsky } from './utils';
import WorkerCard from './WorkerCard';

interface TimeSlotCardProps {
  slot: { label: string; time: string };
  workers: UserSchedule[];
  dayDate: string;
  workComments: Record<string, Record<string, unknown>>;
  allLocations: string[];
  allOrganizations: OrganizationData[];
  userOrgStats: Record<string, Array<{organization_name: string, avg_per_shift: number}>>;
  recommendedLocations: Record<string, Record<string, string[]>>;
  loadingProgress?: number;
  onCommentChange: (userName: string, date: string, field: string, value: string, shiftTime?: string) => void;
  onSaveComment: (userName: string, date: string, field: string, value: string, shiftTime?: string) => void;
  onRemoveSlot: (userId: number, userName: string, date: string, slotTime: string, slotLabel: string) => void;
  onAddSlot: (date: string, slotTime: string, slotLabel: string) => void;
  deletingSlot: DeleteSlotState | null;
}

export default function TimeSlotCard({
  slot,
  workers,
  dayDate,
  workComments,
  allLocations,
  allOrganizations,
  userOrgStats,
  recommendedLocations,
  loadingProgress,
  onCommentChange,
  onSaveComment,
  onRemoveSlot,
  onAddSlot,
  deletingSlot
}: TimeSlotCardProps) {
  const hasMaxim = workers.some(w => isMaximKorelsky(w.first_name, w.last_name));

  const accentColor = hasMaxim
    ? { ring: 'ring-purple-500/20', bg: 'bg-purple-500/8', dot: 'bg-purple-400', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300', addBtn: 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/15' }
    : { ring: 'ring-emerald-500/20', bg: 'bg-emerald-500/8', dot: 'bg-emerald-400', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300', addBtn: 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/15' };

  return (
    <div className={`rounded-xl ring-1 ${accentColor.ring} ${accentColor.bg} overflow-hidden`}>
      {/* Slot header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${accentColor.dot} flex-shrink-0`} />
          <span className={`text-xs font-semibold ${accentColor.text}`}>
            <Icon name="Clock" size={11} className={`${accentColor.text} inline mr-1`} />
            {slot.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${accentColor.badge}`}>
            {workers.length}
          </span>
          <button
            onClick={() => onAddSlot(dayDate, slot.time, slot.label)}
            className={`w-6 h-6 flex items-center justify-center rounded-lg transition-all ${accentColor.addBtn}`}
            title="Добавить промоутера"
          >
            <Icon name="Plus" size={14} />
          </button>
        </div>
      </div>

      {/* Workers */}
      <div className="px-2.5 py-2 space-y-2">
        {workers.length === 0 ? (
          <p className="text-[10px] text-slate-600 italic py-1">Нет промоутеров</p>
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