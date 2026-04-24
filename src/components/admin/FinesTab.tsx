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
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  return `${start.getDate()}.${String(start.getMonth() + 1).padStart(2, '0')} — ${end.getDate()}.${String(end.getMonth() + 1).padStart(2, '0')}`;
}

const FINE_ICONS: Record<string, string> = {
  missed: 'XCircle',
  late: 'Clock',
  early: 'LogOut',
};

const FINE_COLORS: Record<string, string> = {
  missed: 'text-red-600 bg-red-50',
  late: 'text-orange-600 bg-orange-50',
  early: 'text-yellow-600 bg-yellow-50',
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
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d.toISOString().split('T')[0]);
  };

  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d.toISOString().split('T')[0]);
  };

  const isCurrentWeek = weekStart === getCurrentWeekStart();
  const totalFines = data.reduce((sum, p) => sum + p.total_fines, 0);
  const promotersWithFines = data.filter(p => p.total_fines > 0);

  return (
    <div className="space-y-4">
      {/* Заголовок + навигация по неделям */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Icon name="AlertTriangle" size={18} className="text-red-500" />
            Штрафы промоутеров
          </h2>
          {totalFines > 0 && (
            <span className="text-sm font-bold text-red-500">−{totalFines.toLocaleString('ru-RU')} ₽</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-3">
          <button onClick={prevWeek} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <Icon name="ChevronLeft" size={16} className="text-gray-600" />
          </button>
          <span className="flex-1 text-center text-sm font-medium text-gray-700">
            {formatWeekLabel(weekStart)}
            {isCurrentWeek && <span className="ml-2 text-xs text-blue-500 font-semibold">текущая</span>}
          </span>
          <button onClick={nextWeek} disabled={isCurrentWeek} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 flex items-center justify-center transition-colors">
            <Icon name="ChevronRight" size={16} className="text-gray-600" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
          Нет данных за эту неделю
        </div>
      ) : (
        <>
          {/* Сводная таблица */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 grid grid-cols-12 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <span className="col-span-5">Промоутер</span>
              <span className="col-span-2 text-right">Заработок</span>
              <span className="col-span-2 text-right text-red-400">Штрафы</span>
              <span className="col-span-2 text-right">Итого</span>
              <span className="col-span-1"></span>
            </div>

            <div className="divide-y divide-gray-50">
              {data.map((p) => (
                <div key={p.user_id}>
                  {/* Строка промоутера */}
                  <button
                    onClick={() => setExpandedUser(expandedUser === p.user_id ? null : p.user_id)}
                    className="w-full px-4 py-3 grid grid-cols-12 items-center hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="col-span-5 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.total_fines > 0 ? 'bg-red-400' : 'bg-green-400'}`} />
                      <span className="text-sm font-medium text-gray-800 truncate">{p.name}</span>
                    </div>
                    <span className="col-span-2 text-right text-sm text-gray-600">
                      {p.total_earnings.toLocaleString('ru-RU')} ₽
                    </span>
                    <span className={`col-span-2 text-right text-sm font-medium ${p.total_fines > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                      {p.total_fines > 0 ? `−${p.total_fines.toLocaleString('ru-RU')} ₽` : '—'}
                    </span>
                    <span className={`col-span-2 text-right text-sm font-bold ${p.total_net < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                      {p.total_net.toLocaleString('ru-RU')} ₽
                    </span>
                    <span className="col-span-1 flex justify-end">
                      <Icon name={expandedUser === p.user_id ? 'ChevronUp' : 'ChevronDown'} size={14} className="text-gray-400" />
                    </span>
                  </button>

                  {/* Детализация по дням */}
                  {expandedUser === p.user_id && (
                    <div className="bg-gray-50 px-4 pb-3 pt-1 space-y-2">
                      {p.days.map((day) => (
                        <div key={day.date} className="bg-white rounded-xl p-3 border border-gray-100">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-gray-700">
                              {day.day_name}, {new Date(day.date + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-500">{day.contacts} контактов · {day.earnings.toLocaleString('ru-RU')} ₽</span>
                              <span className={`text-xs font-bold ${day.net < 0 ? 'text-red-600' : 'text-gray-700'}`}>
                                = {day.net.toLocaleString('ru-RU')} ₽
                              </span>
                            </div>
                          </div>
                          {day.fines.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {day.fines.map((fine, i) => (
                                <span key={i} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${FINE_COLORS[fine.type]}`}>
                                  <Icon name={FINE_ICONS[fine.type]} size={10} />
                                  {fine.label} · −{fine.amount} ₽
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-green-500 flex items-center gap-1">
                              <Icon name="CheckCircle" size={11} /> Нарушений нет
                            </span>
                          )}
                        </div>
                      ))}

                      {p.days.length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-2">Нет активности за неделю</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Итоги */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">Работали</div>
              <div className="text-lg font-bold text-gray-800">{data.length}</div>
            </div>
            <div className="bg-white rounded-xl border border-red-100 p-3 text-center">
              <div className="text-xs text-red-400 mb-1">Со штрафами</div>
              <div className="text-lg font-bold text-red-500">{promotersWithFines.length}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">Всего штрафов</div>
              <div className="text-lg font-bold text-red-500">−{totalFines.toLocaleString('ru-RU')} ₽</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
