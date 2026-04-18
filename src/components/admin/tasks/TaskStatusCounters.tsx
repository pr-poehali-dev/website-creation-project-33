import { STATUS_CONFIG, TaskStatus } from './tasksTypes';

interface TaskStatusCountersProps {
  counts: Record<TaskStatus, number>;
  filterStatus: string;
  onToggle: (status: TaskStatus) => void;
}

export default function TaskStatusCounters({ counts, filterStatus, onToggle }: TaskStatusCountersProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {(['pending', 'in_progress', 'done'] as const).map(s => {
        const cfg = STATUS_CONFIG[s];
        const active = filterStatus === s;
        return (
          <button
            key={s}
            onClick={() => onToggle(s)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold ring-1 transition-all duration-200 ${
              active
                ? cfg.color + ' scale-105'
                : 'bg-slate-800/40 text-slate-400 ring-slate-700/40 hover:ring-slate-600/50 hover:text-slate-300'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
            <span className={`ml-0.5 font-bold ${active ? '' : 'text-slate-500'}`}>{counts[s]}</span>
          </button>
        );
      })}
    </div>
  );
}