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
  plans,
  deleting,
  onEdit,
  onDelete,
  onPromoterClick,
  onPromoterAdd,
}: DayDetailMobileListProps) {
  return (
    <div className="flex-1 overflow-y-auto overscroll-contain sm:hidden pb-[env(safe-area-inset-bottom,16px)]">
      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-600">
          <Icon name="CalendarDays" size={28} className="mb-2 opacity-30" />
          <span className="text-xs">Нет организаций — нажми +</span>
        </div>
      ) : (
        <div className="p-3 space-y-3">
          {plans.map(plan => (
            <div
              key={plan.id}
              className="rounded-2xl overflow-hidden shadow-lg"
              style={{ backgroundColor: plan.color }}
            >
              <div className="px-3 py-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-white font-bold text-sm leading-tight flex-1 min-w-0">
                    {plan.organization_name}
                  </p>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); onEdit(plan); }}
                      className="w-8 h-8 rounded-xl bg-black/20 active:bg-black/40 flex items-center justify-center"
                    >
                      <Icon name="Pencil" size={13} className="text-white/90" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); onDelete(plan.id); }}
                      disabled={deleting === plan.id}
                      className="w-8 h-8 rounded-xl bg-black/20 active:bg-red-500/60 flex items-center justify-center disabled:opacity-50"
                    >
                      {deleting === plan.id
                        ? <Icon name="Loader2" size={13} className="text-white/80 animate-spin" />
                        : <Icon name="Trash2" size={13} className="text-white/90" />
                      }
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                  {plan.time_from && plan.time_to && (
                    <span className="text-white/75 text-xs flex items-center gap-1">
                      <Icon name="Clock" size={10} className="text-white/50 flex-shrink-0" />
                      {plan.time_from}–{plan.time_to}
                    </span>
                  )}
                  {plan.senior_name && (
                    <span className="text-white/75 text-xs flex items-center gap-1">
                      <Icon name="User" size={10} className="text-white/50 flex-shrink-0" />
                      {plan.senior_name}
                    </span>
                  )}
                  {plan.contact_limit && (
                    <span className="text-white/75 text-xs flex items-center gap-1">
                      <Icon name="Users" size={10} className="text-white/50 flex-shrink-0" />
                      {plan.contact_limit} кон.
                    </span>
                  )}
                </div>
                <div className="mt-2 space-y-1.5">
                  {(plan.promoters ?? []).map(p => (
                    <button
                      key={p.pp_id}
                      onClick={e => { e.stopPropagation(); onPromoterClick(plan); }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl bg-black/25 hover:bg-black/35 transition-all text-left"
                    >
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                        {p.promoter_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-white/90 text-xs font-semibold truncate leading-tight flex-1 min-w-0">{p.promoter_name}</p>
                          {p.time_slot && (
                            <span className="text-white/70 text-[10px] bg-black/25 px-1.5 py-0.5 rounded flex-shrink-0 leading-tight">
                              {p.time_slot === 'slot1' ? '12–16' : '16–20'}
                            </span>
                          )}
                        </div>
                        {(p.org_name || p.place_type) && (
                          <p className="text-white/60 text-[11px] truncate leading-tight">
                            {p.org_name}{p.place_type ? ` · ${p.place_type}` : ''}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={e => { e.stopPropagation(); onPromoterAdd(plan); }}
                    className="w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-black/20 active:bg-black/30 border border-dashed border-white/20 transition-all"
                  >
                    <Icon name="UserPlus" size={12} className="text-white/60" />
                    <span className="text-white/60 text-xs">
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
