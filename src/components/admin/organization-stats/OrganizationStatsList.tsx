import React from 'react';
import Icon from '@/components/ui/icon';

interface OrgTotal {
  name: string;
  total: number;
  contact_rate: number;
  payment_type: string;
  users: Record<string, number>;
  userShifts: Record<string, number>;
}

interface OrganizationStatsListProps {
  sortedOrgs: OrgTotal[];
  selectedOrg: string | null;
  setSelectedOrg: (value: string | null) => void;
  setSelectedPromoter: (value: { name: string; contacts: number }) => void;
  setModalOpen: (value: boolean) => void;
}

export default function OrganizationStatsList({
  sortedOrgs,
  selectedOrg,
  setSelectedOrg,
  setSelectedPromoter,
  setModalOpen,
}: OrganizationStatsListProps) {
  return (
    <div className="space-y-4">
      {sortedOrgs.map(org => {
        const isExpanded = selectedOrg === org.name;
        const usersList = Object.entries(org.users)
          .map(([userName, contacts]) => {
            const shifts = org.userShifts[userName] || 1;
            const average = Math.round(contacts / shifts);
            return { userName, contacts, average };
          })
          .sort((a, b) => b.average - a.average);
        
        return (
          <div key={org.name} className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800">
            <button
              onClick={() => setSelectedOrg(isExpanded ? null : org.name)}
              className="w-full p-3 md:p-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                <span className="font-semibold text-xs md:text-base text-slate-100 truncate">
                  {org.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-4 flex-shrink-0">
                {org.contact_rate > 0 && (
                  <div className="text-right min-w-[60px] md:min-w-[80px]">
                    <div className="text-sm md:text-lg font-bold text-green-400">
                      {(() => {
                        const revenue = org.total * org.contact_rate;
                        const revenueAfterTax = org.payment_type === 'cashless' ? revenue * 0.93 : revenue;
                        return Math.round(revenueAfterTax).toLocaleString('ru-RU');
                      })()}₽
                    </div>
                    <div className="text-[10px] md:text-xs text-slate-400">
                      {org.payment_type === 'cash' ? 'наличка' : 'безнал'}
                    </div>
                  </div>
                )}
                <div className="text-center min-w-[45px] md:min-w-[60px]">
                  <div className="text-sm md:text-lg font-bold text-cyan-400">
                    {(() => {
                      const users = Object.entries(org.users);
                      const avgPerPromoter = users.length > 0 
                        ? users.reduce((sum, [userName, contacts]) => {
                            const shifts = org.userShifts[userName] || 1;
                            return sum + (contacts / shifts);
                          }, 0) / users.length
                        : 0;
                      return Math.round(avgPerPromoter);
                    })()}
                  </div>
                  <div className="text-[10px] md:text-xs text-slate-400 hidden sm:block">средний</div>
                  <div className="text-[10px] md:text-xs text-slate-400 sm:hidden">сред</div>
                </div>
                <div className="text-center min-w-[40px] md:min-w-[60px]">
                  <div className="text-base md:text-xl font-bold text-slate-100">
                    {org.total}
                  </div>
                  <div className="text-[10px] md:text-xs text-slate-400 hidden sm:block">контактов</div>
                  <div className="text-[10px] md:text-xs text-slate-400 sm:hidden">конт</div>
                </div>
                <Icon
                  name={isExpanded ? 'ChevronUp' : 'ChevronDown'}
                  size={16}
                  className="text-slate-400 md:w-5 md:h-5"
                />
              </div>
            </button>

            {isExpanded && usersList.length > 0 && (
              <div className="border-t border-slate-700 bg-slate-700/50 p-4">
                <div className="space-y-2">
                  {usersList.map((user) => (
                    <button
                      key={user.userName}
                      onClick={() => {
                        setSelectedPromoter({ name: user.userName, contacts: user.contacts });
                        setModalOpen(true);
                      }}
                      className="w-full flex items-center justify-between py-2 px-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      <span className="text-sm text-slate-200">{user.userName}</span>
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="text-right">
                          <div className="text-sm font-semibold text-cyan-400">
                            {user.average}
                          </div>
                          <div className="text-xs text-slate-400">средний</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-slate-100">
                            {user.contacts}
                          </div>
                          <div className="text-xs text-slate-400">контактов</div>
                        </div>
                        <Icon name="ChevronRight" size={16} className="text-slate-400" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}