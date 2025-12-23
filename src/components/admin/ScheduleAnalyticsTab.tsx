import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface WeekPeriod {
  label: string;
  start: string;
  end: string;
}

type ViewMode = 'day' | 'week' | 'month' | 'year';
type PeriodDays = 7 | 30 | 60 | 90 | 365;

interface OrganizationActivity {
  date: string;
  count: number;
}

export default function ScheduleAnalyticsTab() {
  const [currentWeekIndex, setCurrentWeekIndex] = useState(4); // Текущая неделя в середине списка
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [periodDays, setPeriodDays] = useState<PeriodDays>(30);
  const [selectedOrganization, setSelectedOrganization] = useState<string>('all');
  const [organizationActivity, setOrganizationActivity] = useState<OrganizationActivity[]>([]);
  const [loading, setLoading] = useState(false);

  // Генерация недель
  const generateWeeks = (): WeekPeriod[] => {
    const weeks: WeekPeriod[] = [];
    const today = new Date();
    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    
    for (let i = -4; i <= 8; i++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() + mondayOffset + (i * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const formatDate = (d: Date) => {
        const day = d.getDate();
        const month = d.toLocaleString('ru', { month: 'short' });
        return `${day} ${month}.`;
      };
      
      weeks.push({
        label: `${formatDate(weekStart)} - ${formatDate(weekEnd)}`,
        start: weekStart.toISOString().split('T')[0],
        end: weekEnd.toISOString().split('T')[0]
      });
    }
    
    return weeks;
  };

  const weeks = generateWeeks();
  const currentWeek = weeks[currentWeekIndex];

  // Загрузка данных активности организаций
  useEffect(() => {
    loadOrganizationActivity();
  }, [periodDays, selectedOrganization]);

  const loadOrganizationActivity = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      const response = await fetch(
        `https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214?action=organization_activity&start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}&organization=${selectedOrganization}`,
        {
          headers: {
            'X-Session-Token': localStorage.getItem('session_token') || ''
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setOrganizationActivity(data.activity || []);
      }
    } catch (error) {
      console.error('Error loading organization activity:', error);
    } finally {
      setLoading(false);
    }
  };

  // Данные для графика
  const maxCount = Math.max(...organizationActivity.map(d => d.count), 1);
  const chartHeight = 300;
  const chartWidth = 1000;
  const paddingLeft = 50;
  const paddingBottom = 30;

  const getChartPoints = () => {
    if (organizationActivity.length === 0) return '';
    
    const stepX = (chartWidth - paddingLeft) / (organizationActivity.length - 1 || 1);
    
    return organizationActivity.map((point, index) => {
      const x = paddingLeft + (index * stepX);
      const y = chartHeight - paddingBottom - ((point.count / maxCount) * (chartHeight - paddingBottom - 20));
      return `${x},${y}`;
    }).join(' ');
  };

  // Статистика
  const stats = {
    week14: { vse: '25% (15/61)', top: '31% (10/32)', kib: '22% (2/9)' },
    week30: { vse: '26% (16/61)', top: '31% (10/32)', kib: '22% (2/9)' }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок с переключением периодов */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Планирование выходов</h2>
          
          {/* Статистика */}
          <div className="space-y-2 text-sm text-slate-600 mb-4">
            <div>
              <span className="font-medium">14 дней:</span> ВСЕ: {stats.week14.vse} ТОП: {stats.week14.top} КИБ: {stats.week14.kib}
            </div>
            <div>
              <span className="font-medium">30 дней:</span> ВСЕ: {stats.week30.vse} ТОП: {stats.week30.top} КИБ: {stats.week30.kib}
            </div>
          </div>

          {/* Навигация по неделям */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentWeekIndex(Math.max(0, currentWeekIndex - 1))}
              disabled={currentWeekIndex === 0}
              className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Icon name="ChevronLeft" size={20} />
            </button>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-slate-800">{currentWeek.label}</div>
            </div>
            
            <button
              onClick={() => setCurrentWeekIndex(Math.min(weeks.length - 1, currentWeekIndex + 1))}
              disabled={currentWeekIndex === weeks.length - 1}
              className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Icon name="ChevronRight" size={20} />
            </button>
          </div>

          {/* Переключатель режима */}
          <div className="flex gap-2">
            <button 
              onClick={() => setViewMode('day')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'day' 
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              День
            </button>
            <button 
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'week' 
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Неделя
            </button>
            <button 
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'month' 
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Месяц
            </button>
            <button 
              onClick={() => setViewMode('year')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'year' 
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Год
            </button>
          </div>
        </CardContent>
      </Card>

      {/* График динамики задействованных организаций */}
      <Card className="bg-slate-900 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Динамика задействованных организаций</h3>
              <p className="text-slate-400 text-sm">Отслеживание активности организаций по категориям</p>
            </div>
            
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-sm hover:bg-slate-700 transition-colors">
                Дни
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-sm hover:bg-slate-700 transition-colors">
                Недели
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-cyan-500 text-white text-sm shadow-lg">
                Месяцы
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-sm hover:bg-slate-700 transition-colors">
                Годы
              </button>
            </div>
          </div>

          {/* Период */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setPeriodDays(7)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                periodDays === 7 ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              7 дн.
            </button>
            <button
              onClick={() => setPeriodDays(30)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                periodDays === 30 ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              30 дн.
            </button>
            <button
              onClick={() => setPeriodDays(60)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                periodDays === 60 ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              60 дн.
            </button>
            <button
              onClick={() => setPeriodDays(90)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                periodDays === 90 ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              90 дн.
            </button>
            <button
              onClick={() => setPeriodDays(365)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                periodDays === 365 ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              365 дн.
            </button>
          </div>

          {/* Фильтр организаций */}
          <div className="mb-6">
            <label className="text-white text-sm mb-2 block">Отслеживать организацию:</label>
            <select
              value={selectedOrganization}
              onChange={(e) => setSelectedOrganization(e.target.value)}
              className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">Не выбрано</option>
            </select>
          </div>

          {/* Легенда */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
              <span className="text-slate-400 text-sm">Все организации</span>
            </div>
          </div>

          {/* График */}
          <div className="bg-slate-800/50 rounded-xl p-4 h-80 relative">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-slate-400">Загрузка...</div>
              </div>
            ) : organizationActivity.length > 0 ? (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
                {/* Сетка */}
                {[0, 7, 14, 21, 28].map(value => {
                  const y = chartHeight - paddingBottom - ((value / maxCount) * (chartHeight - paddingBottom - 20));
                  return (
                    <g key={value}>
                      <line
                        x1={paddingLeft}
                        y1={y}
                        x2={chartWidth}
                        y2={y}
                        stroke="#334155"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                      <text x={10} y={y + 5} fill="#94a3b8" fontSize="12">
                        {value}
                      </text>
                    </g>
                  );
                })}

                {/* Линия графика */}
                <polyline
                  points={getChartPoints()}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Точки на графике */}
                {organizationActivity.map((point, index) => {
                  const stepX = (chartWidth - paddingLeft) / (organizationActivity.length - 1 || 1);
                  const x = paddingLeft + (index * stepX);
                  const y = chartHeight - paddingBottom - ((point.count / maxCount) * (chartHeight - paddingBottom - 20));
                  
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="5"
                      fill="#06b6d4"
                      stroke="#0e7490"
                      strokeWidth="2"
                    />
                  );
                })}
              </svg>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                Нет данных за выбранный период
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Таблицы выходов */}
      <div className="grid grid-cols-2 gap-6">
        {/* Были выходы */}
        <Card className="bg-white border-slate-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Icon name="CheckCircle" size={20} className="text-green-500" />
              Были выходы
            </h3>
            <div className="space-y-2 text-sm text-slate-600">
              <p>Данные загружаются...</p>
            </div>
          </CardContent>
        </Card>

        {/* Не было выходов */}
        <Card className="bg-white border-slate-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Icon name="XCircle" size={20} className="text-red-500" />
              Не было выходов
            </h3>
            <div className="space-y-2 text-sm text-slate-600">
              <p>Данные загружаются...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}