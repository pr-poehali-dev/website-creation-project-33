import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

const ADMIN_API = 'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214';

interface RatePeriod {
  id: number;
  start_date: string;
  end_date: string | null;
  contact_rate: number;
  payment_type: 'cash' | 'cashless';
}

interface RatePeriodsModalProps {
  organizationId: number;
  organizationName: string;
  onClose: () => void;
}

export default function RatePeriodsModal({ organizationId, organizationName, onClose }: RatePeriodsModalProps) {
  const [periods, setPeriods] = useState<RatePeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newRate, setNewRate] = useState('');
  const [newPaymentType, setNewPaymentType] = useState<'cash' | 'cashless'>('cash');

  const getSessionToken = () => localStorage.getItem('session_token');

  useEffect(() => {
    loadPeriods();
  }, [organizationId]);

  const loadPeriods = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${ADMIN_API}?action=get_rate_periods&organization_id=${organizationId}`,
        {
          headers: {
            'X-Session-Token': getSessionToken() || '',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPeriods(data.periods || []);
      } else {
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить периоды',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading periods:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить периоды',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addPeriod = async () => {
    if (!newStartDate || !newRate) {
      toast({
        title: 'Ошибка',
        description: 'Укажите дату начала и ставку',
        variant: 'destructive',
      });
      return;
    }

    setAdding(true);
    try {
      const response = await fetch(ADMIN_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': getSessionToken() || '',
        },
        body: JSON.stringify({
          action: 'add_rate_period',
          organization_id: organizationId,
          start_date: newStartDate,
          end_date: newEndDate || null,
          contact_rate: parseInt(newRate),
          payment_type: newPaymentType,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Период добавлен',
        });
        setNewStartDate('');
        setNewEndDate('');
        setNewRate('');
        setNewPaymentType('cash');
        loadPeriods();
      } else {
        const error = await response.json();
        toast({
          title: 'Ошибка',
          description: error.error || 'Не удалось добавить период',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding period:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить период',
        variant: 'destructive',
      });
    } finally {
      setAdding(false);
    }
  };

  const deletePeriod = async (periodId: number) => {
    if (!confirm('Удалить период?')) return;

    try {
      const response = await fetch(ADMIN_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': getSessionToken() || '',
        },
        body: JSON.stringify({
          action: 'delete_rate_period',
          period_id: periodId,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Период удален',
        });
        loadPeriods();
      } else {
        const error = await response.json();
        toast({
          title: 'Ошибка',
          description: error.error || 'Не удалось удалить период',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting period:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить период',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Icon name="Calendar" size={20} />
              Тарифные периоды: {organizationName}
            </CardTitle>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Icon name="X" size={18} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="overflow-y-auto flex-1 pt-4">
          <div className="space-y-4">
            <div className="border-2 border-blue-200 rounded-xl p-4 bg-blue-50">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Icon name="Plus" size={16} />
                Добавить новый период
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Дата начала *</label>
                    <Input
                      type="date"
                      value={newStartDate}
                      onChange={(e) => setNewStartDate(e.target.value)}
                      className="border-2 border-blue-300"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Дата окончания</label>
                    <Input
                      type="date"
                      value={newEndDate}
                      onChange={(e) => setNewEndDate(e.target.value)}
                      className="border-2 border-blue-300"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Ставка (₽) *</label>
                    <Input
                      type="number"
                      value={newRate}
                      onChange={(e) => setNewRate(e.target.value)}
                      placeholder="Например: 742"
                      className="border-2 border-blue-300"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Форма оплаты</label>
                    <select
                      value={newPaymentType}
                      onChange={(e) => setNewPaymentType(e.target.value as 'cash' | 'cashless')}
                      className="w-full border-2 border-blue-300 bg-white text-gray-900 h-10 rounded-md px-3 text-sm"
                    >
                      <option value="cash">💵 Наличные</option>
                      <option value="cashless">💳 Безнал</option>
                    </select>
                  </div>
                </div>
                <Button
                  onClick={addPeriod}
                  disabled={adding || !newStartDate || !newRate}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {adding ? (
                    <Icon name="Loader2" size={16} className="animate-spin mr-2" />
                  ) : (
                    <Icon name="Plus" size={16} className="mr-2" />
                  )}
                  Добавить период
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-600">
                <Icon name="Loader2" size={24} className="animate-spin mx-auto mb-2" />
                Загрузка периодов...
              </div>
            ) : periods.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Icon name="Calendar" size={32} className="mx-auto mb-3 opacity-30" />
                <p>Периоды не добавлены</p>
              </div>
            ) : (
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <Icon name="List" size={16} />
                  Существующие периоды ({periods.length})
                </h3>
                {periods.map((period) => (
                  <div
                    key={period.id}
                    className="border-2 border-gray-200 rounded-xl p-3 bg-white hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <div className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
                            📅 {formatDate(period.start_date)} 
                            {period.end_date ? ` — ${formatDate(period.end_date)}` : ' — ∞'}
                          </div>
                          <div className="px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-xs font-medium">
                            {period.contact_rate} ₽/контакт
                          </div>
                          <div className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-xs font-medium">
                            {period.payment_type === 'cash' ? '💵 Наличные' : '💳 Безнал'}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => deletePeriod(period.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                      >
                        <Icon name="Trash2" size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
