import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { DaySchedule, UserSchedule, DeleteSlotState, DayStats, OrganizationData } from './types';
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
  userOrgStats: Record<string, Array<{organization_name: string, avg_per_shift: number}>>;
  recommendedLocations: Record<string, Record<string, string[]>>;
  actualStats: Record<string, {contacts: number, revenue: number}>;
  loadingProgress?: number;
  trainingCount?: number;
  promoterSlots?: { total: number; used: number };
  onToggleDay: (date: string) => void;
  onCommentChange: (userName: string, date: string, field: string, value: string, shiftTime?: string) => void;
  onRemoveSlot: (userId: number, userName: string, date: string, slotTime: string, slotLabel: string) => void;
  onAddSlot: (date: string, slotTime: string, slotLabel: string) => void;
  deletingSlot: DeleteSlotState | null;
}

export default function DayCard({
  day,
  isExpanded,
  stats,
  getUsersWorkingOnSlot,
  workComments,
  allLocations,
  allOrganizations,
  userOrgStats,
  recommendedLocations,
  actualStats,
  loadingProgress,
  trainingCount = 0,
  promoterSlots,
  onToggleDay,
  onCommentChange,
  onRemoveSlot,
  onAddSlot,
  deletingSlot,
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
    if (activeTab === 'training') {
      loadTrainingEntries();
    }
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
  const badgeCount = trainingEntries.length;

  return (
    <div className={`rounded-2xl overflow-hidden transition-all duration-300 ${
      isSuccessful
        ? 'bg-gradient-to-br from-emerald-950/80 to-slate-900/90 ring-1 ring-emerald-500/30'
        : 'bg-gradient-to-br from-slate-900/90 to-slate-800/60 ring-1 ring-slate-700/40'
    }`}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 select-none"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Day badge */}
          <div className={`relative w-10 h-10 rounded-xl flex flex-col items-center justify-center font-bold shadow-lg flex-shrink-0 ${
            isSuccessful
              ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white'
              : day.isWeekend
                ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                : 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white'
          }`}>
            <span className="text-[8px] uppercase tracking-wider opacity-80">{day.dayName}</span>
            <span className="text-sm leading-none">{new Date(day.date).getDate()}</span>
          </div>

          <div className="flex-shrink-0">
            <p className="font-semibold text-slate-100 text-sm leading-tight">{day.dayNameFull}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{day.date}</p>
          </div>

          {/* Stats pill */}
          {stats && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
              isSuccessful
                ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30'
                : 'bg-slate-700/50 text-slate-300 ring-1 ring-slate-600/30'
            }`}>
              <span>{stats.expected}</span>
              <span className="text-slate-400 font-bold">/</span>
              <span>{stats.actual}</span>
            </div>
          )}

          {stats && stats.workersCount > 0 && (
            <div className="flex items-center gap-1 bg-cyan-500/10 text-cyan-400 px-1.5 py-1 rounded-full ring-1 ring-cyan-500/20 flex-shrink-0">
              <Icon name="Users" size={10} />
              <span className="text-[10px] font-semibold">{stats.workersCount}</span>
            </div>
          )}

          {isSuccessful && (
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 flex-shrink-0">
              <Icon name="Check" size={11} className="text-white" />
            </div>
          )}

          {trainingCount > 0 && (
            <div className="flex items-center gap-1 bg-violet-500/15 text-violet-400 px-1.5 py-1 rounded-full ring-1 ring-violet-500/25 flex-shrink-0">
              <Icon name="GraduationCap" size={10} />
              <span className="text-[10px] font-semibold">{trainingCount}</span>
            </div>
          )}
        </div>

      </div>

      {/* Content always visible */}
      <div className="px-3 pb-3 pt-2 md:px-4 md:pb-4">
          {/* Tabs */}
          <div className="flex gap-1 mb-3 bg-slate-950/50 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('department')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeTab === 'department'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon name="Users" size={12} />
              Отдел
            </button>
            <button
              onClick={() => setActiveTab('training')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeTab === 'training'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon name="GraduationCap" size={12} />
              Обучение
              {badgeCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === 'training' ? 'bg-white/20' : 'bg-violet-600/30 text-violet-400'
                }`}>
                  {badgeCount}
                </span>
              )}
            </button>
          </div>

          {/* Отдел tab */}
          {activeTab === 'department' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-3">
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
                    onRemoveSlot={onRemoveSlot}
                    onAddSlot={onAddSlot}
                    deletingSlot={deletingSlot}
                  />
                );
              })}
            </div>
          )}

          {/* Обучение tab */}
          {activeTab === 'training' && (
            <div className="space-y-2">
              {loadingTraining ? (
                <div className="flex items-center justify-center gap-2 py-10 text-slate-600">
                  <Icon name="Loader2" size={16} className="animate-spin" />
                  <span className="text-xs">Загрузка...</span>
                </div>
              ) : trainingEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-700">
                  <Icon name="GraduationCap" size={28} className="mb-2 opacity-25" />
                  <p className="text-xs">Нет записей об обучении</p>
                </div>
              ) : (
                trainingEntries.map((entry, index) => (
                  <div key={entry.id} className="group rounded-2xl overflow-hidden ring-1 ring-violet-500/15 bg-violet-500/5">
                    {/* Заголовок карточки: номер + старший + удалить */}
                    <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-violet-500/10">
                      <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-bold text-violet-400">{index + 1}</span>
                      </div>
                      <Icon name="UserCheck" size={13} className="text-cyan-400 flex-shrink-0" />
                      <span className="text-xs md:text-sm font-semibold text-slate-100 flex-1 truncate">{entry.seniorName}</span>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="w-6 h-6 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all flex-shrink-0"
                      >
                        <Icon name="X" size={12} />
                      </button>
                    </div>

                    {/* Тело карточки */}
                    <div className="px-3 py-2 space-y-1.5">
                      {/* Промоутер */}
                      <div className="flex items-center gap-2">
                        <Icon name="User" size={11} className="text-violet-400/70 flex-shrink-0" />
                        <span className="text-xs text-slate-300 font-medium">{entry.promoterName}</span>
                      </div>

                      {/* Телефон */}
                      {entry.promoterPhone && (
                        <div className="flex items-center gap-2">
                          <Icon name="Phone" size={11} className="text-slate-600 flex-shrink-0" />
                          <span className="text-xs text-slate-500">{entry.promoterPhone}</span>
                        </div>
                      )}

                      {/* Организация + время в одну строку */}
                      {(entry.organization || entry.time) && (
                        <div className="flex items-center gap-3 flex-wrap">
                          {entry.organization && (
                            <div className="flex items-center gap-1.5">
                              <Icon name="Building2" size={11} className="text-slate-600 flex-shrink-0" />
                              <span className="text-xs text-slate-500">{entry.organization}</span>
                            </div>
                          )}
                          {entry.time && (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800/60 ring-1 ring-slate-700/40">
                              <Icon name="Clock" size={10} className="text-slate-500 flex-shrink-0" />
                              <span className="text-[10px] text-slate-400 font-medium">{entry.time}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Комментарий */}
                      {entry.comment && (
                        <div className="flex items-start gap-1.5 mt-0.5 pt-1.5 border-t border-slate-800/60">
                          <Icon name="MessageSquare" size={10} className="text-slate-600 flex-shrink-0 mt-0.5" />
                          <span className="text-[10px] text-slate-500 leading-relaxed">{entry.comment}</span>
                        </div>
                      )}
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