import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { User } from './types';
import { TRAINING_API, authHeaders, KpdData, fmtDay, fmtWeek, fmtMonth } from './seniors-utils';

interface Props {
  seniorId: number;
  traineesFromTeam: User[];
}

export default function SeniorKpdSection({ seniorId, traineesFromTeam }: Props) {
  const [kpd, setKpd] = useState<KpdData | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [openPeriod, setOpenPeriod] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${TRAINING_API}?action=get_senior_kpd&senior_id=${seniorId}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { setKpd(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [seniorId]);

  if (loading) return (
    <div className="flex items-center gap-2 text-slate-400 text-sm py-6 justify-center">
      <Icon name="Loader2" size={15} className="animate-spin" />
      Загружаем данные...
    </div>
  );
  if (!kpd) return null;

  const periodData = period === 'day' ? kpd.by_day : period === 'week' ? kpd.by_week : kpd.by_month;
  const total = periodData.reduce((s, i) => s + i.count, 0);

  const getLabel = (item: { date?: string; week_start?: string; month_start?: string }) => {
    if (period === 'day') return fmtDay(item.date!);
    if (period === 'week') return fmtWeek(item.week_start!);
    return fmtMonth(item.month_start!);
  };

  const getTraineesForPeriod = (item: { date?: string; week_start?: string; month_start?: string }) => {
    return kpd.trainees.filter(t => {
      const reg = new Date(t.registered_at);
      if (period === 'day') {
        return fmtDay(t.registered_at) === fmtDay(item.date!);
      }
      if (period === 'week') {
        const ws = new Date(item.week_start!);
        const we = new Date(item.week_start!);
        we.setDate(we.getDate() + 6);
        return reg >= ws && reg <= we;
      }
      const ms = new Date(item.month_start!);
      return reg.getFullYear() === ms.getFullYear() && reg.getMonth() === ms.getMonth();
    });
  };

  const togglePeriod = (key: string) => setOpenPeriod(p => p === key ? null : key);

  return (
    <div className="space-y-5">
      {/* Переключатель периода */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {(['day', 'week', 'month'] as const).map(p => (
          <button
            key={p}
            onClick={() => { setPeriod(p); setOpenPeriod(null); }}
            className={`flex-1 text-xs py-2 rounded-lg font-semibold transition-all duration-200 ${period === p ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {p === 'day' ? 'День' : p === 'week' ? 'Неделя' : 'Месяц'}
          </button>
        ))}
      </div>

      {/* Обучения */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Обучений проведено</span>
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Итого: {total}</span>
        </div>

        {periodData.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">Нет данных за этот период</div>
        ) : (
          <div className="space-y-2">
            {periodData.map((item, i) => {
              const key = item.date || item.week_start || item.month_start || String(i);
              const isOpen = openPeriod === key;
              const trainees = getTraineesForPeriod(item as { date?: string; week_start?: string; month_start?: string });

              return (
                <div key={key} className="rounded-xl overflow-hidden border border-slate-100">
                  <button
                    className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${isOpen ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'}`}
                    onClick={() => togglePeriod(key)}
                  >
                    <div className="flex items-center gap-2">
                      <Icon name={isOpen ? 'ChevronDown' : 'ChevronRight'} size={14} className="text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">
                        {getLabel(item as { date?: string; week_start?: string; month_start?: string })}
                      </span>
                    </div>
                    <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${isOpen ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600'}`}>
                      {item.count}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-100 bg-slate-50/50">
                      {trainees.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-3">Нет стажёров</p>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {trainees.map(t => (
                            <div key={t.id} className={`flex items-center justify-between px-4 py-2.5 ${!t.is_active ? 'opacity-50' : ''}`}>
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.is_active ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                                <span className="text-sm text-slate-700 truncate">{t.name}</span>
                                {!t.is_active && <span className="text-[10px] text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded-full flex-shrink-0">архив</span>}
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <Icon name="Calendar" size={11} />
                                  {t.shifts_count}
                                </span>
                                <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                                  <Icon name="Phone" size={11} />
                                  {t.lead_count}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}