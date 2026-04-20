import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { PlanEntry } from '../tasks/PlanOrgModal';
import PlanOrgModal from '../tasks/PlanOrgModal';
import PromoterAssignModal from './PromoterAssignModal';

const PLANNING_API = 'https://functions.poehali.dev/0476e6f3-5f78-4770-9742-11fda4ba89c8';

const HOURS      = Array.from({ length: 14 }, (_, i) => i + 8); // 8–21
const HOUR_H     = 80;   // px на 1 час
const START_HOUR = 8;
const TIME_LABEL_W = 56; // px — ширина колонки с временем
const RIGHT_PAD    = 12; // px — отступ справа

// "HH:MM" → минуты от начала шкалы
function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h - START_HOUR) * 60 + (m || 0);
}

// Алгоритм раскладки: возвращает { col, totalCols } для каждого индекса
interface Layout { col: number; totalCols: number; }

function computeLayout(plans: PlanEntry[]): Layout[] {
  const n = plans.length;
  const result: Layout[] = Array.from({ length: n }, () => ({ col: 0, totalCols: 1 }));

  // Для событий с временем — раскладываем в колонки
  // Для событий без времени — каждое в своей «колонке» шириной 100%
  const timed = plans.map((p, i) =>
    p.time_from && p.time_to
      ? { i, from: toMin(p.time_from), to: toMin(p.time_to) }
      : null
  );

  // Находим группы перекрывающихся событий
  const visited = new Set<number>();

  for (let i = 0; i < n; i++) {
    if (!timed[i] || visited.has(i)) continue;

    // BFS: собираем все события, пересекающиеся с i (транзитивно)
    const group: number[] = [i];
    visited.add(i);
    const queue = [i];
    while (queue.length) {
      const cur = queue.shift()!;
      for (let j = 0; j < n; j++) {
        if (visited.has(j) || !timed[j]) continue;
        // Проверяем пересечение с любым в группе
        const overlaps = group.some(g => {
          const a = timed[g]!, b = timed[j]!;
          return a.from < b.to && b.from < a.to;
        });
        if (overlaps) {
          group.push(j);
          visited.add(j);
          queue.push(j);
        }
      }
    }

    // Для группы жадно назначаем колонки
    const cols: Array<{ to: number }[]> = [];
    for (const gi of group) {
      const ev = timed[gi]!;
      let placed = false;
      for (let c = 0; c < cols.length; c++) {
        // Можно поставить в колонку c, если последнее событие в ней уже закончилось
        if (cols[c].every(slot => slot.to <= ev.from)) {
          result[gi].col = c;
          cols[c].push({ to: ev.to });
          placed = true;
          break;
        }
      }
      if (!placed) {
        result[gi].col = cols.length;
        cols.push([{ to: ev.to }]);
      }
    }
    const total = cols.length;
    for (const gi of group) result[gi].totalCols = total;
  }

  return result;
}

interface DayDetailModalProps {
  date: string;
  plans: PlanEntry[];
  onSave: (plan: PlanEntry) => void;
  onDelete: (id: number) => void;
  onClose: () => void;
}

function fmtDate(d: string) {
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('ru-RU', {
      weekday: 'long', day: 'numeric', month: 'long',
    });
  } catch { return d; }
}

