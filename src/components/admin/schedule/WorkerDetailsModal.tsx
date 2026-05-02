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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-100 flex flex-col"
        style={{ maxHeight: 'min(90dvh, 680px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Шапка */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Icon name="User" size={15} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">{workerName}</p>
              <p className="text-[11px] text-gray-400">{formatDate(dayDate)}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
            <Icon name="X" size={16} />
          </button>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-[max(16px,env(safe-area-inset-bottom))]">

          {/* Средний показатель */}
          <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
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
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Рекомендации</span>
              </div>
              <div className="space-y-2">
                {recommendedOrgs.map((rec, index) => (
                  <div key={rec.orgName} className={`px-3 py-2.5 rounded-xl border ${
                    index === 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-white shadow-sm'
                  }`}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${
                          index === 0 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                          #{index + 1}
                        </span>
                        <span className="text-sm font-semibold text-gray-700 truncate">{rec.orgName}</span>
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">~{rec.orgAvg.toFixed(1)} кон.</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="text-[11px] text-gray-400">Ожидаемый доход КМС/КВВ:</span>
                      <span className={`text-sm font-bold ${index === 0 ? 'text-blue-600' : 'text-gray-600'}`}>
                        ~{rec.kms} ₽
                      </span>
                    </div>
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
                <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wide">Выбрана</span>
              </div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-semibold text-gray-700 truncate flex-1">{currentOrganization}</span>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {selectedOrgAvg > 0 ? `~${selectedOrgAvg.toFixed(1)} кон.` : 'нет данных'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-amber-100">
                <span className="text-[11px] text-amber-600">Ожидаемый доход КМС/КВВ:</span>
                <span className="text-sm font-bold text-amber-600">
                  {expectedKMS > 0 ? `~${expectedKMS} ₽` : '—'}
                </span>
              </div>
            </div>
          )}

          {/* Разница с лучшей рекомендацией */}
          {recommendedOrgs.length > 0 && expectedKMS > 0 && currentOrganization && (
            <div className={`px-3 py-2.5 rounded-xl border ${
              kmsDifference >= 0 ? 'border-emerald-200 bg-emerald-50' : 'border-red-100 bg-red-50'
            }`}>
              <div className="flex items-center gap-1.5 mb-2">
                <Icon name={kmsDifference >= 0 ? 'TrendingUp' : 'TrendingDown'} size={13}
                  className={kmsDifference >= 0 ? 'text-emerald-500' : 'text-red-400'} />
                <span className={`text-[11px] font-semibold uppercase tracking-wide ${kmsDifference >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {kmsDifference >= 0 ? 'Лучше рекомендации' : 'Рекомендация лучше'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Разница с лучшей:</span>
                <span className={`text-base font-bold ${kmsDifference >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {kmsDifference > 0 ? '+' : ''}{kmsDifference} ₽
                  <span className="text-xs font-normal ml-1 opacity-70">
                    ({kmsDifferencePercent > 0 ? '+' : ''}{kmsDifferencePercent}%)
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
