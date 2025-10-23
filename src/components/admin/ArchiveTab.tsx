import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import ArchiveLeadsChart from './ArchiveLeadsChart';
import ArchivePromotersRating from './ArchivePromotersRating';
import ArchivePromotersByDays from './ArchivePromotersByDays';
import ArchiveOrganizationsStats from './ArchiveOrganizationsStats';
import ArchiveImport from './ArchiveImport';

interface ArchiveTabProps {
  enabled?: boolean;
  sessionToken: string;
}

interface ChartDataPoint {
  date: string;
  total: number;
  users: { name: string; count: number }[];
}

interface PromoterRating {
  rank: number;
  name: string;
  contacts: number;
  dailyBreakdown?: { date: string; contacts: number }[];
}

interface PromoterByDays {
  rank: number;
  name: string;
  daysWorked: number;
  contacts: number;
  firstDate: string;
  lastDate: string;
}

interface OrganizationStats {
  organization: string;
  promoters: number;
  contacts: number;
}

export default function ArchiveTab({ enabled = true, sessionToken }: ArchiveTabProps) {
  const [activeSubTab, setActiveSubTab] = useState('chart');
  const [activePromotersTab, setActivePromotersTab] = useState('contacts');
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [promotersData, setPromotersData] = useState<PromoterRating[]>([]);
  const [promotersByDaysData, setPromotersByDaysData] = useState<PromoterByDays[]>([]);
  const [organizationsData, setOrganizationsData] = useState<OrganizationStats[]>([]);

  const fetchArchiveData = async (action: string) => {
    if (!sessionToken) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://functions.poehali.dev/6e86bd37-d9f4-4dcd-babd-21ff4d9b8a6f?action=${action}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': sessionToken,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Ошибка загрузки данных');
      }

      const result = await response.json();

      if (action === 'chart') {
        setChartData(result.data || []);
      } else if (action === 'promoters') {
        setPromotersData(result.data || []);
      } else if (action === 'promoters_by_days') {
        setPromotersByDaysData(result.data || []);
      } else if (action === 'organizations') {
        setOrganizationsData(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching archive data:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные архива',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImportSuccess = () => {
    setChartData([]);
    setPromotersData([]);
    setPromotersByDaysData([]);
    setOrganizationsData([]);
    
    if (activeSubTab === 'chart') {
      fetchArchiveData('chart');
    } else if (activeSubTab === 'promoters') {
      if (activePromotersTab === 'contacts') {
        fetchArchiveData('promoters');
      } else {
        fetchArchiveData('promoters_by_days');
      }
    } else if (activeSubTab === 'organizations') {
      fetchArchiveData('organizations');
    }
  };

  useEffect(() => {
    if (enabled && activeSubTab === 'chart' && chartData.length === 0) {
      fetchArchiveData('chart');
    } else if (enabled && activeSubTab === 'promoters') {
      if (activePromotersTab === 'contacts' && promotersData.length === 0) {
        fetchArchiveData('promoters');
      } else if (activePromotersTab === 'days' && promotersByDaysData.length === 0) {
        fetchArchiveData('promoters_by_days');
      }
    } else if (enabled && activeSubTab === 'organizations' && organizationsData.length === 0) {
      fetchArchiveData('organizations');
    }
  }, [enabled, activeSubTab, activePromotersTab]);

  if (loading && chartData.length === 0 && promotersData.length === 0 && promotersByDaysData.length === 0 && organizationsData.length === 0) {
    return (
      <Card className="bg-white border-gray-200 rounded-2xl">
        <CardContent className="p-4 md:p-8">
          <div className="text-center text-gray-600 flex items-center justify-center gap-2 md:gap-3 text-sm md:text-base">
            <Icon name="Loader2" size={20} className="animate-spin md:w-6 md:h-6" />
            Загрузка архивных данных...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 rounded-xl md:rounded-2xl">
        <CardContent className="p-3 md:p-6">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-purple-100 rounded-lg md:rounded-xl">
              <Icon name="Archive" size={18} className="md:w-6 md:h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-base md:text-xl font-bold text-gray-800">Архив статистики</h2>
              <p className="text-[10px] md:text-sm text-gray-600">
                Исторические данные: март - сентябрь 2025
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full grid-cols-4 admin-card h-10 md:h-14 p-0.5 md:p-1">
          <TabsTrigger
            value="chart"
            className="flex items-center gap-1 md:gap-2 text-slate-600 data-[state=active]:bg-purple-500 data-[state=active]:text-white transition-all text-[10px] md:text-sm rounded-md md:rounded-lg font-medium px-1 md:px-3"
          >
            <Icon name="LineChart" size={12} className="md:w-4 md:h-4" />
            <span className="hidden sm:inline">График</span>
          </TabsTrigger>
          <TabsTrigger
            value="promoters"
            className="flex items-center gap-1 md:gap-2 text-slate-600 data-[state=active]:bg-purple-500 data-[state=active]:text-white transition-all text-[10px] md:text-sm rounded-md md:rounded-lg font-medium px-1 md:px-3"
          >
            <Icon name="Users" size={12} className="md:w-4 md:h-4" />
            <span className="hidden sm:inline">Промоутеры</span>
          </TabsTrigger>
          <TabsTrigger
            value="organizations"
            className="flex items-center gap-1 md:gap-2 text-slate-600 data-[state=active]:bg-purple-500 data-[state=active]:text-white transition-all text-[10px] md:text-sm rounded-md md:rounded-lg font-medium px-1 md:px-3"
          >
            <Icon name="Building2" size={12} className="md:w-4 md:h-4" />
            <span className="hidden sm:inline">Организации</span>
          </TabsTrigger>
          <TabsTrigger
            value="import"
            className="flex items-center gap-1 md:gap-2 text-slate-600 data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all text-[10px] md:text-sm rounded-md md:rounded-lg font-medium px-1 md:px-3"
          >
            <Icon name="Upload" size={12} className="md:w-4 md:h-4" />
            <span className="hidden sm:inline">Импорт</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chart">
          <ArchiveLeadsChart data={chartData} loading={loading} />
        </TabsContent>

        <TabsContent value="promoters">
          <Tabs value={activePromotersTab} onValueChange={setActivePromotersTab} className="space-y-3 md:space-y-4">
            <TabsList className="grid w-full grid-cols-2 admin-card h-10 md:h-12 p-0.5 md:p-1">
              <TabsTrigger
                value="contacts"
                className="flex items-center gap-2 text-slate-600 data-[state=active]:bg-purple-500 data-[state=active]:text-white transition-all text-sm rounded-lg font-medium"
              >
                <Icon name="Phone" size={14} />
                <span>По контактам</span>
              </TabsTrigger>
              <TabsTrigger
                value="days"
                className="flex items-center gap-2 text-slate-600 data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all text-sm rounded-lg font-medium"
              >
                <Icon name="Briefcase" size={14} />
                <span>По стажу</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="contacts">
              <ArchivePromotersRating 
                data={promotersData} 
                loading={loading}
                sessionToken={sessionToken}
                onSyncSuccess={() => {
                  setPromotersData([]);
                  fetchArchiveData('promoters');
                }}
              />
            </TabsContent>

            <TabsContent value="days">
              <ArchivePromotersByDays 
                data={promotersByDaysData} 
                loading={loading}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="organizations">
          <ArchiveOrganizationsStats data={organizationsData} loading={loading} />
        </TabsContent>

        <TabsContent value="import">
          <ArchiveImport sessionToken={sessionToken} onImportSuccess={handleImportSuccess} />
        </TabsContent>
      </Tabs>
    </div>
  );
}