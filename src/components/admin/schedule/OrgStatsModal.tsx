import { useState } from 'react';
import Icon from '@/components/ui/icon';
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
  loadingProgress?: number;
  onClose: () => void;
}

export default function OrgStatsModal({ workerName, workerEmail, orgStats, allOrganizations, loadingProgress = 100, onClose }: OrgStatsModalProps) {
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const isLoading = loadingProgress < 100;

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
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border-2 border-slate-700 rounded-xl p-4 md:p-6 max-w-md w-full shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base md:text-lg font-bold text-slate-100 flex items-center gap-2">
            <Icon name="BarChart3" size={20} className="text-cyan-400 md:w-6 md:h-6" />
            Статистика контактов
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Icon name="X" size={20} />
          </button>
        </div>
        
        <p className="text-xs md:text-sm text-slate-400 mb-4 flex items-center gap-1.5">
          <Icon name="User" size={14} className="text-cyan-400" />
          {workerName}
        </p>

        <div className="space-y-2 overflow-y-auto pr-1 custom-scrollbar flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative w-24 h-24 mb-4">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-slate-700"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - loadingProgress / 100)}`}
                    className="text-cyan-400 transition-all duration-300"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-cyan-400">{loadingProgress}%</span>
                </div>
              </div>
              <p className="text-sm text-slate-400">Загрузка статистики...</p>
            </div>
          ) : orgStats.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="Inbox" size={36} className="mx-auto mb-2 text-slate-600" />
              <p className="text-xs md:text-sm text-slate-500 italic">Нет данных по организациям</p>
            </div>
          ) : (
            statsWithIncome
              .sort((a, b) => b.expectedIncome - a.expectedIncome)
              .map((stat, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
                  onClick={() => setSelectedOrg(stat.organization_name)}
                >
                  <span className="text-xs md:text-sm text-slate-200 font-medium flex items-center gap-2">
                    <Icon name="Building2" size={14} className="text-cyan-400" />
                    {stat.organization_name}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-base md:text-lg font-bold text-emerald-400">
                      {stat.avg_per_shift.toFixed(1)}
                    </span>
                    {stat.expectedIncome > 0 && (
                      <span className="text-xs md:text-sm font-semibold text-cyan-400">
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

<style>{`
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgb(30 41 59 / 0.5);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgb(71 85 105);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgb(100 116 139);
  }
`}</style>