import { User } from './types';

export const TRAINING_API = 'https://functions.poehali.dev/1401561e-4d80-430c-87e9-7e8252e0a9b9';

export function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-Session-Token': localStorage.getItem('session_token') || '',
  };
}

export function avgPerShift(u: User): number {
  const shifts = u.shifts_count || 0;
  const contacts = u.lead_count || 0;
  return shifts > 0 ? Math.round((contacts / shifts) * 10) / 10 : 0;
}

export function promoterStatus(u: User): 'red' | 'yellow' | 'green' {
  const shifts = u.shifts_count || 0;
  const contacts = u.lead_count || 0;
  if (shifts < 3) return 'red';
  if (contacts < 10) return 'yellow';
  return 'green';
}

export const STATUS_STYLES = {
  red:    { row: 'bg-red-50/60 border border-red-100',         dot: 'bg-red-400',    badge: 'bg-red-100 text-red-600' },
  yellow: { row: 'bg-amber-50/60 border border-amber-100',     dot: 'bg-amber-400',  badge: 'bg-amber-100 text-amber-600' },
  green:  { row: 'bg-emerald-50/60 border border-emerald-100', dot: 'bg-emerald-400', badge: 'bg-emerald-100 text-emerald-700' },
};

export interface KpdTrainee {
  id: number;
  name: string;
  registered_at: string;
  is_active: boolean;
  lead_count: number;
  shifts_count: number;
}

export interface KpdSummary {
  trainees_count: number;
  inactive_count: number;
  total_leads: number;
  total_kms: number;
}

export interface KpdPeriodDay {
  date: string;
  count: number;
  trainees: KpdTrainee[];
  summary: KpdSummary;
}

export interface KpdPeriodWeek {
  week_start: string;
  count: number;
  trainees: KpdTrainee[];
  summary: KpdSummary;
}

export interface KpdPeriodMonth {
  month_start: string;
  count: number;
  trainees: KpdTrainee[];
  summary: KpdSummary;
}

export interface KpdData {
  by_day:   KpdPeriodDay[];
  by_week:  KpdPeriodWeek[];
  by_month: KpdPeriodMonth[];
}

export function fmtDay(s: string) {
  return new Date(s).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

export function fmtWeek(s: string) {
  const d = new Date(s), e = new Date(s);
  e.setDate(e.getDate() + 6);
  return `${d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })} – ${e.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}`;
}

export function fmtMonth(s: string) {
  return new Date(s).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
}