export default function DayDetailModal({ date, plans, onSave, onDelete, onClose }: DayDetailModalProps) {
  const [addModalOpen, setAddModalOpen]           = useState(false);
  const [editingPlan, setEditingPlan]             = useState<PlanEntry | null>(null);
  const [deleting, setDeleting]                   = useState<number | null>(null);
  const [promoterModal, setPromoterModal]         = useState<PlanEntry | null>(null);
  const [promoterModalAdd, setPromoterModalAdd]   = useState(false);
  const [totalSlots, setTotalSlots]               = useState<number | null>(null);

  // Загружаем общее кол-во промежутков промоутеров на этот день
  useEffect(() => {
    fetch(`${PLANNING_API}?action=promoters&date=${date}`)
      .then(r => r.json())
      .then(d => {
        const promoters = d.promoters || [];
        const total = promoters.reduce((sum: number, p: { total_slots: number }) => sum + p.total_slots, 0);
        setTotalSlots(total);
      })
      .catch(() => setTotalSlots(null));
  }, [date]);

  // Считаем занятые промежутки из текущих планов
  const usedSlots = plans.reduce((sum, plan) => sum + (plan.promoters ?? []).length, 0);

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      await fetch(`${PLANNING_API}?id=${id}`, { method: 'DELETE' });
      onDelete(id);
    } finally {
      setDeleting(null);
    }
  };

  const handleSave = (plan: PlanEntry) => {
    onSave(plan);
    setAddModalOpen(false);
    setEditingPlan(null);
  };

  const handlePromoterSave = (plan: PlanEntry) => {
    onSave(plan);
    setPromoterModal(null);
    setPromoterModalAdd(false);
  };

  const layout  = computeLayout(plans);
  const totalH  = HOUR_H * HOURS.length;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex flex-col justify-center items-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="w-full max-w-3xl bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl ring-1 ring-slate-700/60 flex flex-col"
          style={{ maxHeight: 'min(90dvh, 860px)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Шапка */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 flex-shrink-0">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold text-slate-100 capitalize">{fmtDate(date)}</h3>
              {totalSlots !== null && (
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  usedSlots >= totalSlots && totalSlots > 0
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : usedSlots > 0
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-slate-700/60 text-slate-400'
                }`}>
                  <Icon name="Users" size={11} />
                  <span>{usedSlots} / {totalSlots}</span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-700/60 transition-all"
            >
              <Icon name="X" size={16} />
            </button>
          </div>

          {/* Мобильный список (< sm) */}
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
                    className="rounded-xl px-3 py-3 shadow-md ring-1 ring-white/10"
                    style={{ backgroundColor: plan.color }}
                  >
                    <div className="flex items-start gap-1.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-1">
                          <p className="text-white font-bold text-sm leading-tight flex-1 min-w-0">
                            {plan.organization_name}
                          </p>
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={e => { e.stopPropagation(); setEditingPlan(plan); setAddModalOpen(true); }}
                              className="w-8 h-8 rounded-lg bg-black/20 active:bg-black/40 flex items-center justify-center"
                            >
                              <Icon name="Pencil" size={13} className="text-white/90" />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleDelete(plan.id); }}
                              disabled={deleting === plan.id}
                              className="w-8 h-8 rounded-lg bg-black/20 active:bg-red-500/60 flex items-center justify-center disabled:opacity-50"
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
                              onClick={e => { e.stopPropagation(); setPromoterModalAdd(false); setPromoterModal(plan); }}
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
                            onClick={e => { e.stopPropagation(); setPromoterModalAdd(true); setPromoterModal(plan); }}
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
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Десктопная временная шкала (>= sm) */}
          <div className="flex-1 overflow-y-auto overscroll-contain hidden sm:block">
            {/* Обёртка с относительным позиционированием — карточки растягиваем через inline-стиль */}
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
                // Ширина одной колонки = (вся ширина - метки - отступ) / totalCols - зазор
                const gapPx = totalCols > 1 ? 3 : 0;
                // left/width считаем через CSS calc, чтобы не нужен ref на контейнер

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
                                onClick={e => { e.stopPropagation(); setEditingPlan(plan); setAddModalOpen(true); }}
                                className="w-7 h-7 rounded-lg bg-black/20 active:bg-black/40 flex items-center justify-center"
                              >
                                <Icon name="Pencil" size={11} className="text-white/90" />
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); handleDelete(plan.id); }}
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
                          {/* Мета-строки */}
                          <div className="flex flex-col gap-0.5 mt-1">
                            {plan.time_from && plan.time_to && (
                              <span className="text-white/75 text-[11px] flex items-center gap-1">
                                <Icon name="Clock" size={9} className="text-white/50 flex-shrink-0" />
                                {plan.time_from}–{plan.time_to}
                              </span>
                            )}
                            {plan.senior_name && (
                              <span className="text-white/75 text-[11px] flex items-center gap-1">
                                <Icon name="User" size={9} className="text-white/50 flex-shrink-0" />
                                <span className="truncate">{plan.senior_name}</span>
                              </span>
                            )}
                            {plan.contact_limit && (
                              <span className="text-white/75 text-[11px] flex items-center gap-1">
                                <Icon name="Users" size={9} className="text-white/50 flex-shrink-0" />
                                {plan.contact_limit} кон.
                              </span>
                            )}
                          </div>

                          {/* Промоутеры на точке */}
                          <div className="mt-2 space-y-1">
                            {(plan.promoters ?? []).map(p => (
                              <button
                                key={p.pp_id}
                                onClick={e => { e.stopPropagation(); setPromoterModalAdd(false); setPromoterModal(plan); }}
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
                              onClick={e => { e.stopPropagation(); setPromoterModalAdd(true); setPromoterModal(plan); }}
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

          {/* Кнопка + */}
          <div className="flex-shrink-0 flex justify-end px-4 py-3 border-t border-slate-700/40 pb-[max(12px,env(safe-area-inset-bottom))]">
            <button
              onClick={() => { setEditingPlan(null); setAddModalOpen(true); }}
              className="w-12 h-12 rounded-full bg-cyan-500 hover:bg-cyan-400 active:scale-95 shadow-lg shadow-cyan-500/30 flex items-center justify-center transition-all"
            >
              <Icon name="Plus" size={22} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {addModalOpen && (
        <PlanOrgModal
          date={date}
          editPlan={editingPlan}
          onSave={handleSave}
          onClose={() => { setAddModalOpen(false); setEditingPlan(null); }}
        />
      )}

      {promoterModal && (
        <PromoterAssignModal
          plan={promoterModal}
          openAddMode={promoterModalAdd}
          onSave={handlePromoterSave}
          onClose={() => { setPromoterModal(null); setPromoterModalAdd(false); }}
        />
      )}
    </>
  );
}