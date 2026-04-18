import { DaySchedule, UserSchedule, OrganizationData } from './types';

interface DaySummaryProps {
  day: DaySchedule;
  getUsersWorkingOnSlot: (date: string, slotTime: string) => UserSchedule[];
  workComments: Record<string, Record<string, unknown>>;
  allOrganizations: OrganizationData[];
  userOrgStats: Record<string, Array<{organization_name: string, avg_per_shift: number}>>;
  recommendedLocations: Record<string, Record<string, string>>;
  actualStats: Record<string, {contacts: number, revenue: number}>;
}

type ShiftData = { organization?: string; location_type?: string; location_details?: string; flyers?: string; location?: string };

// Получить первую заполненную организацию промоутера за день (из любой смены)
function getFirstOrganization(userEntry: unknown): string {
  if (!userEntry || typeof userEntry !== 'object') return '';
  const obj = userEntry as Record<string, unknown>;
  // Если есть ключи смен (напр. "12:00-16:00") — ищем в них
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val && typeof val === 'object' && 'organization' in val) {
      return (val as ShiftData).organization || '';
    }
  }
  // legacy: организация прямо в объекте
  if ('organization' in obj) return (obj as ShiftData).organization || '';
  return '';
}

// Функция расчёта дохода КМС (копия из WorkerCard)
const calculateKMS = (
  orgName: string, 
  avgContacts: number, 
  dayDate: string,
  allOrganizations: OrganizationData[]
): number => {
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

export default function DaySummary({
  day,
  getUsersWorkingOnSlot,
  workComments,
  allOrganizations,
  userOrgStats,
  recommendedLocations,
  actualStats
}: DaySummaryProps) {
  
  // Собираем всех промоутеров за день (уникальные)
  const allWorkers = new Map<number, UserSchedule>();
  day.slots.forEach(slot => {
    const workers = getUsersWorkingOnSlot(day.date, slot.time);
    workers.forEach(worker => {
      allWorkers.set(worker.user_id, worker);
    });
  });

  let totalRecommendedContacts = 0;
  let totalSelectedContacts = 0;
  let totalRecommendedIncome = 0;
  let totalSelectedIncome = 0;

  allWorkers.forEach(worker => {
    const workerName = `${worker.first_name} ${worker.last_name}`;
    const recommendedOrg = recommendedLocations[workerName]?.[day.date] || '';
    const selectedOrg = getFirstOrganization(workComments[day.date]?.[workerName]);
    const orgStats = userOrgStats[workerName] || [];
    
    // Общий средний показатель промоутера
    const avgContacts = orgStats.length > 0
      ? orgStats.reduce((sum, org) => sum + org.avg_per_shift, 0) / orgStats.length
      : 0;

    // 1. Рекомендованная организация
    if (recommendedOrg) {
      const recommendedOrgStats = orgStats.find(o => o.organization_name === recommendedOrg);
      const recommendedAvg = recommendedOrgStats?.avg_per_shift || 0;
      totalRecommendedContacts += recommendedAvg;
      totalRecommendedIncome += calculateKMS(recommendedOrg, recommendedAvg, day.date, allOrganizations);
    }

    // 2. Выбранная организация
    if (selectedOrg) {
      const selectedOrgStats = orgStats.find(o => o.organization_name === selectedOrg);
      const selectedAvg = selectedOrgStats?.avg_per_shift || 0;
      // Если не было смен - берём общий средний
      const contactsForCalc = selectedAvg > 0 ? selectedAvg : avgContacts;
      totalSelectedContacts += contactsForCalc;
      totalSelectedIncome += calculateKMS(selectedOrg, contactsForCalc, day.date, allOrganizations);
    }
  });

  // Фактические данные за день
  const actualDayStats = actualStats[day.date] || { contacts: 0, revenue: 0 };

  // Разница: фактические - рекомендованные
  const contactsDiff = actualDayStats.contacts - totalRecommendedContacts;
  const contactsDiffPercent = totalRecommendedContacts > 0 
    ? Math.round((contactsDiff / totalRecommendedContacts) * 100) 
    : 0;

  const incomeDiff = actualDayStats.revenue - totalRecommendedIncome;
  const incomeDiffPercent = totalRecommendedIncome > 0 
    ? Math.round((incomeDiff / totalRecommendedIncome) * 100) 
    : 0;

  // Если нет данных - не показываем
  if (allWorkers.size === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-slate-600/50">
      <div className="bg-slate-800/30 rounded-lg p-3 space-y-2">
        <h4 className="text-xs font-semibold text-slate-300 mb-2">📊 Итоги дня:</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px]">
          {/* Контакты */}
          <div className="space-y-1">
            <div className="flex justify-between text-cyan-400">
              <span>Контакты (рекомендовано):</span>
              <span className="font-semibold">~{totalRecommendedContacts.toFixed(1)}</span>
            </div>
            <div className="flex justify-between text-amber-400">
              <span>Контакты (выбрано):</span>
              <span className="font-semibold">~{totalSelectedContacts.toFixed(1)}</span>
            </div>
            <div className="flex justify-between text-green-400">
              <span>Контакты (фактически):</span>
              <span className="font-semibold">{actualDayStats.contacts}</span>
            </div>
            {totalRecommendedContacts > 0 && actualDayStats.contacts > 0 && (
              <div className={`flex justify-between ${contactsDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                <span>Разница по контактам:</span>
                <span className="font-semibold">
                  {contactsDiff > 0 ? '+' : ''}{contactsDiff.toFixed(1)} ({contactsDiffPercent > 0 ? '+' : ''}{contactsDiffPercent}%)
                </span>
              </div>
            )}
          </div>

          {/* Доход */}
          <div className="space-y-1">
            <div className="flex justify-between text-cyan-400">
              <span>Доход КМС/КВВ (рекомендовано):</span>
              <span className="font-semibold">~{totalRecommendedIncome} ₽</span>
            </div>
            <div className="flex justify-between text-amber-400">
              <span>Доход КМС/КВВ (выбрано):</span>
              <span className="font-semibold">~{totalSelectedIncome} ₽</span>
            </div>
            <div className="flex justify-between text-green-400">
              <span>Доход КМС/КВВ (фактически):</span>
              <span className="font-semibold">{actualDayStats.revenue} ₽</span>
            </div>
            {totalRecommendedIncome > 0 && actualDayStats.revenue > 0 && (
              <div className={`flex justify-between ${incomeDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                <span>Разница по доходу:</span>
                <span className="font-semibold">
                  {incomeDiff > 0 ? '+' : ''}{incomeDiff} ₽ ({incomeDiffPercent > 0 ? '+' : ''}{incomeDiffPercent}%)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}