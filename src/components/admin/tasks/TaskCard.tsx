import Icon from '@/components/ui/icon';
import { Task, TaskStatus, TaskAction, STATUS_CONFIG, fmt } from './tasksTypes';

interface TaskCardProps {
  task: Task;
  index: number;
  isUpdating: boolean;
  isDel: boolean;
  isExpanded: boolean;
  taskActions: TaskAction[];
  isLoadingActions: boolean;
  showActionForm: boolean;
  actionText: string;
  savingAction: boolean;
  togglingActionId: number | null;
  onToggleExpand: () => void;
  onChangeStatus: (s: TaskStatus) => void;
  onDelete: () => void;
  onOpenActionForm: () => void;
  onActionTextChange: (v: string) => void;
  onAddAction: () => void;
  onCloseActionForm: () => void;
  onToggleActionDone: (actionId: number, isDone: boolean) => void;
}

export default function TaskCard({
  task, index, isUpdating, isDel, isExpanded,
  taskActions, isLoadingActions, showActionForm,
  actionText, savingAction, togglingActionId,
  onToggleExpand, onChangeStatus, onDelete,
  onOpenActionForm, onActionTextChange, onAddAction,
  onCloseActionForm, onToggleActionDone,
}: TaskCardProps) {
  const cfg = STATUS_CONFIG[task.status];
  const doneCount = taskActions.filter(a => a.is_done).length;

  return (
    <div
      className="bg-gray-50 border border-gray-100 rounded-xl overflow-hidden transition-all duration-200 hover:border-gray-200 hover:shadow-sm"
      style={{ animationName: 'fsi', animationDuration: '250ms', animationDelay: `${index * 30}ms`, animationFillMode: 'both' }}
    >
      {/* ── Шапка карточки ── */}
      <div className="group flex items-start gap-3 p-4 cursor-pointer select-none" onClick={onToggleExpand}>
        <div className={`w-0.5 self-stretch rounded-full flex-shrink-0 ${cfg.bar}`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${cfg.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            {task.category_name && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-600 border border-blue-100">
                <Icon name="Tag" size={9} />{task.category_name}
              </span>
            )}
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <Icon name="User" size={10} />{task.responsible}
            </span>
            {taskActions.length > 0 && (
              <span className="text-[10px] text-gray-400 flex items-center gap-1 ml-1">
                <Icon name="CheckSquare" size={9} />{doneCount}/{taskActions.length}
              </span>
            )}
            <div className="ml-auto flex items-center gap-1" onClick={e => e.stopPropagation()}>
              <button
                onClick={onOpenActionForm}
                className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                title="Добавить действие"
              >
                <Icon name="ListPlus" size={12} />
              </button>
              <button
                onClick={onDelete}
                disabled={isDel}
                className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                title="Удалить задачу"
              >
                {isDel ? <Icon name="Loader2" size={12} className="animate-spin text-red-400" /> : <Icon name="Trash2" size={12} />}
              </button>
              <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={13} className="text-gray-400 ml-1" />
            </div>
          </div>

          <p className={`text-sm leading-relaxed mb-2.5 ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
            {task.text}
          </p>

          <div className="flex items-center justify-between gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
            <span className="text-[10px] text-gray-400 flex items-center gap-1">
              <Icon name="Clock" size={9} />{fmt(task.created_at)}
            </span>
            <div className="flex items-center gap-1">
              {isUpdating ? (
                <Icon name="Loader2" size={13} className="animate-spin text-gray-400" />
              ) : (
                (['pending', 'in_progress', 'done'] as const).map(s => (
                  <button key={s} onClick={() => onChangeStatus(s)} disabled={task.status === s}
                    className={`h-6 px-2 rounded-md text-[10px] font-semibold transition-all duration-150 border ${
                      task.status === s
                        ? STATUS_CONFIG[s].badge + ' cursor-default'
                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100 hover:text-gray-700'
                    }`}>
                    {STATUS_CONFIG[s].label}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Раскрывающийся блок действий ── */}
      <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="border-t border-gray-100 mx-4" />
          <div className="p-4 pt-3 space-y-2">

            {/* Форма добавления действия */}
            {showActionForm && (
              <div className="flex gap-2 mb-3">
                <input
                  value={actionText}
                  onChange={e => onActionTextChange(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && onAddAction()}
                  placeholder="Описание действия..."
                  autoFocus
                  className="flex-1 h-8 px-3 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 placeholder:text-gray-400 transition-all"
                />
                <button
                  onClick={onAddAction}
                  disabled={savingAction || !actionText.trim()}
                  className="h-8 px-3 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-40 transition-all"
                >
                  {savingAction ? <Icon name="Loader2" size={12} className="animate-spin" /> : 'Добавить'}
                </button>
                <button onClick={onCloseActionForm} className="h-8 px-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <Icon name="X" size={13} />
                </button>
              </div>
            )}

            {/* Список действий */}
            {isLoadingActions ? (
              <div className="flex items-center justify-center py-4">
                <Icon name="Loader2" size={16} className="animate-spin text-gray-400" />
              </div>
            ) : taskActions.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">
                Нет действий. Нажмите <Icon name="ListPlus" size={11} className="inline mx-1" /> чтобы добавить.
              </p>
            ) : (
              taskActions.map(action => (
                <div key={action.id} className="flex items-start gap-2.5 p-2.5 bg-white rounded-lg border border-gray-100">
                  <button
                    onClick={() => onToggleActionDone(action.id, !action.is_done)}
                    disabled={togglingActionId === action.id}
                    className="mt-0.5 flex-shrink-0 w-4 h-4 rounded flex items-center justify-center transition-all"
                  >
                    {togglingActionId === action.id ? (
                      <Icon name="Loader2" size={12} className="animate-spin text-gray-400" />
                    ) : action.is_done ? (
                      <div className="w-4 h-4 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                        <Icon name="Check" size={10} className="text-emerald-600" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded border border-gray-300 bg-white hover:border-gray-400 transition-all" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-relaxed ${action.is_done ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                      {action.comment}
                    </p>
                    {action.done_at && (
                      <p className="text-[10px] text-gray-400 mt-0.5">{fmt(action.done_at)}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
