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
  onSelect, 
  onClose 
}: OrgSelectionModalProps) {
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [showDetailsForOrg, setShowDetailsForOrg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

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
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-lg p-4 md:p-6 max-w-md w-full shadow-xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">
              Выбор организации
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <Icon name="X" size={20} />
            </button>
          </div>
          
          <p className="text-xs md:text-sm text-gray-600 mb-3">
            {workerName}
          </p>

          <div className="relative mb-3">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Поиск организации..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowAll(false);
              }}
              className="pl-9 text-xs md:text-sm h-9"
            />
          </div>

          <div className="space-y-2 mb-4 overflow-y-auto flex-1">
            {filteredOrgs.length === 0 ? (
              <p className="text-xs md:text-sm text-gray-500 italic text-center py-4">
                {searchQuery ? 'Организации не найдены' : 'Нет доступных организаций'}
              </p>
            ) : (
              <>
                {displayedOrgs.map((org, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border-2 ${
                      selectedOrg === org.name
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-gray-50 border-transparent hover:bg-gray-100'
                    }`}
                    onClick={() => handleOrgClick(org.name)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        selectedOrg === org.name
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedOrg === org.name && (
                          <Icon name="Check" size={12} className="text-white" />
                        )}
                      </div>
                      <span className="text-xs md:text-sm text-gray-700 font-medium truncate">
                        {org.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                      {org.hasData ? (
                        <>
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-sm md:text-lg font-bold text-blue-600">
                              {org.avgPerShift?.toFixed(1)}
                            </span>
                            {org.expectedIncome > 0 && (
                              <span className="text-[10px] md:text-xs font-semibold text-green-600">
                                ~{org.expectedIncome} ₽
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => handleDetailsClick(org.name, e)}
                            className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                            title="Показать детали"
                          >
                            <Icon name="Info" size={16} className="text-gray-500" />
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] md:text-xs text-gray-400 italic">
                          Нет смен
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                
                {!showAll && hasMore && (
                  <button
                    onClick={() => setShowAll(true)}
                    className="w-full py-2 text-xs md:text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Показать ещё {filteredOrgs.length - 5}
                  </button>
                )}
              </>
            )}
          </div>

          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 text-xs md:text-sm"
            >
              Отмена
            </Button>
            <Button
              onClick={handleSelectClick}
              disabled={!selectedOrg}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm"
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
    </>
  );
}
