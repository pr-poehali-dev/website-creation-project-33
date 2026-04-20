import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { PlanEntry } from '../tasks/PlanOrgModal';

const PLANNING_API = 'https://functions.poehali.dev/0476e6f3-5f78-4770-9742-11fda4ba89c8';
const WORK_COMMENTS_API = 'https://functions.poehali.dev/1b7f0423-384e-417f-8aea-767e5a1c32b2';

function planTimeToSlotLabel(timeFrom: string | null, timeTo: string | null): string | null {
  if (!timeFrom || !timeTo) return null;
  return `${timeFrom}-${timeTo}`;
}

interface PromoterSlot { key: string; label: string; from: string; to: string; }

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
}

const PLACE_TYPES = ['ТЦ', 'Школа', 'Садик', 'Улица', 'Парк', 'Другое'];

interface PromoterAssignModalProps {
  plan: PlanEntry;
  openAddMode?: boolean;
  onSave: (plan: PlanEntry) => void;
  onClose: () => void;
}

// Форма одного промоутера
function PromoterForm({
  assigned,
  availablePromoters,
  onSave,
  onRemove,
  isSaving,
  isNew,
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
    onSave({ promoter_id: promoterId, org_name: orgName || null, place_type: placeType || null, address: address || null, leaflets: leaflets || null });
  };

  // Доступные для выбора — те у кого есть слоты, плюс текущий
  const choices = availablePromoters.filter(p => p.available || p.id === assigned.promoter_id);

  return (
    <div className="bg-slate-800/50 rounded-xl ring-1 ring-slate-700/50 p-3 space-y-2">
      {/* Выбор промоутера + кнопка удалить */}
      <div className="flex items-center gap-2">
        <select
          value={promoterId}
          onChange={e => setPromoterId(Number(e.target.value))}
          className="flex-1 h-9 pl-2 pr-8 bg-slate-700/60 ring-1 ring-slate-600/60 text-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all appearance-none"
        >
          {choices.map(p => (
            <option key={p.id} value={p.id} className="bg-slate-800">{p.name}</option>
          ))}
          {/* Текущий если не в списке */}
          {!choices.find(p => p.id === assigned.promoter_id) && (
            <option value={assigned.promoter_id} className="bg-slate-800">{assigned.promoter_name}</option>
          )}
        </select>
        <button
          onClick={onRemove}
          className="w-9 h-9 rounded-lg bg-red-500/10 hover:bg-red-500/25 flex items-center justify-center flex-shrink-0 transition-all"
        >
          <Icon name="Trash2" size={13} className="text-red-400" />
        </button>
      </div>

      {/* Организация */}
      <div className="relative">
        <input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Организация"
          className="w-full h-9 pl-3 pr-9 bg-slate-700/40 ring-1 ring-slate-600/40 text-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-slate-600 transition-all" />
        <Icon name="Building2" size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
      </div>

      {/* Тип места */}
      <div className="relative">
        <select value={placeType} onChange={e => setPlaceType(e.target.value)}
          className="w-full h-9 pl-3 pr-9 bg-slate-700/40 ring-1 ring-slate-600/40 text-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all appearance-none">
          <option value="" className="bg-slate-800">Тип места</option>
          {PLACE_TYPES.map(t => <option key={t} value={t} className="bg-slate-800">{t}</option>)}
        </select>
        <Icon name="MapPin" size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
      </div>

      {/* Адрес */}
      <div className="relative">
        <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Адрес / Детали"
          className="w-full h-9 pl-3 pr-9 bg-slate-700/40 ring-1 ring-slate-600/40 text-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-slate-600 transition-all" />
        <Icon name="Navigation" size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
      </div>

      {/* Листовки */}
      <div className="relative">
        <input value={leaflets} onChange={e => setLeaflets(e.target.value)} placeholder="Листовки"
          className="w-full h-9 pl-3 pr-9 bg-slate-700/40 ring-1 ring-slate-600/40 text-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-slate-600 transition-all" />
        <Icon name="FileText" size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-500/70" />
      </div>

      {(isDirty || isNew) && (
        <button onClick={handleSave} disabled={isSaving}
          className="w-full h-9 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition-all">
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
    const slotLabel = planTimeToSlotLabel(plan.time_from, plan.time_to);
    await fetch(WORK_COMMENTS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_name: promoterName,
        work_date: plan.date,
        shift_time: slotLabel,
        organization: data.org_name || '',
        location_type: data.place_type || '',
        location_details: data.address || '',
        flyers_comment: data.leaflets || '',
        location_comment: '',
      }),
    });
  };

  const handleUpdatePromoter = async (pp_id: number, data: Partial<AssignedPromoter>) => {
    setSavingId(pp_id);
    try {
      const res = await fetch(PLANNING_API + '?action=update_promoter', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pp_id, ...data }),
      });
      const d = await res.json();
      if (d.plan) {
        setAssigned(d.plan.promoters || []);
        onSave(d.plan);
        // Синхронизируем с расписанием
        const promoter = availablePromoters.find(p => p.id === (data.promoter_id ?? assigned.find(a => a.pp_id === pp_id)?.promoter_id));
        if (promoter) await syncWorkComments(promoter.name, data);
      }
    } finally {
      setSavingId(null);
    }
  };

  const handleAddPromoter = async (data: Partial<AssignedPromoter>) => {
    if (!data.promoter_id) return;
    setSavingId('new');
    try {
      const res = await fetch(PLANNING_API + '?action=add_promoter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    } finally {
      setSavingId(null);
    }
  };

  const handleRemovePromoter = async (pp_id: number) => {
    setSavingId(pp_id);
    try {
      const res = await fetch(`${PLANNING_API}?action=remove_promoter&pp_id=${pp_id}`, { method: 'DELETE' });
      const d = await res.json();
      if (d.plan) {
        setAssigned(d.plan.promoters || []);
        onSave(d.plan);
      }
    } finally {
      setSavingId(null);
    }
  };

  const handleShowAdd = () => {
    setShowAddForm(true);
    setNewPromoter(null); // список выбора, не форма
  };

  const handlePickPromoter = (p: PromoterOption) => {
    setNewPromoter({
      pp_id: -1,
      promoter_id: p.id,
      promoter_name: p.name,
      org_name: plan.organization_name,
      place_type: null,
      address: null,
      leaflets: null,
    });
  };

  const hasAvailableToAdd = availablePromoters.some(p => p.available);

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col justify-end sm:justify-center sm:items-center sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-gradient-to-br from-slate-900 to-slate-800 sm:rounded-2xl rounded-t-2xl shadow-2xl ring-1 ring-slate-700/60 flex flex-col max-h-[92dvh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Ручка */}
        <div className="flex justify-center pt-2.5 pb-1 sm:hidden flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-600" />
        </div>

        {/* Шапка */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-700/50 flex-shrink-0">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Промоутеры на точке</h3>
            <p className="text-xs text-slate-500 mt-0.5">{plan.organization_name} · {plan.time_from}–{plan.time_to}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-700/60 transition-all">
            <Icon name="X" size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Icon name="Loader2" size={20} className="animate-spin text-cyan-400" />
            </div>
          ) : (
            <>
              {/* Список назначенных */}
              {assigned.length === 0 && !showAddForm && (
                <div className="text-center py-6 text-slate-500 text-sm">
                  <Icon name="UserX" size={24} className="mx-auto mb-2 opacity-40" />
                  Нет назначенных промоутеров
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

              {/* Выбор промоутера из списка */}
              {showAddForm && !newPromoter && (
                <div className="bg-slate-800/50 rounded-xl ring-1 ring-slate-700/50 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/40">
                    <span className="text-xs font-semibold text-slate-400">Выбери промоутера</span>
                    <button onClick={() => setShowAddForm(false)} className="text-slate-600 hover:text-slate-400">
                      <Icon name="X" size={13} />
                    </button>
                  </div>
                  {availablePromoters.filter(p => p.available).map(p => (
                    <button
                      key={p.id}
                      onClick={() => handlePickPromoter(p)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700/40 transition-all text-left border-b border-slate-700/20 last:border-0"
                    >
                      <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-300 flex-shrink-0">
                        {p.name.charAt(0)}
                      </div>
                      <span className="text-sm text-slate-200 flex-1">{p.name}</span>
                      <div className="flex gap-1 flex-shrink-0">
                        {p.slots.map(s => (
                          <span key={s.key} className="text-[10px] text-slate-500 bg-slate-700/60 px-1.5 py-0.5 rounded">
                            {s.label}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Форма нового промоутера (после выбора из списка) */}
              {showAddForm && newPromoter && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <button onClick={() => setNewPromoter(null)} className="text-slate-600 hover:text-slate-400">
                      <Icon name="ChevronLeft" size={14} />
                    </button>
                    <p className="text-[11px] font-semibold text-cyan-400/80 uppercase tracking-wider">
                      {newPromoter.promoter_name}
                    </p>
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

              {/* Кнопка добавить ещё — только в режиме добавления */}
              {!showAddForm && hasAvailableToAdd && openAddMode && (
                <button
                  onClick={handleShowAdd}
                  className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-slate-800/40 hover:bg-slate-700/50 ring-1 ring-dashed ring-slate-600/50 text-slate-400 hover:text-slate-300 text-sm transition-all"
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