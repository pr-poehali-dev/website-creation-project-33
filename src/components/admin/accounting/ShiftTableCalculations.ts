import { ShiftRecord } from './types';
import { calculateWorkerSalary } from './calculations';

export interface TableStatistics {
  totalContacts: number;
  unpaidSalary: number;
  salaryAtKVV: number;
  totalRevenue: number;
  totalTax: number;
  totalAfterTax: number;
  totalSalary: number;
  totalNetProfit: number;
  totalKVV: number;
  totalKMS: number;
  unpaidKVV: number;
  unpaidKVVCash: number;
  unpaidKVVCashless: number;
  unpaidKMS: number;
  unpaidKMSCash: number;
  unpaidKMSCashless: number;
  expectedRevenue: number;
}

export function calculateTableStatistics(shifts: ShiftRecord[]): TableStatistics {
  const totalContacts = shifts.reduce((sum, shift) => sum + (shift.contacts_count || 0), 0);
  
  const unpaidSalary = shifts
    .filter(shift => !shift.paid_to_worker && shift.user_name !== 'Корректировка')
    .reduce((sum, shift) => {
      const salary = calculateWorkerSalary(shift.contacts_count, shift.date);
      return sum + salary;
    }, 0);

  const salaryAtKVV = shifts
    .filter(shift => shift.salary_at_kvv && !shift.paid_to_worker && shift.user_name !== 'Корректировка')
    .reduce((sum, shift) => {
      const salary = calculateWorkerSalary(shift.contacts_count, shift.date);
      return sum + salary;
    }, 0);

  const totalRevenue = shifts.reduce((sum, shift) => sum + (shift.contacts_count * shift.contact_rate), 0);
  const totalTax = shifts.reduce((sum, shift) => {
    if (shift.payment_type === 'cashless') {
      return sum + Math.round((shift.contacts_count * shift.contact_rate) * 0.07);
    }
    return sum;
  }, 0);
  const totalAfterTax = totalRevenue - totalTax;
  const totalSalary = shifts
    .filter(shift => shift.user_name !== 'Корректировка')
    .reduce((sum, shift) => sum + calculateWorkerSalary(shift.contacts_count, shift.date), 0);
  const totalNetProfit = shifts
    .filter(shift => shift.user_name !== 'Корректировка')
    .reduce((sum, shift) => {
      const revenue = shift.contacts_count * shift.contact_rate;
      const tax = shift.payment_type === 'cashless' ? Math.round(revenue * 0.07) : 0;
      const afterTax = revenue - tax;
      const salary = calculateWorkerSalary(shift.contacts_count, shift.date);
      const expense = shift.expense_amount || 0;
      return sum + (afterTax - salary - expense);
    }, 0);
  const totalKVV = Math.round(totalNetProfit / 2);
  const totalKMS = Math.round(totalNetProfit / 2);

  const unpaidKVV = shifts
    .filter(shift => !shift.paid_kvv)
    .reduce((sum, shift) => {
      const revenue = shift.contacts_count * shift.contact_rate;
      const tax = shift.payment_type === 'cashless' ? Math.round(revenue * 0.07) : 0;
      const afterTax = revenue - tax;
      const salary = calculateWorkerSalary(shift.contacts_count);
      const expense = shift.expense_amount || 0;
      const netProfit = afterTax - salary - expense;
      const kvv = Math.round(netProfit / 2);
      return sum + kvv;
    }, 0);

  const unpaidKVVCash = shifts
    .filter(shift => !shift.paid_kvv && shift.payment_type === 'cash')
    .reduce((sum, shift) => {
      const revenue = shift.contacts_count * shift.contact_rate;
      const tax = shift.payment_type === 'cashless' ? Math.round(revenue * 0.07) : 0;
      const afterTax = revenue - tax;
      const salary = calculateWorkerSalary(shift.contacts_count);
      const expense = shift.expense_amount || 0;
      const netProfit = afterTax - salary - expense;
      const kvv = Math.round(netProfit / 2);
      return sum + kvv;
    }, 0);

  const unpaidKVVCashless = shifts
    .filter(shift => !shift.paid_kvv && shift.payment_type === 'cashless')
    .reduce((sum, shift) => {
      const revenue = shift.contacts_count * shift.contact_rate;
      const tax = shift.payment_type === 'cashless' ? Math.round(revenue * 0.07) : 0;
      const afterTax = revenue - tax;
      const salary = calculateWorkerSalary(shift.contacts_count);
      const expense = shift.expense_amount || 0;
      const netProfit = afterTax - salary - expense;
      const kvv = Math.round(netProfit / 2);
      return sum + kvv;
    }, 0);

  const unpaidKMS = shifts
    .filter(shift => !shift.paid_kms)
    .reduce((sum, shift) => {
      const revenue = shift.contacts_count * shift.contact_rate;
      const tax = shift.payment_type === 'cashless' ? Math.round(revenue * 0.07) : 0;
      const afterTax = revenue - tax;
      const salary = calculateWorkerSalary(shift.contacts_count);
      const expense = shift.expense_amount || 0;
      const netProfit = afterTax - salary - expense;
      const kms = Math.round(netProfit / 2);
      return sum + kms;
    }, 0);

  const unpaidKMSCash = shifts
    .filter(shift => !shift.paid_kms && shift.payment_type === 'cash')
    .reduce((sum, shift) => {
      const revenue = shift.contacts_count * shift.contact_rate;
      const tax = shift.payment_type === 'cashless' ? Math.round(revenue * 0.07) : 0;
      const afterTax = revenue - tax;
      const salary = calculateWorkerSalary(shift.contacts_count);
      const expense = shift.expense_amount || 0;
      const netProfit = afterTax - salary - expense;
      const kms = Math.round(netProfit / 2);
      return sum + kms;
    }, 0);

  const unpaidKMSCashless = shifts
    .filter(shift => !shift.paid_kms && shift.payment_type === 'cashless')
    .reduce((sum, shift) => {
      const revenue = shift.contacts_count * shift.contact_rate;
      const tax = shift.payment_type === 'cashless' ? Math.round(revenue * 0.07) : 0;
      const afterTax = revenue - tax;
      const salary = calculateWorkerSalary(shift.contacts_count);
      const expense = shift.expense_amount || 0;
      const netProfit = afterTax - salary - expense;
      const kms = Math.round(netProfit / 2);
      return sum + kms;
    }, 0);

  const expectedRevenue = shifts
    .filter(shift => !shift.paid_by_organization)
    .reduce((sum, shift) => {
      const revenue = shift.contacts_count * shift.contact_rate;
      return sum + revenue;
    }, 0);

  return {
    totalContacts,
    unpaidSalary,
    salaryAtKVV,
    totalRevenue,
    totalTax,
    totalAfterTax,
    totalSalary,
    totalNetProfit,
    totalKVV,
    totalKMS,
    unpaidKVV,
    unpaidKVVCash,
    unpaidKVVCashless,
    unpaidKMS,
    unpaidKMSCash,
    unpaidKMSCashless,
    expectedRevenue
  };
}