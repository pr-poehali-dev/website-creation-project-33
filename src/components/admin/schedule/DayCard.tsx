import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { DaySchedule, UserSchedule, DayStats, OrganizationData } from './types';
import TimeSlotCard from './TimeSlotCard';

function PhoneMenu({ phone, onClose }: { phone: string; onClose: () => void }) {
  const clean = phone.replace(/\D/g, '');
  const actions = [
    { label: 'Позвонить', icon: 'Phone', href: `tel:+${clean}`, color: 'text-green-600' },
    { label: 'SMS', icon: 'MessageSquare', href: `sms:+${clean}`, color: 'text-blue-600' },
    { label: 'WhatsApp', icon: 'MessageCircle', href: `https://wa.me/${clean}`, color: 'text-emerald-500' },
    { label: 'Telegram', icon: 'Send', href: `https://t.me/+${clean}`, color: 'text-sky-500' },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="pt-3 pb-1 px-4 border-b border-gray-100">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
          <p className="text-xs text-gray-400 text-center pb-2">{phone}</p>
        </div>
        <div className="p-3 space-y-1">
          {actions.map(a => (
            <a key={a.label} href={a.href} target="_blank" rel="noreferrer"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors">
              <Icon name={a.icon as 'Phone'} size={20} className={a.color} />
              <span className="text-sm font-medium text-gray-800">{a.label}</span>
            </a>
          ))}
        </div>
        <button onClick={onClose} className="w-full py-4 text-sm text-gray-400 font-medium border-t border-gray-100">
          Отмена
        </button>
      </div>
    </div>
  );
}

const TRAINING_API = 'https://functions.poehali.dev/1401561e-4d80-430c-87e9-7e8252e0a9b9';

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-Session-Token': localStorage.getItem('session_token') || '',
  };
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

interface DayCardProps {
  day: DaySchedule;
  isExpanded: boolean;
  stats?: DayStats;
  getUsersWorkingOnSlot: (date: string, slotTime: string) => UserSchedule[];
  workComments: Record<string, Record<string, unknown>>;
  allLocations: string[];
  allOrganizations: OrganizationData[];
  userOrgStats: Record<string, Array<{ organization_name: string; avg_per_shift: number }>>;
  recommendedLocations: Record<string, Record<string, string[]>>;
  actualStats: Record<string, { contacts: number; revenue: number }>;
  loadingProgress?: number;
  trainingCount?: number;
  promoterSlots?: { total: number; used: number };
  onToggleDay: (date: string) => void;
  onCommentChange: (userName: string, date: string, field: string, value: string, shiftTime?: string) => void;
  onSaveComment: (userName: string, date: string, field: string, value: string, shiftTime?: string) => void;
  onAddSlot: (date: string, slotTime: string, slotLabel: string) => void;
  onDeleteShift?: (userId: number, userName: string, date: string, slotTime: string, slotLabel: string) => void;
}

