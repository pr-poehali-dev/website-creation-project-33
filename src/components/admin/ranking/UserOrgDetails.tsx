import React from 'react';

export interface OrgStats {
  organization_name: string;
  contacts: number;
  shifts: number;
  avg_per_shift: number;
}

interface UserOrgDetailsProps {
  orgStats: OrgStats[];
}

export default function UserOrgDetails({ orgStats }: UserOrgDetailsProps) {
  if (orgStats.length === 0) {
    return <div className="text-xs text-gray-500 italic">Загрузка...</div>;
  }

  return (
    <>
      <div className="space-y-2 mb-3">
        {orgStats.map((org, idx) => (
          <div 
            key={idx}
            className="flex items-center justify-between bg-gray-50 rounded-lg p-3 text-xs"
          >
            <div className="flex-1 min-w-0 mr-2">
              <div className="font-medium text-gray-700 truncate">
                {org.organization_name}
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs flex-shrink-0">
              <div className="text-center">
                <div className="font-bold text-green-600">{org.contacts}</div>
                <div className="text-gray-500">К</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-blue-600">{org.shifts}</div>
                <div className="text-gray-500">См</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-purple-600">~{org.avg_per_shift}</div>
                <div className="text-gray-500">Ср</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="border-t border-gray-300 pt-2 mt-2">
        <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 text-xs font-semibold">
          <div className="text-gray-800">Итого:</div>
          <div className="flex items-center gap-3 text-xs">
            <div className="text-center">
              <div className="font-bold text-green-600">
                {orgStats.reduce((sum, org) => sum + org.contacts, 0)}
              </div>
              <div className="text-gray-600">К</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-blue-600">
                {orgStats.reduce((sum, org) => sum + org.shifts, 0)}
              </div>
              <div className="text-gray-600">См</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-purple-600">
                ~{(() => {
                  const totalContacts = orgStats.reduce((sum, org) => sum + org.contacts, 0);
                  const totalShifts = orgStats.reduce((sum, org) => sum + org.shifts, 0);
                  return totalShifts > 0 ? (totalContacts / totalShifts).toFixed(1) : '0';
                })()}
              </div>
              <div className="text-gray-600">Ср</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
