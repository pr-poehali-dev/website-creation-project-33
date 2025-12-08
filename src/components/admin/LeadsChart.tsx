import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { ChartDataPoint, UserStats } from './types';
import PeriodDetailModal from './PeriodDetailModal';
import ChartFilters from './ChartFilters';
import ChartVisualization from './ChartVisualization';
import { useChartData } from './useChartData';
import AddShiftModal from './AddShiftModal';

interface LeadsChartProps {
  chartData: ChartDataPoint[];
  selectedUsers: string[];
  filterType: 'contacts' | 'approaches';
  userStats: UserStats[];
  onFilterTypeChange: (type: 'contacts' | 'approaches') => void;
  onUsersChange: (users: string[]) => void;
  selectedOrganizations: number[];
  onOrganizationsChange: (orgIds: number[]) => void;
}

export default function LeadsChart({ 
  chartData, 
  selectedUsers, 
  filterType, 
  userStats,
  onFilterTypeChange, 
  onUsersChange,
  selectedOrganizations,
  onOrganizationsChange
}: LeadsChartProps) {
  const [showTotal, setShowTotal] = React.useState(true);
  const [groupBy, setGroupBy] = React.useState<'day' | 'week' | 'month' | 'year'>('day');
  const [timeRange, setTimeRange] = React.useState('30d');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [selectedPeriod, setSelectedPeriod] = React.useState<{period: string, displayLabel: string} | null>(null);
  const [periodLeads, setPeriodLeads] = React.useState<any[]>([]);
  const [loadingPeriod, setLoadingPeriod] = React.useState(false);
  const [addShiftModalOpen, setAddShiftModalOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const { getFilteredChartData, fetchPeriodDetails, userColorMap } = useChartData(
    chartData,
    userStats,
    groupBy,
    timeRange,
    selectedOrganizations
  );

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  if (chartData.length === 0) {
    return null;
  }

  const filteredChartData = getFilteredChartData();

  const handleChartClick = (data: any) => {
    console.log('handleChartClick called with:', data);
    let payload = null;
    
    if (data && data.payload) {
      payload = data.payload;
    } else if (data && data.activePayload && data.activePayload[0]) {
      payload = data.activePayload[0].payload;
    }
    
    console.log('Extracted payload:', payload);
    
    if (payload && payload.date) {
      const period = payload.date;
      const displayLabel = payload.displayDate || new Date(period).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      
      console.log('Calling fetchPeriodDetails with:', period, displayLabel);
      fetchPeriodDetails(period, displayLabel, setLoadingPeriod, setSelectedPeriod, setPeriodLeads);
    } else {
      console.log('No valid payload or date found');
    }
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload, fill, r, stroke, strokeWidth } = props;
    
    return (
      <g
        style={{ cursor: 'pointer' }}
        onClick={(e) => {
          e.stopPropagation();
          console.log('Dot clicked!', payload);
          handleChartClick({ payload });
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          console.log('Pointer down on dot!', payload);
          handleChartClick({ payload });
        }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={r || 4}
          fill={fill || '#22d3ee'}
          stroke={stroke || '#0f172a'}
          strokeWidth={strokeWidth || 2}
        />
        <circle
          cx={cx}
          cy={cy}
          r={(r || 4) + 8}
          fill="transparent"
          stroke="none"
        />
      </g>
    );
  };

  const toggleUser = (userName: string) => {
    const isSelected = selectedUsers.includes(userName);
    if (isSelected) {
      onUsersChange(selectedUsers.filter(u => u !== userName));
    } else {
      onUsersChange([...selectedUsers, userName]);
    }
  };

  const toggleAllUsers = () => {
    const allUsers = userStats.map(u => u.name);
    if (selectedUsers.length === allUsers.length) {
      onUsersChange([]);
    } else {
      onUsersChange(allUsers);
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-700 rounded-2xl slide-up hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-3 md:pb-4">
        <CardTitle className="flex items-center gap-2 md:gap-3 text-slate-100 text-lg md:text-xl">
          <div className="p-1.5 md:p-2 rounded-lg bg-slate-800">
            <Icon name="TrendingUp" size={18} className="text-cyan-400 md:w-5 md:h-5" />
          </div>
          График лидов
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartFilters
          showTotal={showTotal}
          setShowTotal={setShowTotal}
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          selectedUsers={selectedUsers}
          userStats={userStats}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isDropdownOpen={isDropdownOpen}
          setIsDropdownOpen={setIsDropdownOpen}
          dropdownRef={dropdownRef}
          toggleUser={toggleUser}
          toggleAllUsers={toggleAllUsers}
          userColorMap={userColorMap}
          onOpenAddShift={() => setAddShiftModalOpen(true)}
          selectedOrganizations={selectedOrganizations}
          onOrganizationsChange={onOrganizationsChange}
        />

        <ChartVisualization
          filteredChartData={filteredChartData}
          groupBy={groupBy}
          showTotal={showTotal}
          filterType={filterType}
          selectedUsers={selectedUsers}
          userColorMap={userColorMap}
          handleChartClick={handleChartClick}
          CustomDot={CustomDot}
        />
      </CardContent>

      <PeriodDetailModal
        isOpen={!!selectedPeriod}
        onClose={() => setSelectedPeriod(null)}
        period={selectedPeriod?.period || ''}
        displayLabel={selectedPeriod?.displayLabel || ''}
        detailedLeads={periodLeads}
        loading={loadingPeriod}
      />

      <AddShiftModal
        isOpen={addShiftModalOpen}
        onClose={() => setAddShiftModalOpen(false)}
        userStats={userStats.map(u => ({ name: u.name, id: u.id }))}
      />
    </Card>
  );
}