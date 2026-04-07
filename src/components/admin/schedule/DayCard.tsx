import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { DaySchedule, UserSchedule, DeleteSlotState, DayStats, OrganizationData } from './types';
import TimeSlotCard from './TimeSlotCard';

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
  workComments: Record<string, Record<string, {location?: string, flyers?: string}>>;
  savingComment: string | null;
  allLocations: string[];
  allOrganizations: OrganizationData[];
  userOrgStats: Record<string, Array<{organization_name: string, avg_per_shift: number}>>;
  recommendedLocations: Record<string, Record<string, string[]>>;
  actualStats: Record<string, {contacts: number, revenue: number}>;
  loadingProgress?: number;
  onToggleDay: (date: string) => void;
  onCommentChange: (userName: string, date: string, field: 'location' | 'flyers', value: string) => void;
  onCommentBlur: (userName: string, date: string, field: 'location' | 'flyers', value: string) => void;
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
  savingComment,
  allLocations,
  allOrganizations,
  userOrgStats,
  recommendedLocations,
  actualStats,
  loadingProgress,
  onToggleDay,
  onCommentChange,
  onCommentBlur,
  onRemoveSlot,
  onAddSlot,
  deletingSlot,
}: DayCardProps) {
  const [activeTab, setActiveTab] = useState<'department' | 'training'>('department');

  const trainingEntries: TrainingEntry[] = (() => {
    try {
      return JSON.parse(localStorage.getItem(`training_${day.date}`) || '[]');
    } catch { return []; }
  })();

  const isSuccessful = stats && stats.expected > 0 && stats.actual >= stats.expected;

  return (
    <Card className={`border border-slate-700/50 md:border-2 shadow-sm transition-all ${isSuccessful ? 'bg-emerald-500/10 md:border-emerald-500/50' : 'bg-slate-800/50 md:border-slate-700/50'}`}>
      <CardContent className="p-2 md:p-4">
        <div
          className={`flex items-center justify-between cursor-pointer -m-2 md:-m-4 p-2 md:p-4 rounded-lg transition-colors ${isSuccessful ? 'hover:bg-emerald-500/20' : 'hover:bg-slate-700/50'}`}
          onClick={() => onToggleDay(day.date)}
        >
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg ${isSuccessful ? 'bg-emerald-500' : day.isWeekend ? 'bg-orange-500' : 'bg-cyan-600'} text-white flex flex-col items-center justify-center font-bold text-[9px] md:text-xs`}>
              <span>{day.dayName}</span>
              <span className="text-xs md:text-sm">{new Date(day.date).getDate()}</span>
            </div>
            <div>
              <p className="font-semibold text-slate-100 text-xs md:text-base">{day.dayNameFull}</p>
              <p className="text-[10px] md:text-xs text-slate-400">{day.date}</p>
            </div>
            {stats && stats.expected > 0 && (
              <span className={`text-[10px] md:text-xs ml-1 md:ml-2 px-1.5 md:px-2 py-0.5 md:py-1 rounded ${isSuccessful ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-300 bg-slate-700/50'}`}>
                {stats.expected} / {stats.actual}
              </span>
            )}
            {isSuccessful && (
              <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-emerald-500 flex items-center justify-center ml-0.5 md:ml-1 animate-in zoom-in-50 duration-500">
                <Icon name="Check" size={14} className="text-white md:w-4 md:h-4" />
              </div>
            )}
          </div>
          <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={18} className="text-slate-400 md:w-5 md:h-5" />
        </div>

        {isExpanded && (
          <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-slate-700/50">

            {/* Табы */}
            <div className="flex gap-1 mb-3 bg-slate-800/60 rounded-lg p-0.5">
              <button
                onClick={() => setActiveTab('department')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'department' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Icon name="Users" size={13} />
                Отдел
              </button>
              <button
                onClick={() => setActiveTab('training')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'training' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Icon name="GraduationCap" size={13} />
                Обучение
                {trainingEntries.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'training' ? 'bg-white/20' : 'bg-violet-600/30 text-violet-400'}`}>
                    {trainingEntries.length}
                  </span>
                )}
              </button>
            </div>

            {/* Таб Отдел */}
            {activeTab === 'department' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 md:gap-2 lg:gap-3">
                {day.slots.map(slot => {
                  const workers = getUsersWorkingOnSlot(day.date, slot.time);
                  return (
                    <TimeSlotCard
                      key={slot.time}
                      slot={slot}
                      workers={workers}
                      dayDate={day.date}
                      workComments={workComments}
                      savingComment={savingComment}
                      allLocations={allLocations}
                      allOrganizations={allOrganizations}
                      userOrgStats={userOrgStats}
                      recommendedLocations={recommendedLocations}
                      loadingProgress={loadingProgress}
                      onCommentChange={onCommentChange}
                      onCommentBlur={onCommentBlur}
                      onRemoveSlot={onRemoveSlot}
                      onAddSlot={onAddSlot}
                      deletingSlot={deletingSlot}
                    />
                  );
                })}
              </div>
            )}

            {/* Таб Обучение */}
            {activeTab === 'training' && (
              <div className="space-y-2">
                {trainingEntries.length === 0 ? (
                  <div className="text-center py-6 text-slate-500">
                    <Icon name="GraduationCap" size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-xs">Нет записей об обучении</p>
                    <p className="text-[10px] text-slate-600 mt-1">Добавьте через кнопку «Добавить обучение»</p>
                  </div>
                ) : (
                  trainingEntries.map((entry, index) => (
                    <div key={entry.id} className="bg-slate-900/60 rounded-xl p-3 border border-slate-700 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-violet-400 w-4">{index + 1}</span>
                        <Icon name="UserCheck" size={13} className="text-cyan-400 flex-shrink-0" />
                        <span className="text-sm font-semibold text-slate-100">{entry.seniorName}</span>
                        <span className="text-slate-500 text-xs">→</span>
                        <span className="text-sm text-slate-200">{entry.promoterName}</span>
                      </div>
                      {entry.promoterPhone && (
                        <div className="flex items-center gap-2">
                          <Icon name="Phone" size={11} className="text-slate-500 flex-shrink-0" />
                          <span className="text-xs text-slate-400">{entry.promoterPhone}</span>
                        </div>
                      )}
                      {(entry.organization || entry.time) && (
                        <div className="flex items-center gap-4 flex-wrap">
                          {entry.organization && (
                            <div className="flex items-center gap-1.5">
                              <Icon name="Building2" size={11} className="text-slate-500 flex-shrink-0" />
                              <span className="text-xs text-slate-400">{entry.organization}</span>
                            </div>
                          )}
                          {entry.time && (
                            <div className="flex items-center gap-1.5">
                              <Icon name="Clock" size={11} className="text-slate-500 flex-shrink-0" />
                              <span className="text-xs text-slate-400">{entry.time}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {entry.comment && (
                        <div className="flex items-start gap-1.5">
                          <Icon name="MessageSquare" size={11} className="text-slate-500 flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-slate-400">{entry.comment}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
