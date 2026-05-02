import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

const PLANNING_API = 'https://functions.poehali.dev/0476e6f3-5f78-4770-9742-11fda4ba89c8';

interface OrgOption { id: number; name: string; }
interface SeniorOption { id: number; name: string; }

export interface PlanPromoter {
  pp_id: number;
  promoter_id: number;
  promoter_name: string;
  org_name: string | null;
  place_type: string | null;
  address: string | null;
  leaflets: string | null;
  time_slot: string | null;
}

export interface PlanEntry {
  id: number;
  organization_id: number;
  organization_name: string;
  date: string;
  senior_id: number | null;
  senior_name: string | null;
  color: string;
  contact_limit: number | null;
  notes: string | null;
  time_from: string | null;
  time_to: string | null;
  promoters: PlanPromoter[];
  promoter_id: number | null;
  promoter_name: string | null;
  promoter_org_name: string | null;
  promoter_place_type: string | null;
  promoter_address: string | null;
  promoter_leaflets: string | null;
}

const PRESET_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
  '#6366f1', '#14b8a6',
];

const TIME_PRESETS = [
  { label: '12:00 – 16:00', from: '12:00', to: '16:00' },
  { label: '16:00 – 20:00', from: '16:00', to: '20:00' },
];

interface PlanOrgModalProps {
  date: string;
  editPlan?: PlanEntry | null;
  onSave: (plan: PlanEntry) => void;
  onClose: () => void;
}

