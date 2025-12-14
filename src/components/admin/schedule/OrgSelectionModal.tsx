import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import ShiftDetailsModal from './ShiftDetailsModal';

interface OrganizationData {
  name: string;
  contact_rate: number;
  payment_type: 'cash' | 'cashless';
}

interface OrgSelectionModalProps {
  workerName: string;
  workerEmail: string;
  orgStats: Array<{organization_name: string, avg_per_shift: number}>;
  allOrganizations: OrganizationData[];
  loadingProgress?: number;
  onSelect: (orgName: string) => void;
  onClose: () => void;
}

interface OrgWithStats {
  name: string;
  avgPerShift: number | null;
  expectedIncome: number;
  hasData: boolean;
}

export default function OrgSelectionModal({ 
  workerName, 
  workerEmail, 
  orgStats, 
  allOrganizations,
  loadingProgress = 100,
  onSelect, 
  onClose 
}: OrgSelectionModalProps) {
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [showDetailsForOrg, setShowDetailsForOrg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const isLoading = loadingProgress < 100 || orgStats.length === 0;

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

  const allOrgsWithStats = useMemo(() => {
    const orgsMap = new Map<string, OrgWithStats>();
    
    allOrganizations.forEach(org => {
      const stat = orgStats.find(s => s.organization_name === org.name);
      
      if (stat) {
        orgsMap.set(org.name, {
          name: org.name,
          avgPerShift: stat.avg_per_shift,
          expectedIncome: calculateKMS(org.name, stat.avg_per_shift),
          hasData: true
        });
      } else {
        orgsMap.set(org.name, {
          name: org.name,
          avgPerShift: null,
          expectedIncome: 0,
          hasData: false
        });
      }
    });
    
    const orgsArray = Array.from(orgsMap.values());
    
    return orgsArray.sort((a, b) => {
      if (a.hasData && !b.hasData) return -1;
      if (!a.hasData && b.hasData) return 1;
      if (a.hasData && b.hasData) return b.expectedIncome - a.expectedIncome;
      return a.name.localeCompare(b.name);
    });
  }, [allOrganizations, orgStats]);

  const filteredOrgs = useMemo(() => {
    if (!searchQuery.trim()) return allOrgsWithStats;
    
    const query = searchQuery.toLowerCase();
    return allOrgsWithStats.filter(org => 
      org.name.toLowerCase().includes(query)
    );
  }, [allOrgsWithStats, searchQuery]);

  const displayedOrgs = showAll ? filteredOrgs : filteredOrgs.slice(0, 5);
  const hasMore = filteredOrgs.length > 5;

  const handleOrgClick = (orgName: string) => {
    if (selectedOrg === orgName) {
      setSelectedOrg(null);
    } else {
      setSelectedOrg(orgName);
    }
  };

  const handleDetailsClick = (orgName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const orgData = allOrgsWithStats.find(o => o.name === orgName);
    if (orgData?.hasData) {
      setShowDetailsForOrg(orgName);
    }
  };

  const handleSelectClick = () => {
    if (selectedOrg) {
      onSelect(selectedOrg);
      onClose();
    }
  };

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
              <Icon name="Building2" size={20} className="text-cyan-400 md:w-6 md:h-6" />
              Выбор организации
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Icon name="X" size={20} />
            </button>
          </div>
          
          <p className="text-xs md:text-sm text-slate-400 mb-3 flex items-center gap-1.5">
            <Icon name="User" size={14} className="text-cyan-400" />
            {workerName}
          </p>

          <div className="relative mb-3">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Поиск организации..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowAll(false);
              }}
              className="pl-9 text-xs md:text-sm h-9 bg-slate-800/50 border-slate-600 text-slate-200 placeholder:text-slate-500 focus:border-cyan-500"
            />
          </div>

          <div className="space-y-2 mb-4 overflow-y-auto flex-1 pr-1 custom-scrollbar">
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
            ) : filteredOrgs.length === 0 ? (
              <div className="text-center py-8">
                <Icon name="Inbox" size={36} className="mx-auto mb-2 text-slate-600" />
                <p className="text-xs md:text-sm text-slate-500 italic">
                  {searchQuery ? 'Организации не найдены' : 'Нет доступных организаций'}
                </p>
              </div>
            ) : (
              <>
                {displayedOrgs.map((org, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border-2 ${
                      selectedOrg === org.name
                        ? 'bg-cyan-500/20 border-cyan-500'
                        : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 hover:border-slate-600'
                    }`}
                    onClick={() => handleOrgClick(org.name)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        selectedOrg === org.name
                          ? 'border-cyan-400 bg-cyan-500'
                          : 'border-slate-600'
                      }`}>
                        {selectedOrg === org.name && (
                          <Icon name="Check" size={12} className="text-white" />
                        )}
                      </div>
                      <span className="text-xs md:text-sm text-slate-200 font-medium truncate">
                        {org.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                      {org.hasData ? (
                        <>
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-sm md:text-lg font-bold text-cyan-400">
                              {org.avgPerShift?.toFixed(1)}
                            </span>
                            {org.expectedIncome > 0 && (
                              <span className="text-[10px] md:text-xs font-semibold text-emerald-400">
                                ~{org.expectedIncome} ₽
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => handleDetailsClick(org.name, e)}
                            className="p-1.5 hover:bg-slate-600/50 rounded-full transition-colors"
                            title="Показать детали"
                          >
                            <Icon name="Info" size={16} className="text-slate-400 hover:text-cyan-400" />
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] md:text-xs text-slate-500 italic">
                          Нет смен
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                
                {!showAll && hasMore && (
                  <button
                    onClick={() => setShowAll(true)}
                    className="w-full py-2 text-xs md:text-sm text-cyan-400 hover:text-cyan-300 font-medium hover:bg-slate-800/50 rounded-lg transition-colors border border-slate-700 hover:border-cyan-500/50"
                  >
                    <Icon name="ChevronDown" size={14} className="inline mr-1" />
                    Показать ещё {filteredOrgs.length - 5}
                  </button>
                )}
              </>
            )}
          </div>

          <div className="flex gap-2 pt-4 border-t border-slate-700">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 text-xs md:text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600"
            >
              Отмена
            </Button>
            <Button
              onClick={handleSelectClick}
              disabled={!selectedOrg}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="Check" size={16} className="mr-1.5" />
              Выбрать
            </Button>
          </div>
        </div>
      </div>
      
      {showDetailsForOrg && (
        <ShiftDetailsModal
          workerName={workerName}
          workerEmail={workerEmail}
          orgName={showDetailsForOrg}
          onClose={() => setShowDetailsForOrg(null)}
        />
      )}
      
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
    </>
  );
}