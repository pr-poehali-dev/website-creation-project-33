import React from 'react';
import Icon from '@/components/ui/icon';
import { UserStats } from '../types';

interface OrganizationsStatsSectionProps {
  dailyUserStats: UserStats[];
  onOrganizationClick?: (orgName: string) => void;
}

export default function OrganizationsStatsSection({ 
  dailyUserStats,
}: OrganizationsStatsSectionProps) {
  const [expandedOrg, setExpandedOrg] = React.useState<string | null>(null);

  const orgStats: Record<string, { contacts: number; approaches: number; total: number }> = {};
  
  dailyUserStats.forEach(user => {
    if (user.organizations) {
      user.organizations.forEach(org => {
        if (!orgStats[org.name]) {
          orgStats[org.name] = { contacts: 0, approaches: 0, total: 0 };
        }
        orgStats[org.name].contacts += org.contacts;
        orgStats[org.name].approaches += org.approaches;
        orgStats[org.name].total += org.total;
      });
    }
  });

  const orgList = Object.entries(orgStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.total - a.total);

  if (orgList.length === 0) {
    return null;
  }

  const getPromotersForOrg = (orgName: string) => {
    return dailyUserStats
      .filter(user => user.organizations?.some(org => org.name === orgName))
      .map(user => {
        const orgData = user.organizations?.find(org => org.name === orgName);
        return { name: user.name, email: user.email, orgData };
      })
      .filter(p => p.orgData)
      .sort((a, b) => (b.orgData?.contacts ?? 0) - (a.orgData?.contacts ?? 0));
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-3 sm:p-4 border-2 border-slate-700">
      <div className="text-sm sm:text-base md:text-lg font-bold text-slate-100 mb-3 flex items-center gap-2">
        <Icon name="Building2" size={20} className="text-cyan-400" />
        Статистика по организациям
      </div>
      <div className="space-y-2">
        {orgList.map((org) => {
          const isOpen = expandedOrg === org.name;
          const promoters = isOpen ? getPromotersForOrg(org.name) : [];

          return (
            <div key={org.name} className="rounded-lg overflow-hidden border border-slate-700">
              <div 
                className="bg-slate-900 p-2 sm:p-3 shadow-sm hover:bg-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer"
                onClick={() => setExpandedOrg(isOpen ? null : org.name)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-slate-100 text-xs sm:text-sm truncate flex-1">
                    {org.name}
                  </div>
                  <div className="flex gap-2 sm:gap-3 flex-shrink-0 items-center">
                    <div className="text-center">
                      <div className="text-xs sm:text-sm font-bold text-green-400">{org.contacts}</div>
                      <div className="text-[9px] sm:text-[10px] text-slate-400">контакты</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs sm:text-sm font-bold text-orange-400">{org.approaches}</div>
                      <div className="text-[9px] sm:text-[10px] text-slate-400">подходы</div>
                    </div>
                    <Icon 
                      name={isOpen ? "ChevronUp" : "ChevronDown"} 
                      size={16} 
                      className="text-slate-400 transition-transform" 
                    />
                  </div>
                </div>
              </div>

              {isOpen && (
                <div className="bg-slate-950/50 border-t border-slate-700 p-2 space-y-1.5">
                  {promoters.map((p, index) => (
                    <div key={p.email} className="flex items-center justify-between gap-3 bg-slate-800/60 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                          <span className="text-cyan-400 font-bold text-[10px]">{index + 1}</span>
                        </div>
                        <div className="font-medium text-slate-200 text-xs sm:text-sm truncate">
                          {p.name}
                        </div>
                      </div>
                      <div className="flex gap-3 flex-shrink-0">
                        <div className="text-center">
                          <div className="text-xs font-bold text-green-400">{p.orgData?.contacts}</div>
                          <div className="text-[9px] text-slate-400">контакты</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-bold text-orange-400">{p.orgData?.approaches}</div>
                          <div className="text-[9px] text-slate-400">подходы</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
