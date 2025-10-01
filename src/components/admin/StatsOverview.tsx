import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

interface Stats {
  total_leads: number;
  contacts: number;
  approaches: number;
}

export default function StatsOverview() {
  const [stats, setStats] = useState<Stats>({ total_leads: 0, contacts: 0, approaches: 0 });
  const [exportingAll, setExportingAll] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/9e47c13d-96b6-42c9-92f2-c5e93ac13ba9');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const exportAllToGoogleSheets = async () => {
    setExportingAll(true);
    try {
      const response = await fetch('https://functions.poehali.dev/7d9b8336-bbfd-499c-9ad4-3ca892738c97', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Успешно!',
          description: `Экспортировано ${data.exported_count} записей в Google Sheets`
        });
      } else {
        throw new Error(data.error || 'Ошибка экспорта');
      }
    } catch (error) {
      toast({
        title: 'Ошибка экспорта',
        description: 'Не удалось экспортировать данные',
        variant: 'destructive'
      });
    } finally {
      setExportingAll(false);
    }
  };

  return (
    <Card className="bg-white shadow-xl">
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2 md:gap-3 text-[#001f54] text-base md:text-xl">
            <div className="p-1.5 md:p-2 rounded-lg bg-[#001f54]/10">
              <Icon name="BarChart3" size={18} className="text-[#001f54] md:w-5 md:h-5" />
            </div>
            Общая статистика
          </CardTitle>
          <Button
            onClick={exportAllToGoogleSheets}
            disabled={exportingAll}
            className="bg-green-600 hover:bg-green-700 text-white shadow-lg transition-all duration-300 hover:scale-105 w-full md:w-auto text-sm md:text-base"
            size="sm"
          >
            {exportingAll ? (
              <>
                <Icon name="Loader2" size={14} className="mr-2 animate-spin md:w-[14px] md:h-[14px]" />
                Экспорт...
              </>
            ) : (
              <>
                <Icon name="Sheet" size={14} className="mr-2 md:w-[14px] md:h-[14px]" />
                Экспорт всей статистики
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Icon name="Users" size={20} className="text-white" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">Всего лидов</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600">{stats.total_leads}</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-600 rounded-lg">
                <Icon name="Phone" size={20} className="text-white" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">Контакты</h3>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.contacts}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-600 rounded-lg">
                <Icon name="Target" size={20} className="text-white" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">Подходы</h3>
            </div>
            <p className="text-3xl font-bold text-orange-600">{stats.approaches}</p>
          </div>
        </div>

        <div className="mt-4 md:mt-6 grid grid-cols-2 gap-3 md:gap-6">
          <div className="flex items-center gap-2 text-gray-700 font-medium text-xs md:text-base">
            <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-green-600 rounded-full shadow-sm"></div>
            <span>Контакты: {stats.total_leads > 0 ? Math.round((stats.contacts / stats.total_leads) * 100) : 0}%</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700 font-medium text-xs md:text-base">
            <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-orange-600 rounded-full shadow-sm"></div>
            <span>Подходы: {stats.total_leads > 0 ? Math.round((stats.approaches / stats.total_leads) * 100) : 0}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
