import { ShiftRecord } from './types';

export const calculateRevenue = (shift: ShiftRecord) => {
  // Для организации "Администратор" фиксированная сумма прихода 2968₽
  const orgName = shift.organization_name || shift.organization;
  let baseRevenue = 0;
  if (orgName === 'Администратор') {
    baseRevenue = 2968;
  } else {
    baseRevenue = shift.contacts_count * shift.contact_rate;
  }
  
  // Добавляем компенсацию (может быть положительной или отрицательной)
  const compensation = shift.compensation_amount || 0;
  return baseRevenue + compensation;
};

export const calculateTax = (shift: ShiftRecord) => {
  // Для организации "Администратор" фиксированный налог 172₽
  const orgName = shift.organization_name || shift.organization;
  if (orgName === 'Администратор') {
    return 172;
  }
  
  if (shift.payment_type === 'cashless') {
    const revenue = calculateRevenue(shift);
    return Math.round(revenue * 0.07);
  }
  return 0;
};

export const calculateAfterTax = (shift: ShiftRecord) => {
  const revenue = calculateRevenue(shift);
  const tax = calculateTax(shift);
  return revenue - tax;
};

export const calculateWorkerSalary = (contactsCount: number, shiftDate?: string, organizationName?: string, userId?: number) => {
  // Для Корельского Максима (ID 3) и Кобыляцкого Виктора (ID 9) зарплата всегда 0
  if (userId === 3 || userId === 9) {
    return 0;
  }
  
  // Для организации "Администратор" фиксированная зарплата 600₽ за смену
  if (organizationName === 'Администратор') {
    return 600;
  }
  
  // До 01.10.2025 все контакты по 200₽
  if (shiftDate && new Date(shiftDate) < new Date('2025-10-01')) {
    return contactsCount * 200;
  }
  
  // С 01.10.2025 прогрессивная шкала: до 10 контактов - 200₽, от 10 - 300₽
  if (contactsCount >= 10) {
    return contactsCount * 300;
  }
  return contactsCount * 200;
};

export const calculateNetProfit = (shift: ShiftRecord) => {
  const afterTax = calculateAfterTax(shift);
  const orgName = shift.organization_name || shift.organization;
  const workerSalary = calculateWorkerSalary(shift.contacts_count, shift.date, orgName, shift.user_id);
  const expense = shift.expense_amount || 0;
  return afterTax - workerSalary - expense;
};

export const calculateKVV = (shift: ShiftRecord) => {
  // Для Корельского Максима (ID 3) КВВ всегда 0
  if (shift.user_id === 3) {
    return 0;
  }
  // Для Кобыляцкого Виктора (ID 9) КВВ = вся сумма после налога
  if (shift.user_id === 9) {
    return calculateAfterTax(shift);
  }
  // Личные средства НЕ добавляются к KVV, только к долгам
  return Math.round(calculateNetProfit(shift) / 2);
};

export const calculateKMS = (shift: ShiftRecord) => {
  // Для Корельского Максима (ID 3) КМС = вся сумма после налога
  if (shift.user_id === 3) {
    return calculateAfterTax(shift);
  }
  // Для Кобыляцкого Виктора (ID 9) КМС всегда 0
  if (shift.user_id === 9) {
    return 0;
  }
  // Личные средства НЕ добавляются к KMS, только к долгам
  return Math.round(calculateNetProfit(shift) / 2);
};

export const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('ru-RU');
};

export const formatTime = (timeStr: string | null) => {
  if (!timeStr) return '—';
  return timeStr.substring(0, 5);
};

export const getShiftKey = (shift: ShiftRecord) => {
  return `${shift.user_id}-${shift.date}-${shift.organization_id}`;
};