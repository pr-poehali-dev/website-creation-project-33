import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { OrganizationData } from './types';

interface WorkerDetailsModalProps {
  workerName: string;
  dayDate: string;
  avgContacts: number;
  recommendedOrgs: Array<{orgName: string, orgAvg: number, kms: number}>;
  currentOrganization: string;
  selectedOrgAvg: number;
  expectedKMS: number;
  kmsDifference: number;
  kmsDifferencePercent: number;
  allOrganizations: OrganizationData[];
  onClose: () => void;
}

export default function WorkerDetailsModal({
  workerName, dayDate, avgContacts,
  recommendedOrgs, currentOrganization,
  selectedOrgAvg, expectedKMS,
  kmsDifference, kmsDifferencePercent,
  onClose
}: WorkerDetailsModalProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    return `${dayNames[date.getDay()]}, ${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-white border-gray-100 text-gray-800 max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Icon name="User" size={15} className="text-blue-500" />
            </div>
            {workerName}
          </DialogTitle>
          <p className="text-xs text-gray-400 mt-0.5 ml-10">{formatDate(dayDate)}</p>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Средний показатель */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Icon name="BarChart3" size={14} className="text-gray-400" />
              Средний до этого дня
            </div>
            <span className="text-base font-bold text-blue-500">~{avgContacts.toFixed(1)} кон.</span>
          </div>

          {/* ТОП-3 рекомендации */}
          {recommendedOrgs.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <Icon name="Lightbulb" size={13} className="text-amber-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Рекомендации</span>
              </div>
              <div className="space-y-2">
                {recommendedOrgs.map((rec, index) => (
                  <div key={rec.orgName} className={`px-3 py-2.5 rounded-xl border ${
                    index === 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-white'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${
                          index === 0 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                          #{index + 1}
                        </span>
                        <span className="text-sm font-semibold text-gray-700 truncate">{rec.orgName}</span>
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">~{rec.orgAvg.toFixed(1)} кон.</span>
                    </div>
                    {rec.kms > 0 && (
                      <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-gray-100">
                        <span className="text-[11px] text-gray-400">КМС/КВВ</span>
                        <span className="text-sm font-semibold text-gray-600">~{rec.kms} ₽</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Выбранная организация */}
          {currentOrganization && (
            <div className="px-3 py-2.5 rounded-xl border border-amber-200 bg-amber-50">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon name="Building2" size={13} className="text-amber-500" />
                <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Выбрана</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">{currentOrganization}</span>
                <span className="text-xs text-gray-500">
                  {selectedOrgAvg > 0 ? `~${selectedOrgAvg.toFixed(1)} кон.` : 'нет данных'}
                </span>
              </div>
              {expectedKMS > 0 && (
                <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-amber-100">
                  <span className="text-[11px] text-amber-600">КМС/КВВ</span>
                  <span className="text-sm font-semibold text-amber-600">~{expectedKMS} ₽</span>
                </div>
              )}
            </div>
          )}

          {/* Разница */}
          {recommendedOrgs.length > 0 && expectedKMS > 0 && currentOrganization && (
            <div className={`px-3 py-2.5 rounded-xl border ${
              kmsDifference >= 0 ? 'border-emerald-200 bg-emerald-50' : 'border-red-100 bg-red-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon name={kmsDifference >= 0 ? 'TrendingUp' : 'TrendingDown'} size={13}
                    className={kmsDifference >= 0 ? 'text-emerald-500' : 'text-red-400'} />
                  <span className={`text-xs font-semibold ${kmsDifference >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {kmsDifference >= 0 ? 'Лучше рекомендации' : 'Рекомендация лучше'}
                  </span>
                </div>
                <span className={`text-sm font-bold ${kmsDifference >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {kmsDifference > 0 ? '+' : ''}{kmsDifference} ₽
                  <span className="text-xs font-normal ml-1">({kmsDifferencePercent > 0 ? '+' : ''}{kmsDifferencePercent}%)</span>
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-medium transition-colors"
          >
            Закрыть
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
