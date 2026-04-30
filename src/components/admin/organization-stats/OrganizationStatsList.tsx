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
  setSelectedPromoter: (value: { name: string; contacts: number; orgName: string }) => void;
  setModalOpen: (value: boolean) => void;
}

export default function OrganizationStatsList({
  sortedOrgs, selectedOrg, setSelectedOrg, setSelectedPromoter, setModalOpen,
}: OrganizationStatsListProps) {
  return (
    <div className="space-y-2">
      {sortedOrgs.map(org => {
        const isExpanded = selectedOrg === org.name;
        const usersList = Object.entries(org.users)
          .map(([userName, contacts]) => {
            const shifts = org.userShifts[userName] || 1;
            return { userName, contacts, average: Math.round(contacts / shifts) };
          })
          .sort((a, b) => b.average - a.average);

        const revenue = org.contact_rate > 0
          ? Math.round(org.total * org.contact_rate * (org.payment_type === 'cashless' ? 0.93 : 1))
          : null;

        const avgPerPromoter = (() => {
          const users = Object.entries(org.users);
          if (!users.length) return 0;
          return Math.round(
            users.reduce((sum, [name, contacts]) => sum + contacts / (org.userShifts[name] || 1), 0) / users.length
          );
        })();

        return (
          <div key={org.name} className="rounded-xl border border-gray-100 overflow-hidden bg-white">
            <button
              onClick={() => setSelectedOrg(isExpanded ? null : org.name)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-sm text-gray-800 truncate text-left flex-1 mr-2">{org.name}</span>
              <div className="flex items-center gap-3 flex-shrink-0">
                {revenue !== null && (
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-500">{revenue.toLocaleString('ru-RU')}₽</div>
                    <div className="text-[10px] text-gray-400">{org.payment_type === 'cash' ? 'наличка' : 'безнал'}</div>
                  </div>
                )}
                <div className="text-center">
                  <div className="text-sm font-bold text-blue-500">{avgPerPromoter}</div>
                  <div className="text-[10px] text-gray-400">сред</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-gray-700">{org.total}</div>
                  <div className="text-[10px] text-gray-400">конт</div>
                </div>
                <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={15} className="text-gray-400" />
              </div>
            </button>

            {isExpanded && usersList.length > 0 && (
              <div className="border-t border-gray-100 bg-gray-50 p-3 space-y-1.5">
                {usersList.map(user => (
                  <button
                    key={user.userName}
                    onClick={() => { setSelectedPromoter({ name: user.userName, contacts: user.contacts, orgName: org.name }); setModalOpen(true); }}
                    className="w-full flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all text-left"
                  >
                    <span className="text-sm text-gray-700">{user.userName}</span>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-blue-500">{user.average}</div>
                        <div className="text-[10px] text-gray-400">средний</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-700">{user.contacts}</div>
                        <div className="text-[10px] text-gray-400">контактов</div>
                      </div>
                      <Icon name="ChevronRight" size={14} className="text-gray-300" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
