import { ShiftRecord } from './types';
import { calculateWorkerSalary, calculateRevenue, calculateTax } from './calculations';

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
  console.log('🔵 Всего смен для расчета:', shifts.length);
  const totalContacts = shifts.reduce((sum, shift) => sum + (shift.contacts_count || 0), 0);
  
  const unpaidSalary = shifts
    .filter(shift => !shift.paid_to_worker && shift.user_name !== 'Корректировка')
    .reduce((sum, shift) => {
      const orgName = shift.organization_name || shift.organization;
      const salary = calculateWorkerSalary(shift.contacts_count, shift.date, orgName);
      return sum + salary;
    }, 0);

  const salaryAtKVVShifts = shifts.filter(shift => shift.salary_at_kvv && shift.user_name !== 'Корректировка');
  
  const salaryDetails = salaryAtKVVShifts.map(s => {
    const orgName = s.organization_name || s.organization;
    const salary = calculateWorkerSalary(s.contacts_count, s.date, orgName);
    return {
      date: s.date,
      user: s.user_name,
      org: s.organization,
      contacts: s.contacts_count,
      salary: salary,
      paid: s.paid_to_worker
    };
  });
  
  console.log('🟡 ДЕТАЛИ: Смены с галочкой "У КВВ":', salaryDetails);
  console.table(salaryDetails);
  console.log('🟡 КОЛИЧЕСТВО смен с галочкой "У КВВ":', salaryDetails.length);
  
  const salaryAtKVV = salaryAtKVVShifts.reduce((sum, shift) => {
    const orgName = shift.organization_name || shift.organization;
    const salary = calculateWorkerSalary(shift.contacts_count, shift.date, orgName);
    return sum + salary;
  }, 0);
  
  console.log('🟡 ИТОГО зарплата у КВВ:', salaryAtKVV, '₽');

  const totalRevenue = shifts.reduce((sum, shift) => sum + calculateRevenue(shift), 0);
  const totalTax = shifts.reduce((sum, shift) => sum + calculateTax(shift), 0);
  const totalAfterTax = totalRevenue - totalTax;
  const totalSalary = shifts
    .filter(shift => shift.user_name !== 'Корректировка')
    .reduce((sum, shift) => {
      const orgName = shift.organization_name || shift.organization;
      return sum + calculateWorkerSalary(shift.contacts_count, shift.date, orgName);
    }, 0);
  const totalNetProfit = shifts
    .filter(shift => shift.user_name !== 'Корректировка')
    .reduce((sum, shift) => {
      const revenue = calculateRevenue(shift);
      const tax = calculateTax(shift);
      const afterTax = revenue - tax;
      const orgName = shift.organization_name || shift.organization;
      const salary = calculateWorkerSalary(shift.contacts_count, shift.date, orgName);
      const expense = shift.expense_amount || 0;
      return sum + (afterTax - salary - expense);
    }, 0);
  const totalKVV = Math.round(totalNetProfit / 2);
  const totalKMS = Math.round(totalNetProfit / 2);

  const unpaidKVV = shifts
    .filter(shift => !shift.paid_kvv)
    .reduce((sum, shift) => {
      const revenue = calculateRevenue(shift);
      const tax = calculateTax(shift);
      const afterTax = revenue - tax;
      const orgName = shift.organization_name || shift.organization;
      const salary = calculateWorkerSalary(shift.contacts_count, shift.date, orgName);
      const expense = shift.expense_amount || 0;
      const netProfit = afterTax - salary - expense;
      const kvv = Math.round(netProfit / 2);
      return sum + kvv;
    }, 0);

  const unpaidKVVCash = shifts
    .filter(shift => !shift.paid_kvv && shift.payment_type === 'cash')
    .reduce((sum, shift) => {
      const revenue = calculateRevenue(shift);
      const tax = calculateTax(shift);
      const afterTax = revenue - tax;
      const orgName = shift.organization_name || shift.organization;
      const salary = calculateWorkerSalary(shift.contacts_count, shift.date, orgName);
      const expense = shift.expense_amount || 0;
      const netProfit = afterTax - salary - expense;
      const kvv = Math.round(netProfit / 2);
      return sum + kvv;
    }, 0);

  const unpaidKVVCashless = shifts
    .filter(shift => !shift.paid_kvv && shift.payment_type === 'cashless')
    .reduce((sum, shift) => {
      const revenue = calculateRevenue(shift);
      const tax = calculateTax(shift);
      const afterTax = revenue - tax;
      const orgName = shift.organization_name || shift.organization;
      const salary = calculateWorkerSalary(shift.contacts_count, shift.date, orgName);
      const expense = shift.expense_amount || 0;
      const netProfit = afterTax - salary - expense;
      const kvv = Math.round(netProfit / 2);
      return sum + kvv;
    }, 0);

  const unpaidKMS = shifts
    .filter(shift => !shift.paid_kms)
    .reduce((sum, shift) => {
      const revenue = calculateRevenue(shift);
      const tax = calculateTax(shift);
      const afterTax = revenue - tax;
      const orgName = shift.organization_name || shift.organization;
      const salary = calculateWorkerSalary(shift.contacts_count, shift.date, orgName);
      const expense = shift.expense_amount || 0;
      const netProfit = afterTax - salary - expense;
      const kms = Math.round(netProfit / 2);
      return sum + kms;
    }, 0);

  const unpaidKMSCash = shifts
    .filter(shift => !shift.paid_kms && shift.payment_type === 'cash')
    .reduce((sum, shift) => {
      const revenue = calculateRevenue(shift);
      const tax = calculateTax(shift);
      const afterTax = revenue - tax;
      const orgName = shift.organization_name || shift.organization;
      const salary = calculateWorkerSalary(shift.contacts_count, shift.date, orgName);
      const expense = shift.expense_amount || 0;
      const netProfit = afterTax - salary - expense;
      const kms = Math.round(netProfit / 2);
      return sum + kms;
    }, 0);

  const unpaidKMSCashless = shifts
    .filter(shift => !shift.paid_kms && shift.payment_type === 'cashless')
    .reduce((sum, shift) => {
      const revenue = calculateRevenue(shift);
      const tax = calculateTax(shift);
      const afterTax = revenue - tax;
      const orgName = shift.organization_name || shift.organization;
      const salary = calculateWorkerSalary(shift.contacts_count, shift.date, orgName);
      const expense = shift.expense_amount || 0;
      const netProfit = afterTax - salary - expense;
      const kms = Math.round(netProfit / 2);
      return sum + kms;
    }, 0);

  const expectedRevenue = shifts
    .filter(shift => !shift.paid_by_organization)
    .reduce((sum, shift) => {
      const revenue = calculateRevenue(shift);
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