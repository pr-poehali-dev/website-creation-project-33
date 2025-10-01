import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

interface PromoterStats {
  promoter_id: number;
  promoter_name: string;
  total_leads: number;
  contacts: number;
  approaches: number;
}

export default function PromotersList() {
  const [promoters, setPromoters] = useState<PromoterStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingId, setExportingId] = useState<number | null>(null);

  useEffect(() => {
    fetchPromoters();
  }, []);

  const fetchPromoters = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/eb5c1ecc-5e4d-44bd-b5db-c5b6d856fcca');
      const data = await response.json();
      if (data.success) {
        setPromoters(data.promoters);
      }
    } catch (error) {
      console.error('Error fetching promoters:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportPromoterData = async (promoterId: number, promoterName: string) => {
    setExportingId(promoterId);
    try {
      const response = await fetch('https://functions.poehali.dev/4fad84e6-05dd-459f-a5d0-a12c10b14ddd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promoter_id: promoterId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Успешно!',
          description: `Экспортировано ${data.exported_count} записей для ${promoterName}`
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка экспорта',
        variant: 'destructive'
      });
    } finally {
      setExportingId(null);
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
        <CardTitle className="flex items-center gap-3 text-[#001f54]">
          <Icon name="Users" size={24} />
          Статистика промоутеров
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {promoters.map((promoter) => (
            <div key={promoter.promoter_id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-[#001f54]">{promoter.promoter_name}</h3>
                <Button
                  onClick={() => exportPromoterData(promoter.promoter_id, promoter.promoter_name)}
                  disabled={exportingId === promoter.promoter_id}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {exportingId === promoter.promoter_id ? (
                    <Icon name="Loader2" size={14} className="mr-1 animate-spin" />
                  ) : (
                    <Icon name="Sheet" size={14} className="mr-1" />
                  )}
                  Экспорт
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Лиды</p>
                  <p className="text-xl font-bold text-blue-600">{promoter.total_leads}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Контакты</p>
                  <p className="text-xl font-bold text-green-600">{promoter.contacts}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Подходы</p>
                  <p className="text-xl font-bold text-orange-600">{promoter.approaches}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
