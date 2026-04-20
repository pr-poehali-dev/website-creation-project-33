import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

const PLANNING_API = 'https://functions.poehali.dev/0476e6f3-5f78-4770-9742-11fda4ba89c8';

interface OrgOption { id: number; name: string; }
interface SeniorOption { id: number; name: string; }

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
}

const PRESET_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
  '#6366f1', '#14b8a6',
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
  const [saving, setSaving]             = useState(false);
  const [orgSearch, setOrgSearch]       = useState('');

  useEffect(() => {
    fetch(`${PLANNING_API}?action=meta`)
      .then(r => r.json())
      .then(d => { setOrgs(d.organizations || []); setSeniors(d.seniors || []); })
      .finally(() => setMetaLoading(false));
  }, []);

  const filteredOrgs = orgs.filter(o => o.name.toLowerCase().includes(orgSearch.toLowerCase()));

  const handleSave = async () => {
    if (!orgId) return;
    setSaving(true);
    try {
      const payload = {
        organization_id: orgId,
        date,
        senior_id: seniorId || null,
        color,
        contact_limit: contactLimit ? Number(contactLimit) : null,
        notes: notes.trim() || null,
      };
      const res = editPlan
        ? await fetch(PLANNING_API, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editPlan.id, ...payload }) })
        : await fetch(PLANNING_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await res.json();
      onSave(d.plan);
    } finally {
      setSaving(false);
    }
  };

  const fmtDate = (d: string) => {
    try { return new Date(d + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' }); }
    catch { return d; }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Bottom sheet на мобильных, центрированный модал на десктопе */}
      <div
        className="
          w-full sm:max-w-md
          bg-gradient-to-br from-slate-900 to-slate-800
          sm:rounded-2xl rounded-t-2xl
          shadow-2xl ring-1 ring-slate-700/60
          flex flex-col
          max-h-[92dvh] sm:max-h-[90vh]
        "
        onClick={e => e.stopPropagation()}
      >
        {/* Ручка (только мобайл) */}
        <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-slate-600" />
        </div>

        {/* Шапка — фиксированная */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-700/50 flex-shrink-0">
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              {editPlan ? 'Редактировать' : 'Добавить организацию'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 capitalize">{fmtDate(date)}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-700/60 transition-all"
          >
            <Icon name="X" size={16} />
          </button>
        </div>

        {/* Скроллируемый контент */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-5">
          {metaLoading ? (
            <div className="flex items-center justify-center py-10">
              <Icon name="Loader2" size={22} className="animate-spin text-cyan-400" />
            </div>
          ) : (
            <>
              {/* Организация */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Организация *</label>
                <input
                  value={orgSearch}
                  onChange={e => setOrgSearch(e.target.value)}
                  placeholder="Поиск организации..."
                  className="w-full h-10 px-3 mb-2 bg-slate-800/60 ring-1 ring-slate-700/60 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-slate-600 transition-all"
                />
                <div className="max-h-44 overflow-y-auto rounded-xl bg-slate-800/40 ring-1 ring-slate-700/40 divide-y divide-slate-700/30">
                  {filteredOrgs.length === 0 && (
                    <p className="text-xs text-slate-600 text-center py-4">Не найдено</p>
                  )}
                  {filteredOrgs.map(o => (
                    <button
                      key={o.id}
                      onClick={() => setOrgId(o.id)}
                      className={`w-full text-left px-4 py-3 text-sm transition-all ${
                        orgId === o.id
                          ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                          : 'text-slate-300 hover:bg-slate-700/50 active:bg-slate-700'
                      }`}
                    >
                      {orgId === o.id && <Icon name="Check" size={11} className="inline mr-2 text-cyan-400" />}
                      {o.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Старший */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Старший на точке</label>
                <div className="grid grid-cols-2 gap-2">
                  {seniors.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSeniorId(s.id)}
                      className={`h-10 px-3 rounded-xl text-sm font-medium transition-all ring-1 truncate ${
                        seniorId === s.id ? 'bg-cyan-500/20 text-cyan-300 ring-cyan-500/40' : 'bg-slate-800/40 text-slate-400 ring-slate-700/40 active:bg-slate-700'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Лимит контактов */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Лимит контактов</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={contactLimit}
                  onChange={e => setContactLimit(e.target.value)}
                  placeholder="Не задан"
                  className="w-full h-10 px-3 bg-slate-800/60 ring-1 ring-slate-700/60 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-slate-600 transition-all"
                />
              </div>

              {/* Цвет */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Цвет метки</label>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-xl transition-all flex-shrink-0 ${color === c ? 'scale-125 ring-2 ring-white/50 shadow-lg' : 'hover:scale-110 active:scale-95'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <div className="relative w-8 h-8">
                    <input
                      type="color"
                      value={color}
                      onChange={e => setColor(e.target.value)}
                      className="absolute inset-0 w-full h-full rounded-xl cursor-pointer opacity-0"
                      title="Свой цвет"
                    />
                    <div
                      className="w-8 h-8 rounded-xl ring-1 ring-white/20 flex items-center justify-center"
                      style={{ backgroundColor: color }}
                    >
                      <Icon name="Pipette" size={12} className="text-white/70" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Заметки */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Заметки</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Дополнительная информация..."
                  rows={2}
                  className="w-full px-3 py-2.5 bg-slate-800/60 ring-1 ring-slate-700/60 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-slate-600 transition-all resize-none"
                />
              </div>
            </>
          )}
        </div>

        {/* Кнопки — фиксированные внизу */}
        <div className="flex gap-3 px-5 py-4 border-t border-slate-700/50 flex-shrink-0 bg-slate-900/80">
          <button
            onClick={onClose}
            className="flex-1 h-11 bg-slate-700/50 text-slate-300 ring-1 ring-slate-600/50 rounded-xl text-sm font-semibold hover:bg-slate-700 active:bg-slate-600 transition-all"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !orgId}
            className="flex-1 h-11 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20"
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