import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { PlanEntry } from '../tasks/PlanOrgModal';

const PLANNING_API = 'https://functions.poehali.dev/0476e6f3-5f78-4770-9742-11fda4ba89c8';
const WORK_COMMENTS_API = 'https://functions.poehali.dev/1b7f0423-384e-417f-8aea-767e5a1c32b2';

function planTimeToSlotLabel(timeFrom: string | null, timeTo: string | null): string | null {
  if (!timeFrom || !timeTo) return null;
  return `${timeFrom}-${timeTo}`;
}

interface PromoterSlot { key: string; label: string; from: string; to: string; used: boolean; }

interface PromoterOption {
  id: number;
  name: string;
  total_slots: number;
  used_slots: number;
  available: boolean;
  slots: PromoterSlot[];
}

interface AssignedPromoter {
  pp_id: number;
  promoter_id: number;
  promoter_name: string;
  org_name: string | null;
  place_type: string | null;
  address: string | null;
  leaflets: string | null;
  time_slot: string | null;
}

const PLACE_TYPES = ['ТЦ', 'Школа', 'Садик', 'Улица', 'Парк', 'Другое'];

interface PromoterAssignModalProps {
  plan: PlanEntry;
  openAddMode?: boolean;
  onSave: (plan: PlanEntry) => void;
  onClose: () => void;
}

const inputCls = "w-full h-9 px-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-gray-400 transition-all";

function PromoterForm({
  assigned, availablePromoters, onSave, onRemove, isSaving, isNew,
}: {
  assigned: AssignedPromoter;
  availablePromoters: PromoterOption[];
  onSave: (data: Partial<AssignedPromoter>) => void;
  onRemove: () => void;
  isSaving: boolean;
  isNew?: boolean;
}) {
  const [promoterId, setPromoterId] = useState(assigned.promoter_id);
  const [orgName, setOrgName] = useState(assigned.org_name ?? '');
  const [placeType, setPlaceType] = useState(assigned.place_type ?? '');
  const [address, setAddress] = useState(assigned.address ?? '');
  const [leaflets, setLeaflets] = useState(assigned.leaflets ?? '');

  const isDirty =
    promoterId !== assigned.promoter_id ||
    orgName !== (assigned.org_name ?? '') ||
    placeType !== (assigned.place_type ?? '') ||
    address !== (assigned.address ?? '') ||
    leaflets !== (assigned.leaflets ?? '');

  const handleSave = () => {
    onSave({ promoter_id: promoterId, org_name: orgName || null, place_type: placeType || null, address: address || null, leaflets: leaflets || null, time_slot: assigned.time_slot });
  };

  const choices = availablePromoters.filter(p => p.available || p.id === assigned.promoter_id);

  return (
    <div className="bg-gray-50 rounded-2xl border border-gray-100 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <select
          value={promoterId}
          onChange={e => setPromoterId(Number(e.target.value))}
          className="flex-1 h-9 pl-3 pr-8 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm focus:outline-none focus:border-blue-400 appearance-none"
        >
          {choices.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          {!choices.find(p => p.id === assigned.promoter_id) && (
            <option value={assigned.promoter_id}>{assigned.promoter_name}</option>
          )}
        </select>
        <button onClick={onRemove} className="w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 border border-red-100 flex items-center justify-center flex-shrink-0 transition-all">
          <Icon name="Trash2" size={13} className="text-red-400" />
        </button>
      </div>

      <div className="relative">
        <input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Организация" className={inputCls} />
        <Icon name="Building2" size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
      </div>

      <div className="relative">
        <select value={placeType} onChange={e => setPlaceType(e.target.value)}
          className="w-full h-9 pl-3 pr-9 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm focus:outline-none focus:border-blue-400 appearance-none">
          <option value="">Тип места</option>
          {PLACE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <Icon name="MapPin" size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
      </div>

      <div className="relative">
        <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Адрес / Детали" className={inputCls} />
        <Icon name="Navigation" size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
      </div>

      <div className="relative">
        <input value={leaflets} onChange={e => setLeaflets(e.target.value)} placeholder="Листовки" className={inputCls} />
        <Icon name="FileText" size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none" />
      </div>

      {(isDirty || isNew) && (
        <button onClick={handleSave} disabled={isSaving}
          className="w-full h-9 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition-all">
          {isSaving ? <Icon name="Loader2" size={13} className="animate-spin" /> : <Icon name="Check" size={13} />}
          {isNew ? 'Добавить' : 'Сохранить'}
        </button>
      )}
    </div>
  );
}

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
      const date = new Date(plan.date);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      if (data.time_slot === 'slot1') slotLabel = isWeekend ? '11:00-15:00' : '12:00-16:00';
      else if (data.time_slot === 'slot2') slotLabel = isWeekend ? '15:00-19:00' : '16:00-20:00';
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
                <div className="space-y-1.5">
                  {availablePromoters.length === 0 && (
                    <p className="text-center text-xs text-gray-400 py-4">Нет промоутеров со сменами на этот день</p>
                  )}
                  {availablePromoters.map(p => {
                    const freeSlots = p.slots.filter(s => !s.used);
                    const allBusy = freeSlots.length === 0;
                    return (
                      <div
                        key={p.id}
                        onClick={() => !allBusy && handlePickPromoter(p)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition-all ${
                          allBusy
                            ? 'opacity-40 border-gray-100 bg-gray-50 cursor-not-allowed'
                            : 'border-gray-100 bg-white hover:bg-gray-50 hover:border-gray-200 cursor-pointer shadow-sm'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${allBusy ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600'}`}>
                          {p.name.charAt(0)}
                        </div>
                        <span className={`text-sm font-medium flex-1 ${allBusy ? 'text-gray-400' : 'text-gray-700'}`}>{p.name}</span>
                        <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                          {p.slots.map(s => (
                            s.used ? (
                              <span key={s.key} className="text-[10px] text-gray-300 bg-gray-100 px-2 py-1 rounded-lg line-through">
                                {s.label}
                              </span>
                            ) : (
                              <button
                                key={s.key}
                                onClick={() => handlePickPromoter(p, s.key)}
                                className="text-[10px] text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded-lg transition-all font-semibold"
                              >
                                {s.label}
                              </button>
                            )
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
