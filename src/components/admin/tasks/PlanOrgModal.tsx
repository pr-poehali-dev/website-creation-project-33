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

  const [orgId, setOrgId]           = useState<number | ''>(editPlan?.organization_id ?? '');
  const [seniorId, setSeniorId]     = useState<number | ''>(editPlan?.senior_id ?? '');
  const [color, setColor]           = useState(editPlan?.color ?? '#3b82f6');
  const [contactLimit, setContactLimit] = useState<string>(editPlan?.contact_limit != null ? String(editPlan.contact_limit) : '');
  const [notes, setNotes]           = useState(editPlan?.notes ?? '');
  const [saving, setSaving]         = useState(false);
  const [orgSearch, setOrgSearch]   = useState('');

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
      let res;
      if (editPlan) {
        res = await fetch(PLANNING_API, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editPlan.id, ...payload }),
        });
      } else {
        res = await fetch(PLANNING_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      const d = await res.json();
      onSave(d.plan);
    } finally {
      setSaving(false);
    }
  };

  const fmtDate = (d: string) => {
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' });
    } catch { return d; }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl ring-1 ring-slate-700/60 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Шапка */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              {editPlan ? 'Редактировать' : 'Добавить организацию'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 capitalize">{fmtDate(date)}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-700/60 transition-all">
            <Icon name="X" size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {metaLoading ? (
            <div className="flex items-center justify-center py-8">
              <Icon name="Loader2" size={20} className="animate-spin text-cyan-400" />
            </div>
          ) : (
            <>
              {/* Организация */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Организация *</label>
                <input
                  value={orgSearch}
                  onChange={e => setOrgSearch(e.target.value)}
                  placeholder="Поиск организации..."
                  className="w-full h-8 px-3 mb-1.5 bg-slate-800/60 ring-1 ring-slate-700/60 text-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-slate-600 transition-all"
                />
                <div className="max-h-40 overflow-y-auto rounded-lg bg-slate-800/40 ring-1 ring-slate-700/40 divide-y divide-slate-700/30">
                  {filteredOrgs.length === 0 && (
                    <p className="text-xs text-slate-600 text-center py-3">Не найдено</p>
                  )}
                  {filteredOrgs.map(o => (
                    <button
                      key={o.id}
                      onClick={() => setOrgId(o.id)}
                      className={`w-full text-left px-3 py-2 text-xs transition-all ${
                        orgId === o.id
                          ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                          : 'text-slate-300 hover:bg-slate-700/50'
                      }`}
                    >
                      {orgId === o.id && <Icon name="Check" size={10} className="inline mr-1.5 text-cyan-400" />}
                      {o.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Старший */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Старший на точке</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setSeniorId('')}
                    className={`h-8 px-3 rounded-lg text-xs font-medium transition-all ring-1 ${
                      seniorId === '' ? 'bg-slate-600 text-slate-200 ring-slate-500' : 'bg-slate-800/40 text-slate-500 ring-slate-700/40 hover:text-slate-300'
                    }`}
                  >
                    — не указан —
                  </button>
                  {seniors.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSeniorId(s.id)}
                      className={`h-8 px-3 rounded-lg text-xs font-medium transition-all ring-1 truncate ${
                        seniorId === s.id ? 'bg-cyan-500/20 text-cyan-300 ring-cyan-500/40' : 'bg-slate-800/40 text-slate-400 ring-slate-700/40 hover:text-slate-200'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Лимит контактов */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Лимит контактов</label>
                <input
                  type="number"
                  min={0}
                  value={contactLimit}
                  onChange={e => setContactLimit(e.target.value)}
                  placeholder="Не задан"
                  className="w-full h-9 px-3 bg-slate-800/60 ring-1 ring-slate-700/60 text-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-slate-600 transition-all"
                />
              </div>

              {/* Цвет */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Цвет метки</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-lg transition-all ${color === c ? 'scale-125 ring-2 ring-white/40' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                    title="Свой цвет"
                  />
                </div>
              </div>

              {/* Заметки */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Заметки</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Дополнительная информация..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-800/60 ring-1 ring-slate-700/60 text-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-slate-600 transition-all resize-none"
                />
              </div>

              {/* Кнопки */}
              <div className="flex gap-2 pt-1">
                <button onClick={onClose} className="flex-1 h-9 bg-slate-700/50 text-slate-300 ring-1 ring-slate-600/50 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-all">
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !orgId}
                  className="flex-1 h-9 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20"
                >
                  {saving
                    ? <><Icon name="Loader2" size={14} className="animate-spin" /> Сохранение...</>
                    : <><Icon name="Check" size={14} /> {editPlan ? 'Сохранить' : 'Добавить'}</>
                  }
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
