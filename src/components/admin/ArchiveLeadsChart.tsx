import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
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

  const allUsers = useMemo(
    () => Array.from(new Set(data.flatMap((d) => d.users.map((u) => u.name)))),
    [data]
  );

  const [selectedUsers, setSelectedUsers] = useState<string[]>(allUsers);

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

  const USER_COLORS = [
    '#7C93C3',
    '#9EB384',
    '#C8A2C8',
    '#D4A574',
    '#9DC5C3',
    '#C48B9F',
    '#A7B8A8',
    '#B89D9D',
    '#8EACCD',
    '#6B9BD1',
  ];

  const userColorMap = allUsers.reduce((acc, user, index) => {
    acc[user] = USER_COLORS[index % USER_COLORS.length];
    return acc;
  }, {} as Record<string, string>);

  const chartDataFormatted = filteredData.map((item) => {
    const formatted: any = { date: item.date, total: item.total };
    item.users.forEach((user) => {
      formatted[user.name] = user.count;
    });
    return formatted;
  });

  const toggleUser = (userName: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userName)
        ? prev.filter((u) => u !== userName)
        : [...prev, userName]
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload) return null;

    const date = payload[0]?.payload?.date;
    const total = payload[0]?.payload?.total;

    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 mb-2">{date}</p>
        <p className="text-sm text-purple-600 font-semibold mb-1">Всего: {total}</p>
        <div className="border-t border-gray-100 mt-2 pt-2">
          {payload.slice(1).map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
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
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700">
                  Фильтр по промоутерам ({selectedUsers.length} из {allUsers.length})
                </p>
                <Button
                  onClick={() =>
                    setSelectedUsers(
                      selectedUsers.length === allUsers.length ? [] : allUsers
                    )
                  }
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                >
                  {selectedUsers.length === allUsers.length
                    ? 'Снять всё'
                    : 'Выбрать всё'}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                {allUsers.map((user) => (
                  <Button
                    key={user}
                    onClick={() => toggleUser(user)}
                    variant={selectedUsers.includes(user) ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-8"
                    style={
                      selectedUsers.includes(user)
                        ? { backgroundColor: userColorMap[user], borderColor: userColorMap[user] }
                        : {}
                    }
                  >
                    {user}
                  </Button>
                ))}
              </div>
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
              <Line
                type="monotone"
                dataKey="total"
                stroke="#8b5cf6"
                strokeWidth={3}
                name="Всего"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              {selectedUsers.map((user) => (
                <Line
                  key={user}
                  type="monotone"
                  dataKey={user}
                  stroke={userColorMap[user]}
                  strokeWidth={2}
                  name={user}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 p-4 bg-purple-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {filteredData.reduce((sum, d) => sum + d.total, 0)}
              </p>
              <p className="text-sm text-gray-600">Контактов за период</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {Math.round(
                  filteredData.reduce((sum, d) => sum + d.total, 0) /
                    (filteredData.length || 1)
                )}
              </p>
              <p className="text-sm text-gray-600">Среднее за день</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
