import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { ShiftRecord } from './types';

interface KmsRevenueChartProps {
  shifts: ShiftRecord[];
}

type Period = 'day' | 'week' | 'month' | 'year';

interface ChartData {
  label: string;
  revenue: number;
  date: string;
}

export default function KmsRevenueChart({ shifts }: KmsRevenueChartProps) {
  const [period, setPeriod] = useState<Period>('week');

  const calculateWorkerSalary = (contacts: number): number => {
    return contacts >= 10 ? contacts * 300 : contacts * 200;
  };

  const chartData = useMemo(() => {
    const dataMap = new Map<string, number>();

    shifts.forEach(shift => {
      const shiftDate = new Date(shift.date);
      let key = '';

      if (period === 'day') {
        key = shift.date;
      } else if (period === 'week') {
        const weekStart = new Date(shiftDate);
        weekStart.setDate(shiftDate.getDate() - shiftDate.getDay() + 1);
        key = weekStart.toISOString().split('T')[0];
      } else if (period === 'month') {
        key = `${shiftDate.getFullYear()}-${String(shiftDate.getMonth() + 1).padStart(2, '0')}`;
      } else if (period === 'year') {
        key = String(shiftDate.getFullYear());
      }

      const revenue = shift.contacts_count * shift.contact_rate;
      const tax = shift.payment_type === 'cashless' ? Math.round(revenue * 0.07) : 0;
      const afterTax = revenue - tax;
      const salary = calculateWorkerSalary(shift.contacts_count);
      const expense = shift.expense_amount || 0;
      const kmsShare = Math.round((afterTax - salary - expense) / 2);

      dataMap.set(key, (dataMap.get(key) || 0) + kmsShare);
    });

    const data: ChartData[] = Array.from(dataMap.entries()).map(([key, revenue]) => {
      let label = '';
      if (period === 'day') {
        const date = new Date(key);
        label = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
      } else if (period === 'week') {
        const date = new Date(key);
        const endDate = new Date(date);
        endDate.setDate(date.getDate() + 6);
        label = `${date.getDate()}.${date.getMonth() + 1} - ${endDate.getDate()}.${endDate.getMonth() + 1}`;
      } else if (period === 'month') {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        label = date.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' });
      } else if (period === 'year') {
        label = key;
      }

      return { label, revenue, date: key };
    });

    return data.sort((a, b) => a.date.localeCompare(b.date));
  }, [shifts, period]);

  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 0);
  const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'day': return 'по дням';
      case 'week': return 'по неделям';
      case 'month': return 'по месяцам';
      case 'year': return 'по годам';
    }
  };

  return (
    <Card className="bg-white border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="flex items-center gap-3 text-gray-900 text-xl">
            <div className="p-2 rounded-lg bg-yellow-100">
              <Icon name="TrendingUp" size={20} className="text-yellow-600" />
            </div>
            Доход КМС {getPeriodLabel()}
          </CardTitle>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setPeriod('day')}
              variant={period === 'day' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 ${period === 'day'
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-md'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
              }`}
            >
              <Icon name="Calendar" size={14} className="mr-1.5" />
              Дни
            </Button>
            <Button
              onClick={() => setPeriod('week')}
              variant={period === 'week' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 ${period === 'week'
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-md'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
              }`}
            >
              <Icon name="CalendarDays" size={14} className="mr-1.5" />
              Недели
            </Button>
            <Button
              onClick={() => setPeriod('month')}
              variant={period === 'month' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 ${period === 'month'
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-md'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
              }`}
            >
              <Icon name="CalendarRange" size={14} className="mr-1.5" />
              Месяцы
            </Button>
            <Button
              onClick={() => setPeriod('year')}
              variant={period === 'year' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 ${period === 'year'
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-md'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
              }`}
            >
              <Icon name="CalendarClock" size={14} className="mr-1.5" />
              Годы
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-6 p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border-2 border-yellow-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="Wallet" size={24} className="text-yellow-600" />
              <span className="text-gray-700 font-medium">Общий доход за период:</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(totalRevenue)} ₽
            </div>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Icon name="BarChart3" size={48} className="mx-auto mb-3 opacity-30" />
            <div className="text-sm">Нет данных за выбранный период</div>
          </div>
        ) : (
          <div className="space-y-3">
            {chartData.map((item, index) => {
              const barWidth = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;

              return (
                <div key={index} className="group">
                  <div className="flex items-center justify-between mb-1 text-sm">
                    <span className="font-medium text-gray-700 min-w-[120px]">{item.label}</span>
                    <span className="font-bold text-yellow-600">{formatCurrency(item.revenue)} ₽</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-8 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-3 group-hover:from-yellow-500 group-hover:to-amber-600"
                      style={{ width: `${Math.max(barWidth, 2)}%` }}
                    >
                      {barWidth > 15 && (
                        <span className="text-xs font-bold text-white drop-shadow">
                          {formatCurrency(item.revenue)} ₽
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
