import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { PlanEntry } from '../tasks/PlanOrgModal';
import {
  PLANNING_API, WORK_COMMENTS_API,
  AssignedPromoter, PromoterOption, PromoterAssignModalProps,
  planTimeToSlotLabel,
} from './promoterAssignTypes';
import PromoterForm from './PromoterForm';
import PromoterPickList from './PromoterPickList';

export default function PromoterAssignModal({ plan, openAddMode = false, onSave, onClose }: PromoterAssignModalProps) {
  const [availablePromoters, setAvailablePromoters] = useState<PromoterOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigned, setAssigned] = useState<AssignedPromoter[]>(plan.promoters ?? []);
  const [savingId, setSavingId] = useState<number | 'new' | null>(null);
  const [showAddForm, setShowAddForm] = useState(openAddMode);
  const [newPromoter, setNewPromoter] = useState<AssignedPromoter | null>(null);

  useEffect(() => {
    fetch(`${PLANNING_API}?action=promoters&date=${plan.date}`)
      .then(r => r.json())
      .then(d => setAvailablePromoters(d.promoters || []))
      .finally(() => setLoading(false));
  }, [plan.date]);

  const syncWorkComments = async (promoterName: string, data: Partial<AssignedPromoter>) => {
    let slotLabel: string | null = null;
    if (data.time_slot) {
      if (data.time_slot === 'slot1') slotLabel = '12:00-16:00';
      else if (data.time_slot === 'slot2') slotLabel = '16:00-20:00';
    }
    if (!slotLabel) slotLabel = planTimeToSlotLabel(plan.time_from, plan.time_to);
    await fetch(WORK_COMMENTS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_name: promoterName, work_date: plan.date, shift_time: slotLabel,
        organization: data.org_name || '', location_type: data.place_type || '',
        location_details: data.address || '', flyers_comment: data.leaflets || '',
        location_comment: '',
      }),
    });
  };

  const handleUpdatePromoter = async (pp_id: number, data: Partial<AssignedPromoter>) => {
    setSavingId(pp_id);
    try {
      const res = await fetch(PLANNING_API + '?action=update_promoter', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pp_id, ...data }),
      });
      const d = await res.json();
      if (d.plan) {
        setAssigned(d.plan.promoters || []);
        onSave(d.plan);
        const promoter = availablePromoters.find(p => p.id === (data.promoter_id ?? assigned.find(a => a.pp_id === pp_id)?.promoter_id));
        if (promoter) await syncWorkComments(promoter.name, data);
      }
    } finally { setSavingId(null); }
  };

  const handleAddPromoter = async (data: Partial<AssignedPromoter>) => {
    if (!data.promoter_id) return;
    setSavingId('new');
    try {
      const res = await fetch(PLANNING_API + '?action=add_promoter', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: plan.id, ...data }),
      });
      const d = await res.json();
      if (d.plan) {
        setAssigned(d.plan.promoters || []);
        onSave(d.plan);
        setShowAddForm(false);
        setNewPromoter(null);
        const promoter = availablePromoters.find(p => p.id === data.promoter_id);
        if (promoter) await syncWorkComments(promoter.name, data);
      }
    } finally { setSavingId(null); }
  };

  const handleRemovePromoter = async (pp_id: number) => {
    setSavingId(pp_id);
    try {
      const removedPromoter = assigned.find(a => a.pp_id === pp_id);
      const res = await fetch(`${PLANNING_API}?action=remove_promoter&pp_id=${pp_id}`, { method: 'DELETE' });
      const d = await res.json();
      if (d.plan) {
        setAssigned(d.plan.promoters || []);
        onSave(d.plan);
        if (removedPromoter) {
          await syncWorkComments(removedPromoter.promoter_name, {
            time_slot: removedPromoter.time_slot, org_name: '', place_type: '', address: '', leaflets: '',
          });
        }
      }
    } finally { setSavingId(null); }
  };

  const handlePickPromoter = (p: PromoterOption, slotKey?: string) => {
    const chosenSlotKey = slotKey ?? p.slots.find(s => !s.used)?.key ?? null;
    setNewPromoter({
      pp_id: -1, promoter_id: p.id, promoter_name: p.name,
      org_name: plan.organization_name, place_type: null, address: null, leaflets: null,
      time_slot: chosenSlotKey,
    });
  };

  const hasAvailableToAdd = availablePromoters.some(p => p.available);

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col justify-center items-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col"
        style={{ maxHeight: 'min(92dvh, 680px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Шапка */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="text-sm font-bold text-gray-800">{openAddMode ? 'Выберите промоутера' : 'Промоутеры на точке'}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{plan.organization_name} · {plan.time_from}–{plan.time_to}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
            <Icon name="X" size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Icon name="Loader2" size={20} className="animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              {/* Список назначенных */}
              {!openAddMode && (
                <>
                  {assigned.length === 0 && !showAddForm && (
                    <div className="text-center py-6 text-gray-300 text-sm">
                      <Icon name="UserX" size={24} className="mx-auto mb-2" />
                      <span className="text-gray-400">Нет назначенных промоутеров</span>
                    </div>
                  )}
                  {assigned.map(a => (
                    <PromoterForm
                      key={a.pp_id}
                      assigned={a}
                      availablePromoters={availablePromoters}
                      onSave={data => handleUpdatePromoter(a.pp_id, data)}
                      onRemove={() => handleRemovePromoter(a.pp_id)}
                      isSaving={savingId === a.pp_id}
                    />
                  ))}
                </>
              )}

              {/* Выбор промоутера из списка */}
              {showAddForm && !newPromoter && (
                <PromoterPickList
                  availablePromoters={availablePromoters}
                  organizationName={plan.organization_name}
                  onPick={handlePickPromoter}
                />
              )}

              {/* Форма нового промоутера */}
              {showAddForm && newPromoter && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <button onClick={() => setNewPromoter(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                      <Icon name="ChevronLeft" size={16} />
                    </button>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-700">{newPromoter.promoter_name}</p>
                      {newPromoter.time_slot && (
                        <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">
                          {newPromoter.time_slot === 'slot1' ? '12:00–16:00' : '16:00–20:00'}
                        </span>
                      )}
                    </div>
                  </div>
                  <PromoterForm
                    assigned={newPromoter}
                    availablePromoters={availablePromoters}
                    onSave={handleAddPromoter}
                    onRemove={() => { setShowAddForm(false); setNewPromoter(null); }}
                    isSaving={savingId === 'new'}
                    isNew
                  />
                </div>
              )}

              {/* Кнопка добавить ещё */}
              {!showAddForm && hasAvailableToAdd && openAddMode && (
                <button
                  onClick={() => { setShowAddForm(true); setNewPromoter(null); }}
                  className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-200 text-gray-400 hover:text-gray-600 text-sm transition-all"
                >
                  <Icon name="UserPlus" size={14} />
                  Добавить промоутера
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
