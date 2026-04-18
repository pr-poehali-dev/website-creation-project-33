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
  const avatarCls = AVATAR_COLORS[task.responsible] || 'bg-gray-100 text-gray-600';

  return (
    <div
      className="group bg-white border border-gray-100 rounded-2xl p-4 hover:border-gray-200 hover:shadow-md transition-all duration-200"
      style={{
        animationName: 'fadeSlideIn',
        animationDuration: '300ms',
        animationDelay: `${index * 30}ms`,
        animationFillMode: 'both',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Цветная полоска */}
        <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${cfg.bar} opacity-70`} />

        <div className="flex-1 min-w-0">
          {/* Строка 1: статус + категория */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            {task.category_name && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gray-50 text-gray-500 border border-gray-100">
                <Icon name="Hash" size={10} />
                {task.category_name}
              </span>
            )}
          </div>

          {/* Текст */}
          <p className={`text-sm leading-relaxed font-medium mb-3 ${task.status === 'done' ? 'line-through text-gray-300' : 'text-gray-800'}`}>
            {task.text}
          </p>

          {/* Строка 3: дата + ответственный + кнопки */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              {/* Аватар ответственного */}
              <div className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${avatarCls}`}>
                  {getInitials(task.responsible)}
                </div>
                <span className="text-xs text-gray-400">{task.responsible}</span>
              </div>
              <span className="text-[11px] text-gray-300 flex items-center gap-1">
                <Icon name="Clock" size={10} />
                {formatDate(task.created_at)}
              </span>
            </div>

            {/* Кнопки смены статуса */}
            <div className="flex items-center gap-1">
              {isUpdating ? (
                <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
              ) : (
                (['pending', 'in_progress', 'done'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => onStatusChange(task.id, s)}
                    disabled={task.status === s}
                    title={STATUS_CONFIG[s].label}
                    className={`h-7 px-2.5 rounded-lg text-[10px] font-semibold transition-all duration-150 ${
                      task.status === s
                        ? STATUS_CONFIG[s].activeBg + ' cursor-default shadow-sm'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
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
