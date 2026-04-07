import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';

interface TrainingModalProps {
  date: string;
  dayNameFull: string;
  organizations?: string[];
  onClose: () => void;
}

interface TrainingEntry {
  id: string;
  seniorName: string;
  promoterName: string;
  promoterPhone: string;
  organization: string;
  time: string;
  comment: string;
}

const SENIORS_KEY = 'training_seniors_list';

function loadSeniors(): string[] {
  const saved = localStorage.getItem(SENIORS_KEY);
  return saved ? JSON.parse(saved) : [];
}

function saveSeniors(list: string[]) {
  localStorage.setItem(SENIORS_KEY, JSON.stringify(list));
}

export default function TrainingModal({ date, dayNameFull, organizations: orgsProp, onClose }: TrainingModalProps) {
  const storageKey = `training_${date}`;
  const saved = localStorage.getItem(storageKey);
  const initialEntries: TrainingEntry[] = saved ? JSON.parse(saved) : [];

  const [entries, setEntries] = useState<TrainingEntry[]>(initialEntries);
  const [loadedOrgs, setLoadedOrgs] = useState<string[]>(orgsProp ?? []);

  useEffect(() => {
    if (orgsProp && orgsProp.length > 0) return;
    fetch('https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214?action=get_organizations', {
      headers: { 'X-Session-Token': localStorage.getItem('session_token') || '' }
    })
      .then(r => r.json())
      .then(data => {
        if (data.organizations) {
          setLoadedOrgs(data.organizations.map((o: {name: string}) => o.name).sort());
        }
      })
      .catch(() => {});
  }, []);
  const [form, setForm] = useState({
    seniorName: '',
    promoterName: '',
    promoterPhone: '',
    organization: '',
    time: '',
    comment: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const [seniors, setSeniors] = useState<string[]>(loadSeniors);
  const [showSeniorDropdown, setShowSeniorDropdown] = useState(false);
  const [newSeniorInput, setNewSeniorInput] = useState('');
  const [showAddSenior, setShowAddSenior] = useState(false);
  const seniorRef = useRef<HTMLDivElement>(null);

  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [orgSearch, setOrgSearch] = useState('');
  const orgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (seniorRef.current && !seniorRef.current.contains(e.target as Node)) {
        setShowSeniorDropdown(false);
      }
      if (orgRef.current && !orgRef.current.contains(e.target as Node)) {
        setShowOrgDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleAddSenior = () => {
    const name = newSeniorInput.trim();
    if (!name || seniors.includes(name)) return;
    const updated = [...seniors, name];
    setSeniors(updated);
    saveSeniors(updated);
    setForm(prev => ({ ...prev, seniorName: name }));
    setNewSeniorInput('');
    setShowAddSenior(false);
    setShowSeniorDropdown(false);
  };

  const handleDeleteSenior = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = seniors.filter(s => s !== name);
    setSeniors(updated);
    saveSeniors(updated);
  };

  const filteredOrgs = loadedOrgs.filter(o =>
    o.toLowerCase().includes(orgSearch.toLowerCase())
  );

  const saveToStorage = (updated: TrainingEntry[]) => {
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.seniorName.trim() || !form.promoterName.trim()) return;

    let updated: TrainingEntry[];
    if (editingId) {
      updated = entries.map(e => e.id === editingId ? { ...form, id: editingId } : e);
      setEditingId(null);
    } else {
      const newEntry: TrainingEntry = { ...form, id: Date.now().toString() };
      updated = [...entries, newEntry];
    }

    setEntries(updated);
    saveToStorage(updated);
    setForm({ seniorName: '', promoterName: '', promoterPhone: '', organization: '', time: '', comment: '' });
  };

  const handleEdit = (entry: TrainingEntry) => {
    setEditingId(entry.id);
    setForm({
      seniorName: entry.seniorName,
      promoterName: entry.promoterName,
      promoterPhone: entry.promoterPhone,
      organization: entry.organization,
      time: entry.time,
      comment: entry.comment,
    });
  };

  const handleDelete = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    saveToStorage(updated);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ seniorName: '', promoterName: '', promoterPhone: '', organization: '', time: '', comment: '' });
  };

  const inputClass = "w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500";
  const labelClass = "text-xs text-slate-400 mb-1.5 block";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg h-[92dvh] sm:max-h-[90vh] flex flex-col shadow-2xl">

        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-100">Обучение</h2>
            <p className="text-xs text-slate-400">{dayNameFull}, {date}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-slate-800/60 rounded-xl p-4 space-y-3 border border-slate-700">
            <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">
              {editingId ? 'Редактировать запись' : 'Новая запись'}
            </h3>

            {/* Старший */}
            <div>
              <label className={labelClass}>Старший *</label>
              <div className="relative" ref={seniorRef}>
                <div
                  className={`${inputClass} flex items-center justify-between cursor-pointer`}
                  onClick={() => setShowSeniorDropdown(p => !p)}
                >
                  <span className={form.seniorName ? 'text-slate-100' : 'text-slate-500'}>
                    {form.seniorName || 'Выбрать старшего'}
                  </span>
                  <Icon name={showSeniorDropdown ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-slate-400 flex-shrink-0" />
                </div>

                {showSeniorDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-xl z-20 overflow-hidden">
                    {seniors.length > 0 ? (
                      <div className="max-h-48 overflow-y-auto">
                        {seniors.map(name => (
                          <div
                            key={name}
                            className="flex items-center justify-between px-3 py-2.5 hover:bg-slate-700 active:bg-slate-600 cursor-pointer transition-colors"
                            onClick={() => {
                              setForm(prev => ({ ...prev, seniorName: name }));
                              setShowSeniorDropdown(false);
                              setShowAddSenior(false);
                            }}
                          >
                            <span className="text-sm text-slate-100">{name}</span>
                            <button
                              onClick={(e) => handleDeleteSenior(name, e)}
                              className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors"
                            >
                              <Icon name="X" size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-3 py-3 text-sm text-slate-500 text-center">Список пуст</div>
                    )}
                    <div className="border-t border-slate-700">
                      {showAddSenior ? (
                        <div className="p-2 flex gap-2">
                          <input
                            type="text"
                            value={newSeniorInput}
                            onChange={e => setNewSeniorInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddSenior()}
                            placeholder="Имя старшего"
                            autoFocus
                            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                          />
                          <button
                            onClick={handleAddSenior}
                            className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm rounded-lg transition-colors"
                          >
                            <Icon name="Check" size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowAddSenior(true)}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-cyan-400 hover:bg-slate-700 transition-colors"
                        >
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
              <label className={labelClass}>Стажер *</label>
              <input
                type="text"
                value={form.promoterName}
                onChange={e => handleChange('promoterName', e.target.value)}
                placeholder="Имя стажера"
                className={inputClass}
              />
            </div>

            {/* Телефон */}
            <div>
              <label className={labelClass}>Телефон стажера</label>
              <input
                type="tel"
                value={form.promoterPhone}
                onChange={e => handleChange('promoterPhone', e.target.value)}
                placeholder="+7 999 000-00-00"
                className={inputClass}
              />
            </div>

            {/* Организация */}
            <div>
              <label className={labelClass}>Организация</label>
              <div className="relative" ref={orgRef}>
                <div
                  className={`${inputClass} flex items-center justify-between cursor-pointer`}
                  onClick={() => { setShowOrgDropdown(p => !p); setOrgSearch(''); }}
                >
                  <span className={form.organization ? 'text-slate-100' : 'text-slate-500'}>
                    {form.organization || 'Выбрать организацию'}
                  </span>
                  <div className="flex items-center gap-1">
                    {form.organization && (
                      <button
                        onClick={e => { e.stopPropagation(); setForm(prev => ({ ...prev, organization: '' })); }}
                        className="text-slate-500 hover:text-slate-300"
                      >
                        <Icon name="X" size={13} />
                      </button>
                    )}
                    <Icon name={showOrgDropdown ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-slate-400" />
                  </div>
                </div>

                {showOrgDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-xl z-20 overflow-hidden">
                    <div className="p-2 border-b border-slate-700">
                      <input
                        type="text"
                        value={orgSearch}
                        onChange={e => setOrgSearch(e.target.value)}
                        placeholder="Поиск..."
                        autoFocus
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                      {filteredOrgs.length > 0 ? filteredOrgs.map(org => (
                        <div
                          key={org}
                          className={`px-3 py-2.5 text-sm cursor-pointer transition-colors ${form.organization === org ? 'bg-cyan-600/20 text-cyan-400' : 'text-slate-100 hover:bg-slate-700'}`}
                          onClick={() => {
                            setForm(prev => ({ ...prev, organization: org }));
                            setShowOrgDropdown(false);
                          }}
                        >
                          {org}
                        </div>
                      )) : (
                        <div className="px-3 py-3 text-sm text-slate-500 text-center">Ничего не найдено</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Время */}
            <div>
              <label className={labelClass}>Время стажировки</label>
              <div className="flex gap-2">
                <select
                  value={form.time.split(':')[0] || ''}
                  onChange={e => {
                    const mins = form.time.split(':')[1] || '00';
                    handleChange('time', e.target.value ? `${e.target.value}:${mins}` : '');
                  }}
                  className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Часы</option>
                  {Array.from({length: 24}, (_, i) => String(i).padStart(2, '0')).map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <select
                  value={form.time.split(':')[1] || ''}
                  onChange={e => {
                    const hrs = form.time.split(':')[0] || '00';
                    handleChange('time', e.target.value ? `${hrs}:${e.target.value}` : '');
                  }}
                  className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Минуты</option>
                  {['00','05','10','15','20','25','30','35','40','45','50','55'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Комментарии */}
            <div>
              <label className={labelClass}>Комментарии</label>
              <textarea
                value={form.comment}
                onChange={e => handleChange('comment', e.target.value)}
                placeholder="Дополнительная информация..."
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSubmit}
                disabled={!form.seniorName.trim() || !form.promoterName.trim()}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold py-3 rounded-xl transition-colors"
              >
                {editingId ? 'Сохранить' : 'Добавить'}
              </button>
              {editingId && (
                <button
                  onClick={cancelEdit}
                  className="px-5 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-slate-300 text-sm font-semibold py-3 rounded-xl transition-colors"
                >
                  Отмена
                </button>
              )}
            </div>
          </div>

          {entries.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-1">
                Записи ({entries.length})
              </h3>
              {entries.map(entry => (
                <div key={entry.id} className="bg-slate-800/60 rounded-xl p-3 border border-slate-700 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Icon name="UserCheck" size={13} className="text-cyan-400 flex-shrink-0" />
                        <span className="text-sm font-semibold text-slate-100">{entry.seniorName}</span>
                        <span className="text-slate-500">→</span>
                        <span className="text-sm text-slate-200">{entry.promoterName}</span>
                      </div>
                      {entry.promoterPhone && (
                        <div className="flex items-center gap-2">
                          <Icon name="Phone" size={12} className="text-slate-500 flex-shrink-0" />
                          <span className="text-xs text-slate-400">{entry.promoterPhone}</span>
                        </div>
                      )}
                      {(entry.organization || entry.time) && (
                        <div className="flex items-center gap-4 flex-wrap">
                          {entry.organization && (
                            <div className="flex items-center gap-1.5">
                              <Icon name="Building2" size={12} className="text-slate-500 flex-shrink-0" />
                              <span className="text-xs text-slate-400">{entry.organization}</span>
                            </div>
                          )}
                          {entry.time && (
                            <div className="flex items-center gap-1.5">
                              <Icon name="Clock" size={12} className="text-slate-500 flex-shrink-0" />
                              <span className="text-xs text-slate-400">{entry.time}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {entry.comment && (
                        <div className="flex items-start gap-1.5">
                          <Icon name="MessageSquare" size={12} className="text-slate-500 flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-slate-400">{entry.comment}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-cyan-400 transition-colors"
                      >
                        <Icon name="Pencil" size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Icon name="Trash2" size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {entries.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Icon name="GraduationCap" size={36} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Нет записей об обучении</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}