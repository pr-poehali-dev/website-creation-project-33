import { useState, useRef, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';

const TRAINING_API = 'https://functions.poehali.dev/1401561e-4d80-430c-87e9-7e8252e0a9b9';

function authHeaders() {
  return { 'Content-Type': 'application/json', 'X-Session-Token': localStorage.getItem('session_token') || '' };
}

interface WeekDay { date: string; dayNameFull: string; dayName: string; }
interface TrainingModalProps { weekDays: WeekDay[]; organizations?: string[]; promoters?: string[]; onClose: () => void; }
interface TrainingEntry { id: string; seniorName: string; promoterName: string; promoterPhone: string; organization: string; time: string; comment: string; }

const DAY_NAMES: Record<string, string> = {
  'Понедельник': 'Пн', 'Вторник': 'Вт', 'Среда': 'Ср',
  'Четверг': 'Чт', 'Пятница': 'Пт', 'Суббота': 'Сб', 'Воскресенье': 'Вс'
};

const inputCls = "w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors";
const labelCls = "text-xs font-medium text-gray-500 mb-1.5 block";

export default function TrainingModal({ weekDays, organizations: orgsProp, promoters = [], onClose }: TrainingModalProps) {
  const [selectedDate, setSelectedDate] = useState(weekDays[0]?.date || '');
  const [entries, setEntries] = useState<TrainingEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [loadedOrgs, setLoadedOrgs] = useState<string[]>(orgsProp ?? []);
  const [seniors, setSeniors] = useState<string[]>([]);
  const emptyForm = { seniorName: '', promoterName: '', promoterPhone: '', organization: '', time: '', comment: '' };
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSeniorDropdown, setShowSeniorDropdown] = useState(false);
  const [newSeniorInput, setNewSeniorInput] = useState('');
  const [showAddSenior, setShowAddSenior] = useState(false);
  const seniorRef = useRef<HTMLDivElement>(null);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [orgSearch, setOrgSearch] = useState('');
  const orgRef = useRef<HTMLDivElement>(null);

  const loadSeniors = useCallback(async () => {
    const res = await fetch(`${TRAINING_API}?action=get_seniors`, { headers: authHeaders() });
    const data = await res.json();
    if (data.seniors) setSeniors(data.seniors.map((s: { name: string }) => s.name));
  }, []);

  const loadEntries = useCallback(async (date: string) => {
    setLoadingEntries(true);
    const res = await fetch(`${TRAINING_API}?action=get_entries&date=${date}`, { headers: authHeaders() });
    const data = await res.json();
    setEntries(data.entries || []);
    setLoadingEntries(false);
  }, []);

  useEffect(() => {
    loadSeniors();
    if (weekDays[0]?.date) loadEntries(weekDays[0].date);
  }, []);

  useEffect(() => {
    if (orgsProp && orgsProp.length > 0) { setLoadedOrgs(orgsProp); return; }
    fetch('https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214?action=get_organizations', {
      headers: { 'X-Session-Token': localStorage.getItem('session_token') || '' }
    }).then(r => r.json()).then(data => {
      if (data.organizations) setLoadedOrgs(data.organizations.map((o: { name: string }) => o.name).sort());
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (seniorRef.current && !seniorRef.current.contains(e.target as Node)) setShowSeniorDropdown(false);
      if (orgRef.current && !orgRef.current.contains(e.target as Node)) setShowOrgDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleDateChange = (date: string) => { setSelectedDate(date); loadEntries(date); setEditingId(null); setForm(emptyForm); };
  const handleChange = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleAddSenior = async () => {
    const name = newSeniorInput.trim();
    if (!name || seniors.includes(name)) return;
    await fetch(TRAINING_API, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'add_senior', name }) });
    setSeniors(prev => [...prev, name].sort());
    setForm(prev => ({ ...prev, seniorName: name }));
    setNewSeniorInput(''); setShowAddSenior(false); setShowSeniorDropdown(false);
  };

  const handleDeleteSenior = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(TRAINING_API, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'delete_senior', name }) });
    setSeniors(prev => prev.filter(s => s !== name));
  };

  const filteredOrgs = loadedOrgs.filter(o => o.toLowerCase().includes(orgSearch.toLowerCase()));

  const handleSubmit = async () => {
    if (!form.seniorName.trim() || !form.promoterName.trim() || !selectedDate) return;
    setSaving(true);
    if (editingId) {
      await fetch(TRAINING_API, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'update_entry', id: parseInt(editingId), ...form }) });
      setEditingId(null);
    } else {
      await fetch(TRAINING_API, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'add_entry', date: selectedDate, ...form }) });
    }
    await loadEntries(selectedDate);
    setForm(emptyForm);
    setSaving(false);
  };

  const handleEdit = (entry: TrainingEntry) => {
    setEditingId(entry.id);
    setForm({ seniorName: entry.seniorName, promoterName: entry.promoterName, promoterPhone: entry.promoterPhone, organization: entry.organization, time: entry.time, comment: entry.comment });
  };

  const handleDelete = async (id: string) => {
    await fetch(TRAINING_API, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'delete_entry', id: parseInt(id) }) });
    await loadEntries(selectedDate);
  };

  const cancelEdit = () => { setEditingId(null); setForm(emptyForm); };
  const selectedDay = weekDays.find(d => d.date === selectedDate);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg h-[92dvh] sm:max-h-[90vh] flex flex-col shadow-2xl border border-gray-100">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-800">Добавить обучение</h2>
            {selectedDay && <p className="text-xs text-gray-400">{selectedDay.dayNameFull}, {selectedDate}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Form */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100">
            <h3 className="text-xs font-semibold text-blue-500 uppercase tracking-wide">
              {editingId ? 'Редактировать запись' : 'Новая запись'}
            </h3>

            {/* Дата */}
            <div>
              <label className={labelCls}>Дата *</label>
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map(day => {
                  const isSelected = day.date === selectedDate;
                  const dayNum = new Date(day.date).getDate();
                  const shortName = DAY_NAMES[day.dayNameFull] || day.dayName;
                  return (
                    <button key={day.date} onClick={() => handleDateChange(day.date)}
                      className={`flex flex-col items-center py-2 px-1 rounded-xl text-center transition-all ${
                        isSelected ? 'bg-blue-500 text-white shadow-sm' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                      }`}>
                      <span className="text-[9px] font-semibold">{shortName}</span>
                      <span className="text-sm font-bold">{dayNum}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Старший */}
            <div>
              <label className={labelCls}>Старший *</label>
              <div className="relative" ref={seniorRef}>
                <div className={`${inputCls} flex items-center justify-between cursor-pointer`} onClick={() => setShowSeniorDropdown(p => !p)}>
                  <span className={form.seniorName ? 'text-gray-700' : 'text-gray-400'}>
                    {form.seniorName || 'Выбрать старшего'}
                  </span>
                  <Icon name={showSeniorDropdown ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-gray-400 flex-shrink-0" />
                </div>
                {showSeniorDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                    {seniors.length > 0 ? (
                      <div className="max-h-48 overflow-y-auto">
                        {seniors.map(name => (
                          <div key={name} className="flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => { setForm(prev => ({ ...prev, seniorName: name })); setShowSeniorDropdown(false); setShowAddSenior(false); }}>
                            <span className="text-sm text-gray-700">{name}</span>
                            <button onClick={(e) => handleDeleteSenior(name, e)} className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors">
                              <Icon name="X" size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-3 py-3 text-sm text-gray-400 text-center">Список пуст</div>
                    )}
                    <div className="border-t border-gray-100">
                      {showAddSenior ? (
                        <div className="p-2 flex gap-2">
                          <input type="text" value={newSeniorInput} onChange={e => setNewSeniorInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddSenior()} placeholder="Имя старшего" autoFocus
                            className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400" />
                          <button onClick={handleAddSenior} className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors">
                            <Icon name="Check" size={16} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setShowAddSenior(true)} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-blue-500 hover:bg-gray-50 transition-colors">
                          <Icon name="Plus" size={15} />
                          Добавить нового старшего
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Стажер */}
            <div>
              <label className={labelCls}>Стажер *</label>
              {promoters.length > 0 ? (
                <select value={form.promoterName} onChange={e => handleChange('promoterName', e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors appearance-none">
                  <option value="">Выберите промоутера</option>
                  {promoters.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              ) : (
                <input type="text" value={form.promoterName} onChange={e => handleChange('promoterName', e.target.value)} placeholder="Имя стажера" className={inputCls} />
              )}
            </div>

            {/* Телефон */}
            <div>
              <label className={labelCls}>Телефон стажера</label>
              <input type="tel" value={form.promoterPhone} onChange={e => handleChange('promoterPhone', e.target.value)} placeholder="+7 999 000-00-00" className={inputCls} />
            </div>

            {/* Организация */}
            <div>
              <label className={labelCls}>Организация</label>
              <div className="relative" ref={orgRef}>
                <div className={`${inputCls} flex items-center justify-between cursor-pointer`}
                  onClick={() => { setShowOrgDropdown(p => !p); setOrgSearch(''); }}>
                  <span className={form.organization ? 'text-gray-700' : 'text-gray-400'}>
                    {form.organization || 'Выбрать организацию'}
                  </span>
                  <div className="flex items-center gap-1">
                    {form.organization && (
                      <button onClick={e => { e.stopPropagation(); setForm(prev => ({ ...prev, organization: '' })); }} className="text-gray-300 hover:text-gray-500">
                        <Icon name="X" size={13} />
                      </button>
                    )}
                    <Icon name={showOrgDropdown ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-gray-400" />
                  </div>
                </div>
                {showOrgDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                    <div className="p-2 border-b border-gray-100">
                      <input type="text" value={orgSearch} onChange={e => setOrgSearch(e.target.value)} placeholder="Поиск..." autoFocus
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400" />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                      {filteredOrgs.length > 0 ? filteredOrgs.map(org => (
                        <div key={org} className={`px-3 py-2.5 text-sm cursor-pointer transition-colors ${form.organization === org ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                          onClick={() => { setForm(prev => ({ ...prev, organization: org })); setShowOrgDropdown(false); }}>
                          {org}
                        </div>
                      )) : <div className="px-3 py-3 text-sm text-gray-400 text-center">Ничего не найдено</div>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Время */}
            <div>
              <label className={labelCls}>Время стажировки</label>
              <div className="flex gap-2">
                <select value={form.time.split(':')[0] || ''}
                  onChange={e => { const mins = form.time.split(':')[1] || '00'; handleChange('time', e.target.value ? `${e.target.value}:${mins}` : ''); }}
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-blue-400">
                  <option value="">Часы</option>
                  {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <select value={form.time.split(':')[1] || ''}
                  onChange={e => { const hrs = form.time.split(':')[0] || '00'; handleChange('time', e.target.value ? `${hrs}:${e.target.value}` : ''); }}
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-blue-400">
                  <option value="">Минуты</option>
                  {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            {/* Комментарии */}
            <div>
              <label className={labelCls}>Комментарии</label>
              <textarea value={form.comment} onChange={e => handleChange('comment', e.target.value)} placeholder="Дополнительная информация..." rows={3}
                className={`${inputCls} resize-none`} />
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={handleSubmit} disabled={!form.seniorName.trim() || !form.promoterName.trim() || !selectedDate || saving}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                {saving && <Icon name="Loader2" size={14} className="animate-spin" />}
                {editingId ? 'Сохранить' : 'Добавить'}
              </button>
              {editingId && (
                <button onClick={cancelEdit} className="px-5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl transition-colors">
                  Отмена
                </button>
              )}
            </div>
          </div>

          {/* Список записей */}
          {loadingEntries ? (
            <div className="flex items-center justify-center gap-2 py-8 text-gray-400">
              <Icon name="Loader2" size={18} className="animate-spin" />
              <span className="text-sm">Загрузка...</span>
            </div>
          ) : entries.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
                Записи на {selectedDay?.dayNameFull} ({entries.length})
              </h3>
              {entries.map((entry, index) => (
                <div key={entry.id} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-blue-400 w-4 flex-shrink-0">{index + 1}</span>
                        <Icon name="UserCheck" size={13} className="text-blue-400 flex-shrink-0" />
                        <span className="text-sm font-semibold text-gray-700">{entry.seniorName}</span>
                      </div>
                      <div className="flex items-center gap-2 pl-6">
                        <Icon name="User" size={13} className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{entry.promoterName}</span>
                      </div>
                      {entry.promoterPhone && (
                        <div className="flex items-center gap-2 pl-6">
                          <Icon name="Phone" size={12} className="text-gray-300 flex-shrink-0" />
                          <span className="text-xs text-gray-400">{entry.promoterPhone}</span>
                        </div>
                      )}
                      {(entry.organization || entry.time) && (
                        <div className="flex items-center gap-4 flex-wrap pl-6">
                          {entry.organization && (
                            <div className="flex items-center gap-1.5">
                              <Icon name="Building2" size={12} className="text-gray-300 flex-shrink-0" />
                              <span className="text-xs text-gray-400">{entry.organization}</span>
                            </div>
                          )}
                          {entry.time && (
                            <div className="flex items-center gap-1.5">
                              <Icon name="Clock" size={12} className="text-gray-300 flex-shrink-0" />
                              <span className="text-xs text-gray-400">{entry.time}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {entry.comment && (
                        <div className="flex items-start gap-1.5 pl-6">
                          <Icon name="MessageSquare" size={12} className="text-gray-300 flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-gray-400 italic">{entry.comment}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => handleEdit(entry)} className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-blue-400 hover:bg-blue-50 rounded-lg transition-colors">
                        <Icon name="Pencil" size={14} />
                      </button>
                      <button onClick={() => handleDelete(entry.id)} className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                        <Icon name="Trash2" size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-300">
              <Icon name="GraduationCap" size={36} className="mx-auto mb-2" />
              <p className="text-sm text-gray-400">Нет записей на {selectedDay?.dayNameFull}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}