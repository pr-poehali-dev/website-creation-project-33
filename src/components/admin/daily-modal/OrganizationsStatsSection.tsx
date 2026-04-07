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
    <div className="bg-slate-800/50 rounded-xl p-3 sm:p-4 border-2 border-slate-700">
      <div className="text-sm sm:text-base font-bold text-slate-100 mb-3 flex items-center gap-2">
        <Icon name="Building2" size={18} className="text-cyan-400" />
        Статистика по организациям
      </div>
      <div className="space-y-3">
        {orgList.map((org) => {
          const promoters = getPromotersForOrg(org.name);
          return (
            <div key={org.name} className="rounded-lg overflow-hidden border border-slate-700">
              <div className="bg-slate-900 px-3 py-2 flex items-center justify-between gap-2">
                <div className="font-semibold text-slate-100 text-xs sm:text-sm truncate flex-1">
                  {org.name}
                </div>
                <div className="flex gap-3 flex-shrink-0">
                  <div className="text-center">
                    <div className="text-xs sm:text-sm font-bold text-green-400">{org.contacts}</div>
                    <div className="text-[9px] text-slate-400">контакты</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs sm:text-sm font-bold text-orange-400">{org.approaches}</div>
                    <div className="text-[9px] text-slate-400">подходы</div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-950/50 border-t border-slate-700 p-2 space-y-1">
                {promoters.map((p, index) => (
                  <div key={p.email} className="flex items-center justify-between gap-2 bg-slate-800/60 rounded-lg px-2.5 py-1.5">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-cyan-500 w-4 text-center flex-shrink-0">{index + 1}</span>
                      <span className="text-xs text-slate-200 truncate">{p.name}</span>
                    </div>
                    <div className="flex gap-3 flex-shrink-0">
                      <div className="text-center">
                        <div className="text-xs font-bold text-green-400">{p.orgData?.contacts}</div>
                        <div className="text-[9px] text-slate-400">конт.</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-bold text-orange-400">{p.orgData?.approaches}</div>
                        <div className="text-[9px] text-slate-400">подх.</div>
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
