import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/ui/icon';

interface DayData {
  date: string;
  day_name: string;
  contacts: number;
  earnings: number;
  fines: { type: string; amount: number; label: string; time_info?: string }[];
  fines_total: number;
  net: number;
  has_shift: boolean;
  is_today: boolean;
  is_future: boolean;
}

interface EarningsData {
  days: DayData[];
  week_start: string;
  total_earnings: number;
  total_fines: number;
  total_net: number;
}

function getCurrentWeekStart(): string {
  const now = new Date();
  // MSK = UTC+3
  const msk = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const day = msk.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  msk.setUTCDate(msk.getUTCDate() + diff);
  return msk.toISOString().split('T')[0];
}

export default function EarningsChart() {
  const { user } = useAuth();
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    fetchEarnings();
  }, [user?.id]);

  const fetchEarnings = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const weekStart = getCurrentWeekStart();
      const res = await fetch(
        `https://functions.poehali.dev/db9c0dd3-cb0d-4986-8fa4-bb89c1b4fa00?user_id=${user.id}&week_start=${weekStart}`,
        { headers: { 'X-Session-Token': localStorage.getItem('session_token') || '' } }
      );
      if (res.ok) {
        const json = await res.json();
        setData(json);
        const today = json.days.find((d: DayData) => d.is_today);
        if (today) setSelectedDay(today);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
        <div className="h-16 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-[#001f54] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const maxNet = Math.max(...data.days.map(d => Math.abs(d.net)), 1);

  // Половина высоты графика = 28px (центральная линия)
  const CHART_HALF = 28;

  return (
    <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
      {/* График + итог справа */}
      <div className="flex items-center gap-3 mb-1">
        <div className="flex-1 flex items-stretch gap-1" style={{ height: 64 }}>
          {data.days.map((day) => {
            const isSelected = selectedDay?.date === day.date;
            const barHeight = day.net === 0 ? 3 : Math.max(5, Math.round((Math.abs(day.net) / maxNet) * CHART_HALF));
            const hasProblems = day.fines_total > 0;
            const isNegative = day.net < 0;

            let barColor = 'bg-[#001f54]';
            if (day.is_future || (!day.has_shift && !day.is_today)) {
              barColor = 'bg-gray-200';
            } else if (isNegative) {
              barColor = 'bg-red-400';
            } else if (hasProblems) {
              barColor = 'bg-orange-400';
            }

            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center cursor-pointer group"
                onClick={() => setSelectedDay(isSelected ? null : day)}
              >
                {/* Верхняя половина — положительные бары растут вверх */}
                <div className="w-full flex items-end justify-center" style={{ height: CHART_HALF }}>
                  {!isNegative && day.net !== 0 && (
                    <div
                      className={`w-full rounded-t-md transition-all ${barColor} ${isSelected ? 'opacity-100' : 'opacity-70 group-hover:opacity-90'}`}
                      style={{ height: barHeight }}
                    />
                  )}
                </div>

                {/* Центральная линия */}
                <div className="w-full h-px bg-gray-200" />

                {/* Нижняя половина — отрицательные бары растут вниз */}
                <div className="w-full flex items-start justify-center" style={{ height: CHART_HALF }}>
                  {isNegative && (
                    <div
                      className={`w-full rounded-b-md transition-all ${barColor} ${isSelected ? 'opacity-100' : 'opacity-70 group-hover:opacity-90'}`}
                      style={{ height: barHeight }}
                    />
                  )}
                  {day.net === 0 && (
                    <div className={`w-full rounded-md ${barColor} opacity-30`} style={{ height: 3 }} />
                  )}
                </div>

                {/* Day label */}
                <span className={`text-[10px] font-medium mt-0.5 ${day.is_today ? 'text-[#001f54] font-bold' : 'text-gray-400'}`}>
                  {day.day_name}
                </span>

                {/* Dot if fines */}
                {hasProblems && (
                  <div className="w-1 h-1 rounded-full bg-red-400 mt-0.5" />
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* Detail panel */}
      {selectedDay && (
        <div className="mt-3 pt-3 border-t border-gray-100 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700">
              {selectedDay.day_name}, {new Date(selectedDay.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
            </span>
            <span className={`text-sm font-bold ${selectedDay.net < 0 ? 'text-red-500' : 'text-[#001f54]'}`}>
              {selectedDay.net.toLocaleString('ru-RU')} ₽
            </span>
          </div>

          <div className="space-y-1">
            {selectedDay.earnings > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Icon name="Users" size={11} /> {selectedDay.contacts} контактов
                </span>
                <span className="text-xs font-medium text-gray-700">+{selectedDay.earnings.toLocaleString('ru-RU')} ₽</span>
              </div>
            )}

            {selectedDay.fines.map((fine, i) => (
              <div key={i} className="flex justify-between items-start gap-2">
                <span className="text-xs text-red-500 flex items-start gap-1">
                  <Icon name="AlertCircle" size={11} className="mt-0.5 flex-shrink-0" />
                  <span>
                    {fine.label}
                    {fine.time_info && <span className="block text-[10px] text-red-400 mt-0.5">({fine.time_info})</span>}
                  </span>
                </span>
                <span className="text-xs font-medium text-red-500 flex-shrink-0">−{fine.amount.toLocaleString('ru-RU')} ₽</span>
              </div>
            ))}

            {!selectedDay.has_shift && !selectedDay.is_future && selectedDay.earnings === 0 && selectedDay.fines.length === 0 && (
              <span className="text-xs text-gray-400">Нет смены</span>
            )}

            {selectedDay.is_future && (
              <span className="text-xs text-gray-400">Ещё не наступил</span>
            )}
          </div>
        </div>
      )}

      {/* Footer stats */}
      {(data.total_earnings > 0 || data.total_fines > 0) && (
        <div className="mt-3 pt-2 border-t border-gray-100 flex flex-col gap-1">
          {data.total_earnings > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-700 flex items-center gap-1">
                <Icon name="TrendingUp" size={11} /> Доход за неделю
              </span>
              <span className="text-xs font-semibold text-gray-800">+{data.total_earnings.toLocaleString('ru-RU')} ₽</span>
            </div>
          )}
          {data.total_fines > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-700 flex items-center gap-1">
                <Icon name="AlertCircle" size={11} /> Штрафы за неделю
              </span>
              <span className="text-xs font-semibold text-red-500">−{data.total_fines.toLocaleString('ru-RU')} ₽</span>
            </div>
          )}
          {data.total_fines > 0 && (
            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
              <span className="text-xs text-gray-700 flex items-center gap-1 font-medium">
                <Icon name="Wallet" size={11} /> Итого за неделю
              </span>
              <span className={`text-xs font-bold ${data.total_net < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                {data.total_net >= 0 ? '+' : ''}{data.total_net.toLocaleString('ru-RU')} ₽
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}