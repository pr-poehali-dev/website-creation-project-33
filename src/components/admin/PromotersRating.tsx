import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

interface PromoterStats {
  name: string;
  email: string;
  lead_count: number;
  contacts: number;
  approaches: number;
}

export default function PromotersRating() {
  const [promoters, setPromoters] = useState<PromoterStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchRating();
  }, []);

  const fetchRating = async () => {
    try {
      const sessionToken = localStorage.getItem('session_token');
      const response = await fetch(
        'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214?action=stats',
        {
          headers: { 'X-Session-Token': sessionToken || '' }
        }
      );
      const data = await response.json();
      if (data.user_stats) {
        setPromoters(data.user_stats);
      }
    } catch (error) {
      console.error('Error fetching rating:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportRating = async () => {
    setExporting(true);
    try {
      const sessionToken = localStorage.getItem('session_token');
      const response = await fetch('https://functions.poehali.dev/b5adaa83-68c7-43cf-a042-4b4b60dc8d82', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken || ''
        }
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Успешно!',
          description: `Рейтинг экспортирован в Google Sheets`
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка экспорта',
        description: 'Не удалось экспортировать рейтинг',
        variant: 'destructive'
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white shadow-xl">
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Icon name="Loader2" size={32} className="animate-spin text-[#001f54]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-3 text-[#001f54]">
            <div className="p-2 rounded-lg bg-[#001f54]/10">
              <Icon name="Trophy" size={20} className="text-[#001f54]" />
            </div>
            Рейтинг промоутеров
          </CardTitle>
          <Button
            onClick={exportRating}
            disabled={exporting}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {exporting ? (
              <>
                <Icon name="Loader2" size={14} className="mr-2 animate-spin" />
                Экспорт...
              </>
            ) : (
              <>
                <Icon name="Sheet" size={14} className="mr-2" />
                Экспорт
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {promoters.map((promoter, index) => {
            const medalColor =
              index === 0 ? 'bg-yellow-100 border-yellow-400' :
              index === 1 ? 'bg-gray-100 border-gray-400' :
              index === 2 ? 'bg-orange-100 border-orange-400' :
              'bg-white border-gray-200';

            const medal =
              index === 0 ? '🥇' :
              index === 1 ? '🥈' :
              index === 2 ? '🥉' :
              `${index + 1}`;

            return (
              <div
                key={promoter.email}
                className={`border-2 rounded-lg p-4 transition-all ${medalColor}`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold w-12 text-center">
                    {medal}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#001f54]">{promoter.name}</h3>
                    <p className="text-sm text-gray-600">{promoter.email}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-600">Лиды</p>
                      <p className="text-lg font-bold text-blue-600">{promoter.lead_count}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Контакты</p>
                      <p className="text-lg font-bold text-green-600">{promoter.contacts}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Подходы</p>
                      <p className="text-lg font-bold text-orange-600">{promoter.approaches}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
