import { useState } from 'react';
import ShiftDetailsModal from './ShiftDetailsModal';

interface OrganizationData {
  name: string;
  contact_rate: number;
  payment_type: 'cash' | 'cashless';
}

interface OrgStatsModalProps {
  workerName: string;
  workerEmail: string;
  orgStats: Array<{organization_name: string, avg_per_shift: number}>;
  allOrganizations: OrganizationData[];
  onClose: () => void;
}

export default function OrgStatsModal({ workerName, workerEmail, orgStats, allOrganizations, onClose }: OrgStatsModalProps) {
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);

  const calculateKMS = (orgName: string, avgContacts: number): number => {
    if (avgContacts <= 0) return 0;
    
    const orgData = allOrganizations.find(o => o.name === orgName);
    if (!orgData) return 0;
    
    const contactsCount = Math.round(avgContacts);
    const rate = orgData.contact_rate;
    
    const revenue = contactsCount * rate;
    const tax = orgData.payment_type === 'cashless' ? Math.round(revenue * 0.07) : 0;
    const afterTax = revenue - tax;
    
    const workerSalary = contactsCount >= 10 ? contactsCount * 300 : contactsCount * 200;
    const netProfit = afterTax - workerSalary;
    
    return Math.round(netProfit / 2);
  };

  const statsWithIncome = orgStats.map(stat => ({
    ...stat,
    expectedIncome: calculateKMS(stat.organization_name, stat.avg_per_shift)
  }));

  return (
    <>
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Статистика контактов
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          {workerName}
        </p>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {orgStats.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Нет данных по организациям</p>
          ) : (
            statsWithIncome
              .sort((a, b) => b.expectedIncome - a.expectedIncome)
              .map((stat, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => setSelectedOrg(stat.organization_name)}
                >
                  <span className="text-sm text-gray-700 font-medium">
                    {stat.organization_name}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-blue-600">
                      {stat.avg_per_shift.toFixed(1)}
                    </span>
                    {stat.expectedIncome > 0 && (
                      <span className="text-sm font-semibold text-green-600">
                        ~{stat.expectedIncome} ₽
                      </span>
                    )}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
    
    {selectedOrg && (
      <ShiftDetailsModal
        workerName={workerName}
        workerEmail={workerEmail}
        orgName={selectedOrg}
        onClose={() => setSelectedOrg(null)}
      />
    )}
    </>
  );
}