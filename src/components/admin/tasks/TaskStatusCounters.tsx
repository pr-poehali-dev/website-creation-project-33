import { STATUS_CONFIG, TaskStatus } from './tasksTypes';

interface TaskStatusCountersProps {
  counts: Record<TaskStatus, number>;
  filterStatus: string;
  onToggle: (status: TaskStatus) => void;
}

export default function TaskStatusCounters({ counts, filterStatus, onToggle }: TaskStatusCountersProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {(['pending', 'in_progress', 'done'] as const).map(s => {
        const cfg = STATUS_CONFIG[s];
        return (
          <button
            key={s}
            onClick={() => onToggle(s)}
            className={`rounded-2xl p-4 text-left border transition-all duration-200 hover:shadow-md ${
              filterStatus === s
                ? `${cfg.bg} ${cfg.border} border shadow-sm`
                : 'bg-white border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${cfg.bg}`}>
              <span className={`text-lg font-bold ${cfg.text}`}>{counts[s]}</span>
            </div>
            <p className={`text-xs font-semibold ${filterStatus === s ? cfg.text : 'text-gray-500'}`}>
              {cfg.label}
            </p>
          </button>
        );
      })}
    </div>
  );
}
