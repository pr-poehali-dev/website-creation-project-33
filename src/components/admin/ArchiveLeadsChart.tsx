import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface ChartDataPoint {
  date: string;
  total: number;
  users: { name: string; count: number }[];
}

interface ArchiveLeadsChartProps {
  data: ChartDataPoint[];
  loading: boolean;
}

export default function ArchiveLeadsChart({ data, loading }: ArchiveLeadsChartProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('all');
  const [selectedPromoter, setSelectedPromoter] = useState<string>('all');

  const allUsers = useMemo(() => {
    const users = Array.from(new Set(data.flatMap((d) => d.users.map((u) => u.name))));
    return users.sort((a, b) => a.localeCompare(b, 'ru'));
  }, [data]);

  if (loading) {
    return (
      <Card className="bg-white border-gray-200 rounded-2xl">
        <CardContent className="p-8">
          <div className="text-center text-gray-600 flex items-center justify-center gap-3">
            <Icon name="Loader2" size={20} className="animate-spin" />
            Загрузка графика...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="bg-white border-gray-200 rounded-2xl">
        <CardContent className="p-8">
          <div className="text-center text-gray-600">
            <Icon name="AlertCircle" size={28} className="mx-auto mb-3 opacity-60" />
            <div className="text-lg font-medium">Нет данных для отображения</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getFilteredChartData = () => {
    if (timeRange === 'all') {
      return data;
    }

    const now = new Date();
    const daysToSubtract = timeRange === 'week' ? 7 : 30;
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - daysToSubtract);

    return data.filter((item) => new Date(item.date) >= cutoffDate);
  };

  const filteredData = getFilteredChartData();

  const chartDataFormatted = filteredData.map((item) => {
    const formatted: any = { date: item.date, total: item.total };
    
    if (selectedPromoter !== 'all') {
      const user = item.users.find(u => u.name === selectedPromoter);
      formatted[selectedPromoter] = user ? user.count : 0;
    }
    
    return formatted;
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload) return null;

    const date = payload[0]?.payload?.date;
    const displayData = payload.filter((p: any) => p.dataKey === 'total' || p.dataKey === selectedPromoter);

    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 mb-2">{date}</p>
        {displayData.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <Card className="bg-white border-gray-200 rounded-2xl hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-gray-900 text-xl">
          <div className="p-2 rounded-lg bg-purple-100">
            <Icon name="LineChart" size={20} className="text-purple-600" />
          </div>
          График контактов по дням
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setTimeRange('week')}
              variant={timeRange === 'week' ? 'default' : 'outline'}
              size="sm"
              className={
                timeRange === 'week'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'text-purple-600'
              }
            >
              Неделя
            </Button>
            <Button
              onClick={() => setTimeRange('month')}
              variant={timeRange === 'month' ? 'default' : 'outline'}
              size="sm"
              className={
                timeRange === 'month'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'text-purple-600'
              }
            >
              Месяц
            </Button>
            <Button
              onClick={() => setTimeRange('all')}
              variant={timeRange === 'all' ? 'default' : 'outline'}
              size="sm"
              className={
                timeRange === 'all'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'text-purple-600'
              }
            >
              Весь период
            </Button>
          </div>

          {allUsers.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Выберите промоутера
              </p>
              <Select value={selectedPromoter} onValueChange={setSelectedPromoter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Все промоутеры" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все промоутеры (общая сумма)</SelectItem>
                  {allUsers.map((user) => (
                    <SelectItem key={user} value={user}>
                      {user}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartDataFormatted}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              {selectedPromoter === 'all' ? (
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  name="Общая сумма"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ) : (
                <>
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#e5e7eb"
                    strokeWidth={1}
                    name="Общая сумма"
                    dot={false}
                    strokeDasharray="5 5"
                  />
                  <Line
                    type="monotone"
                    dataKey={selectedPromoter}
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    name={selectedPromoter}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
