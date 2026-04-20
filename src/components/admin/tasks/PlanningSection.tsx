import { useState, useEffect } from 'react';
import { getMoscowDate, getWeekDates, getWeekLabel } from './utils';
import WeekNavigation from './WeekNavigation';
import WeekCalendarGrid from './WeekCalendarGrid';
import PlanOrgModal, { PlanEntry } from './PlanOrgModal';
import Icon from '@/components/ui/icon';

const PLANNING_API = 'https://functions.poehali.dev/0476e6f3-5f78-4770-9742-11fda4ba89c8';

export default function PlanningSection() {
  const [plans, setPlans]           = useState<PlanEntry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const todayStr = getMoscowDate();
  const weekDates = getWeekDates(weekOffset);

  // Модалка
  const [modalDate, setModalDate]     = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<PlanEntry | null>(null);

  // Загрузка планов на текущую неделю
  const loadPlans = async (dates: string[]) => {
    setLoading(true);
    try {
      const from = dates[0];
      const to = dates[dates.length - 1];
      const d = await (await fetch(`${PLANNING_API}?date_from=${from}&date_to=${to}`)).json();
      setPlans(d.plans || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPlans(weekDates); }, [weekOffset]);

  const handleDateClick = (date: string) => {
    setEditingPlan(null);
    setModalDate(date);
  };

  const handleEditPlan = (plan: PlanEntry) => {
    setEditingPlan(plan);
    setModalDate(plan.date);
  };

  const handleSave = (plan: PlanEntry) => {
    setPlans(prev => {
      const exists = prev.find(p => p.id === plan.id);
      if (exists) return prev.map(p => p.id === plan.id ? plan : p);
      return [...prev, plan];
    });
    setModalDate(null);
    setEditingPlan(null);
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`${PLANNING_API}?id=${id}`, { method: 'DELETE' });
    } catch { /* ignore */ }
    setPlans(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-100">Планирование на неделю</h3>
        {loading && <Icon name="Loader2" size={16} className="animate-spin text-cyan-400" />}
      </div>

      <WeekNavigation
        weekOffset={weekOffset}
        weekLabel={getWeekLabel(weekDates)}
        onPrevious={() => setWeekOffset(weekOffset - 1)}
        onNext={() => setWeekOffset(weekOffset + 1)}
      />

      <WeekCalendarGrid
        weekDates={weekDates}
        todayStr={todayStr}
        plans={plans}
        onDateClick={handleDateClick}
        onEditPlan={handleEditPlan}
        onDeletePlan={handleDelete}
      />

      {/* Легенда */}
      {plans.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {Array.from(new Map(plans.map(p => [p.organization_id, p])).values()).map(p => (
            <div key={p.organization_id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800/40 ring-1 ring-slate-700/40 text-xs text-slate-400">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: p.color }} />
              {p.organization_name}
            </div>
          ))}
        </div>
      )}

      {modalDate && (
        <PlanOrgModal
          date={modalDate}
          editPlan={editingPlan}
          onSave={handleSave}
          onClose={() => { setModalDate(null); setEditingPlan(null); }}
        />
      )}
    </div>
  );
}
