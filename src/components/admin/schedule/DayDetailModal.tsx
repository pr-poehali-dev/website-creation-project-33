import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { PlanEntry } from '../tasks/PlanOrgModal';
import PlanOrgModal from '../tasks/PlanOrgModal';

const PLANNING_API = 'https://functions.poehali.dev/0476e6f3-5f78-4770-9742-11fda4ba89c8';

const HOURS      = Array.from({ length: 14 }, (_, i) => i + 8); // 8–21
const HOUR_H     = 60;   // px на 1 час
const START_HOUR = 8;

// "HH:MM" → минуты от начала шкалы
function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h - START_HOUR) * 60 + (m || 0);
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
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingPlan, setEditingPlan]   = useState<PlanEntry | null>(null);
  const [deleting, setDeleting]         = useState<number | null>(null);

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

  const totalH = HOUR_H * HOURS.length;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center sm:p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="w-full sm:max-w-sm bg-gradient-to-br from-slate-900 to-slate-800 sm:rounded-2xl rounded-t-2xl shadow-2xl ring-1 ring-slate-700/60 flex flex-col"
          style={{ maxHeight: 'min(92dvh, 680px)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Ручка мобайл */}
          <div className="flex justify-center pt-2.5 pb-1 sm:hidden flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-slate-600" />
          </div>

          {/* Шапка */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 flex-shrink-0">
            <h3 className="text-sm font-bold text-slate-100 capitalize">{fmtDate(date)}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-700/60 transition-all"
            >
              <Icon name="X" size={16} />
            </button>
          </div>

          {/* Временная шкала */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="relative" style={{ height: totalH }}>

              {/* Линии часов */}
              {HOURS.map((h, i) => (
                <div key={h} className="absolute left-0 right-0 flex items-start" style={{ top: i * HOUR_H }}>
                  <span className="w-14 flex-shrink-0 text-right pr-3 text-[11px] text-slate-600 leading-none pt-1 select-none">
                    {h}:00
                  </span>
                  <div className="flex-1 border-t border-slate-700/40 mt-[3px]" />
                </div>
              ))}

              {/* Пустое состояние */}
              {plans.length === 0 && (
                <div
                  className="absolute left-14 right-3 flex flex-col items-center justify-center text-slate-600"
                  style={{ top: HOUR_H * 2, height: HOUR_H * 4 }}
                >
                  <Icon name="CalendarDays" size={28} className="mb-2 opacity-30" />
                  <span className="text-xs">Нет организаций — нажми +</span>
                </div>
              )}

              {/* Карточки — позиционируем по времени */}
              {plans.map((plan, idx) => {
                const hasTime = plan.time_from && plan.time_to;
                let top: number;
                let height: number;

                if (hasTime) {
                  const mFrom = toMinutes(plan.time_from!);
                  const mTo   = toMinutes(plan.time_to!);
                  top    = (mFrom / 60) * HOUR_H;
                  height = Math.max(((mTo - mFrom) / 60) * HOUR_H - 4, 44);
                } else {
                  // без времени — стек сверху
                  top    = idx * 68 + 4;
                  height = 60;
                }

                return (
                  <div
                    key={plan.id}
                    className="absolute left-14 right-3"
                    style={{ top, height }}
                  >
                    <div
                      className="h-full rounded-xl px-3 py-2 shadow-md ring-1 ring-white/10 flex items-center gap-2 overflow-hidden"
                      style={{ backgroundColor: plan.color }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm leading-tight truncate">
                          {plan.organization_name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {plan.time_from && plan.time_to && (
                            <span className="text-white/80 text-xs flex items-center gap-1">
                              <Icon name="Clock" size={9} className="text-white/60 flex-shrink-0" />
                              {plan.time_from} – {plan.time_to}
                            </span>
                          )}
                          {plan.senior_name && (
                            <span className="text-white/80 text-xs flex items-center gap-1">
                              <Icon name="User" size={9} className="text-white/60 flex-shrink-0" />
                              <span className="truncate max-w-[90px]">{plan.senior_name}</span>
                            </span>
                          )}
                          {plan.contact_limit && (
                            <span className="text-white/80 text-xs flex items-center gap-1">
                              <Icon name="Users" size={9} className="text-white/60 flex-shrink-0" />
                              {plan.contact_limit} кон.
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => { setEditingPlan(plan); setAddModalOpen(true); }}
                          className="w-8 h-8 rounded-lg bg-black/20 active:bg-black/40 flex items-center justify-center"
                        >
                          <Icon name="Pencil" size={13} className="text-white/90" />
                        </button>
                        <button
                          onClick={() => handleDelete(plan.id)}
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
                  </div>
                );
              })}
            </div>
          </div>

          {/* Кнопка + */}
          <div className="flex-shrink-0 flex justify-end px-4 py-3 border-t border-slate-700/40">
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
    </>
  );
}
