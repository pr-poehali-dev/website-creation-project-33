import { ShiftRecord } from './types';

export const calculateRevenue = (shift: ShiftRecord) => {
  return shift.contacts_count * shift.contact_rate;
};

export const calculateTax = (shift: ShiftRecord) => {
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

export const calculateWorkerSalary = (contactsCount: number, shiftDate?: string, organizationName?: string) => {
  // Для организации "Администратор" зарплата всегда 0₽
  if (organizationName === 'Администратор') {
    return 0;
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
  const workerSalary = calculateWorkerSalary(shift.contacts_count, shift.date, shift.organization_name);
  const expense = shift.expense_amount || 0;
  return afterTax - workerSalary - expense;
};

export const calculateKVV = (shift: ShiftRecord) => {
  return Math.round(calculateNetProfit(shift) / 2);
};

export const calculateKMS = (shift: ShiftRecord) => {
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