export default function PlanOrgModal({ date, editPlan, onSave, onClose }: PlanOrgModalProps) {
  const [orgs, setOrgs]       = useState<OrgOption[]>([]);
  const [seniors, setSeniors] = useState<SeniorOption[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);

  const [orgId, setOrgId]               = useState<number | ''>(editPlan?.organization_id ?? '');
  const [seniorId, setSeniorId]         = useState<number | ''>(editPlan?.senior_id ?? '');
  const [color, setColor]               = useState(editPlan?.color ?? '#3b82f6');
  const [contactLimit, setContactLimit] = useState<string>(editPlan?.contact_limit != null ? String(editPlan.contact_limit) : '');
  const [notes, setNotes]               = useState(editPlan?.notes ?? '');
  const [timeFrom, setTimeFrom]         = useState(editPlan?.time_from ?? '');
  const [timeTo, setTimeTo]             = useState(editPlan?.time_to ?? '');
  const [saving, setSaving]             = useState(false);
  const [orgSearch, setOrgSearch]       = useState('');

  useEffect(() => {
    setOrgId(editPlan?.organization_id ?? '');
    setSeniorId(editPlan?.senior_id ?? '');
    setColor(editPlan?.color ?? '#3b82f6');
    setContactLimit(editPlan?.contact_limit != null ? String(editPlan.contact_limit) : '');
    setNotes(editPlan?.notes ?? '');
    setTimeFrom(editPlan?.time_from ?? '');
    setTimeTo(editPlan?.time_to ?? '');
    setOrgSearch('');
  }, [editPlan?.id]);

  useEffect(() => {
    fetch(`${PLANNING_API}?action=meta`)
      .then(r => r.json())
      .then(d => { setOrgs(d.organizations || []); setSeniors(d.seniors || []); })
      .finally(() => setMetaLoading(false));
  }, []);

  const filteredOrgs = orgs.filter(o => o.name.toLowerCase().includes(orgSearch.toLowerCase()));
  const activePreset = TIME_PRESETS.find(p => p.from === timeFrom && p.to === timeTo) ?? null;

  const handlePreset = (p: typeof TIME_PRESETS[0]) => {
    if (activePreset?.from === p.from) { setTimeFrom(''); setTimeTo(''); }
    else { setTimeFrom(p.from); setTimeTo(p.to); }
  };

  const handleSave = async () => {
    if (!orgId) return;
    setSaving(true);
    try {
      const payload = {
        organization_id: orgId, date, senior_id: seniorId || null,
        color, contact_limit: contactLimit ? Number(contactLimit) : null,
        notes: notes.trim() || null, time_from: timeFrom || null, time_to: timeTo || null,
      };
      const res = editPlan
        ? await fetch(PLANNING_API, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editPlan.id, ...payload }) })
        : await fetch(PLANNING_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await res.json();
      if (d.plan) onSave(d.plan);
    } finally {
      setSaving(false);
    }
  };

  const fmtDate = (d: string) => {
    try { return new Date(d + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' }); }
    catch { return d; }
  };

  const labelCls = "text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block";
  const inputCls = "w-full h-10 px-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-gray-400 transition-all";

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col justify-center items-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col"
        style={{ maxHeight: 'min(90dvh, 700px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Шапка */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="text-sm font-bold text-gray-800">
              {editPlan ? 'Редактировать' : 'Добавить организацию'}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">{fmtDate(date)}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
            <Icon name="X" size={16} />
          </button>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-5">
          {metaLoading ? (
            <div className="flex items-center justify-center py-10">
              <Icon name="Loader2" size={22} className="animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              {/* Организация */}
              <div>
                <label className={labelCls}>Организация *</label>
                <input
                  value={orgSearch}
                  onChange={e => setOrgSearch(e.target.value)}
                  placeholder="Поиск организации..."
                  className={`${inputCls} mb-2`}
                />
                <div className="max-h-44 overflow-y-auto rounded-xl bg-white border border-gray-200 divide-y divide-gray-100">
                  {filteredOrgs.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Не найдено</p>}
                  {filteredOrgs.map(o => (
                    <button
                      key={o.id}
                      onClick={() => setOrgId(o.id)}
                      className={`w-full text-left px-4 py-3 text-sm transition-all ${
                        orgId === o.id ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {orgId === o.id && <Icon name="Check" size={11} className="inline mr-2 text-blue-500" />}
                      {o.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Время смены */}
              <div>
                <label className={labelCls}>Время смены</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {TIME_PRESETS.map(p => (
                    <button
                      key={p.from}
                      onClick={() => handlePreset(p)}
                      className={`h-10 px-3 rounded-xl text-sm font-medium transition-all border flex items-center justify-center gap-1.5 ${
                        activePreset?.from === p.from
                          ? 'bg-blue-50 text-blue-600 border-blue-300'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Icon name="Clock" size={12} className={activePreset?.from === p.from ? 'text-blue-400' : 'text-gray-400'} />
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input type="time" value={timeFrom} onChange={e => setTimeFrom(e.target.value)} className={inputCls} />
                  <span className="text-gray-400 text-sm">—</span>
                  <input type="time" value={timeTo} onChange={e => setTimeTo(e.target.value)} className={inputCls} />
                </div>
              </div>

              {/* Старший */}
              <div>
                <label className={labelCls}>Старший на точке</label>
                <div className="grid grid-cols-2 gap-2">
                  {seniors.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSeniorId(seniorId === s.id ? '' : s.id)}
                      className={`h-10 px-3 rounded-xl text-sm font-medium transition-all border truncate ${
                        seniorId === s.id ? 'bg-blue-50 text-blue-600 border-blue-300' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Лимит контактов */}
              <div>
                <label className={labelCls}>Лимит контактов</label>
                <input
                  type="number" inputMode="numeric" min={0}
                  value={contactLimit} onChange={e => setContactLimit(e.target.value)}
                  placeholder="Не задан" className={inputCls}
                />
              </div>

              {/* Цвет */}
              <div>
                <label className={labelCls}>Цвет метки</label>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-xl transition-all flex-shrink-0 ${color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400 shadow-md' : 'hover:scale-110 active:scale-95'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <div className="relative w-8 h-8">
                    <input type="color" value={color} onChange={e => setColor(e.target.value)} className="absolute inset-0 w-full h-full rounded-xl cursor-pointer opacity-0" />
                    <div className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center" style={{ backgroundColor: color }}>
                      <Icon name="Pipette" size={12} className="text-white/80" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Заметки */}
              <div>
                <label className={labelCls}>Заметки</label>
                <textarea
                  value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Дополнительная информация..." rows={2}
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-gray-400 transition-all resize-none"
                />
              </div>
            </>
          )}
        </div>

        {/* Кнопки */}
        <div className="flex gap-3 px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-semibold transition-all"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !orgId}
            className="flex-1 h-11 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            {saving
              ? <><Icon name="Loader2" size={15} className="animate-spin" /> Сохранение...</>
              : <><Icon name="Check" size={15} /> {editPlan ? 'Сохранить' : 'Добавить'}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
