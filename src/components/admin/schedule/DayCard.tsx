import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { DaySchedule, UserSchedule, DayStats, OrganizationData } from './types';
import TimeSlotCard from './TimeSlotCard';

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
}

export default function DayCard({
  day, isExpanded, stats,
  getUsersWorkingOnSlot,
  workComments, allLocations, allOrganizations,
  userOrgStats, recommendedLocations, actualStats,
  loadingProgress, trainingCount = 0, promoterSlots,
  onToggleDay, onCommentChange, onSaveComment, onAddSlot,
}: DayCardProps) {
  const [activeTab, setActiveTab] = useState<'department' | 'training'>('department');
  const [trainingEntries, setTrainingEntries] = useState<TrainingEntry[]>([]);
  const [loadingTraining, setLoadingTraining] = useState(false);

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

  const isSuccessful = stats && stats.actual > 0 && (stats.expected === 0 || stats.actual >= stats.expected);

  return (
    <div className={`rounded-2xl overflow-hidden border transition-all ${
      isSuccessful
        ? 'bg-emerald-50 border-emerald-200'
        : 'bg-white border-gray-100 shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Day badge */}
          <div className={`relative w-10 h-10 rounded-xl flex flex-col items-center justify-center font-bold flex-shrink-0 ${
            isSuccessful
              ? 'bg-emerald-500 text-white'
              : day.isWeekend
                ? 'bg-orange-400 text-white'
                : 'bg-blue-500 text-white'
          }`}>
            <span className="text-[8px] uppercase tracking-wider opacity-80">{day.dayName}</span>
            <span className="text-sm leading-none">{new Date(day.date).getDate()}</span>
          </div>

          <div className="flex-shrink-0">
            <p className="font-semibold text-gray-800 text-sm leading-tight">{day.dayNameFull}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{day.date}</p>
          </div>

          {/* Stats pill */}
          {stats && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
              isSuccessful
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              <span>{stats.expected}</span>
              <span className="text-gray-400 font-bold">/</span>
              <span>{stats.actual}</span>
            </div>
          )}

          {stats && stats.workersCount > 0 && (
            <div className="flex items-center gap-1 bg-blue-50 text-blue-500 px-1.5 py-1 rounded-full flex-shrink-0">
              <Icon name="Users" size={10} />
              <span className="text-[10px] font-semibold">{stats.workersCount}</span>
            </div>
          )}

          {isSuccessful && (
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <Icon name="Check" size={11} className="text-white" />
            </div>
          )}

          {trainingCount > 0 && (
            <div className="flex items-center gap-1 bg-violet-50 text-violet-500 px-1.5 py-1 rounded-full flex-shrink-0">
              <Icon name="GraduationCap" size={10} />
              <span className="text-[10px] font-semibold">{trainingCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-3 pb-3 pt-3 md:px-4 md:pb-4">
        {/* Tabs */}
        <div className="flex gap-1 mb-3 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('department')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'department'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon name="Users" size={12} />
            Отдел
          </button>
          <button
            onClick={() => setActiveTab('training')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'training'
                ? 'bg-violet-500 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon name="GraduationCap" size={12} />
            Обучение
            {trainingEntries.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === 'training' ? 'bg-white/20' : 'bg-violet-100 text-violet-500'
              }`}>
                {trainingEntries.length}
              </span>
            )}
          </button>
        </div>

        {/* Отдел tab */}
        {activeTab === 'department' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                />
              );
            })}
          </div>
        )}

        {/* Обучение tab */}
        {activeTab === 'training' && (
          <div className="space-y-2">
            {loadingTraining ? (
              <div className="flex items-center gap-2 text-gray-400 text-xs py-3 justify-center">
                <Icon name="Loader2" size={14} className="animate-spin" />
                Загрузка...
              </div>
            ) : trainingEntries.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-3">Нет записей об обучении</p>
            ) : (
              trainingEntries.map(entry => (
                <div key={entry.id} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-700 truncate">{entry.promoterName}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{entry.seniorName} · {entry.time}</p>
                      {entry.organization && (
                        <p className="text-[10px] text-blue-500 mt-0.5">{entry.organization}</p>
                      )}
                      {entry.comment && (
                        <p className="text-[10px] text-gray-500 mt-0.5 italic">{entry.comment}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
                    >
                      <Icon name="X" size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
