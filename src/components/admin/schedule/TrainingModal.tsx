import { useState } from 'react';
import Icon from '@/components/ui/icon';

interface TrainingModalProps {
  date: string;
  dayNameFull: string;
  onClose: () => void;
}

interface TrainingEntry {
  id: string;
  seniorName: string;
  promoterName: string;
  promoterPhone: string;
  location: string;
  time: string;
  comment: string;
}

export default function TrainingModal({ date, dayNameFull, onClose }: TrainingModalProps) {
  const storageKey = `training_${date}`;
  const saved = localStorage.getItem(storageKey);
  const initialEntries: TrainingEntry[] = saved ? JSON.parse(saved) : [];

  const [entries, setEntries] = useState<TrainingEntry[]>(initialEntries);
  const [form, setForm] = useState({
    seniorName: '',
    promoterName: '',
    promoterPhone: '',
    location: '',
    time: '',
    comment: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);

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
    setForm({ seniorName: '', promoterName: '', promoterPhone: '', location: '', time: '', comment: '' });
  };

  const handleEdit = (entry: TrainingEntry) => {
    setEditingId(entry.id);
    setForm({
      seniorName: entry.seniorName,
      promoterName: entry.promoterName,
      promoterPhone: entry.promoterPhone,
      location: entry.location,
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
    setForm({ seniorName: '', promoterName: '', promoterPhone: '', location: '', time: '', comment: '' });
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

            <div>
              <label className={labelClass}>Старший *</label>
              <input
                type="text"
                value={form.seniorName}
                onChange={e => handleChange('seniorName', e.target.value)}
                placeholder="Имя старшего"
                className={inputClass}
              />
            </div>

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

            <div>
              <label className={labelClass}>Локация</label>
              <input
                type="text"
                value={form.location}
                onChange={e => handleChange('location', e.target.value)}
                placeholder="Место встречи"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Время</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.time}
                onChange={e => handleChange('time', e.target.value)}
                placeholder="Например: 10:00"
                className={inputClass}
              />
            </div>

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
                      {(entry.location || entry.time) && (
                        <div className="flex items-center gap-4 flex-wrap">
                          {entry.location && (
                            <div className="flex items-center gap-1.5">
                              <Icon name="MapPin" size={12} className="text-slate-500 flex-shrink-0" />
                              <span className="text-xs text-slate-400">{entry.location}</span>
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