import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

interface Fine {
  type: 'missed' | 'late' | 'early';
  amount: number;
  label: string;
}

interface DayData {
  date: string;
  day_name: string;
  contacts: number;
  earnings: number;
  fines: Fine[];
  fines_total: number;
  net: number;
  has_shift: boolean;
}

interface PromoterData {
  user_id: number;
  name: string;
  total_earnings: number;
  total_fines: number;
  total_net: number;
  days: DayData[];
}

function getCurrentWeekStart(): string {
  const now = new Date();
  const msk = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const day = msk.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  msk.setUTCDate(msk.getUTCDate() + diff);
  return msk.toISOString().split('T')[0];
}

function formatWeekLabel(weekStart: string): string {
  const start = new Date(weekStart + 'T12:00:00');
  const end = new Date(weekStart + 'T12:00:00');
  end.setDate(end.getDate() + 6);
  return `${start.getDate()}.${String(start.getMonth() + 1).padStart(2, '0')} — ${end.getDate()}.${String(end.getMonth() + 1).padStart(2, '0')}`;
}

const FINE_ICONS: Record<string, string> = {
  missed: 'XCircle',
  late: 'Clock',
  early: 'LogOut',
};

const FINE_COLORS: Record<string, string> = {
  missed: 'text-red-600 bg-red-50 border-red-100',
  late: 'text-orange-600 bg-orange-50 border-orange-100',
  early: 'text-yellow-600 bg-yellow-50 border-yellow-100',
};

export default function FinesTab() {
  const [data, setData] = useState<PromoterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(getCurrentWeekStart());
  const [expandedUser, setExpandedUser] = useState<number | null>(null);

  useEffect(() => {
    fetchFines();
  }, [weekStart]);

  const fetchFines = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://functions.poehali.dev/5bc9ec24-af65-4ab1-ba3b-2d43b1803637?week_start=${weekStart}`,
        { headers: { 'X-Session-Token': localStorage.getItem('session_token') || '' } }
      );
      if (res.ok) {
        const json = await res.json();
        setData(json.promoters || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const prevWeek = () => {
    const d = new Date(weekStart + 'T12:00:00');
    d.setDate(d.getDate() - 7);
    setWeekStart(d.toISOString().split('T')[0]);
  };

  const nextWeek = () => {
    const d = new Date(weekStart + 'T12:00:00');
    d.setDate(d.getDate() + 7);
    setWeekStart(d.toISOString().split('T')[0]);
  };

  const isCurrentWeek = weekStart === getCurrentWeekStart();
  const totalFines = data.reduce((sum, p) => sum + p.total_fines, 0);
  const promotersWithFines = data.filter(p => p.total_fines > 0);

  return (
    <div className="space-y-3">
      {/* Шапка с навигацией */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Icon name="AlertTriangle" size={18} className="text-red-500" />
            Штрафы промоутеров
          </h2>
          {totalFines > 0 && (
            <span className="text-sm font-bold text-red-500">−{totalFines.toLocaleString('ru-RU')} ₽</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevWeek} className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0">
            <Icon name="ChevronLeft" size={16} className="text-gray-600" />
          </button>
          <div className="flex-1 text-center">
            <span className="text-sm font-semibold text-gray-700">{formatWeekLabel(weekStart)}</span>
            {isCurrentWeek && <span className="ml-2 text-xs text-blue-500 font-semibold">текущая</span>}
          </div>
          <button onClick={nextWeek} disabled={isCurrentWeek} className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-30 flex items-center justify-center transition-colors flex-shrink-0">
            <Icon name="ChevronRight" size={16} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Итоги */}
      {!loading && data.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <div className="text-[11px] text-gray-400 mb-1">Работали</div>
            <div className="text-xl font-bold text-gray-800">{data.length}</div>
          </div>
          <div className="bg-white rounded-xl border border-red-100 p-3 text-center">
            <div className="text-[11px] text-red-400 mb-1">Со штрафами</div>
            <div className="text-xl font-bold text-red-500">{promotersWithFines.length}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <div className="text-[11px] text-gray-400 mb-1">Сумма</div>
            <div className="text-xl font-bold text-red-500">−{totalFines.toLocaleString('ru-RU')}</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
          Нет данных за эту неделю
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((p) => (
            <div key={p.user_id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Строка промоутера */}
              <button
                onClick={() => setExpandedUser(expandedUser === p.user_id ? null : p.user_id)}
                className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${p.total_fines > 0 ? 'bg-red-400' : 'bg-green-400'}`} />

                {/* Имя */}
                <span className="flex-1 text-sm font-semibold text-gray-800 truncate min-w-0">{p.name}</span>

                {/* Цифры */}
                <div className="flex items-center gap-2 flex-shrink-0 text-right">
                  <div className="hidden sm:block text-xs text-gray-400">
                    {p.total_earnings.toLocaleString('ru-RU')} ₽
                  </div>
                  {p.total_fines > 0 ? (
                    <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-lg">
                      −{p.total_fines.toLocaleString('ru-RU')} ₽
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">нет штрафов</span>
                  )}
                  <span className={`text-sm font-bold ${p.total_net < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                    {p.total_net.toLocaleString('ru-RU')} ₽
                  </span>
                  <Icon name={expandedUser === p.user_id ? 'ChevronUp' : 'ChevronDown'} size={14} className="text-gray-400" />
                </div>
              </button>

              {/* Детализация по дням */}
              {expandedUser === p.user_id && (
                <div className="border-t border-gray-100 bg-gray-50 px-3 py-3 space-y-2">
                  {/* Доход на мобиле */}
                  <div className="sm:hidden flex justify-between text-xs text-gray-500 px-1 pb-1">
                    <span>Заработок: {p.total_earnings.toLocaleString('ru-RU')} ₽</span>
                  </div>

                  {p.days.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-2">Нет активности за неделю</p>
                  ) : (
                    p.days.map((day) => (
                      <div key={day.date} className="bg-white rounded-xl p-3 border border-gray-100">
                        {/* День + итог */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-gray-700">
                            {day.day_name}, {new Date(day.date + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                          </span>
                          <span className={`text-xs font-bold ${day.net < 0 ? 'text-red-600' : 'text-gray-700'}`}>
                            {day.net.toLocaleString('ru-RU')} ₽
                          </span>
                        </div>

                        {/* Контакты + доход */}
                        <div className="text-[11px] text-gray-400 mb-1.5">
                          {day.contacts} контакт{day.contacts === 1 ? '' : day.contacts < 5 ? 'а' : 'ов'} · заработок {day.earnings.toLocaleString('ru-RU')} ₽
                          {day.fines_total > 0 && <span className="text-red-400"> · штрафы −{day.fines_total.toLocaleString('ru-RU')} ₽</span>}
                        </div>

                        {/* Штрафы */}
                        {day.fines.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {day.fines.map((fine, i) => (
                              <span key={i} className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg font-medium border ${FINE_COLORS[fine.type]}`}>
                                <Icon name={FINE_ICONS[fine.type]} size={11} />
                                {fine.label} · −{fine.amount} ₽
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-green-500 flex items-center gap-1">
                            <Icon name="CheckCircle" size={11} /> Нарушений нет
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
