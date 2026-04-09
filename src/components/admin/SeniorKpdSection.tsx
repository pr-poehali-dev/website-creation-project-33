import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { TRAINING_API, authHeaders, KpdData, KpdTrainee, KpdSummary, fmtDay, fmtWeek, fmtMonth } from './seniors-utils';

interface Props {
  seniorId: number;
}

export default function SeniorKpdSection({ seniorId }: Props) {
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

  const getKey = (item: { date?: string; week_start?: string; month_start?: string }, i: number) =>
    item.date || item.week_start || item.month_start || String(i);

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
              const key = getKey(item as { date?: string; week_start?: string; month_start?: string }, i);
              const isOpen = openPeriod === key;
              const trainees: KpdTrainee[] = (item as { trainees: KpdTrainee[] }).trainees || [];
              const summary: KpdSummary = (item as { summary: KpdSummary }).summary || { trainees_count: 0, inactive_count: 0, total_leads: 0, total_kms: 0 };

              return (
                <div key={key} className="rounded-xl overflow-hidden border border-slate-100">
                  {/* Заголовок периода */}
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

                  {/* Раскрытая панель */}
                  {isOpen && (
                    <div className="border-t border-slate-100 bg-slate-50/50">
                      {/* Список стажёров */}
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
                              <span className="text-xs font-semibold text-blue-600 flex items-center gap-1 flex-shrink-0 ml-3">
                                <Icon name="Phone" size={11} />
                                {t.lead_count}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Итог периода */}
                      <div className="mx-3 mb-3 mt-2 rounded-xl bg-white border border-slate-100 px-4 py-3">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Итог периода</div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-col items-center flex-1">
                            <span className="text-base font-bold text-slate-800">{summary.trainees_count}</span>
                            <span className="text-[10px] text-slate-400 text-center leading-tight">Стажёров</span>
                          </div>
                          <div className="w-px h-8 bg-slate-100" />
                          <div className="flex flex-col items-center flex-1">
                            <span className="text-base font-bold text-red-500">{summary.inactive_count}</span>
                            <span className="text-[10px] text-slate-400 text-center leading-tight">Слив</span>
                          </div>
                          <div className="w-px h-8 bg-slate-100" />
                          <div className="flex flex-col items-center flex-1">
                            <span className="text-base font-bold text-blue-600">{summary.total_leads}</span>
                            <span className="text-[10px] text-slate-400 text-center leading-tight">Контактов</span>
                          </div>
                          <div className="w-px h-8 bg-slate-100" />
                          <div className="flex flex-col items-center flex-1">
                            <span className="text-base font-bold text-emerald-600">{summary.total_kms ?? 0}₽</span>
                            <span className="text-[10px] text-slate-400 text-center leading-tight">Прибыль</span>
                          </div>
                        </div>
                      </div>
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