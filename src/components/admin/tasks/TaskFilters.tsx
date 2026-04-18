import Icon from '@/components/ui/icon';
import { RESPONSIBLES, Category } from './tasksTypes';

interface TaskFiltersProps {
  categories: Category[];
  filterResponsible: string;
  filterCategory: string;
  filterStatus: string;
  onResponsibleChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onReset: () => void;
}

export default function TaskFilters({
  categories,
  filterResponsible,
  filterCategory,
  filterStatus,
  onResponsibleChange,
  onCategoryChange,
  onReset,
}: TaskFiltersProps) {
  const hasActiveFilters = !!(filterResponsible || filterCategory || filterStatus);

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-xs font-medium text-gray-400 flex items-center gap-1.5 mr-1">
        <Icon name="SlidersHorizontal" size={13} />
        Фильтр:
      </span>

      {/* Ответственный */}
      <div className="flex gap-1 flex-wrap">
        {['', ...RESPONSIBLES].map(r => (
          <button
            key={r}
            onClick={() => onResponsibleChange(r)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
              filterResponsible === r
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {r || 'Все'}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-gray-200 mx-1 hidden md:block" />

      {/* Классификация */}
      <div className="flex gap-1 flex-wrap">
        {['', ...categories.map(c => c.name)].map((name, i) => {
          const catId = i === 0 ? '' : String(categories[i - 1]?.id);
          return (
            <button
              key={name}
              onClick={() => onCategoryChange(catId)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                filterCategory === catId
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {name || 'Все категории'}
            </button>
          );
        })}
      </div>

      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          <Icon name="X" size={12} /> Сбросить
        </button>
      )}
    </div>
  );
}
