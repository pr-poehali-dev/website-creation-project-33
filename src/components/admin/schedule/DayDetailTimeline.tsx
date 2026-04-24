import Icon from '@/components/ui/icon';
import { PlanEntry } from '../tasks/PlanOrgModal';
import {
  HOURS, HOUR_H, TIME_LABEL_W, RIGHT_PAD,
  toMin, Layout,
} from './dayDetailUtils';

interface DayDetailTimelineProps {
  plans: PlanEntry[];
  layout: Layout[];
  deleting: number | null;
  onEdit: (plan: PlanEntry) => void;
  onDelete: (id: number) => void;
  onPromoterClick: (plan: PlanEntry) => void;
  onPromoterAdd: (plan: PlanEntry) => void;
}

export default function DayDetailTimeline({
  plans,
  layout,
  deleting,
  onEdit,
  onDelete,
  onPromoterClick,
  onPromoterAdd,
}: DayDetailTimelineProps) {
  const totalH = HOUR_H * HOURS.length;

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain hidden sm:block">
      <div className="relative" style={{ height: totalH }}>

        {/* Линии часов */}
        {HOURS.map((h, i) => (
          <div key={h} className="absolute left-0 right-0 flex items-start pointer-events-none" style={{ top: i * HOUR_H }}>
            <span
              className="flex-shrink-0 text-right pr-3 text-[11px] text-slate-600 leading-none pt-1 select-none"
              style={{ width: TIME_LABEL_W }}
            >
              {h}:00
            </span>
            <div className="flex-1 border-t border-slate-700/40 mt-[3px]" />
          </div>
        ))}

        {/* Пустое состояние */}
        {plans.length === 0 && (
          <div
            className="absolute flex flex-col items-center justify-center text-slate-600"
            style={{ left: TIME_LABEL_W, right: RIGHT_PAD, top: HOUR_H * 2, height: HOUR_H * 4 }}
          >
            <Icon name="CalendarDays" size={28} className="mb-2 opacity-30" />
            <span className="text-xs">Нет организаций — нажми +</span>
          </div>
        )}

        {/* Карточки — колоночная раскладка */}
        {plans.map((plan, idx) => {
          const { col, totalCols } = layout[idx];
          const hasTime = plan.time_from && plan.time_to;

          let top: number, height: number;
          const gapPx = totalCols > 1 ? 3 : 0;

          if (hasTime) {
            const mFrom = toMin(plan.time_from!);
            const mTo   = toMin(plan.time_to!);
            top    = (mFrom / 60) * HOUR_H;
            height = Math.max(((mTo - mFrom) / 60) * HOUR_H - 4, 48);
          } else {
            top    = idx * 72 + 4;
            height = 64;
          }

          return (
            <div
              key={plan.id}
              className="absolute"
              style={{
                top,
                height,
                left: `calc(${TIME_LABEL_W}px + (100% - ${TIME_LABEL_W + RIGHT_PAD}px) * ${col} / ${totalCols})`,
                width: `calc((100% - ${TIME_LABEL_W + RIGHT_PAD}px) / ${totalCols} - ${gapPx}px)`,
              }}
            >
              <div
                className="h-full rounded-xl px-2.5 py-2 shadow-md ring-1 ring-white/10 flex items-start gap-1.5"
                style={{ backgroundColor: plan.color }}
              >
                <div className="flex-1 min-w-0 flex flex-col h-full">
                  {/* Название */}
                  <div className="flex items-start gap-1">
                    <p className="text-white font-bold text-[13px] leading-tight line-clamp-2 flex-1 min-w-0">
                      {plan.organization_name}
                    </p>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={e => { e.stopPropagation(); onEdit(plan); }}
                        className="w-7 h-7 rounded-lg bg-black/20 active:bg-black/40 flex items-center justify-center"
                      >
                        <Icon name="Pencil" size={11} className="text-white/90" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); onDelete(plan.id); }}
                        disabled={deleting === plan.id}
                        className="w-7 h-7 rounded-lg bg-black/20 active:bg-red-500/60 flex items-center justify-center disabled:opacity-50"
                      >
                        {deleting === plan.id
                          ? <Icon name="Loader2" size={11} className="text-white/80 animate-spin" />
                          : <Icon name="Trash2" size={11} className="text-white/90" />
                        }
                      </button>
                    </div>
                  </div>

                  {/* Мета-инфо */}
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                    {plan.time_from && plan.time_to && (
                      <span className="text-white/70 text-[11px] flex items-center gap-0.5">
                        <Icon name="Clock" size={9} className="text-white/50 flex-shrink-0" />
                        {plan.time_from}–{plan.time_to}
                      </span>
                    )}
                    {plan.senior_name && (
                      <span className="text-white/70 text-[11px] flex items-center gap-0.5">
                        <Icon name="User" size={9} className="text-white/50 flex-shrink-0" />
                        {plan.senior_name}
                      </span>
                    )}
                    {plan.contact_limit && (
                      <span className="text-white/70 text-[11px] flex items-center gap-0.5">
                        <Icon name="Users" size={9} className="text-white/50 flex-shrink-0" />
                        {plan.contact_limit}
                      </span>
                    )}
                  </div>

                  {/* Промоутеры на точке */}
                  <div className="mt-2 space-y-1">
                    {(plan.promoters ?? []).map(p => (
                      <button
                        key={p.pp_id}
                        onClick={e => { e.stopPropagation(); onPromoterClick(plan); }}
                        className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-black/25 hover:bg-black/35 transition-all text-left"
                      >
                        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
                          {p.promoter_name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-white/90 text-[11px] font-semibold truncate leading-tight flex-1 min-w-0">{p.promoter_name}</p>
                            {p.time_slot && (
                              <span className="text-white/70 text-[9px] bg-black/25 px-1.5 py-0.5 rounded flex-shrink-0 leading-tight">
                                {p.time_slot === 'slot1' ? '12–16' : '16–20'}
                              </span>
                            )}
                          </div>
                          {(p.org_name || p.place_type) && (
                            <p className="text-white/60 text-[10px] truncate leading-tight">
                              {p.org_name}{p.place_type ? ` · ${p.place_type}` : ''}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                    <button
                      onClick={e => { e.stopPropagation(); onPromoterAdd(plan); }}
                      className="w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-black/20 active:bg-black/30 border border-dashed border-white/20 transition-all"
                    >
                      <Icon name="UserPlus" size={10} className="text-white/60" />
                      <span className="text-white/60 text-[10px]">
                        {(plan.promoters ?? []).length > 0 ? 'Ещё промоутера' : 'Назначить промоутера'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
