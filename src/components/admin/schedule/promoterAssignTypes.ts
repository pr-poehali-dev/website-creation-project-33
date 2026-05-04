import { PlanEntry } from '../tasks/PlanOrgModal';

export const PLANNING_API = 'https://functions.poehali.dev/0476e6f3-5f78-4770-9742-11fda4ba89c8';
export const WORK_COMMENTS_API = 'https://functions.poehali.dev/1b7f0423-384e-417f-8aea-767e5a1c32b2';

export const PLACE_TYPES = ['ТЦ', 'Школа', 'Садик', 'Улица', 'Парк', 'Другое'];

export const inputCls = "w-full h-9 px-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-gray-400 transition-all";

export interface PromoterSlot {
  key: string;
  label: string;
  from: string;
  to: string;
  used: boolean;
}

export interface PromoterOption {
  id: number;
  name: string;
  nearest_metro?: string | null;
  total_slots: number;
  used_slots: number;
  available: boolean;
  slots: PromoterSlot[];
}

export interface AssignedPromoter {
  pp_id: number;
  promoter_id: number;
  promoter_name: string;
  org_name: string | null;
  place_type: string | null;
  address: string | null;
  leaflets: string | null;
  time_slot: string | null;
}

export interface PromoterAssignModalProps {
  plan: PlanEntry;
  openAddMode?: boolean;
  onSave: (plan: PlanEntry) => void;
  onClose: () => void;
}

export function planTimeToSlotLabel(timeFrom: string | null, timeTo: string | null): string | null {
  if (!timeFrom || !timeTo) return null;
  return `${timeFrom}-${timeTo}`;
}
