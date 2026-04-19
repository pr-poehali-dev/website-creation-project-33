import Icon from '@/components/ui/icon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RESPONSIBLES, Category } from './tasksTypes';

interface TaskFiltersProps {
  categories: Category[];
  fResp2: string;
  fCat2: string;
  fStatus: string;
  onFResp2Change: (v: string) => void;
  onFCat2Change: (v: string) => void;
  onFStatusChange: (v: string) => void;
  onReset: () => void;
}

export default function TaskFilters({
  categories, fResp2, fCat2, fStatus,
  onFResp2Change, onFCat2Change, onFStatusChange, onReset,
}: TaskFiltersProps) {
  return (
    <div className="p-3 bg-slate-800/30 ring-1 ring-slate-700/30 rounded-xl">
      <div className="flex items-center gap-1.5 mb-3">
        <Icon name="Filter" size={12} className="text-slate-500" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Фильтры</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-[10px] font-medium text-slate-500 mb-1 block uppercase tracking-wider">Ответственный</label>
          <Select value={fResp2 || '_all'} onValueChange={v => onFResp2Change(v === '_all' ? '' : v)}>
            <SelectTrigger className="h-8 bg-slate-800/60 ring-1 ring-slate-700/50 border-0 text-slate-300 rounded-lg text-xs">
              <SelectValue placeholder="Все" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="_all" className="text-slate-400 focus:bg-slate-700 text-xs">Все</SelectItem>
              {RESPONSIBLES.map(r => <SelectItem key={r} value={r} className="text-slate-200 focus:bg-slate-700 focus:text-white text-xs">{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[10px] font-medium text-slate-500 mb-1 block uppercase tracking-wider">Классификация</label>
          <Select value={fCat2 || '_all'} onValueChange={v => onFCat2Change(v === '_all' ? '' : v)}>
            <SelectTrigger className="h-8 bg-slate-800/60 ring-1 ring-slate-700/50 border-0 text-slate-300 rounded-lg text-xs">
              <SelectValue placeholder="Все" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="_all" className="text-slate-400 focus:bg-slate-700 text-xs">Все</SelectItem>
              {categories.map(c => <SelectItem key={c.id} value={String(c.id)} className="text-slate-200 focus:bg-slate-700 focus:text-white text-xs">{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[10px] font-medium text-slate-500 mb-1 block uppercase tracking-wider">Статус</label>
          <Select value={fStatus || '_all'} onValueChange={v => onFStatusChange(v === '_all' ? '' : v)}>
            <SelectTrigger className="h-8 bg-slate-800/60 ring-1 ring-slate-700/50 border-0 text-slate-300 rounded-lg text-xs">
              <SelectValue placeholder="Все" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="_all" className="text-slate-400 focus:bg-slate-700 text-xs">Все</SelectItem>
              <SelectItem value="pending" className="text-red-300 focus:bg-slate-700 text-xs">Не выполнена</SelectItem>
              <SelectItem value="in_progress" className="text-yellow-300 focus:bg-slate-700 text-xs">В процессе</SelectItem>
              <SelectItem value="done" className="text-emerald-300 focus:bg-slate-700 text-xs">Выполнена</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {(fResp2 || fCat2 || fStatus) && (
        <button onClick={onReset} className="mt-2 flex items-center gap-1 text-xs text-slate-600 hover:text-red-400 transition-colors">
          <Icon name="X" size={11} /> Сбросить фильтры
        </button>
      )}
    </div>
  );
}