export default function DayCard({
  day, isExpanded, stats,
  getUsersWorkingOnSlot,
  workComments, allLocations, allOrganizations,
  userOrgStats, recommendedLocations, actualStats,
  loadingProgress, trainingCount = 0, promoterSlots,
  onToggleDay, onCommentChange, onSaveComment, onAddSlot, onDeleteShift,
}: DayCardProps) {
  const [activeTab, setActiveTab] = useState<'department' | 'training'>('department');
  const [trainingEntries, setTrainingEntries] = useState<TrainingEntry[]>([]);
  const [loadingTraining, setLoadingTraining] = useState(false);
  const [phoneMenu, setPhoneMenu] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<TrainingEntry | null>(null);
  const [editForm, setEditForm] = useState({ seniorName: '', promoterName: '', promoterPhone: '', organization: '', time: '', comment: '' });
  const [saving, setSaving] = useState(false);

  const loadTrainingEntries = useCallback(async () => {
    setLoadingTraining(true);
    try {
      const res = await fetch(`${TRAINING_API}?action=get_entries&date=${day.date}`, { headers: authHeaders() });
      const data = await res.json();
      setTrainingEntries(data.entries || []);
    } finally {
      setLoadingTraining(false);
    }
  }, [day.date]);

  useEffect(() => {
    if (activeTab === 'training') loadTrainingEntries();
  }, [activeTab, loadTrainingEntries]);

  const handleDeleteEntry = async (id: string) => {
    await fetch(TRAINING_API, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ action: 'delete_entry', id: parseInt(id) }),
    });
    setTrainingEntries(prev => prev.filter(e => e.id !== id));
  };

  const handleStartEdit = (entry: TrainingEntry) => {
    setEditingEntry(entry);
    setEditForm({ seniorName: entry.seniorName, promoterName: entry.promoterName, promoterPhone: entry.promoterPhone, organization: entry.organization, time: entry.time, comment: entry.comment });
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    setSaving(true);
    await fetch(TRAINING_API, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ action: 'update_entry', id: parseInt(editingEntry.id), ...editForm }),
    });
    setTrainingEntries(prev => prev.map(e => e.id === editingEntry.id ? { ...e, ...editForm } : e));
    setEditingEntry(null);
    setSaving(false);
  };

  const isSuccessful = stats && stats.actual > 0 && (stats.expected === 0 || stats.actual >= stats.expected);

  return (
    <div className="py-1">
      {/* Day header — строка без блока */}
      <div className="flex items-center gap-3 px-1 py-2">
        {/* Day badge */}
        <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-bold flex-shrink-0 ${
          isSuccessful
            ? 'bg-emerald-500 text-white'
            : day.isWeekend
              ? 'bg-orange-400 text-white'
              : 'bg-blue-500 text-white'
        }`}>
          <span className="text-[8px] uppercase tracking-wider opacity-80">{day.dayName}</span>
          <span className="text-sm leading-none">{new Date(day.date).getDate()}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-800 text-sm">{day.dayNameFull}</span>

            {stats && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isSuccessful ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'
              }`}>
                {stats.expected} / {stats.actual}
              </span>
            )}

            {stats && stats.workersCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-gray-500">
                <Icon name="Users" size={10} />
                {stats.workersCount}
              </span>
            )}

            {trainingCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-violet-500">
                <Icon name="GraduationCap" size={10} />
                {trainingCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs — компактные */}
      <div className="flex gap-0 mb-2 border-b border-gray-100">
        <button
          onClick={() => setActiveTab('department')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all -mb-px ${
            activeTab === 'department'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Icon name="Users" size={11} />
          Отдел
        </button>
        <button
          onClick={() => setActiveTab('training')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all -mb-px ${
            activeTab === 'training'
              ? 'border-violet-500 text-violet-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Icon name="GraduationCap" size={11} />
          Обучение
          {trainingEntries.length > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              activeTab === 'training' ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-500'
            }`}>
              {trainingEntries.length}
            </span>
          )}
        </button>
      </div>

      {/* Отдел tab */}
      {activeTab === 'department' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pb-3">
          {day.slots.map(slot => {
            const workers = getUsersWorkingOnSlot(day.date, slot.time);
            return (
              <TimeSlotCard
                key={slot.time}
                slot={slot}
                workers={workers}
                dayDate={day.date}
                workComments={workComments}
                allLocations={allLocations}
                allOrganizations={allOrganizations}
                userOrgStats={userOrgStats}
                recommendedLocations={recommendedLocations}
                loadingProgress={loadingProgress}
                onCommentChange={onCommentChange}
                onSaveComment={onSaveComment}
                onAddSlot={onAddSlot}
                onDeleteShift={onDeleteShift}
              />
            );
          })}
        </div>
      )}

      {/* Обучение tab */}
      {activeTab === 'training' && (
        <div className="space-y-2 pb-3">
          {loadingTraining ? (
            <div className="flex items-center gap-2 text-gray-400 text-xs py-3 justify-center">
              <Icon name="Loader2" size={14} className="animate-spin" />
              Загрузка...
            </div>
          ) : trainingEntries.length === 0 ? (
            <p className="text-xs text-gray-400 italic text-center py-4">Нет записей об обучении</p>
          ) : (
            trainingEntries.map(entry => (
              <div key={entry.id} className="flex items-start justify-between gap-2 px-1 py-2 border-b border-gray-50">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-800">{entry.seniorName}</p>
                  <p className="text-sm text-gray-600">
                    {entry.promoterName}
                    {entry.promoterPhone && (
                      <span className="cursor-pointer active:opacity-70" onClick={() => setPhoneMenu(entry.promoterPhone)}> {entry.promoterPhone}</span>
                    )}
                  </p>
                  {(entry.organization || entry.time) && (
                    <p className="text-sm text-blue-500 mt-0.5">{[entry.organization, entry.time].filter(Boolean).join(' · ')}</p>
                  )}
                  {entry.comment && <p className="text-sm text-gray-600 mt-0.5">{entry.comment}</p>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleStartEdit(entry)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <Icon name="Pencil" size={11} />
                  </button>
                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                  >
                    <Icon name="X" size={11} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Разделитель между днями */}
      <div className="border-b border-gray-100 mt-1" />

      {phoneMenu && <PhoneMenu phone={phoneMenu} onClose={() => setPhoneMenu(null)} />}

      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setEditingEntry(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl border border-gray-100" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-800">Редактировать запись</h3>
              <button onClick={() => setEditingEntry(null)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <Icon name="X" size={15} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {[
                { field: 'seniorName', label: 'Старший' },
                { field: 'promoterName', label: 'Стажёр' },
                { field: 'promoterPhone', label: 'Телефон' },
                { field: 'organization', label: 'Организация' },
                { field: 'time', label: 'Время' },
                { field: 'comment', label: 'Комментарий' },
              ].map(({ field, label }) => (
                <div key={field}>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">{label}</label>
                  <input
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors"
                    value={editForm[field as keyof typeof editForm]}
                    onChange={e => setEditForm(prev => ({ ...prev, [field]: e.target.value }))}
                    placeholder={label}
                  />
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setEditingEntry(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 font-medium hover:bg-gray-50 transition-colors">
                  Отмена
                </button>
                <button onClick={handleSaveEdit} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50">
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}