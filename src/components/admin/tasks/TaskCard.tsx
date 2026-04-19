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
      className="bg-slate-800/40 ring-1 ring-slate-700/40 rounded-xl overflow-hidden transition-all duration-200 hover:ring-slate-600/60"
      style={{ animationName: 'fsi', animationDuration: '250ms', animationDelay: `${index * 30}ms`, animationFillMode: 'both' }}
    >
      {/* ── Шапка карточки (кликабельная) ── */}
      <div className="group flex items-start gap-3 p-4 cursor-pointer select-none" onClick={onToggleExpand}>
        <div className={`w-0.5 self-stretch rounded-full flex-shrink-0 ${cfg.bar}`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ring-1 ${cfg.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            {task.category_name && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
                <Icon name="Tag" size={9} />{task.category_name}
              </span>
            )}
            <span className="text-[11px] text-slate-600 flex items-center gap-1">
              <Icon name="User" size={10} />{task.responsible}
            </span>
            {taskActions.length > 0 && (
              <span className="text-[10px] text-slate-500 flex items-center gap-1 ml-1">
                <Icon name="CheckSquare" size={9} />{doneCount}/{taskActions.length}
              </span>
            )}
            <div className="ml-auto flex items-center gap-1" onClick={e => e.stopPropagation()}>
              <button
                onClick={onOpenActionForm}
                className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-md text-slate-600 hover:text-cyan-400 hover:bg-cyan-400/10 transition-all"
                title="Добавить действие"
              >
                <Icon name="ListPlus" size={12} />
              </button>
              <button
                onClick={onDelete}
                disabled={isDel}
                className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-md text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
                title="Удалить задачу"
              >
                {isDel ? <Icon name="Loader2" size={12} className="animate-spin text-red-400" /> : <Icon name="Trash2" size={12} />}
              </button>
              <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={13} className="text-slate-600 ml-1" />
            </div>
          </div>

          <p className={`text-sm leading-relaxed mb-2.5 ${task.status === 'done' ? 'line-through text-slate-600' : 'text-slate-200'}`}>
            {task.text}
          </p>

          <div className="flex items-center justify-between gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
            <span className="text-[10px] text-slate-700 flex items-center gap-1">
              <Icon name="Clock" size={9} />{fmt(task.created_at)}
            </span>
            <div className="flex items-center gap-1">
              {isUpdating ? (
                <Icon name="Loader2" size={13} className="animate-spin text-slate-500" />
              ) : (
                (['pending', 'in_progress', 'done'] as const).map(s => (
                  <button key={s} onClick={() => onChangeStatus(s)} disabled={task.status === s}
                    className={`h-6 px-2 rounded-md text-[10px] font-semibold transition-all duration-150 ${
                      task.status === s
                        ? STATUS_CONFIG[s].badge + ' ring-1 cursor-default'
                        : 'bg-slate-700/50 text-slate-500 ring-1 ring-slate-700/30 hover:bg-slate-700 hover:text-slate-300'
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
          <div className="border-t border-slate-700/50 mx-4" />
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
                  className="flex-1 h-8 px-3 bg-slate-900/60 ring-1 ring-slate-700/60 text-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-slate-600 transition-all"
                />
                <button
                  onClick={onAddAction}
                  disabled={savingAction || !actionText.trim()}
                  className="h-8 px-3 bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/30 rounded-lg text-xs font-semibold hover:bg-cyan-500/30 disabled:opacity-40 transition-all"
                >
                  {savingAction ? <Icon name="Loader2" size={12} className="animate-spin" /> : 'Добавить'}
                </button>
                <button onClick={onCloseActionForm} className="h-8 px-2 text-slate-600 hover:text-slate-400 transition-colors">
                  <Icon name="X" size={13} />
                </button>
              </div>
            )}

            {/* Список действий */}
            {isLoadingActions ? (
              <div className="flex items-center justify-center py-4">
                <Icon name="Loader2" size={16} className="animate-spin text-slate-500" />
              </div>
            ) : taskActions.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-3">
                Нет действий. Нажмите <Icon name="ListPlus" size={11} className="inline mx-1" /> чтобы добавить.
              </p>
            ) : (
              taskActions.map(action => (
                <div key={action.id} className="flex items-start gap-2.5 p-2.5 bg-slate-900/40 rounded-lg ring-1 ring-slate-700/30">
                  <button
                    onClick={() => onToggleActionDone(action.id, !action.is_done)}
                    disabled={togglingActionId === action.id}
                    className="mt-0.5 flex-shrink-0 w-4 h-4 rounded flex items-center justify-center transition-all"
                  >
                    {togglingActionId === action.id ? (
                      <Icon name="Loader2" size={12} className="animate-spin text-slate-500" />
                    ) : action.is_done ? (
                      <div className="w-4 h-4 rounded bg-emerald-500/20 ring-1 ring-emerald-500/40 flex items-center justify-center">
                        <Icon name="Check" size={10} className="text-emerald-400" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded ring-1 ring-slate-600 bg-slate-800 hover:ring-slate-500 transition-all" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-relaxed ${action.is_done ? 'line-through text-slate-600' : 'text-slate-300'}`}>
                      {action.comment}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-700">добавлено {fmt(action.created_at)}</span>
                      {action.is_done && action.done_at && (
                        <span className="text-[10px] text-emerald-700 flex items-center gap-0.5">
                          <Icon name="CheckCircle" size={9} /> выполнено {fmt(action.done_at)}
                        </span>
                      )}
                    </div>
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
