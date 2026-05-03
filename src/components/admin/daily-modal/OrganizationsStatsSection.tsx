import Icon from '@/components/ui/icon';
import { UserStats } from '../types';

interface OrganizationsStatsSectionProps {
  dailyUserStats: UserStats[];
  onOrganizationClick?: (orgName: string) => void;
}

export default function OrganizationsStatsSection({ dailyUserStats }: OrganizationsStatsSectionProps) {
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

  if (orgList.length === 0) return null;

  const getPromotersForOrg = (orgName: string) =>
    dailyUserStats
      .filter(user => user.organizations?.some(org => org.name === orgName))
      .map(user => {
        const orgData = user.organizations?.find(org => org.name === orgName);
        return { name: user.name, email: user.email, orgData };
      })
      .filter(p => p.orgData)
      .sort((a, b) => (b.orgData?.contacts ?? 0) - (a.orgData?.contacts ?? 0));

  return (
    <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm">
      <div className="text-sm sm:text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
        <Icon name="Building2" size={18} className="text-blue-500" />
        Статистика по организациям
      </div>
      <div className="space-y-3">
        {orgList.map((org) => {
          const promoters = getPromotersForOrg(org.name);
          return (
            <div key={org.name} className="rounded-xl overflow-hidden border border-gray-100">
              <div className="bg-gray-50 px-3 py-2 flex items-center justify-between gap-2">
                <div className="font-semibold text-gray-800 text-xs sm:text-sm truncate flex-1">
                  {org.name}
                </div>
                <div className="flex gap-3 flex-shrink-0">
                  <div className="text-center">
                    <div className="text-xs sm:text-sm font-bold text-green-500">{org.contacts}</div>
                    <div className="text-[9px] text-gray-400">контакты</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs sm:text-sm font-bold text-orange-400">{org.approaches}</div>
                    <div className="text-[9px] text-gray-400">подходы</div>
                  </div>
                </div>
              </div>
              <div className="bg-white border-t border-gray-100 p-2 space-y-1">
                {promoters.map((p, index) => (
                  <div key={p.email} className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg px-2.5 py-1.5">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-blue-500 w-4 text-center flex-shrink-0">{index + 1}</span>
                      <span className="text-xs text-gray-700 truncate">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-center">
                        <div className="text-xs font-bold text-green-500">{p.orgData?.contacts}</div>
                        <div className="text-[9px] text-gray-400">конт.</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-bold text-orange-400">{p.orgData?.approaches}</div>
                        <div className="text-[9px] text-gray-400">подх.</div>
                      </div>
                      <div className="text-center min-w-[28px]">
                        <div className="text-xs font-bold text-gray-400">
                          {(p.orgData?.approaches ?? 0) > 0 ? Math.round(((p.orgData?.contacts ?? 0) / (p.orgData?.approaches ?? 1)) * 100) : 0}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}