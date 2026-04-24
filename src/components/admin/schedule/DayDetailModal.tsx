import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { PlanEntry } from '../tasks/PlanOrgModal';
import PlanOrgModal from '../tasks/PlanOrgModal';
import PromoterAssignModal from './PromoterAssignModal';
import { PLANNING_API, WORK_COMMENTS_API, computeLayout } from './dayDetailUtils';
import DayDetailHeader from './DayDetailHeader';
import DayDetailMobileList from './DayDetailMobileList';
import DayDetailTimeline from './DayDetailTimeline';

interface DayDetailModalProps {
  date: string;
  plans: PlanEntry[];
  onSave: (plan: PlanEntry) => void;
  onDelete: (id: number) => void;
  onClose: () => void;
}

export default function DayDetailModal({ date, plans, onSave, onDelete, onClose }: DayDetailModalProps) {
  const [addModalOpen, setAddModalOpen]           = useState(false);
  const [editingPlan, setEditingPlan]             = useState<PlanEntry | null>(null);
  const [deleting, setDeleting]                   = useState<number | null>(null);
  const [promoterModal, setPromoterModal]         = useState<PlanEntry | null>(null);
  const [promoterModalAdd, setPromoterModalAdd]   = useState(false);
  const [totalSlots, setTotalSlots]               = useState<number | null>(null);

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

  const usedSlots = plans.reduce((sum, plan) => sum + (plan.promoters ?? []).length, 0);

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      const plan = plans.find(p => p.id === id);
      await fetch(`${PLANNING_API}?id=${id}`, { method: 'DELETE' });
      onDelete(id);
      if (plan && (plan.promoters ?? []).length > 0) {
        const date = new Date(plan.date);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        await Promise.all((plan.promoters ?? []).map(p => {
          let shiftTime: string | null = null;
          if (p.time_slot === 'slot1') shiftTime = isWeekend ? '11:00-15:00' : '12:00-16:00';
          else if (p.time_slot === 'slot2') shiftTime = isWeekend ? '15:00-19:00' : '16:00-20:00';
          else if (plan.time_from && plan.time_to) shiftTime = `${plan.time_from}-${plan.time_to}`;
          return fetch(WORK_COMMENTS_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_name: p.promoter_name,
              work_date: plan.date,
              shift_time: shiftTime,
              organization: '',
              location_type: '',
              location_details: '',
              flyers_comment: '',
              location_comment: '',
            }),
          });
        }));
      }
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

  const layout = computeLayout(plans);

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
          <DayDetailHeader
            date={date}
            usedSlots={usedSlots}
            totalSlots={totalSlots}
            onClose={onClose}
          />

          <DayDetailMobileList
            plans={plans}
            deleting={deleting}
            onEdit={plan => { setEditingPlan(plan); setAddModalOpen(true); }}
            onDelete={handleDelete}
            onPromoterClick={plan => { setPromoterModalAdd(false); setPromoterModal(plan); }}
            onPromoterAdd={plan => { setPromoterModalAdd(true); setPromoterModal(plan); }}
          />

          <DayDetailTimeline
            plans={plans}
            layout={layout}
            deleting={deleting}
            onEdit={plan => { setEditingPlan(plan); setAddModalOpen(true); }}
            onDelete={handleDelete}
            onPromoterClick={plan => { setPromoterModalAdd(false); setPromoterModal(plan); }}
            onPromoterAdd={plan => { setPromoterModalAdd(true); setPromoterModal(plan); }}
          />

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
