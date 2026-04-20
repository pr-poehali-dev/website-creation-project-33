import { useState } from 'react';
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
  workComments: Record<string, Record<string, unknown>>;
  allLocations: string[];
  allOrganizations: OrganizationData[];
  recommendedOrgs: string[];
  orgStats: Array<{organization_name: string, avg_per_shift: number}>;
  loadingProgress?: number;
  onCommentChange: (userName: string, date: string, field: string, value: string, shiftTime?: string) => void;
  onSaveComment: (userName: string, date: string, field: string, value: string, shiftTime?: string) => void;
  onRemoveSlot: (userId: number, userName: string, date: string, slotTime: string, slotLabel: string) => void;
  deletingSlot: DeleteSlotState | null;
}

export default function WorkerCard({
  worker,
  dayDate,
  slotTime,
  slotLabel,
  workComments,
  allLocations,
  allOrganizations,
  recommendedOrgs,
  orgStats,
  loadingProgress,
  onCommentChange,
  onSaveComment,
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

  const userComments = workComments[dayDate]?.[workerName] as Record<string, {organization?: string}> | undefined;
  const commentData = (userComments?.[slotLabel]) || {};
  const currentOrganization = commentData.organization || '';

  const handleOrgSelect = (org: string) => {
    onCommentChange(workerName, dayDate, 'organization', org, slotLabel);
    onSaveComment(workerName, dayDate, 'organization', org, slotLabel);
    setShowOrgSelectionModal(false);
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

  const aboveAvg = actualContacts !== null && avgContacts !== null && actualContacts >= Math.round(avgContacts);

  return (
    <div className="bg-slate-900/60 rounded-xl ring-1 ring-slate-700/30 overflow-hidden">
      {/* Worker row */}
      <div className="flex items-center justify-between px-2.5 py-1.5 group gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
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
        </div>

        {/* Организация справа */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {currentOrganization ? (
            <span className="text-[9px] md:text-[10px] text-cyan-300 bg-cyan-500/10 ring-1 ring-cyan-500/20 px-1.5 py-0.5 rounded-full truncate max-w-[100px]">
              {currentOrganization}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setShowOrgSelectionModal(true)}
              className="text-[9px] text-slate-600 hover:text-slate-400 bg-slate-800/30 ring-1 ring-slate-700/30 hover:ring-slate-600/50 px-1.5 py-0.5 rounded-full transition-all"
            >
              + Орг.
            </button>
          )}
          {currentOrganization && (
            <button
              type="button"
              onClick={() => { onCommentChange(workerName, dayDate, 'organization', '', slotLabel); onSaveComment(workerName, dayDate, 'organization', '', slotLabel); }}
              className="w-4 h-4 flex items-center justify-center rounded-md hover:bg-red-500/15 transition-colors flex-shrink-0"
              title="Очистить организацию"
            >
              <Icon name="X" size={9} className="text-red-400/60" />
            </button>
          )}
        </div>

        <button
          onClick={() => onRemoveSlot(worker.user_id, workerName, dayDate, slotTime, slotLabel)}
          disabled={isDeleting}
          className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded-md text-slate-600 hover:text-red-400 hover:bg-red-400/10 flex-shrink-0"
          title="Удалить смену"
        >
          {isDeleting
            ? <Icon name="Loader2" size={12} className="animate-spin text-red-400" />
            : <Icon name="X" size={12} />
          }
        </button>
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