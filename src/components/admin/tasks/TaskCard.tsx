import Icon from '@/components/ui/icon';
import { Task, TaskStatus, STATUS_CONFIG, AVATAR_COLORS, getInitials, formatDate } from './tasksTypes';

interface TaskCardProps {
  task: Task;
  index: number;
  isUpdating: boolean;
  onStatusChange: (taskId: number, newStatus: TaskStatus) => void;
}

export default function TaskCard({ task, index, isUpdating, onStatusChange }: TaskCardProps) {
  const cfg = STATUS_CONFIG[task.status];
  const avatarCls = AVATAR_COLORS[task.responsible] || 'bg-slate-700 text-slate-300';

  return (
    <div
      className="bg-slate-900/70 ring-1 ring-slate-700/40 rounded-2xl p-4 hover:ring-slate-600/60 transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/50"
      style={{
        animationName: 'fadeSlideIn',
        animationDuration: '300ms',
        animationDelay: `${index * 40}ms`,
        animationFillMode: 'both',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Цветная полоска */}
        <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${cfg.bar}`} />

        <div className="flex-1 min-w-0">
          {/* Строка 1: статус + категория */}
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ring-1 ${cfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            {task.category_name && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
                <Icon name="Tag" size={10} />
                {task.category_name}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-800/60 text-slate-400 ring-1 ring-slate-700/50 ml-auto">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${avatarCls}`}>
                {getInitials(task.responsible)}
              </div>
              {task.responsible}
            </span>
          </div>

          {/* Текст */}
          <p className={`text-sm leading-relaxed mb-3 ${task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
            {task.text}
          </p>

          {/* Строка: дата + кнопки статуса */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[10px] text-slate-600 flex items-center gap-1">
              <Icon name="Clock" size={10} />
              {formatDate(task.created_at)}
            </span>

            <div className="flex items-center gap-1">
              {isUpdating ? (
                <Icon name="Loader2" size={14} className="animate-spin text-slate-400" />
              ) : (
                (['pending', 'in_progress', 'done'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => onStatusChange(task.id, s)}
                    disabled={task.status === s}
                    className={`h-7 px-2.5 rounded-lg text-[10px] font-semibold transition-all duration-200 ${
                      task.status === s
                        ? `ring-1 ${STATUS_CONFIG[s].color} cursor-default`
                        : 'bg-slate-800/50 text-slate-500 hover:bg-slate-700/50 ring-1 ring-slate-700/30 hover:text-slate-300'
                    }`}
                  >
                    {STATUS_CONFIG[s].label}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}