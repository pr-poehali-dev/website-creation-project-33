import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useOrganizationStats } from '@/hooks/useAdminData';
import PromoterShiftsModal from './PromoterShiftsModal';
import OrganizationStatsFilters from './organization-stats/OrganizationStatsFilters';
import OrganizationStatsList from './organization-stats/OrganizationStatsList';
import { getAvailableWeeks, getAvailableMonths, getAvailableYears } from './organization-stats/OrganizationStatsUtils';

interface OrganizationStat {
  date: string;
  organization_name: string;
  organization_id: number;
  total_contacts: number;
  contact_rate: number;
  payment_type: string;
  user_stats: Array<{
    user_name: string;
    contacts: number;
  }>;
}

export default function OrganizationStatsChart() {
  const { data: orgStatsData = [], isLoading, refetch } = useOrganizationStats(true);
  const [timeRange, setTimeRange] = React.useState<'week' | 'month' | 'year'>('week');
  const [selectedOrg, setSelectedOrg] = React.useState<string | null>(null);
  const [selectedWeekIndex, setSelectedWeekIndex] = React.useState<number>(0);
  const [selectedMonthIndex, setSelectedMonthIndex] = React.useState<number>(0);
  const [selectedYear, setSelectedYear] = React.useState<number>(new Date().getFullYear());
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selectedPromoter, setSelectedPromoter] = React.useState<{ name: string; contacts: number } | null>(null);
  const [sortBy, setSortBy] = React.useState<'revenue' | 'contacts' | 'average'>('revenue');

  if (isLoading) {
    return (
      <Card className="bg-slate-900 border-slate-700 rounded-2xl">
        <CardContent className="p-4 md:p-8">
          <div className="text-center text-slate-300 flex items-center justify-center gap-2 text-sm">
            <Icon name="Loader2" size={20} className="animate-spin" />
            Загрузка статистики по организациям...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (orgStatsData.length === 0) {
    return null;
  }

  const availableWeeks = getAvailableWeeks();
  const availableMonths = getAvailableMonths();
  const availableYears = getAvailableYears(orgStatsData);

  const getFilteredData = () => {
    if (timeRange === 'week') {
      const week = availableWeeks[selectedWeekIndex];
      return orgStatsData.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= week.start && itemDate <= week.end;
      });
    }
    
    if (timeRange === 'month') {
      const month = availableMonths[selectedMonthIndex];
      return orgStatsData.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getMonth() === month.date.getMonth() && 
               itemDate.getFullYear() === month.date.getFullYear();
      });
    }
    
    if (timeRange === 'year') {
      return orgStatsData.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getFullYear() === selectedYear;
      });
    }

    return orgStatsData;
  };

  const filteredData = getFilteredData();

  const totalContactsForPeriod = filteredData.reduce((sum, item) => sum + item.total_contacts, 0);

  const organizations = Array.from(
    new Set(filteredData.map(d => d.organization_name))
  ).sort();

  const orgTotals = filteredData.reduce((acc, item) => {
    if (!acc[item.organization_name]) {
      acc[item.organization_name] = {
        name: item.organization_name,
        total: 0,
        contact_rate: item.contact_rate || 0,
        payment_type: item.payment_type || 'cash',
        users: {},
        userShifts: {}
      };
    }
    acc[item.organization_name].total += item.total_contacts;
    
    item.user_stats.forEach(userStat => {
      if (!acc[item.organization_name].users[userStat.user_name]) {
        acc[item.organization_name].users[userStat.user_name] = 0;
        acc[item.organization_name].userShifts[userStat.user_name] = 0;
      }
      acc[item.organization_name].users[userStat.user_name] += userStat.contacts;
      if (userStat.contacts > 0) {
        acc[item.organization_name].userShifts[userStat.user_name] += 1;
      }
    });
    
    return acc;
  }, {} as Record<string, { name: string; total: number; contact_rate: number; payment_type: string; users: Record<string, number>; userShifts: Record<string, number> }>);

  const sortedOrgs = Object.values(orgTotals).sort((a, b) => {
    if (sortBy === 'revenue') {
      const revenueA = a.contact_rate > 0 
        ? (a.payment_type === 'cashless' ? a.total * a.contact_rate * 0.93 : a.total * a.contact_rate)
        : 0;
      const revenueB = b.contact_rate > 0 
        ? (b.payment_type === 'cashless' ? b.total * b.contact_rate * 0.93 : b.total * b.contact_rate)
        : 0;
      return revenueB - revenueA;
    }
    
    if (sortBy === 'contacts') {
      return b.total - a.total;
    }
    
    if (sortBy === 'average') {
      const usersA = Object.entries(a.users);
      const usersB = Object.entries(b.users);
      
      const avgA = usersA.length > 0 
        ? usersA.reduce((sum, [userName, contacts]) => {
            const shifts = a.userShifts[userName] || 1;
            return sum + (contacts / shifts);
          }, 0) / usersA.length
        : 0;
      
      const avgB = usersB.length > 0 
        ? usersB.reduce((sum, [userName, contacts]) => {
            const shifts = b.userShifts[userName] || 1;
            return sum + (contacts / shifts);
          }, 0) / usersB.length
        : 0;
      
      return avgB - avgA;
    }
    
    return 0;
  });

  return (
    <Card className="bg-slate-900 border-slate-700 rounded-2xl slide-up hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-3 md:pb-4">
        <CardTitle className="flex items-center justify-between gap-2 md:gap-3 text-slate-100 text-lg md:text-xl">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 rounded-lg bg-slate-800">
              <Icon name="Building2" size={18} className="text-cyan-400 md:w-5 md:h-5" />
            </div>
            Статистика по организациям
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700"
          >
            <Icon name="RefreshCw" size={14} className="md:w-4 md:h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <OrganizationStatsFilters
          sortBy={sortBy}
          setSortBy={setSortBy}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          setSelectedWeekIndex={setSelectedWeekIndex}
          setSelectedMonthIndex={setSelectedMonthIndex}
          selectedWeekIndex={selectedWeekIndex}
          selectedMonthIndex={selectedMonthIndex}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          availableWeeks={availableWeeks}
          availableMonths={availableMonths}
          availableYears={availableYears}
          totalContactsForPeriod={totalContactsForPeriod}
        />

        <OrganizationStatsList
          sortedOrgs={sortedOrgs}
          selectedOrg={selectedOrg}
          setSelectedOrg={setSelectedOrg}
          setSelectedPromoter={setSelectedPromoter}
          setModalOpen={setModalOpen}
        />
      </CardContent>

      <PromoterShiftsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        promoterName={selectedPromoter?.name || ''}
        totalContacts={selectedPromoter?.contacts || 0}
      />
    </Card>
  );
}
