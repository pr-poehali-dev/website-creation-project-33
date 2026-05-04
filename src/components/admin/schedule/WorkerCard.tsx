import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { UserSchedule, OrganizationData } from './types';
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
  orgStats: Array<{ organization_name: string; avg_per_shift: number }>;
  loadingProgress?: number;
  onCommentChange: (userName: string, date: string, field: string, value: string, shiftTime?: string) => void;
  onSaveComment: (userName: string, date: string, field: string, value: string, shiftTime?: string) => void;
  onDeleteShift?: (userId: number, userName: string, date: string, slotTime: string, slotLabel: string) => void;
}

export default function WorkerCard({
  worker, dayDate, slotTime, slotLabel,
  workComments, allLocations, allOrganizations,
  recommendedOrgs, orgStats, loadingProgress,
  onCommentChange, onSaveComment, onDeleteShift,
}: WorkerCardProps) {
  const [showOrgStatsModal, setShowOrgStatsModal] = useState(false);
  const [showOrgSelectionModal, setShowOrgSelectionModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const isMaxim = isMaximKorelsky(worker.first_name, worker.last_name);
  const workerName = `${worker.first_name} ${worker.last_name}`;

  const avgContacts = calculateAvgBeforeDate(worker.daily_contacts, dayDate);
  const actualContacts = worker.daily_contacts?.find(d => d.date === dayDate)?.count ?? null;

  const userComments = workComments[dayDate]?.[workerName] as Record<string, { organization?: string }> | undefined;
  // Реальный ключ смены (может отличаться от slotLabel при нестандартном расписании)
  const realSlotKey = userComments?.[slotLabel] !== undefined
    ? slotLabel
    : (userComments ? Object.keys(userComments).find(k => typeof userComments[k] === 'object' && userComments[k] !== null) : undefined) || slotLabel;
  const commentData = (userComments?.[realSlotKey]) || {};
  const currentOrganization = commentData.organization || '';

  const handleOrgSelect = (org: string) => {
    onCommentChange(workerName, dayDate, 'organization', org, realSlotKey);
    onSaveComment(workerName, dayDate, 'organization', org, realSlotKey);
    setShowOrgSelectionModal(false);
  };

  const handleDeleteShift = () => {
    onDeleteShift?.(worker.user_id, workerName, dayDate, slotTime, slotLabel);
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
    return Math.round((afterTax - workerSalary) / 2);
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
  const aboveAvg = actualContacts !== null && avgContacts !== null && actualContacts >= Math.round(avgContacts);

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-3 py-2 gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <button
            onClick={() => setShowDetailsModal(true)}
            className="text-[11px] text-gray-700 hover:text-blue-500 transition-colors font-medium truncate"
            title="Детальная информация"
          >
            {worker.first_name} {worker.last_name}{isMaxim && ' 👑'}
          </button>

          {avgContacts !== undefined && avgContacts !== null && (
            <span className="flex items-center gap-0.5 text-[9px] bg-gray-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
              <span className="text-gray-400">~{avgContacts.toFixed(1)}</span>
              {actualContacts !== null && (
                <>
                  <span className="text-gray-300 font-bold">/</span>
                  <span className={aboveAvg ? 'text-emerald-500 font-bold' : 'text-orange-500 font-bold'}>
                    {actualContacts}
                  </span>
                </>
              )}
            </span>
          )}
        </div>

        {/* Организация + удаление */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {currentOrganization ? (
            <button
              onClick={() => setShowOrgSelectionModal(true)}
              className="text-[9px] text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full truncate max-w-[100px] hover:bg-blue-100 transition-colors"
            >
              {currentOrganization}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowOrgSelectionModal(true)}
              className="text-[9px] text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 px-1.5 py-0.5 rounded-full transition-all"
            >
              + Орг.
            </button>
          )}
          {onDeleteShift && (
            <button
              onClick={handleDeleteShift}
              className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors flex-shrink-0"
              title="Удалить смену"
            >
              <Icon name="X" size={11} className="text-red-400 hover:text-red-600" />
            </button>
          )}
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