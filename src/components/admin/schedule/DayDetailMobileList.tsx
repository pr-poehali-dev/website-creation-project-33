import Icon from '@/components/ui/icon';
import { PlanEntry } from '../tasks/PlanOrgModal';

interface DayDetailMobileListProps {
  plans: PlanEntry[];
  deleting: number | null;
  onEdit: (plan: PlanEntry) => void;
  onDelete: (id: number) => void;
  onPromoterClick: (plan: PlanEntry) => void;
  onPromoterAdd: (plan: PlanEntry) => void;
}

export default function DayDetailMobileList({
  plans, deleting,
  onEdit, onDelete, onPromoterClick, onPromoterAdd,
}: DayDetailMobileListProps) {
  return (
    <div className="flex-1 overflow-y-auto overscroll-contain sm:hidden pb-[env(safe-area-inset-bottom,16px)]">
      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-300">
          <Icon name="CalendarDays" size={28} className="mb-2" />
          <span className="text-xs text-gray-400">Нет организаций — нажми +</span>
        </div>
      ) : (
        <div className="p-3 space-y-2.5">
          {plans.map(plan => (
            <div
              key={plan.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              {/* Цветная полоска сверху */}
              <div className="h-1 w-full" style={{ backgroundColor: plan.color }} />

              <div className="px-3 py-3">
                {/* Заголовок */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: plan.color }} />
                    <p className="text-gray-800 font-bold text-sm leading-tight truncate">
                      {plan.organization_name}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); onEdit(plan); }}
                      className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                      <Icon name="Pencil" size={12} className="text-gray-500" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); onDelete(plan.id); }}
                      disabled={deleting === plan.id}
                      className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-50 flex items-center justify-center transition-colors disabled:opacity-50"
                    >
                      {deleting === plan.id
                        ? <Icon name="Loader2" size={12} className="text-red-400 animate-spin" />
                        : <Icon name="Trash2" size={12} className="text-gray-400 hover:text-red-400" />
                      }
                    </button>
                  </div>
                </div>

                {/* Метаинфо */}
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-2.5">
                  {plan.time_from && plan.time_to && (
                    <span className="text-gray-400 text-xs flex items-center gap-1">
                      <Icon name="Clock" size={10} className="text-gray-300 flex-shrink-0" />
                      {plan.time_from}–{plan.time_to}
                    </span>
                  )}
                  {plan.senior_name && (
                    <span className="text-gray-400 text-xs flex items-center gap-1">
                      <Icon name="User" size={10} className="text-gray-300 flex-shrink-0" />
                      {plan.senior_name}
                    </span>
                  )}
                  {plan.contact_limit && (
                    <span className="text-gray-400 text-xs flex items-center gap-1">
                      <Icon name="Users" size={10} className="text-gray-300 flex-shrink-0" />
                      {plan.contact_limit} кон.
                    </span>
                  )}
                </div>

                {/* Промоутеры */}
                <div className="space-y-1.5">
                  {(plan.promoters ?? []).map(p => (
                    <button
                      key={p.pp_id}
                      onClick={e => { e.stopPropagation(); onPromoterClick(plan); }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-all text-left"
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: plan.color }}
                      >
                        {p.promoter_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-gray-700 text-xs font-semibold truncate leading-tight flex-1 min-w-0">
                            {p.promoter_name}
                          </p>
                          {p.time_slot && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold text-white flex-shrink-0 leading-tight"
                              style={{ backgroundColor: plan.color + 'cc' }}
                            >
                              {p.time_slot === 'slot1' ? '12–16' : '16–20'}
                            </span>
                          )}
                        </div>
                        {(p.org_name || p.place_type) && (
                          <p className="text-gray-400 text-[10px] truncate leading-tight mt-0.5">
                            {p.org_name}{p.place_type ? ` · ${p.place_type}` : ''}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}

                  {/* Добавить промоутера */}
                  <button
                    onClick={e => { e.stopPropagation(); onPromoterAdd(plan); }}
                    className="w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                  >
                    <Icon name="UserPlus" size={12} className="text-gray-400" />
                    <span className="text-gray-400 text-xs">
                      {(plan.promoters ?? []).length > 0 ? 'Ещё промоутера' : 'Назначить промоутера'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
