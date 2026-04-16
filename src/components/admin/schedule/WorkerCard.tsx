import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { UserSchedule, DeleteSlotState, OrganizationData } from './types';
import { isMaximKorelsky, calculateAvgBeforeDate } from './utils';
import OrgStatsModal from './OrgStatsModal';
import OrgSelectionModal from './OrgSelectionModal';
import WorkerDetailsModal from './WorkerDetailsModal';

interface WorkerCardProps {
  worker: UserSchedule;
  dayDate: string;
  slotTime: string;
  slotLabel: string;
  workComments: Record<string, Record<string, {
    location?: string;
    flyers?: string;
    organization?: string;
    location_type?: string;
    location_details?: string;
  }>>;
  savingComment: string | null;
  allLocations: string[];
  allOrganizations: OrganizationData[];
  recommendedOrgs: string[];
  orgStats: Array<{organization_name: string, avg_per_shift: number}>;
  loadingProgress?: number;
  onCommentChange: (userName: string, date: string, field: string, value: string) => void;
  onCommentBlur: (userName: string, date: string, field: string, value: string) => void;
  onRemoveSlot: (userId: number, userName: string, date: string, slotTime: string, slotLabel: string) => void;
  deletingSlot: DeleteSlotState | null;
}

const LOCATION_TYPES = ['ТЦ', 'Школа', 'Садик', 'Улица'];

