import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from '@/lib/toast';
import { UserStats } from './types';
import RankingFilters, { type RankingType } from './ranking/RankingFilters';
import UserRankingCard from './ranking/UserRankingCard';
import type { OrgStats } from './ranking/UserOrgDetails';
import type { ShiftDetail } from './ranking/UserShiftDetails';
import UserRevenueModal, { type OrgRevenue } from './ranking/UserRevenueModal';

interface UsersRankingProps {
  userStats: UserStats[];
}

export default function UsersRanking({ userStats }: UsersRankingProps) {
  const [rankingType, setRankingType] = useState<RankingType>('contacts');
  const [showAllContacts, setShowAllContacts] = useState(false);
  const [showAllShifts, setShowAllShifts] = useState(false);
  const [showAllAvg, setShowAllAvg] = useState(false);
  const [showAllMax, setShowAllMax] = useState(false);
  const [showAllRevenue, setShowAllRevenue] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [expandedUserEmail, setExpandedUserEmail] = useState<string | null>(null);
  const [userOrgStats, setUserOrgStats] = useState<Record<string, OrgStats[]>>({});
  const [userShifts, setUserShifts] = useState<Record<string, ShiftDetail[]>>({});
  const [revenueModalOpen, setRevenueModalOpen] = useState(false);
  const [selectedUserRevenue, setSelectedUserRevenue] = useState<{
    userName: string;
    orgRevenues: OrgRevenue[];
    totalRevenue: number;
  } | null>(null);

  const filteredUsers = userStats.filter(user => {
    if (showOnlyActive && user.is_active === false) {
      return false;
    }
    
    if (rankingType === 'avg_per_shift' && (user.shifts_count || 0) <= 3) {
      return false;
    }
    
    if (rankingType === 'max_contacts_per_shift' && user.email === 'ещё.2.дня.работы@archive.local') {
      return false;
    }
    
    if (rankingType === 'revenue' && (!user.revenue || user.revenue === 0)) {
      return false;
    }
    
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (rankingType === 'contacts') {
      return b.contacts - a.contacts;
    } else if (rankingType === 'shifts') {
      return (b.shifts_count || 0) - (a.shifts_count || 0);
    } else if (rankingType === 'max_contacts_per_shift') {
      return (b.max_contacts_per_shift || 0) - (a.max_contacts_per_shift || 0);
    } else if (rankingType === 'revenue') {
      return (b.revenue || 0) - (a.revenue || 0);
    } else {
      return (b.avg_per_shift || 0) - (a.avg_per_shift || 0);
    }
  });

  const displayUsers = (() => {
    if (rankingType === 'contacts') {
      return showAllContacts ? sortedUsers : sortedUsers.slice(0, 4);
    } else if (rankingType === 'shifts') {
      return showAllShifts ? sortedUsers : sortedUsers.slice(0, 4);
    } else if (rankingType === 'max_contacts_per_shift') {
      return showAllMax ? sortedUsers : sortedUsers.slice(0, 4);
    } else if (rankingType === 'revenue') {
      return showAllRevenue ? sortedUsers : sortedUsers.slice(0, 4);
    } else {
      return showAllAvg ? sortedUsers : sortedUsers.slice(0, 4);
    }
  })();

  const hasMore = sortedUsers.length > 4;
  const isExpanded = (() => {
    if (rankingType === 'contacts') return showAllContacts;
    if (rankingType === 'shifts') return showAllShifts;
    if (rankingType === 'max_contacts_per_shift') return showAllMax;
    if (rankingType === 'revenue') return showAllRevenue;
    return showAllAvg;
  })();

  const toggleExpand = () => {
    if (rankingType === 'contacts') {
      setShowAllContacts(!showAllContacts);
    } else if (rankingType === 'shifts') {
      setShowAllShifts(!showAllShifts);
    } else if (rankingType === 'max_contacts_per_shift') {
      setShowAllMax(!showAllMax);
    } else if (rankingType === 'revenue') {
      setShowAllRevenue(!showAllRevenue);
    } else {
      setShowAllAvg(!showAllAvg);
    }
  };

  const getRankingTitle = () => {
    if (rankingType === 'contacts') return 'по контактам';
    if (rankingType === 'shifts') return 'по сменам';
    if (rankingType === 'max_contacts_per_shift') return 'по рекорду за смену';
    if (rankingType === 'revenue') return 'по доходу';
    return 'по среднему за смену';
  };

  const fetchUserOrgStats = async (email: string) => {
    if (userOrgStats[email]) {
      return;
    }

    try {
      const sessionToken = localStorage.getItem('session_token');
      const response = await fetch('https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken || ''
        },
        body: JSON.stringify({
          action: 'get_user_org_stats',
          email: email
        })
      });

      const data = await response.json();
      if (data.success && data.org_stats) {
        setUserOrgStats(prev => ({
          ...prev,
          [email]: data.org_stats
        }));
      }
    } catch (error) {
      console.error('Error fetching user org stats:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить статистику по организациям',
        variant: 'destructive'
      });
    }
  };

  const fetchUserShifts = async (email: string) => {
    if (userShifts[email]) {
      return;
    }

    try {
      const sessionToken = localStorage.getItem('session_token');
      const response = await fetch('https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken || ''
        },
        body: JSON.stringify({
          action: 'get_user_shifts',
          email: email
        })
      });

      const data = await response.json();
      if (data.success && data.shifts) {
        setUserShifts(prev => ({
          ...prev,
          [email]: data.shifts
        }));
      }
    } catch (error) {
      console.error('Error fetching user shifts:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить список смен',
        variant: 'destructive'
      });
    }
  };

  const fetchUserRevenue = async (email: string, userName: string, totalRevenue: number) => {
    try {
      const sessionToken = localStorage.getItem('session_token');
      const response = await fetch('https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken || ''
        },
        body: JSON.stringify({
          action: 'get_user_revenue',
          email: email
        })
      });

      const data = await response.json();
      if (data.success && data.org_revenues) {
        setSelectedUserRevenue({
          userName,
          orgRevenues: data.org_revenues,
          totalRevenue
        });
        setRevenueModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching user revenue:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные по доходу',
        variant: 'destructive'
      });
    }
  };

  const handleUserClick = async (email: string) => {
    if (rankingType === 'revenue') {
      const user = userStats.find(u => u.email === email);
      if (user) {
        await fetchUserRevenue(email, user.name, user.revenue || 0);
      }
      return;
    }
    
    if (rankingType !== 'avg_per_shift' && rankingType !== 'shifts' && rankingType !== 'max_contacts_per_shift') return;
    
    if (expandedUserEmail === email) {
      setExpandedUserEmail(null);
    } else {
      setExpandedUserEmail(email);
      if (rankingType === 'avg_per_shift') {
        await fetchUserOrgStats(email);
      } else if (rankingType === 'shifts') {
        await fetchUserShifts(email);
      } else if (rankingType === 'max_contacts_per_shift') {
        await fetchUserShifts(email);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
          <Icon name="Trophy" size={18} className="text-amber-500" />
        </div>
        <h2 className="font-semibold text-gray-800 text-base">Рейтинг промоутеров <span className="text-gray-400 font-normal text-sm">({getRankingTitle()})</span></h2>
      </div>

      <div className="p-5">
        <RankingFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          rankingType={rankingType}
          onRankingTypeChange={setRankingType}
          showOnlyActive={showOnlyActive}
          onShowOnlyActiveChange={setShowOnlyActive}
        />

        <div className="space-y-2">
          {displayUsers.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="Search" size={28} className="mx-auto mb-2 text-gray-300" />
              <div className="text-sm text-gray-400">Промоутеры не найдены</div>
            </div>
          ) : (
            displayUsers.map((user, index) => (
              <UserRankingCard
                key={user.email}
                user={user}
                index={index}
                rankingType={rankingType}
                isExpanded={expandedUserEmail === user.email}
                orgStats={userOrgStats[user.email] || []}
                shifts={userShifts[user.email] || []}
                onUserClick={handleUserClick}
              />
            ))
          )}

          {hasMore && (
            <button
              onClick={toggleExpand}
              className="w-full py-2.5 px-4 text-xs font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-100 transition-colors flex items-center justify-center gap-1.5 mt-1"
            >
              <span>
                {isExpanded
                  ? 'Скрыть'
                  : `Показать ещё ${sortedUsers.length - 4} ${
                      sortedUsers.length - 4 < 5 ? 'промоутера' : 'промоутеров'
                    }`}
              </span>
              <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={14} />
            </button>
          )}
        </div>

        {selectedUserRevenue && (
          <UserRevenueModal
            isOpen={revenueModalOpen}
            onClose={() => setRevenueModalOpen(false)}
            userName={selectedUserRevenue.userName}
            orgRevenues={selectedUserRevenue.orgRevenues}
            totalRevenue={selectedUserRevenue.totalRevenue}
          />
        )}
      </div>
    </div>
  );
}