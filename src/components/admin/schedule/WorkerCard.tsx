import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { UserSchedule, OrganizationData } from './types';
import { isMaximKorelsky, calculateAvgBeforeDate } from './utils';
import OrgStatsModal from './OrgStatsModal';

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

  const isMaxim = isMaximKorelsky(worker.first_name, worker.last_name);
  const workerName = `${worker.first_name} ${worker.last_name}`;

  const userComments = workComments[dayDate]?.[workerName] as Record<string, { organization?: string }> | undefined;
  // Реальный ключ смены (может отличаться от slotLabel при нестандартном расписании)
  const realSlotKey = userComments?.[slotLabel] !== undefined
    ? slotLabel
    : (userComments ? Object.keys(userComments).find(k => typeof userComments[k] === 'object' && userComments[k] !== null) : undefined) || slotLabel;
  const commentData = (userComments?.[realSlotKey]) || {};
  const currentOrganization = commentData.organization || '';

  const avgContacts = calculateAvgBeforeDate(worker.daily_contacts, dayDate, currentOrganization || undefined);
  const actualContacts = worker.daily_contacts
    ?.filter(d => d.date === dayDate && (!currentOrganization || d.org_name === currentOrganization))
    ?.reduce((sum, d) => sum + d.count, 0) ?? null;

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
    <div className={`rounded-xl border overflow-hidden shadow-sm ${worker.is_active === false ? 'bg-gray-50 border-gray-200 opacity-75' : 'bg-white border-gray-100'}`}>
      <div className="flex items-center justify-between px-3 py-2 gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className={`text-[11px] font-medium truncate ${worker.is_active === false ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
            {worker.first_name} {worker.last_name}{isMaxim && ' 👑'}
          </span>
          {worker.is_active === false && (
            <span className="text-[9px] bg-red-100 text-red-400 px-1.5 py-0.5 rounded-full flex-shrink-0">удалён</span>
          )}

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
          {currentOrganization && (
            <span className="text-[9px] text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full truncate max-w-[100px]">
              {currentOrganization}
            </span>
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


    </div>
  );
}