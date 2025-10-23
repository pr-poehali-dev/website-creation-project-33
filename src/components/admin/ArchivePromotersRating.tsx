import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

interface DailyBreakdown {
  date: string;
  contacts: number;
}

interface PromoterRating {
  rank: number;
  name: string;
  contacts: number;
  dailyBreakdown?: DailyBreakdown[];
}

interface ArchivePromotersRatingProps {
  data: PromoterRating[];
  loading: boolean;
  sessionToken: string;
  onSyncSuccess?: () => void;
}

export default function ArchivePromotersRating({
  data,
  loading,
  sessionToken,
  onSyncSuccess,
}: ArchivePromotersRatingProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [expandedPromoter, setExpandedPromoter] = useState<number | null>(null);

  const handleSync = async () => {
    if (!sessionToken) {
      toast({
        title: 'Ошибка',
        description: 'Требуется авторизация',
        variant: 'destructive',
      });
      return;
    }

    setSyncing(true);
    try {
      const response = await fetch(
        'https://functions.poehali.dev/da57fe30-0429-4569-89c3-64d8c0875a6a',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': sessionToken,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка синхронизации');
      }

      const result = await response.json();
      toast({
        title: 'Успешно',
        description: result.message || 'Архив обновлен',
      });

      if (onSyncSuccess) {
        onSyncSuccess();
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось синхронизировать архив',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white border-gray-200 rounded-2xl">
        <CardContent className="p-8">
          <div className="text-center text-gray-600 flex items-center justify-center gap-3">
            <Icon name="Loader2" size={20} className="animate-spin" />
            Загрузка рейтинга...
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

  const filteredData = searchTerm
    ? data.filter((promoter) =>
        promoter.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : data;

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500';
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600';
    return 'bg-gray-100';
  };

  const totalContacts = data.reduce((sum, p) => sum + p.contacts, 0);

  return (
    <Card className="bg-white border-gray-200 rounded-2xl hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-gray-900 text-xl">
            <div className="p-2 rounded-lg bg-purple-100">
              <Icon name="Trophy" size={20} className="text-purple-600" />
            </div>
            Рейтинг промоутеров по контактам
          </CardTitle>
          <Button
            onClick={handleSync}
            disabled={syncing}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
          >
            {syncing ? (
              <>
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                Синхронизация...
              </>
            ) : (
              <>
                <Icon name="RefreshCw" size={16} className="mr-2" />
                Синхронизировать архив
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="relative">
            <Icon
              name="Search"
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <Input
              placeholder="Поиск промоутера..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </div>

        <div className="mb-6 p-4 bg-purple-50 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-purple-600">{data.length}</p>
              <p className="text-sm text-gray-600">Промоутеров</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{totalContacts}</p>
              <p className="text-sm text-gray-600">Всего контактов</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {Math.round(totalContacts / data.length)}
              </p>
              <p className="text-sm text-gray-600">Среднее на человека</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filteredData.map((promoter) => (
            <div key={promoter.rank}>
              <div
                onClick={() => setExpandedPromoter(expandedPromoter === promoter.rank ? null : promoter.rank)}
                className={`p-4 rounded-xl border transition-all duration-300 hover:shadow-lg cursor-pointer ${
                  promoter.rank <= 3
                    ? 'border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50'
                    : 'border-gray-200 hover:border-purple-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getRankColor(
                        promoter.rank
                      )}`}
                    >
                      {promoter.rank <= 3 ? (
                        <span className="text-2xl">{getMedalIcon(promoter.rank)}</span>
                      ) : (
                        <span className="text-gray-700">#{promoter.rank}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">
                        {promoter.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {promoter.contacts} контактов
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        promoter.rank === 1
                          ? 'bg-yellow-100 text-yellow-800'
                          : promoter.rank === 2
                          ? 'bg-gray-200 text-gray-800'
                          : promoter.rank === 3
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      <p className="text-2xl font-bold">{promoter.contacts}</p>
                    </div>
                    <Icon
                      name={expandedPromoter === promoter.rank ? 'ChevronUp' : 'ChevronDown'}
                      size={20}
                      className="text-gray-400"
                    />
                  </div>
                </div>
              </div>
              
              {expandedPromoter === promoter.rank && promoter.dailyBreakdown && (
                <div className="mt-2 ml-16 mr-4 space-y-2 animate-in slide-in-from-top-2">
                  {promoter.dailyBreakdown.map((day) => (
                    <div
                      key={day.date}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Icon name="Calendar" size={16} className="text-purple-500" />
                        <span className="text-sm font-medium text-gray-700">
                          {new Date(day.date).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon name="Phone" size={14} className="text-purple-400" />
                        <span className="text-sm font-bold text-purple-600">
                          {day.contacts}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-8 text-gray-600">
            <Icon name="Search" size={32} className="mx-auto mb-3 opacity-40" />
            <p>Промоутер не найден</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}