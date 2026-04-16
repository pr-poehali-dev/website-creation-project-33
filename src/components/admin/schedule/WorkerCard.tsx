import { useState } from 'react';
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

  const avgContacts = calculateAvgBeforeDate(worker.daily_contacts, dayDate);
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

  const selectedOrgStats = currentOrganization
    ? orgStats.find(o => o.organization_name === currentOrganization)
    : null;
  const selectedOrgAvg = selectedOrgStats?.avg_per_shift || 0;

  const calculateKMS = (orgName: string, avgContacts: number): number => {
    if (avgContacts <= 0) return 0;
    const orgData = allOrganizations.find(o => o.name === orgName);
    if (!orgData) return 0;
    const contactsCount = Math.round(avgContacts);
    const rate = orgData.contact_rate;
    const revenue = contactsCount * rate;
    const tax = orgData.payment_type === 'cashless' ? Math.round(revenue * 0.07) : 0;
    const afterTax = revenue - tax;
    const shiftDate = new Date(dayDate);
    const workerSalary = shiftDate >= new Date('2025-10-01') && contactsCount >= 10
      ? contactsCount * 300
      : contactsCount * 200;
    const netProfit = afterTax - workerSalary;
    return Math.round(netProfit / 2);
  };

  const contactsForCalc = selectedOrgAvg > 0 ? selectedOrgAvg : avgContacts;
  const expectedKMS = currentOrganization ? calculateKMS(currentOrganization, contactsForCalc) : 0;

  const recommendedKMSList = recommendedOrgs.map(orgName => {
    const orgStat = orgStats.find(o => o.organization_name === orgName);
    const orgAvg = orgStat?.avg_per_shift || avgContacts;
    return { orgName, orgAvg, kms: calculateKMS(orgName, orgAvg) };
  });

  const bestRecommendedKMS = recommendedKMSList[0]?.kms || 0;
  const kmsDifference = expectedKMS - bestRecommendedKMS;
  const kmsDifferencePercent = bestRecommendedKMS > 0 ? Math.round((kmsDifference / bestRecommendedKMS) * 100) : 0;

  const isDeleting = deletingSlot?.userId === worker.user_id && deletingSlot?.date === dayDate && deletingSlot?.slot === slotTime;
  const isSaving = savingComment === commentKey;

  const aboveAvg = actualContacts !== null && avgContacts !== null && actualContacts >= Math.round(avgContacts);

  return (
    <div className="bg-slate-900/60 rounded-xl ring-1 ring-slate-700/30 overflow-hidden">
      {/* Worker header row */}
      <div className="flex items-center justify-between px-2.5 py-1.5 group">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            onClick={() => setShowDetailsModal(true)}
            className="text-[10px] md:text-xs text-slate-300 hover:text-cyan-400 transition-colors font-medium truncate"
            title="Детальная информация"
          >
            {worker.first_name} {worker.last_name}{isMaxim && ' 👑'}
          </button>

          {avgContacts !== undefined && avgContacts !== null && (
            <span className="flex items-center gap-0.5 text-[9px] bg-slate-800/70 px-1.5 py-0.5 rounded-full ring-1 ring-slate-700/40 flex-shrink-0">
              <span className="text-slate-500">~{avgContacts.toFixed(1)}</span>
              {actualContacts !== null && (
                <>
                  <span className="text-slate-400 font-bold">/</span>
                  <span className={aboveAvg ? 'text-emerald-400 font-bold' : 'text-orange-400 font-bold'}>
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
              className="w-4 h-4 flex items-center justify-center rounded-md hover:bg-red-500/15 transition-colors flex-shrink-0"
              title="Очистить организацию"
            >
              <Icon name="X" size={10} className="text-red-400/70" />
            </button>
          )}
        </div>

        <button
          onClick={() => onRemoveSlot(worker.user_id, workerName, dayDate, slotTime, slotLabel)}
          disabled={isDeleting}
          className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded-md text-slate-600 hover:text-red-400 hover:bg-red-400/10 flex-shrink-0 ml-1"
          title="Удалить смену"
        >
          {isDeleting
            ? <Icon name="Loader2" size={12} className="animate-spin text-red-400" />
            : <Icon name="X" size={12} />
          }
        </button>
      </div>

      {/* Fields */}
      <div className="px-2.5 pb-2.5 space-y-1">
        {/* Организация */}
        <div className="flex items-center gap-1">
          {currentOrganization ? (
            <div className="flex-1 h-7 px-2 bg-slate-800/50 ring-1 ring-slate-700/50 text-slate-200 rounded-lg flex items-center min-w-0 text-[10px] md:text-xs">
              <span className="truncate">{currentOrganization}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowOrgSelectionModal(true)}
              className="flex-1 text-left h-7 px-2 bg-slate-800/30 ring-1 ring-slate-700/30 text-slate-600 rounded-lg hover:bg-slate-800/60 hover:ring-slate-600/50 hover:text-slate-400 transition-all flex items-center justify-between group text-[10px] md:text-xs"
            >
              <span>Организация</span>
              <Icon name="Plus" size={12} className="text-cyan-500/60 group-hover:text-cyan-400 transition-colors" />
            </button>
          )}
          <div className="w-5 flex-shrink-0 flex items-center justify-center">
            <Icon name="Building2" size={11} className="text-cyan-500/70" />
          </div>
        </div>

        {/* Тип места */}
        <div className="flex items-center gap-1">
          <Select
            value={currentLocationType}
            onValueChange={(value) => onCommentChange(workerName, dayDate, 'location_type', value)}
            disabled={!currentOrganization}
          >
            <SelectTrigger className={`h-7 text-[10px] md:text-xs px-2 ring-1 border-0 rounded-lg transition-all ${
              !currentOrganization
                ? 'bg-slate-800/20 ring-slate-700/20 text-slate-700 cursor-not-allowed opacity-50'
                : 'bg-slate-800/50 ring-slate-700/50 text-slate-200'
            }`}>
              <SelectValue placeholder="Тип места" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
              {LOCATION_TYPES.map((type) => (
                <SelectItem key={type} value={type} className="text-[10px] md:text-xs">
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="w-5 flex-shrink-0 flex items-center justify-center">
            <Icon name="MapPin" size={11} className="text-emerald-500/70" />
          </div>
        </div>

        {/* Адрес / Детали */}
        <div className="flex items-center gap-1">
          <Input
            type="text"
            placeholder="Адрес / Детали"
            value={currentLocationDetails}
            onChange={(e) => onCommentChange(workerName, dayDate, 'location_details', e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSave(); } }}
            disabled={!currentOrganization}
            className={`h-7 text-[10px] md:text-xs px-2 border-0 ring-1 rounded-lg transition-all ${
              !currentOrganization
                ? 'bg-slate-800/20 ring-slate-700/20 text-slate-700 cursor-not-allowed opacity-50'
                : 'bg-slate-800/50 ring-slate-700/50 text-slate-200'
            }`}
          />
          <div className="w-5 flex-shrink-0 flex items-center justify-center">
            <Icon name="Navigation" size={11} className="text-blue-500/70" />
          </div>
        </div>

        {/* Листовки */}
        <div className="flex items-center gap-1">
          <Input
            type="text"
            placeholder="Листовки"
            value={currentFlyers}
            onChange={(e) => onCommentChange(workerName, dayDate, 'flyers', e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSave(); } }}
            disabled={!currentOrganization}
            className={`h-7 text-[10px] md:text-xs px-2 border-0 ring-1 rounded-lg transition-all ${
              !currentOrganization
                ? 'bg-slate-800/20 ring-slate-700/20 text-slate-700 cursor-not-allowed opacity-50'
                : 'bg-slate-800/50 ring-slate-700/50 text-slate-200'
            }`}
          />
          <div className="w-5 flex-shrink-0 flex items-center justify-center">
            <Icon name="FileText" size={11} className="text-amber-500/70" />
          </div>
        </div>

        {/* Кнопка Сохранить */}
        <div className="flex items-center gap-1 pt-0.5">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 h-7 rounded-lg text-[10px] md:text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-md shadow-emerald-900/30"
          >
            {isSaving
              ? <Icon name="Loader2" size={11} className="animate-spin" />
              : <><Icon name="Check" size={11} /><span>Сохранить</span></>
            }
          </button>
          <div className="w-5 flex-shrink-0" />
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