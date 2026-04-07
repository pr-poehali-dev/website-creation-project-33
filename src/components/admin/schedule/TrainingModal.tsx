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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-700 sticky top-0 bg-slate-900 z-10">
          <div>
            <h2 className="text-base font-bold text-slate-100">Обучение</h2>
            <p className="text-xs text-slate-400">{dayNameFull}, {date}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="bg-slate-800/60 rounded-xl p-3 space-y-2.5 border border-slate-700">
            <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">
              {editingId ? 'Редактировать запись' : 'Новая запись'}
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 mb-1 block">Старший *</label>
                <input
                  type="text"
                  value={form.seniorName}
                  onChange={e => handleChange('seniorName', e.target.value)}
                  placeholder="Имя старшего"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 mb-1 block">Промоутер *</label>
                <input
                  type="text"
                  value={form.promoterName}
                  onChange={e => handleChange('promoterName', e.target.value)}
                  placeholder="Имя промоутера"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 mb-1 block">Телефон</label>
                <input
                  type="tel"
                  value={form.promoterPhone}
                  onChange={e => handleChange('promoterPhone', e.target.value)}
                  placeholder="+7 999 000-00-00"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 mb-1 block">Время</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={e => handleChange('time', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 mb-1 block">Локация</label>
              <input
                type="text"
                value={form.location}
                onChange={e => handleChange('location', e.target.value)}
                placeholder="Место встречи"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 mb-1 block">Комментарии</label>
              <textarea
                value={form.comment}
                onChange={e => handleChange('comment', e.target.value)}
                placeholder="Дополнительная информация..."
                rows={2}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={!form.seniorName.trim() || !form.promoterName.trim()}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
              >
                {editingId ? 'Сохранить' : 'Добавить'}
              </button>
              {editingId && (
                <button
                  onClick={cancelEdit}
                  className="px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold py-2 rounded-lg transition-colors"
                >
                  Отмена
                </button>
              )}
            </div>
          </div>

          {entries.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Записи ({entries.length})
              </h3>
              {entries.map(entry => (
                <div key={entry.id} className="bg-slate-800/60 rounded-xl p-3 border border-slate-700 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <Icon name="UserCheck" size={12} className="text-cyan-400 flex-shrink-0" />
                        <span className="text-xs font-semibold text-slate-100 truncate">{entry.seniorName}</span>
                        <span className="text-[10px] text-slate-500">→</span>
                        <span className="text-xs text-slate-200 truncate">{entry.promoterName}</span>
                      </div>
                      {entry.promoterPhone && (
                        <div className="flex items-center gap-1.5">
                          <Icon name="Phone" size={11} className="text-slate-500 flex-shrink-0" />
                          <span className="text-[11px] text-slate-400">{entry.promoterPhone}</span>
                        </div>
                      )}
                      {(entry.location || entry.time) && (
                        <div className="flex items-center gap-3">
                          {entry.location && (
                            <div className="flex items-center gap-1.5">
                              <Icon name="MapPin" size={11} className="text-slate-500 flex-shrink-0" />
                              <span className="text-[11px] text-slate-400">{entry.location}</span>
                            </div>
                          )}
                          {entry.time && (
                            <div className="flex items-center gap-1.5">
                              <Icon name="Clock" size={11} className="text-slate-500 flex-shrink-0" />
                              <span className="text-[11px] text-slate-400">{entry.time}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {entry.comment && (
                        <div className="flex items-start gap-1.5">
                          <Icon name="MessageSquare" size={11} className="text-slate-500 flex-shrink-0 mt-0.5" />
                          <span className="text-[11px] text-slate-400">{entry.comment}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="p-1 text-slate-500 hover:text-cyan-400 transition-colors"
                      >
                        <Icon name="Pencil" size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Icon name="Trash2" size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {entries.length === 0 && (
            <div className="text-center py-6 text-slate-500">
              <Icon name="GraduationCap" size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-xs">Нет записей об обучении</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
