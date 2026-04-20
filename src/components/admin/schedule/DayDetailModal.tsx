import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { PlanEntry } from '../tasks/PlanOrgModal';
import PlanOrgModal from '../tasks/PlanOrgModal';

const PLANNING_API = 'https://functions.poehali.dev/0476e6f3-5f78-4770-9742-11fda4ba89c8';

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8:00 — 21:00

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
    await fetch(`${PLANNING_API}?id=${id}`, { method: 'DELETE' });
    onDelete(id);
    setDeleting(null);
  };

  const handleSave = (plan: PlanEntry) => {
    onSave(plan);
    setAddModalOpen(false);
    setEditingPlan(null);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center sm:p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="w-full sm:max-w-sm bg-gradient-to-br from-slate-900 to-slate-800 sm:rounded-2xl rounded-t-2xl shadow-2xl ring-1 ring-slate-700/60 flex flex-col max-h-[92dvh] sm:max-h-[85vh]"
          onClick={e => e.stopPropagation()}
        >
          {/* Ручка мобайл */}
          <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
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

          {/* Тело: временная шкала + карточки */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="relative px-0 py-0">
              {/* Временная шкала */}
              {HOURS.map(h => (
                <div key={h} className="flex items-start" style={{ minHeight: 52 }}>
                  <span className="w-12 flex-shrink-0 text-right pr-3 pt-0 text-[11px] text-slate-600 leading-none mt-0 pt-1">
                    {h}:00
                  </span>
                  <div className="flex-1 border-t border-slate-700/40 min-h-[52px]" />
                </div>
              ))}

              {/* Карточки организаций поверх шкалы */}
              <div className="absolute top-0 left-12 right-3 pointer-events-none">
                {plans.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-600 text-sm">
                    <Icon name="CalendarDays" size={32} className="mb-2 opacity-40" />
                    Нет запланированных организаций
                  </div>
                )}
                {plans.map((plan, idx) => {
                  // Раскладываем карточки по вертикали — без реального времени, просто стекаем
                  const top = 8 + idx * 90;
                  return (
                    <div
                      key={plan.id}
                      className="absolute left-0 right-0 pointer-events-auto mx-0"
                      style={{ top }}
                    >
                      <div
                        className="rounded-xl px-3 py-2.5 shadow-lg ring-1 ring-white/10"
                        style={{ backgroundColor: plan.color }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-bold text-sm leading-tight truncate">
                              {plan.organization_name}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {plan.senior_name && (
                                <span className="text-white/80 text-xs flex items-center gap-1">
                                  <Icon name="User" size={10} className="text-white/60" />
                                  {plan.senior_name}
                                </span>
                              )}
                              {plan.contact_limit && (
                                <span className="text-white/80 text-xs flex items-center gap-1">
                                  <Icon name="Users" size={10} className="text-white/60" />
                                  {plan.contact_limit} кон.
                                </span>
                              )}
                            </div>
                            {plan.notes && (
                              <p className="text-white/60 text-xs mt-1 line-clamp-1">{plan.notes}</p>
                            )}
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => { setEditingPlan(plan); setAddModalOpen(true); }}
                              className="w-7 h-7 rounded-lg bg-black/20 hover:bg-black/40 flex items-center justify-center transition-all"
                            >
                              <Icon name="Pencil" size={12} className="text-white/80" />
                            </button>
                            <button
                              onClick={() => handleDelete(plan.id)}
                              disabled={deleting === plan.id}
                              className="w-7 h-7 rounded-lg bg-black/20 hover:bg-red-500/60 flex items-center justify-center transition-all disabled:opacity-50"
                            >
                              {deleting === plan.id
                                ? <Icon name="Loader2" size={12} className="text-white/80 animate-spin" />
                                : <Icon name="Trash2" size={12} className="text-white/80" />
                              }
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* FAB кнопка + */}
          <div className="relative flex-shrink-0 h-16">
            <button
              onClick={() => { setEditingPlan(null); setAddModalOpen(true); }}
              className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-cyan-500 hover:bg-cyan-400 active:scale-95 shadow-lg shadow-cyan-500/30 flex items-center justify-center transition-all"
            >
              <Icon name="Plus" size={22} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Модалка добавления/редактирования */}
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
