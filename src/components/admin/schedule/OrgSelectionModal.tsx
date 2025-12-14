import { useState } from 'react';
import { Button } from '@/components/ui/button';
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

  const handleOrgClick = (orgName: string) => {
    if (selectedOrg === orgName) {
      setSelectedOrg(null);
    } else {
      setSelectedOrg(orgName);
    }
  };

  const handleDetailsClick = (orgName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetailsForOrg(orgName);
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
          className="bg-white rounded-lg p-4 md:p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto"
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
          
          <p className="text-xs md:text-sm text-gray-600 mb-4">
            {workerName}
          </p>

          <div className="space-y-2 mb-4">
            {orgStats.length === 0 ? (
              <p className="text-xs md:text-sm text-gray-500 italic">Нет данных по организациям</p>
            ) : (
              statsWithIncome
                .sort((a, b) => b.expectedIncome - a.expectedIncome)
                .map((stat, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border-2 ${
                      selectedOrg === stat.organization_name
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-gray-50 border-transparent hover:bg-gray-100'
                    }`}
                    onClick={() => handleOrgClick(stat.organization_name)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        selectedOrg === stat.organization_name
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedOrg === stat.organization_name && (
                          <Icon name="Check" size={12} className="text-white" />
                        )}
                      </div>
                      <span className="text-xs md:text-sm text-gray-700 font-medium truncate">
                        {stat.organization_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-sm md:text-lg font-bold text-blue-600">
                          {stat.avg_per_shift.toFixed(1)}
                        </span>
                        {stat.expectedIncome > 0 && (
                          <span className="text-[10px] md:text-xs font-semibold text-green-600">
                            ~{stat.expectedIncome} ₽
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => handleDetailsClick(stat.organization_name, e)}
                        className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                        title="Показать детали"
                      >
                        <Icon name="Info" size={16} className="text-gray-500" />
                      </button>
                    </div>
                  </div>
                ))
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
