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
  workerName,
  dayDate,
  avgContacts,
  recommendedOrgs,
  currentOrganization,
  selectedOrgAvg,
  expectedKMS,
  kmsDifference,
  kmsDifferencePercent,
  allOrganizations,
  onClose
}: WorkerDetailsModalProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    return `${dayNames[date.getDay()]}, ${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-200 max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-cyan-400 flex items-center gap-2">
            <Icon name="User" size={24} />
            {workerName}
          </DialogTitle>
          <p className="text-sm text-slate-400 mt-1">{formatDate(dayDate)}</p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Общая статистика */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Icon name="BarChart3" size={16} />
              Общая статистика
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Средний показатель до этого дня:</span>
                <span className="text-lg font-bold text-cyan-400">~{avgContacts.toFixed(1)} контактов</span>
              </div>
            </div>
          </div>

          {/* ТОП-3 Рекомендации */}
          {recommendedOrgs.length > 0 && (
            <div className="bg-cyan-900/20 rounded-lg p-4 border border-cyan-700/50">
              <h3 className="text-sm font-semibold text-cyan-300 mb-3 flex items-center gap-2">
                <Icon name="Lightbulb" size={16} />
                ТОП-3 Рекомендуемых организаций
              </h3>
              <div className="space-y-3">
                {recommendedOrgs.map((rec, index) => (
                  <div key={rec.orgName} className={`p-3 rounded-lg border ${
                    index === 0 ? 'border-cyan-500/50 bg-cyan-500/10' : 'border-cyan-700/30 bg-slate-800/30'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          index === 0 ? 'bg-cyan-500 text-white' : 'bg-cyan-700/50 text-cyan-300'
                        }`}>
                          #{index + 1}
                        </span>
                        <span className="text-base font-semibold text-cyan-200">{rec.orgName}</span>
                      </div>
                      <span className="text-sm text-cyan-400 bg-cyan-900/30 px-2 py-1 rounded">
                        ~{rec.orgAvg.toFixed(1)} контактов
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-cyan-700/30">
                      <span className="text-sm text-cyan-300">Ожидаемый доход КМС/КВВ:</span>
                      <span className="text-lg font-bold text-cyan-400">~{rec.kms} ₽</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Выбранная организация */}
          {currentOrganization && (
            <div className="bg-amber-900/20 rounded-lg p-4 border border-amber-700/50">
              <h3 className="text-sm font-semibold text-amber-300 mb-3 flex items-center gap-2">
                <Icon name="Building2" size={16} />
                Выбранная организация
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-amber-200">{currentOrganization}</span>
                  <span className="text-sm text-amber-400 bg-amber-900/30 px-2 py-1 rounded">
                    {selectedOrgAvg > 0 ? `~${selectedOrgAvg.toFixed(1)} контактов` : 'не было смен'}
                  </span>
                </div>
                {expectedKMS > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t border-amber-700/30">
                    <span className="text-sm text-amber-300">Ожидаемый доход КМС/КВВ:</span>
                    <span className="text-lg font-bold text-amber-400">~{expectedKMS} ₽</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Разница с лучшей рекомендацией */}
          {recommendedOrgs.length > 0 && expectedKMS > 0 && currentOrganization && (
            <div className={`rounded-lg p-4 border ${kmsDifference >= 0 ? 'bg-green-900/20 border-green-700/50' : 'bg-red-900/20 border-red-700/50'}`}>
              <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${kmsDifference >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                <Icon name={kmsDifference >= 0 ? 'TrendingUp' : 'TrendingDown'} size={16} />
                Разница с лучшей рекомендацией
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${kmsDifference >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    {kmsDifference >= 0 ? 'Выбрано лучше на:' : 'Лучшая рекомендация была бы лучше на:'}
                  </span>
                  <div className="text-right">
                    <span className={`text-xl font-bold ${kmsDifference >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {kmsDifference > 0 ? '+' : ''}{kmsDifference} ₽
                    </span>
                    <span className={`text-sm ml-2 ${kmsDifference >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ({kmsDifferencePercent > 0 ? '+' : ''}{kmsDifferencePercent}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors flex items-center gap-2"
          >
            <Icon name="X" size={16} />
            Закрыть
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}