export default function WorkerCard({
  worker,
  dayDate,
  slotTime,
  slotLabel,
  workComments,
  savingComment,
  allLocations,
  allOrganizations,
  recommendedOrgs,
  orgStats,
  loadingProgress,
  onCommentChange,
  onCommentBlur,
  onRemoveSlot,
  deletingSlot
}: WorkerCardProps) {
  const [showOrgStatsModal, setShowOrgStatsModal] = useState(false);
  const [showOrgSelectionModal, setShowOrgSelectionModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const isMaxim = isMaximKorelsky(worker.first_name, worker.last_name);
  const workerName = `${worker.first_name} ${worker.last_name}`;
  
  // Вычисляем средний показатель ДО текущей даты (не включая её)
  const avgContacts = calculateAvgBeforeDate(worker.daily_contacts, dayDate);
  // Фактический результат за этот день
  const actualContacts = worker.daily_contacts?.find(d => d.date === dayDate)?.count ?? null;
  const commentKey = `${workerName}-${dayDate}`;
  
  const commentData = workComments[dayDate]?.[workerName] || {};
  const currentOrganization = commentData.organization || '';
  const currentLocationType = commentData.location_type || '';
  const currentLocationDetails = commentData.location_details || '';
  const currentFlyers = commentData.flyers || '';

  const handleOrgSelect = (org: string) => {
    onCommentChange(workerName, dayDate, 'organization', org);
    setShowOrgSelectionModal(false);
  };

  const handleSave = () => {
    onCommentBlur(workerName, dayDate, 'organization', currentOrganization);
    onCommentBlur(workerName, dayDate, 'location_type', currentLocationType);
    onCommentBlur(workerName, dayDate, 'location_details', currentLocationDetails);
    onCommentBlur(workerName, dayDate, 'flyers', currentFlyers);
  };

  // Расчёт среднего результата промоутера в выбранной организации
  const selectedOrgStats = currentOrganization 
    ? orgStats.find(o => o.organization_name === currentOrganization)
    : null;
  const selectedOrgAvg = selectedOrgStats?.avg_per_shift || 0;

  // Функция расчёта дохода КМС
  const calculateKMS = (orgName: string, avgContacts: number): number => {
    if (avgContacts <= 0) return 0;
    
    const orgData = allOrganizations.find(o => o.name === orgName);
    if (!orgData) return 0;
    
    const contactsCount = Math.round(avgContacts);
    const rate = orgData.contact_rate;
    
    // Шаг 1: Рассчитываем выручку
    const revenue = contactsCount * rate;
    
    // Шаг 2: Рассчитываем налог (только для безнала)
    const tax = orgData.payment_type === 'cashless' 
      ? Math.round(revenue * 0.07) 
      : 0;
    
    // Шаг 3: Выручка после налога
    const afterTax = revenue - tax;
    
    // Шаг 4: Рассчитываем зарплату промоутера
    // С 01.10.2025 прогрессивная шкала: до 10 контактов - 200₽, от 10 - 300₽
    const shiftDate = new Date(dayDate);
    const workerSalary = shiftDate >= new Date('2025-10-01') && contactsCount >= 10
      ? contactsCount * 300
      : contactsCount * 200;
    
    // Шаг 5: Чистая прибыль (без учёта расходов, т.к. их заранее не знаем)
    const netProfit = afterTax - workerSalary;
    
    // Шаг 6: КМС = 50% от чистой прибыли (округлённо)
    return Math.round(netProfit / 2);
  };

  // Расчёт дохода для выбранной организации
  // Если не было смен (selectedOrgAvg = 0), используем общий средний показатель
  const contactsForCalc = selectedOrgAvg > 0 ? selectedOrgAvg : avgContacts;
  
  const expectedKMS = currentOrganization 
    ? calculateKMS(currentOrganization, contactsForCalc) 
    : 0;
  
  // Расчёт доходов для ТОП-3 рекомендованных организаций
  const recommendedKMSList = recommendedOrgs.map(orgName => {
    const orgStat = orgStats.find(o => o.organization_name === orgName);
    const orgAvg = orgStat?.avg_per_shift || avgContacts;
    return {
      orgName,
      orgAvg,
      kms: calculateKMS(orgName, orgAvg)
    };
  });
  
  // Для сравнения берём лучшую рекомендацию (первую)
  const bestRecommendedKMS = recommendedKMSList[0]?.kms || 0;
  
  // Разница: Ожидаемый доход - Лучший рекомендованный доход
  const kmsDifference = expectedKMS - bestRecommendedKMS;
  const kmsDifferencePercent = bestRecommendedKMS > 0 ? Math.round((kmsDifference / bestRecommendedKMS) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between group">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span 
              className="text-[10px] md:text-xs text-slate-200 cursor-pointer hover:text-cyan-400 transition-colors"
              onClick={() => setShowDetailsModal(true)}
              title="Показать детальную информацию"
            >
              • {worker.first_name} {worker.last_name}{isMaxim && ' 👑'}
            </span>
            {avgContacts !== undefined && avgContacts !== null && (
              <span className="text-[9px] md:text-[10px] bg-slate-700/50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <span className="text-slate-400">~{avgContacts.toFixed(1)}</span>
                {actualContacts !== null && (
                  <>
                    <span className="text-slate-300 font-bold">/</span>
                    <span className={actualContacts >= Math.round(avgContacts) ? 'text-green-400' : 'text-orange-400'}>
                      {actualContacts}
                    </span>
                  </>
                )}
              </span>
            )}
            {currentOrganization && (
              <button
                type="button"
                onClick={() => onCommentChange(workerName, dayDate, 'organization', '')}
                className="p-0.5 hover:bg-red-500/20 rounded transition-colors"
                title="Очистить организацию"
              >
                <Icon name="X" size={11} className="text-red-400" />
              </button>
            )}
          </div>
        </div>
        <button
          onClick={() => onRemoveSlot(worker.user_id, workerName, dayDate, slotTime, slotLabel)}
          disabled={deletingSlot?.userId === worker.user_id && deletingSlot?.date === dayDate && deletingSlot?.slot === slotTime}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 disabled:opacity-50"
          title="Удалить смену"
        >
          {deletingSlot?.userId === worker.user_id && deletingSlot?.date === dayDate && deletingSlot?.slot === slotTime ? (
            <Icon name="Loader2" size={14} className="animate-spin" />
          ) : (
            <Icon name="X" size={14} />
          )}
        </button>
      </div>
      
      <div className="space-y-1 ml-2">
        <div className="flex items-center gap-1">
          {currentOrganization ? (
            <div className="flex-1 text-[10px] md:text-xs h-6 md:h-7 px-2 bg-slate-800/50 border border-slate-600 text-slate-200 rounded-md flex items-center min-w-0">
              <span className="truncate">{currentOrganization}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowOrgSelectionModal(true)}
              className="flex-1 text-left text-[10px] md:text-xs h-6 md:h-7 px-2 bg-slate-800/50 border border-slate-600 text-slate-500 rounded-md hover:bg-slate-700/50 flex items-center justify-between group"
            >
              <span>Организация</span>
              <Icon name="Plus" size={14} className="text-cyan-400 group-hover:scale-110 transition-transform" />
            </button>
          )}
          <div className="w-4 flex-shrink-0 flex items-center justify-center">
            <Icon name="Building2" size={12} className="text-cyan-400" />
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Select
            value={currentLocationType}
            onValueChange={(value) => onCommentChange(workerName, dayDate, 'location_type', value)}
            disabled={!currentOrganization}
          >
            <SelectTrigger className={`text-[10px] md:text-xs h-6 md:h-7 px-2 border-slate-600 text-slate-200 ${
              !currentOrganization 
                ? 'bg-slate-800/30 cursor-not-allowed opacity-50' 
                : 'bg-slate-800/50'
            }`}>
              <SelectValue placeholder="Тип места" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600 text-slate-200">
              {LOCATION_TYPES.map((type) => (
                <SelectItem key={type} value={type} className="text-[10px] md:text-xs">
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="w-4 flex-shrink-0 flex items-center justify-center">
            <Icon name="MapPin" size={12} className="text-emerald-400" />
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Input
            type="text"
            placeholder="Адрес / Детали"
            value={currentLocationDetails}
            onChange={(e) => onCommentChange(workerName, dayDate, 'location_details', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              }
            }}
            disabled={!currentOrganization}
            className={`text-[10px] md:text-xs h-6 md:h-7 px-2 border-slate-600 text-slate-200 ${
              !currentOrganization 
                ? 'bg-slate-800/30 cursor-not-allowed opacity-50' 
                : 'bg-slate-800/50'
            }`}
          />
          <div className="w-4 flex-shrink-0 flex items-center justify-center">
            <Icon name="Navigation" size={12} className="text-blue-400" />
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Input
            type="text"
            placeholder="Листовки"
            value={currentFlyers}
            onChange={(e) => onCommentChange(workerName, dayDate, 'flyers', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              }
            }}
            disabled={!currentOrganization}
            className={`text-[10px] md:text-xs h-6 md:h-7 px-2 border-slate-600 text-slate-200 ${
              !currentOrganization 
                ? 'bg-slate-800/30 cursor-not-allowed opacity-50' 
                : 'bg-slate-800/50'
            }`}
          />
          <div className="w-4 flex-shrink-0 flex items-center justify-center">
            <Icon name="FileText" size={12} className="text-amber-400" />
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={handleSave}
            disabled={savingComment === commentKey}
            className="flex-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white rounded text-[10px] md:text-xs h-6 md:h-7 flex items-center justify-center gap-1"
            title="Сохранить"
          >
            {savingComment === commentKey ? (
              <Icon name="Loader2" size={12} className="animate-spin" />
            ) : (
              <>
                <Icon name="Check" size={12} />
                <span>Сохранить</span>
              </>
            )}
          </button>
          <div className="w-4 flex-shrink-0" />
        </div>
      </div>
      
      {showOrgStatsModal && (
        <OrgStatsModal
          workerName={workerName}
          workerEmail={worker.email}
          orgStats={orgStats}
          allOrganizations={allOrganizations}
          loadingProgress={loadingProgress}
          onClose={() => setShowOrgStatsModal(false)}
        />
      )}
      
      {showOrgSelectionModal && (
        <OrgSelectionModal
          workerName={workerName}
          workerEmail={worker.email}
          orgStats={orgStats}
          allOrganizations={allOrganizations}
          loadingProgress={loadingProgress}
          onSelect={handleOrgSelect}
          onClose={() => setShowOrgSelectionModal(false)}
        />
      )}
      
      {showDetailsModal && (
        <WorkerDetailsModal
          workerName={workerName}
          dayDate={dayDate}
          avgContacts={avgContacts}
          recommendedOrgs={recommendedKMSList}
          currentOrganization={currentOrganization}
          selectedOrgAvg={selectedOrgAvg}
          expectedKMS={expectedKMS}
          kmsDifference={kmsDifference}
          kmsDifferencePercent={kmsDifferencePercent}
          allOrganizations={allOrganizations}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  );
}