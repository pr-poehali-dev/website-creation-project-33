import Icon from '@/components/ui/icon';
import { RESPONSIBLES, Category } from './tasksTypes';

interface TaskFiltersProps {
  categories: Category[];
  filterResponsible: string;
  filterCategory: string;
  filterStatus: string;
  onResponsibleChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onReset: () => void;
}

export default function TaskFilters({
  categories,
  filterResponsible,
  filterCategory,
  filterStatus,
  onResponsibleChange,
  onCategoryChange,
  onStatusChange,
  onReset,
}: TaskFiltersProps) {
  const hasActiveFilters = !!(filterResponsible || filterCategory || filterStatus);

  return (
    <div className="bg-slate-900/60 ring-1 ring-slate-700/40 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon name="Filter" size={14} className="text-slate-400" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Фильтры</span>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="ml-auto text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"
          >
            <Icon name="X" size={12} /> Сбросить
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <select
          value={filterResponsible}
          onChange={e => onResponsibleChange(e.target.value)}
          className="h-9 px-3 bg-slate-800/60 ring-1 ring-slate-700/50 text-slate-300 rounded-xl text-xs focus:outline-none focus:ring-cyan-500/50 focus:ring-2 transition-all"
        >
          <option value="">Все ответственные</option>
          {RESPONSIBLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select
          value={filterCategory}
          onChange={e => onCategoryChange(e.target.value)}
          className="h-9 px-3 bg-slate-800/60 ring-1 ring-slate-700/50 text-slate-300 rounded-xl text-xs focus:outline-none focus:ring-cyan-500/50 focus:ring-2 transition-all"
        >
          <option value="">Все классификации</option>
          {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => onStatusChange(e.target.value)}
          className="h-9 px-3 bg-slate-800/60 ring-1 ring-slate-700/50 text-slate-300 rounded-xl text-xs focus:outline-none focus:ring-cyan-500/50 focus:ring-2 transition-all"
        >
          <option value="">Все статусы</option>
          <option value="pending">Не выполнена</option>
          <option value="in_progress">В процессе</option>
          <option value="done">Выполнена</option>
        </select>
      </div>
    </div>
  );
}