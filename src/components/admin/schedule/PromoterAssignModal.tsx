import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { PlanEntry } from '../tasks/PlanOrgModal';

const PLANNING_API = 'https://functions.poehali.dev/0476e6f3-5f78-4770-9742-11fda4ba89c8';
const WORK_COMMENTS_API = 'https://functions.poehali.dev/1b7f0423-384e-417f-8aea-767e5a1c32b2';

// slot1 → "12:00-16:00", slot2 → "16:00-20:00"
function planTimeToSlotLabel(timeFrom: string | null, timeTo: string | null): string | null {
  if (!timeFrom || !timeTo) return null;
  return `${timeFrom}-${timeTo}`;
}

interface PromoterSlot {
  key: string;
  label: string;
  from: string;
  to: string;
}

interface PromoterOption {
  id: number;
  name: string;
  total_slots: number;
  used_slots: number;
  available: boolean;
  slots: PromoterSlot[];
}

const PLACE_TYPES = ['ТЦ', 'Школа', 'Садик', 'Улица', 'Парк', 'Другое'];

interface PromoterAssignModalProps {
  plan: PlanEntry;
  onSave: (plan: PlanEntry) => void;
  onClose: () => void;
}

export default function PromoterAssignModal({ plan, onSave, onClose }: PromoterAssignModalProps) {
  const [promoters, setPromoters] = useState<PromoterOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedPromoterId, setSelectedPromoterId] = useState<number | null>(plan.promoter_id);
  const [orgName, setOrgName] = useState(plan.promoter_org_name ?? plan.organization_name);
  const [placeType, setPlaceType] = useState(plan.promoter_place_type ?? '');
  const [address, setAddress] = useState(plan.promoter_address ?? '');
  const [leaflets, setLeaflets] = useState<string>(plan.promoter_leaflets != null ? String(plan.promoter_leaflets) : '');

  useEffect(() => {
    fetch(`${PLANNING_API}?action=promoters&date=${plan.date}`)
      .then(r => r.json())
      .then(d => setPromoters(d.promoters || []))
      .finally(() => setLoading(false));
  }, [plan.date]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        id: plan.id,
        promoter_id: selectedPromoterId,
        promoter_org_name: orgName.trim() || null,
        promoter_place_type: placeType || null,
        promoter_address: address.trim() || null,
        promoter_leaflets: leaflets.trim() || null,
      };
      const res = await fetch(PLANNING_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (d.plan) {
        // Синхронизируем данные в карточку расписания (work_location_comments)
        if (selectedPromoterId && selectedPromoter) {
          const slotLabel = planTimeToSlotLabel(plan.time_from, plan.time_to);
          await fetch(WORK_COMMENTS_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_name: selectedPromoter.name,
              work_date: plan.date,
              shift_time: slotLabel,
              organization: orgName.trim() || '',
              location_type: placeType || '',
              location_details: address.trim() || '',
              flyers_comment: leaflets || '',
              location_comment: '',
            }),
          });
        }
        onSave(d.plan);
      }
    } finally {
      setSaving(false);
    }
  };

  const selectedPromoter = promoters.find(p => p.id === selectedPromoterId);

  // Проверяем доступность: если уже назначен этот промоутер — разрешаем (редактирование)
  const isPromoterAvailable = (p: PromoterOption) =>
    p.available || p.id === plan.promoter_id;

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
            <h3 className="text-sm font-bold text-slate-100">Назначить промоутера</h3>
            <p className="text-xs text-slate-500 mt-0.5">{plan.organization_name} · {plan.time_from}–{plan.time_to}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-700/60 transition-all">
            <Icon name="X" size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-5">
          {/* Выбор промоутера */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
              Промоутер
            </label>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Icon name="Loader2" size={20} className="animate-spin text-cyan-400" />
              </div>
            ) : promoters.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">
                <Icon name="UserX" size={24} className="mx-auto mb-2 opacity-40" />
                Нет промоутеров со сменами на этот день
              </div>
            ) : (
              <div className="space-y-2">
                {/* Кнопка "Без промоутера" */}
                <button
                  onClick={() => setSelectedPromoterId(null)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ring-1 transition-all text-left ${
                    selectedPromoterId === null
                      ? 'bg-slate-700/60 ring-slate-500/60 text-slate-200'
                      : 'bg-slate-800/40 ring-slate-700/40 text-slate-500 hover:bg-slate-700/30'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <Icon name="UserMinus" size={13} className="text-slate-400" />
                  </div>
                  <span className="text-sm">Без промоутера</span>
                  {selectedPromoterId === null && <Icon name="Check" size={13} className="ml-auto text-cyan-400" />}
                </button>

                {promoters.map(p => {
                  const available = isPromoterAvailable(p);
                  const isSelected = selectedPromoterId === p.id;
                  return (
                    <button
                      key={p.id}
                      disabled={!available}
                      onClick={() => available && setSelectedPromoterId(p.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ring-1 transition-all text-left ${
                        isSelected
                          ? 'bg-cyan-500/15 ring-cyan-500/40 text-slate-100'
                          : available
                            ? 'bg-slate-800/40 ring-slate-700/40 text-slate-300 hover:bg-slate-700/30'
                            : 'bg-slate-800/20 ring-slate-700/20 text-slate-600 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        isSelected ? 'bg-cyan-500/30 text-cyan-300' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {p.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <div className="flex gap-1 mt-0.5 flex-wrap">
                          {p.slots.map(s => (
                            <span key={s.key} className="text-[10px] text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded">
                              {s.label}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                        {isSelected && <Icon name="Check" size={13} className="text-cyan-400" />}
                        {!available && (
                          <span className="text-[10px] text-red-400/70">занят</span>
                        )}
                        <span className="text-[10px] text-slate-600">
                          {p.used_slots}/{p.total_slots} исп.
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Поля задания — показываем только если промоутер выбран */}
          {selectedPromoterId !== null && (
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Задание для {selectedPromoter?.name ?? ''}
              </p>

              {/* Организация */}
              <div className="relative">
                <input
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  placeholder="Организация"
                  className="w-full h-11 pl-3 pr-10 bg-slate-800/60 ring-1 ring-slate-700/60 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-slate-600 transition-all"
                />
                <Icon name="Building2" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600" />
              </div>

              {/* Тип места */}
              <div className="relative">
                <select
                  value={placeType}
                  onChange={e => setPlaceType(e.target.value)}
                  className="w-full h-11 pl-3 pr-10 bg-slate-800/60 ring-1 ring-slate-700/60 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all appearance-none"
                >
                  <option value="" className="bg-slate-800">Тип места</option>
                  {PLACE_TYPES.map(t => (
                    <option key={t} value={t} className="bg-slate-800">{t}</option>
                  ))}
                </select>
                <Icon name="MapPin" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
              </div>

              {/* Адрес */}
              <div className="relative">
                <input
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Адрес / Детали"
                  className="w-full h-11 pl-3 pr-10 bg-slate-800/60 ring-1 ring-slate-700/60 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-slate-600 transition-all"
                />
                <Icon name="Navigation" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600" />
              </div>

              {/* Листовки */}
              <div className="relative">
                <input
                  type="text"
                  value={leaflets}
                  onChange={e => setLeaflets(e.target.value)}
                  placeholder="Листовки"
                  className="w-full h-11 pl-3 pr-10 bg-slate-800/60 ring-1 ring-slate-700/60 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-slate-600 transition-all"
                />
                <Icon name="FileText" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500/70" />
              </div>
            </div>
          )}
        </div>

        {/* Кнопка сохранить */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-slate-700/40">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-[0.98] disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
          >
            {saving
              ? <><Icon name="Loader2" size={16} className="animate-spin" /> Сохраняю...</>
              : <><Icon name="Check" size={16} /> Сохранить</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}