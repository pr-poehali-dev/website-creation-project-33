import { useState } from 'react';
import ShiftDetailsModal from './ShiftDetailsModal';

interface OrgStatsModalProps {
  workerName: string;
  workerEmail: string;
  orgStats: Array<{organization_name: string, avg_per_shift: number}>;
  onClose: () => void;
}

export default function OrgStatsModal({ workerName, workerEmail, orgStats, onClose }: OrgStatsModalProps) {
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);

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
            orgStats
              .sort((a, b) => b.avg_per_shift - a.avg_per_shift)
              .map((stat, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => setSelectedOrg(stat.organization_name)}
                >
                  <span className="text-sm text-gray-700 font-medium">
                    {stat.organization_name}
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    {stat.avg_per_shift.toFixed(1)}
                  </span>
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